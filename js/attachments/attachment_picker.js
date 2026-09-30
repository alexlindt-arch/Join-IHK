/**
 * Attachments of every file picker on the page, keyed by picker id ('task', 'modal', 'edit').
 * @type {Object<string, Array<{name: string, type: string, size: number, base64: string}>>}
 */
const attachmentStore = {};

/** Timer that hides the upload message box again. */
let attachmentToastTimer = null;


/**
 * Returns the attachments of a picker.
 * @param {string} pickerId - Picker id.
 * @returns {Array<Object>} Attachment objects.
 */
function getAttachments(pickerId) {
    return attachmentStore[pickerId] || [];
}


/**
 * Replaces the attachments of a picker (e.g. when an existing task is edited) and renders them.
 * @param {string} pickerId - Picker id.
 * @param {Array<Object>} attachments - Attachment objects.
 * @returns {void}
 */
function setAttachments(pickerId, attachments) {
    attachmentStore[pickerId] = [...(attachments || [])];
    renderAttachmentPicker(pickerId);
}


/**
 * Opens the file dialog of a picker.
 * @param {string} pickerId - Picker id.
 * @returns {void}
 */
function openAttachmentDialog(pickerId) {
    document.getElementById(`attachment-input-${pickerId}`).click();
}


/**
 * Handles files chosen in the file dialog.
 * @async
 * @param {Event} event - Change event of the file input.
 * @param {string} pickerId - Picker id.
 * @returns {Promise<void>}
 */
async function handleAttachmentInput(event, pickerId) {
    const input = event.target;
    await addAttachmentFiles(pickerId, [...input.files]);
    input.value = '';
}


/**
 * Validates, compresses and adds files to a picker. Invalid files are skipped with an error message.
 * @async
 * @param {string} pickerId - Picker id.
 * @param {File[]} files - Selected files.
 * @returns {Promise<void>}
 */
async function addAttachmentFiles(pickerId, files) {
    const errors = [];
    setAttachmentBusy(pickerId, true);
    for (const file of files) {
        const error = await addAttachmentFile(pickerId, file);
        if (error) errors.push(error);
    }
    setAttachmentBusy(pickerId, false);
    renderAttachmentPicker(pickerId);
    if (errors.length) showAttachmentToast(errors);
}


/**
 * Adds a single file to a picker.
 * @async
 * @param {string} pickerId - Picker id.
 * @param {File} file - Selected file.
 * @returns {Promise<{title: string, text: string}|null>} Null on success, otherwise the error.
 */
async function addAttachmentFile(pickerId, file) {
    const validationError = await validateAttachmentFile(file);
    if (validationError) return validationError;
    try {
        const attachment = await createAttachmentFromFile(file);
        const attachments = getAttachments(pickerId);
        if (exceedsTaskUploadLimit(attachments, attachment)) return getUploadLimitError(file.name, attachments);
        attachmentStore[pickerId] = [...attachments, attachment];
        return null;
    } catch (error) {
        return { title: 'This file could not be read!', text: `"${file.name}" is not a valid image.` };
    }
}


/**
 * Removes one attachment from a picker.
 * @param {string} pickerId - Picker id.
 * @param {number} index - Index of the attachment.
 * @returns {void}
 */
function removeAttachment(pickerId, index) {
    attachmentStore[pickerId] = getAttachments(pickerId).filter((_, i) => i !== index);
    renderAttachmentPicker(pickerId);
    focusAttachmentDropzone(pickerId);
}


/**
 * Removes all attachments from a picker.
 * @param {string} pickerId - Picker id.
 * @returns {void}
 */
function removeAllAttachments(pickerId) {
    setAttachments(pickerId, []);
    focusAttachmentDropzone(pickerId);
}


/**
 * Renders the preview list and shows or hides the "Delete all" button.
 * @param {string} pickerId - Picker id.
 * @returns {void}
 */
function renderAttachmentPicker(pickerId) {
    const list = document.getElementById(`attachment-list-${pickerId}`);
    if (!list) return;
    const attachments = getAttachments(pickerId);
    list.innerHTML = attachments.map((attachment, index) => attachmentPreviewTemplate(pickerId, attachment, index)).join('');
    list.classList.toggle('d-none', attachments.length === 0);
    document.getElementById(`attachment-delete-all-${pickerId}`).classList.toggle('d-none', attachments.length === 0);
}


/**
 * Opens the image viewer for an attachment of a picker.
 * @param {string} pickerId - Picker id.
 * @param {number} index - Index of the attachment.
 * @returns {void}
 */
function openPickerAttachment(pickerId, index) {
    openImageViewer(getAttachments(pickerId), index);
}


/**
 * Shows upload errors in the red message box: the title of the first error and the texts of all errors.
 * @param {Array<{title: string, text: string}>} errors - Upload errors.
 * @returns {void}
 */
function showAttachmentToast(errors) {
    const toast = document.getElementById('attachment-toast');
    document.getElementById('attachment-toast-title').textContent = errors[0].title;
    document.getElementById('attachment-toast-text').textContent = errors.map(error => error.text).join(' ');
    if (toast.matches(':popover-open')) toast.hidePopover();
    toast.showPopover();
    clearTimeout(attachmentToastTimer);
    attachmentToastTimer = setTimeout(hideAttachmentToast, 6000);
}


/**
 * Hides the red upload message box.
 * @returns {void}
 */
function hideAttachmentToast() {
    const toast = document.getElementById('attachment-toast');
    if (toast?.matches(':popover-open')) toast.hidePopover();
}


/**
 * Marks the drop zone as busy while images are compressed.
 * @param {string} pickerId - Picker id.
 * @param {boolean} isBusy - True while files are processed.
 * @returns {void}
 */
function setAttachmentBusy(pickerId, isBusy) {
    const dropzone = document.getElementById(`attachment-dropzone-${pickerId}`);
    dropzone.classList.toggle('attachment-dropzone--busy', isBusy);
    dropzone.setAttribute('aria-busy', String(isBusy));
}


/**
 * Moves the keyboard focus back to the drop zone.
 * @param {string} pickerId - Picker id.
 * @returns {void}
 */
function focusAttachmentDropzone(pickerId) {
    document.getElementById(`attachment-dropzone-${pickerId}`)?.focus();
}


/**
 * Highlights the drop zone while files are dragged over it.
 * @param {DragEvent} event - Dragover event.
 * @returns {void}
 */
function handleAttachmentDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('attachment-dropzone--active');
}


/**
 * Removes the drop zone highlight.
 * @param {DragEvent} event - Dragleave event.
 * @returns {void}
 */
function handleAttachmentDragLeave(event) {
    event.currentTarget.classList.remove('attachment-dropzone--active');
}


/**
 * Adds the files dropped onto the drop zone.
 * @async
 * @param {DragEvent} event - Drop event.
 * @param {string} pickerId - Picker id.
 * @returns {Promise<void>}
 */
async function handleAttachmentDrop(event, pickerId) {
    event.preventDefault();
    handleAttachmentDragLeave(event);
    await addAttachmentFiles(pickerId, [...event.dataTransfer.files]);
}


/**
 * Escapes text for safe use in HTML (file names come from the user).
 * @param {string} text - Raw text.
 * @returns {string} Escaped text.
 */
function escapeAttachmentText(text) {
    const element = document.createElement('span');
    element.textContent = text || '';
    return element.innerHTML.replace(/"/g, '&quot;');
}
