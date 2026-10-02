/** Trash icon of the attachment previews (design). */
const ATTACHMENT_DELETE_ICON = `<svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM3 3V16H13V3H3ZM5 13C5 13.2833 5.09583 13.5208 5.2875 13.7125C5.47917 13.9042 5.71667 14 6 14C6.28333 14 6.52083 13.9042 6.7125 13.7125C6.90417 13.5208 7 13.2833 7 13V6C7 5.71667 6.90417 5.47917 6.7125 5.2875C6.52083 5.09583 6.28333 5 6 5C5.71667 5 5.47917 5.09583 5.2875 5.2875C5.09583 5.47917 5 5.71667 5 6V13ZM9 13C9 13.2833 9.09583 13.5208 9.2875 13.7125C9.47917 13.9042 9.71667 14 10 14C10.2833 14 10.5208 13.9042 10.7125 13.7125C10.9042 13.5208 11 13.2833 11 13V6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6V13Z" fill="currentColor"/></svg>`;

/** Cloud download icon of the attachment previews in the task detail (design). */
const ATTACHMENT_DOWNLOAD_ICON = `<svg width="24" height="24" viewBox="0 -960 960 960" fill="none" aria-hidden="true"><path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q17-72 85-137t145-65q33 0 56.5 23.5T520-716v242l64-62 56 56-160 160-160-160 56-56 64 62v-242q-76 14-118 73.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-48-22-89.5T600-680v-93q74 35 117 103.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H260Z" fill="currentColor"/></svg>`;


/**
 * Returns the file picker field used in the board modal and in the edit overlay.
 * The add-task page contains the same markup statically.
 * @param {string} pickerId - Picker id ('modal' or 'edit').
 * @returns {string} HTML string.
 */
function attachmentPickerTemplate(pickerId) {
    return `
        <section class="form-group attachment-field" aria-labelledby="attachment-label-${pickerId}">
            ${attachmentHeaderTemplate(pickerId)}
            ${attachmentDropzoneTemplate(pickerId)}
            <ul class="attachment-list d-none" id="attachment-list-${pickerId}" aria-label="Selected images"></ul>
        </section>`;
}


/**
 * Returns the label, the hint and the "Delete all" button of a file picker.
 * @param {string} pickerId - Picker id.
 * @returns {string} HTML string.
 */
function attachmentHeaderTemplate(pickerId) {
    return `
            <div class="attachment-header">
                <div>
                    <h3 class="form-label attachment-label" id="attachment-label-${pickerId}">Attachments</h3>
                    <p class="attachment-hint" id="attachment-hint-${pickerId}">Allowed file types are JPEG and PNG, max. 5 MB per image</p>
                </div>
                <button type="button" class="attachment-delete-all d-none" id="attachment-delete-all-${pickerId}"
                    onclick="removeAllAttachments('${pickerId}')">${ATTACHMENT_DELETE_ICON} Delete all</button>
            </div>`;
}


/**
 * Returns the hidden file input and the drop zone button of a file picker.
 * @param {string} pickerId - Picker id.
 * @returns {string} HTML string.
 */
function attachmentDropzoneTemplate(pickerId) {
    return `
            <input type="file" class="attachment-input" id="attachment-input-${pickerId}" accept="image/jpeg,image/png"
                multiple tabindex="-1" aria-hidden="true" onchange="handleAttachmentInput(event, '${pickerId}')">
            <button type="button" class="attachment-dropzone" id="attachment-dropzone-${pickerId}"
                aria-describedby="attachment-hint-${pickerId}"
                onclick="openAttachmentDialog('${pickerId}')" ondragover="handleAttachmentDragOver(event)"
                ondragleave="handleAttachmentDragLeave(event)" ondrop="handleAttachmentDrop(event, '${pickerId}')">
                Drag a file or browse <span class="attachment-plus" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 0V15" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round"/><path d="M15 7.64L0 7.64" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round"/></svg></span>
            </button>`;
}


/**
 * Returns one image card of a file picker (image with the file name below) with a button to open it and a centered button to remove it.
 * @param {string} pickerId - Picker id.
 * @param {{name: string, base64: string}} attachment - Attachment object.
 * @param {number} index - Index of the attachment.
 * @returns {string} HTML string.
 */
function attachmentPreviewTemplate(pickerId, attachment, index) {
    const name = escapeAttachmentText(attachment.name);
    return `
        <li class="attachment-item">
            <button type="button" class="attachment-card" onclick="openPickerAttachment('${pickerId}', ${index})"
                aria-label="Open ${name}" title="${name}">
                <img class="attachment-card-image" src="${getSafeImageSource(attachment.base64)}" alt="">
                <span class="attachment-name">${name}</span>
            </button>
            <button type="button" class="attachment-thumb-action" onclick="removeAttachment('${pickerId}', ${index})"
                aria-label="Remove ${name}">${ATTACHMENT_DELETE_ICON}</button>
        </li>`;
}


/**
 * Returns the attachment section of the task detail view, or an empty string without attachments.
 * @param {Object} task - Task object with optional attachments.
 * @returns {string} HTML string.
 */
function detailAttachmentSectionTemplate(task) {
    const attachments = task.attachments || [];
    if (!attachments.length) return '';
    const items = attachments.map((attachment, index) => detailAttachmentTemplate(task.id, attachment, index)).join('');
    return `
        <section class="detail-section detail-attachments" aria-label="Attachments">
            <span class="detail-label">Attachments</span>
            <ul class="attachment-list">${items}</ul>
        </section>`;
}


/**
 * Returns one image card of the task detail with a button to open it and a centered download button.
 * @param {string|number} taskId - Task id.
 * @param {{name: string, base64: string}} attachment - Attachment object.
 * @param {number} index - Index of the attachment.
 * @returns {string} HTML string.
 */
function detailAttachmentTemplate(taskId, attachment, index) {
    const name = escapeAttachmentText(attachment.name);
    return `
        <li class="attachment-item">
            <button type="button" class="attachment-card" onclick="openTaskAttachment(${taskId}, ${index})"
                aria-label="Open ${name}" title="${name}">
                <img class="attachment-card-image" src="${getSafeImageSource(attachment.base64)}" alt="">
                <span class="attachment-name">${name}</span>
            </button>
            <button type="button" class="attachment-thumb-action" onclick="downloadTaskAttachment(${taskId}, ${index})"
                aria-label="Download ${name}">${ATTACHMENT_DOWNLOAD_ICON}</button>
        </li>`;
}


/**
 * Returns the image viewer dialog (Figma "Pic view"); it is added once to every page with attachments.
 * @returns {string} HTML string.
 */
function imageViewerTemplate() {
    return `
    <dialog class="image-viewer" id="image-viewer" aria-label="Image viewer" onclick="handleViewerBackdropClick(event)"
        onkeydown="handleViewerKeydown(event)">
        ${imageViewerBarTemplate()}
        <div class="image-viewer-stage" id="image-viewer-stage">
            <img class="image-viewer-img" id="image-viewer-img" src="" alt="">
        </div>
        ${imageViewerFooterTemplate()}
    </dialog>`;
}


/**
 * Returns the top bar of the image viewer with name, type, size, download and close.
 * @returns {string} HTML string.
 */
function imageViewerBarTemplate() {
    return `
        <header class="image-viewer-bar">
            <p class="image-viewer-info">
                <span class="image-viewer-name" id="image-viewer-name"></span>
                <span class="image-viewer-meta"><span aria-hidden="true">/</span> <span id="image-viewer-meta"></span></span>
            </p>
            <div class="image-viewer-actions">
                <button type="button" class="image-viewer-btn" aria-label="Download image" onclick="downloadViewerImage()">${ATTACHMENT_DOWNLOAD_ICON}</button>
                <button type="button" class="image-viewer-btn" aria-label="Close image viewer" onclick="closeImageViewer()">
                    <svg width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" fill="currentColor"/></svg>
                </button>
            </div>
        </header>`;
}


/**
 * Returns the bottom bar of the image viewer with the previous arrow, zoom and the next arrow.
 * @returns {string} HTML string.
 */
function imageViewerFooterTemplate() {
    return `
        <footer class="image-viewer-footer">
            <button type="button" class="image-viewer-btn image-viewer-nav image-viewer-prev" id="image-viewer-prev"
                aria-label="Previous image" onclick="showPreviousViewerImage()"><svg width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" fill="currentColor"/></svg></button>
            <div class="image-viewer-tools">
                <button type="button" class="image-viewer-btn" id="image-viewer-zoom-out" aria-label="Zoom out"
                    onclick="zoomViewerImage(-1)"><svg width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400ZM280-540v-80h200v80H280Z" fill="currentColor"/></svg></button>
                <span class="image-viewer-counter" id="image-viewer-counter" aria-live="polite"></span>
                <button type="button" class="image-viewer-btn" id="image-viewer-zoom-in" aria-label="Zoom in"
                    onclick="zoomViewerImage(1)"><svg width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Zm-40-60v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" fill="currentColor"/></svg></button>
            </div>
            <button type="button" class="image-viewer-btn image-viewer-nav image-viewer-next" id="image-viewer-next"
                aria-label="Next image" onclick="showNextViewerImage()"><svg width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" fill="currentColor"/></svg></button>
        </footer>`;
}
