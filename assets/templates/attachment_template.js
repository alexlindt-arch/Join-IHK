/** Trash icon of the attachment previews (design). */
const ATTACHMENT_DELETE_ICON = `<svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM3 3V16H13V3H3ZM5 13C5 13.2833 5.09583 13.5208 5.2875 13.7125C5.47917 13.9042 5.71667 14 6 14C6.28333 14 6.52083 13.9042 6.7125 13.7125C6.90417 13.5208 7 13.2833 7 13V6C7 5.71667 6.90417 5.47917 6.7125 5.2875C6.52083 5.09583 6.28333 5 6 5C5.71667 5 5.47917 5.09583 5.2875 5.2875C5.09583 5.47917 5 5.71667 5 6V13ZM9 13C9 13.2833 9.09583 13.5208 9.2875 13.7125C9.47917 13.9042 9.71667 14 10 14C10.2833 14 10.5208 13.9042 10.7125 13.7125C10.9042 13.5208 11 13.2833 11 13V6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6V13Z" fill="currentColor"/></svg>`;

/** Download icon of the attachment previews in the task detail (design). */
const ATTACHMENT_DOWNLOAD_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="currentColor"/></svg>`;


/**
 * Returns the file picker field used in the board modal and in the edit overlay.
 * The add-task page contains the same markup statically.
 * @param {string} pickerId - Picker id ('modal' or 'edit').
 * @returns {string} HTML string.
 */
function attachmentPickerTemplate(pickerId) {
    const labelClass = pickerId === 'edit' ? 'edit-label' : 'form-label';
    return `
        <section class="form-group edit-form-group attachment-field" aria-labelledby="attachment-label-${pickerId}">
            <div class="attachment-header">
                <div>
                    <h3 class="${labelClass} attachment-label" id="attachment-label-${pickerId}">Attachments</h3>
                    <p class="attachment-hint" id="attachment-hint-${pickerId}">Allowed file types are JPEG and PNG</p>
                </div>
                <button type="button" class="attachment-delete-all d-none" id="attachment-delete-all-${pickerId}"
                    onclick="removeAllAttachments('${pickerId}')">${ATTACHMENT_DELETE_ICON} Delete all</button>
            </div>
            <input type="file" class="attachment-input" id="attachment-input-${pickerId}" accept="image/jpeg,image/png"
                multiple tabindex="-1" aria-hidden="true" onchange="handleAttachmentInput(event, '${pickerId}')">
            <button type="button" class="attachment-dropzone" id="attachment-dropzone-${pickerId}"
                aria-describedby="attachment-hint-${pickerId} attachment-error-${pickerId}"
                onclick="openAttachmentDialog('${pickerId}')" ondragover="handleAttachmentDragOver(event)"
                ondragleave="handleAttachmentDragLeave(event)" ondrop="handleAttachmentDrop(event, '${pickerId}')">
                Drag a file or browse <span class="attachment-plus" aria-hidden="true">+</span>
            </button>
            <p class="field-error attachment-error d-none" id="attachment-error-${pickerId}" role="alert"></p>
            <ul class="attachment-list d-none" id="attachment-list-${pickerId}" aria-label="Selected images"></ul>
        </section>`;
}


/**
 * Returns one image preview of a file picker with a button to open it and a button to remove it.
 * @param {string} pickerId - Picker id.
 * @param {{name: string, base64: string}} attachment - Attachment object.
 * @param {number} index - Index of the attachment.
 * @returns {string} HTML string.
 */
function attachmentPreviewTemplate(pickerId, attachment, index) {
    const name = escapeAttachmentText(attachment.name);
    return `
        <li class="attachment-item">
            <button type="button" class="attachment-thumb" onclick="openPickerAttachment('${pickerId}', ${index})"
                aria-label="Open ${name}">
                <img src="${getSafeImageSource(attachment.base64)}" alt="">
            </button>
            <span class="attachment-name" title="${name}">${name}</span>
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
 * Returns one image preview of the task detail with a button to open it and a download button.
 * @param {string|number} taskId - Task id.
 * @param {{name: string, base64: string}} attachment - Attachment object.
 * @param {number} index - Index of the attachment.
 * @returns {string} HTML string.
 */
function detailAttachmentTemplate(taskId, attachment, index) {
    const name = escapeAttachmentText(attachment.name);
    return `
        <li class="attachment-item">
            <button type="button" class="attachment-thumb" onclick="openTaskAttachment(${taskId}, ${index})"
                aria-label="Open ${name}">
                <img src="${getSafeImageSource(attachment.base64)}" alt="">
            </button>
            <span class="attachment-name" title="${name}">${name}</span>
            <button type="button" class="attachment-thumb-action" onclick="downloadTaskAttachment(${taskId}, ${index})"
                aria-label="Download ${name}">${ATTACHMENT_DOWNLOAD_ICON}</button>
        </li>`;
}
