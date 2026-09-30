const IMAGE_MAX_INPUT_BYTES = 15 * 1024 * 1024;
const AVATAR_MAX_SIZE = 200;


/**
 * Checks the first bytes of a file to verify it really is a JPEG or PNG.
 * Prevents renamed files (e.g. .exe → .jpg) from being accepted.
 * @async
 * @param {File} file - The selected file.
 * @returns {Promise<boolean>} True if the file starts with a JPEG or PNG signature.
 */
async function hasImageMagicBytes(file) {
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    return isJpeg || isPng;
}


/**
 * Validates type, size and signature of an image file.
 * @async
 * @param {File} file - The selected file.
 * @returns {Promise<string>} Empty string when valid, otherwise an error message.
 */
async function validateImageFile(file) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) return `${file.name}: only JPG and PNG are allowed.`;
    if (file.size > IMAGE_MAX_INPUT_BYTES) return `${file.name}: file is larger than 15 MB.`;
    if (!(await hasImageMagicBytes(file))) return `${file.name}: file is not a valid image.`;
    return '';
}


/**
 * Loads a file into an HTMLImageElement.
 * @param {File} file - The image file.
 * @returns {Promise<HTMLImageElement>}
 */
async function loadImageFromFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try {
        await img.decode();
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}


/**
 * Scales an image down to fit into a square box and returns it as JPEG data URL.
 * @async
 * @param {File} file - The image file.
 * @param {number} maxSize - Maximum width/height in pixels.
 * @param {number} [quality=0.7] - JPEG quality between 0 and 1.
 * @returns {Promise<string>} Compressed image as data URL.
 */
async function compressImage(file, maxSize, quality = 0.7) {
    const img = await loadImageFromFile(file);
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
}


/**
 * Creates a compressed avatar data URL from an image file.
 * @async
 * @param {File} file - Selected image file.
 * @returns {Promise<string>} Data URL of the avatar.
 * @throws {Error} When the file is invalid.
 */
async function fileToAvatar(file) {
    const error = await validateImageFile(file);
    if (error) throw new Error(error);
    return await compressImage(file, AVATAR_MAX_SIZE, 0.8);
}


/**
 * Returns the inner HTML for an avatar: the photo if present, otherwise the initials.
 * @param {Object} person - Object with optional photo and initials/avatar fields.
 * @returns {string} HTML string.
 */
function avatarInnerHTML(person) {
    if (person?.photo) return `<img class="avatar-photo" src="${person.photo}" alt="">`;
    return person?.initials || person?.avatar || '?';
}


/**
 * Escapes HTML special characters (standalone so this file works on every page).
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function imgEscape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML.replace(/"/g, '&quot;');
}
