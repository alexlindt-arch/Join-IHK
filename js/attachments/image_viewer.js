/** Images currently shown in the viewer. */
let viewerImages = [];

/** Index of the visible image. */
let viewerIndex = 0;

/** Current zoom factor of the visible image. */
let viewerZoom = 1;

/** Width of the image at zoom factor 1, measured when zooming starts. */
let viewerBaseWidth = 0;

/** Smallest and largest zoom factor and the step per click. */
const VIEWER_ZOOM_MIN = 1;
const VIEWER_ZOOM_MAX = 3;
const VIEWER_ZOOM_STEP = 0.5;


/**
 * Opens the image viewer with a list of attachments.
 * @param {Array<Object>} images - Attachment objects with name, type, size and base64.
 * @param {number} index - Index of the image to show first.
 * @returns {void}
 */
function openImageViewer(images, index) {
    if (!images.length) return;
    viewerImages = images;
    viewerIndex = index;
    renderViewerImage();
    const viewer = document.getElementById('image-viewer');
    if (!viewer.open) viewer.showModal();
}


/**
 * Closes the image viewer.
 * @returns {void}
 */
function closeImageViewer() {
    document.getElementById('image-viewer').close();
}


/**
 * Closes the viewer when the dark background around the image is clicked.
 * @param {MouseEvent} event - Click event on the dialog.
 * @returns {void}
 */
function handleViewerBackdropClick(event) {
    if (event.target.id === 'image-viewer' || event.target.classList.contains('image-viewer-stage')) closeImageViewer();
}


/**
 * Shows the current image with its file name, format and size.
 * @returns {void}
 */
function renderViewerImage() {
    const image = viewerImages[viewerIndex];
    const imageElement = document.getElementById('image-viewer-img');
    imageElement.src = getSafeImageSource(image.base64);
    imageElement.alt = image.name;
    document.getElementById('image-viewer-name').textContent = image.name;
    document.getElementById('image-viewer-meta').textContent = `${formatFileType(image.type)} · ${formatFileSize(image.size)}`;
    document.getElementById('image-viewer-counter').textContent = `${viewerIndex + 1} / ${viewerImages.length}`;
    toggleViewerNavigation();
    viewerZoom = 1;
    setViewerZoom(1);
}


/**
 * Hides the arrows when there is only one image.
 * @returns {void}
 */
function toggleViewerNavigation() {
    const hasSeveralImages = viewerImages.length > 1;
    document.getElementById('image-viewer-prev').classList.toggle('d-none', !hasSeveralImages);
    document.getElementById('image-viewer-next').classList.toggle('d-none', !hasSeveralImages);
    document.getElementById('image-viewer-counter').classList.toggle('d-none', !hasSeveralImages);
}


/**
 * Shows the next image; after the last one the viewer starts again with the first.
 * @returns {void}
 */
function showNextViewerImage() {
    viewerIndex = (viewerIndex + 1) % viewerImages.length;
    renderViewerImage();
}


/**
 * Shows the previous image; before the first one the viewer jumps to the last.
 * @returns {void}
 */
function showPreviousViewerImage() {
    viewerIndex = (viewerIndex - 1 + viewerImages.length) % viewerImages.length;
    renderViewerImage();
}


/**
 * Zooms the visible image in (direction 1) or out (direction -1).
 * @param {number} direction - 1 to zoom in, -1 to zoom out.
 * @returns {void}
 */
function zoomViewerImage(direction) {
    const zoom = viewerZoom + direction * VIEWER_ZOOM_STEP;
    setViewerZoom(Math.min(VIEWER_ZOOM_MAX, Math.max(VIEWER_ZOOM_MIN, zoom)));
}


/**
 * Applies a zoom factor and enables or disables the zoom buttons at the limits.
 * @param {number} zoom - Zoom factor.
 * @returns {void}
 */
function setViewerZoom(zoom) {
    const imageElement = document.getElementById('image-viewer-img');
    if (viewerZoom === 1 && zoom > 1) viewerBaseWidth = imageElement.clientWidth;
    viewerZoom = zoom;
    imageElement.style.width = zoom > 1 ? `${Math.round(viewerBaseWidth * zoom)}px` : '';
    document.getElementById('image-viewer-stage').classList.toggle('image-viewer-stage--zoomed', zoom > 1);
    document.getElementById('image-viewer-zoom-out').disabled = zoom <= VIEWER_ZOOM_MIN;
    document.getElementById('image-viewer-zoom-in').disabled = zoom >= VIEWER_ZOOM_MAX;
}


/**
 * Downloads the image that is currently shown in the viewer.
 * @returns {void}
 */
function downloadViewerImage() {
    downloadAttachment(viewerImages[viewerIndex]);
}


/**
 * Downloads an attachment under its original file name.
 * @param {{name: string, base64: string}} attachment - Attachment to download.
 * @returns {void}
 */
function downloadAttachment(attachment) {
    if (!getSafeImageSource(attachment.base64)) return;
    const url = URL.createObjectURL(base64ToBlob(attachment.base64));
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}


/**
 * Lets the user browse with the arrow keys and zoom with + and -.
 * Escape is handled by the dialog element itself.
 * @param {KeyboardEvent} event - Keydown event on the dialog.
 * @returns {void}
 */
function handleViewerKeydown(event) {
    const actions = {
        ArrowRight: showNextViewerImage,
        ArrowLeft: showPreviousViewerImage,
        '+': () => zoomViewerImage(1),
        '-': () => zoomViewerImage(-1)
    };
    if (!actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
}


/**
 * Adds the image viewer dialog to the page.
 * @returns {void}
 */
function addImageViewerToPage() {
    document.body.insertAdjacentHTML('beforeend', imageViewerTemplate());
}


document.addEventListener('DOMContentLoaded', addImageViewerToPage);
