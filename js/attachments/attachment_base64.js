/** Maximum width and height of an uploaded image in pixels. */
const ATTACHMENT_MAX_DIMENSION = 800;

/** JPEG quality used when an image is compressed. */
const ATTACHMENT_JPEG_QUALITY = 0.8;


/**
 * Converts an image file into an attachment object with compressed base64 data and metadata.
 * @async
 * @param {File} file - Validated JPEG or PNG file.
 * @returns {Promise<{name: string, type: string, size: number, base64: string}>} Attachment object.
 */
async function createAttachmentFromFile(file) {
    const image = await loadImageElement(file);
    const canvas = drawScaledImage(image, ATTACHMENT_MAX_DIMENSION);
    const base64 = canvasToBase64(canvas, file.type);
    return { name: file.name, type: file.type, size: getBase64ByteSize(base64), base64 };
}


/**
 * Loads a file into an HTMLImageElement through a temporary object URL.
 * @async
 * @param {File} file - Image file.
 * @returns {Promise<HTMLImageElement>} Decoded image; rejects when the file cannot be read as image.
 */
async function loadImageElement(file) {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    try {
        await image.decode();
        return image;
    } finally {
        URL.revokeObjectURL(url);
    }
}


/**
 * Calculates the size of an image scaled down to fit into a square of maxDimension pixels.
 * Smaller images keep their original size.
 * @param {number} width - Original width.
 * @param {number} height - Original height.
 * @param {number} maxDimension - Maximum width and height.
 * @returns {{width: number, height: number}} Scaled size.
 */
function getScaledSize(width, height, maxDimension) {
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
}


/**
 * Draws an image onto a new canvas, scaled down to the maximum dimension.
 * @param {HTMLImageElement} image - Loaded image.
 * @param {number} maxDimension - Maximum width and height.
 * @returns {HTMLCanvasElement} Canvas with the scaled image.
 */
function drawScaledImage(image, maxDimension) {
    const size = getScaledSize(image.naturalWidth, image.naturalHeight, maxDimension);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext('2d').drawImage(image, 0, 0, size.width, size.height);
    return canvas;
}


/**
 * Encodes a canvas as base64 data URL in the original image format.
 * JPEG is compressed with ATTACHMENT_JPEG_QUALITY, PNG stays lossless to keep transparency.
 * @param {HTMLCanvasElement} canvas - Canvas to encode.
 * @param {string} mimeType - 'image/jpeg' or 'image/png'.
 * @returns {string} Base64 data URL.
 */
function canvasToBase64(canvas, mimeType) {
    if (mimeType === 'image/png') return canvas.toDataURL('image/png');
    return canvas.toDataURL('image/jpeg', ATTACHMENT_JPEG_QUALITY);
}


/**
 * Returns the number of bytes a base64 data URL takes up when it is stored.
 * @param {string} base64 - Base64 data URL.
 * @returns {number} Size in bytes.
 */
function getBase64ByteSize(base64) {
    return new Blob([base64]).size;
}


/**
 * Turns a base64 data URL back into a Blob, e.g. for downloads.
 * @param {string} base64 - Base64 data URL.
 * @returns {Blob} Binary image data.
 */
function base64ToBlob(base64) {
    const [header, data] = base64.split(',');
    const mimeType = header.match(/data:(.*?);/)[1];
    const bytes = Uint8Array.from(atob(data), char => char.charCodeAt(0));
    return new Blob([bytes], { type: mimeType });
}
