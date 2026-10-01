/** File formats that can be attached to a task. */
const ATTACHMENT_ALLOWED_TYPES = ['image/jpeg', 'image/png'];

/** Upload limit of the database for all images of one task (1 MB). */
const ATTACHMENT_MAX_TASK_BYTES = 1024 * 1024;

/** Largest original file that is accepted, checked before compressing (5 MB). */
const ATTACHMENT_MAX_FILE_BYTES = 5 * 1024 * 1024;


/**
 * Checks format, file size and file signature of a selected file.
 * @async
 * @param {File} file - Selected file.
 * @returns {Promise<{title: string, text: string}|null>} Null when the file is valid, otherwise the error.
 */
async function validateAttachmentFile(file) {
    const formatError = { title: 'This file format is not allowed!', text: `You can only upload JPEG and PNG. "${file.name}" was not added.` };
    if (!isAllowedAttachmentType(file)) return formatError;
    if (!(await hasImageMagicBytes(file))) return formatError;
    if (file.size > ATTACHMENT_MAX_FILE_BYTES) return getFileTooLargeError(file);
    return null;
}


/**
 * Returns the error for a file that is larger than the allowed size before compressing.
 * @param {File} file - Rejected file.
 * @returns {{title: string, text: string}} Error.
 */
function getFileTooLargeError(file) {
    const text = `"${file.name}" has ${formatFileSize(file.size)}. Each image may have max. ${formatFileSize(ATTACHMENT_MAX_FILE_BYTES)}.`;
    return { title: 'This file is too large!', text };
}


/**
 * Tells whether the MIME type and the file extension belong to an allowed image format.
 * @param {File} file - Selected file.
 * @returns {boolean} True for JPEG and PNG files.
 */
function isAllowedAttachmentType(file) {
    const hasAllowedExtension = /\.(jpe?g|png)$/i.test(file.name);
    return ATTACHMENT_ALLOWED_TYPES.includes(file.type) && hasAllowedExtension;
}


/**
 * Adds up the stored size of all attachments.
 * @param {Array<{size: number}>} attachments - Attachment objects.
 * @returns {number} Total size in bytes.
 */
function getTotalAttachmentBytes(attachments) {
    return attachments.reduce((total, attachment) => total + (attachment.size || 0), 0);
}


/**
 * Tells whether one more attachment still fits into the upload limit of a task.
 * @param {Array<{size: number}>} attachments - Attachments already added to the task.
 * @param {{size: number}} newAttachment - Attachment that should be added.
 * @returns {boolean} True when the limit would be exceeded.
 */
function exceedsTaskUploadLimit(attachments, newAttachment) {
    return getTotalAttachmentBytes(attachments) + newAttachment.size > ATTACHMENT_MAX_TASK_BYTES;
}


/**
 * Returns the error shown when an image does not fit into the upload limit of the database.
 * @param {string} fileName - Name of the rejected file.
 * @param {Array<{size: number}>} attachments - Attachments already added to the task.
 * @returns {{title: string, text: string}} Error.
 */
function getUploadLimitError(fileName, attachments) {
    const usedBytes = getTotalAttachmentBytes(attachments);
    const text = `"${fileName}" does not fit anymore. The images of a task may use max. 1 MB – ${formatFileSize(usedBytes)} are already used.`;
    return { title: 'Upload limit reached', text, usedShare: usedBytes / ATTACHMENT_MAX_TASK_BYTES };
}


/**
 * Formats a byte count for display, e.g. 457 KB or 1.2 MB.
 * @param {number} bytes - Size in bytes.
 * @returns {string} Readable size.
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${parseFloat((bytes / (1024 * 1024)).toFixed(1))} MB`;
}


/**
 * Returns the short format label of a MIME type, e.g. "JPEG" for image/jpeg.
 * @param {string} mimeType - MIME type of an attachment.
 * @returns {string} Format label.
 */
function formatFileType(mimeType) {
    return (mimeType || '').replace('image/', '').toUpperCase();
}


/**
 * Returns the base64 data URL only if it really is a JPEG or PNG image,
 * so manipulated database entries can never inject HTML or scripts into an img src.
 * @param {string} base64 - Stored base64 data URL.
 * @returns {string} The data URL, or an empty string when it is not a valid image.
 */
function getSafeImageSource(base64) {
    const isImageDataUrl = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(base64 || '');
    return isImageDataUrl ? base64 : '';
}
