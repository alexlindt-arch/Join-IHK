/**
 * Returns the full HTML string for the edit-task overlay.
 * @param {Object} task - Task object with all editable fields.
 * @returns {string} HTML string assembled from sub-builders.
 */
function editTaskTemplate(task) {
    const prioButtons = buildPrioButtons(task.priority);
    return buildEditHeader()
        + buildEditBasicFields(task)
        + buildEditPrioField(prioButtons)
        + buildEditAssignField()
        + attachmentPickerTemplate('edit')
        + buildEditSubtaskField()
        + '</div>'
        + buildEditSaveButton(task.id);
}


/**
 * Returns three priority button HTML strings for urgent, medium, and low.
 * @param {string} currentPrio - Currently selected priority value.
 * @returns {string} HTML string with all three buttons.
 */
function buildPrioButtons(currentPrio) {
    return ['urgent', 'medium', 'low'].map(p => `
        <button type="button" class="edit-prio-btn edit-prio-${p} ${currentPrio === p ? 'edit-prio-btn--active' : ''}"
            data-prio="${p}" onclick="selectEditPrio(this, '${p}')">
            ${p.charAt(0).toUpperCase() + p.slice(1)} ${prioSvg(p)}
        </button>`).join('');
}


/**
 * Returns the edit overlay header HTML with title and close button.
 * @returns {string} HTML string.
 */
function buildEditHeader() {
    return `
        <div class="detail-header">
            <span class="detail-title">Edit Task</span>
            <button class="detail-close-btn" onmousedown="event.stopPropagation(); event.preventDefault();" onclick="closeOverlay(); event.stopPropagation();">&#x2715;</button>
        </div>`;
}


/**
 * Returns the title, description, and due date input fields for the edit form.
 * @param {Object} task - Task object with title, description, dueDate.
 * @returns {string} HTML string.
 */
function buildEditBasicFields(task) {
    return `
    <div class="edit-box">
        <div class="edit-form-group">
            <label class="edit-label">Title <span class="required">*</span></label>
            <input id="edit-title" class="edit-input" type="text" value="${escapeHtml(task.title || '')}">
        </div>
        <div class="edit-form-group">
            <label class="edit-label">Description</label>
            <textarea id="edit-desc" class="edit-input edit-textarea">${escapeHtml(task.description || '')}</textarea>
        </div>
        <div class="edit-form-group">
            <label class="edit-label">Due Date</label>
            <div class="form-input-icon">
                <input id="edit-due" class="edit-input date-picker flatpickr-edit" type="text"
                    placeholder="dd.mm.yyyy"
                    value="${escapeHtml(task.dueDate || '')}" readonly style="cursor:pointer;">
                <img src="../assets/icons/event.svg" class="input-icon" alt="calendar">
            </div>
        </div>`;
}


/**
 * Returns the priority button group HTML for the edit form.
 * @param {string} prioButtons - Pre-built priority button HTML.
 * @returns {string} HTML string.
 */
function buildEditPrioField(prioButtons) {
    return `
        <div class="edit-form-group">
            <label class="edit-label">Priority</label>
            <div class="edit-prio-group">${prioButtons}</div>
        </div>`;
}


/**
 * Returns the assigned-to dropdown and avatar preview HTML for the edit form.
 * @returns {string} HTML string.
 */
function buildEditAssignField() {
    return `
        <div class="edit-form-group">
            <label class="edit-label">Assigned To</label>
            <div class="edit-assign-wrapper">
                <button type="button" class="edit-input edit-assign-toggle" aria-haspopup="listbox"
                    aria-expanded="false" onclick="toggleEditAssignDropdown()">
                    <span>Select contacts</span>
                    <span class="select-caret" aria-hidden="true">&#9662;</span>
                </button>
                <div class="edit-assign-options d-none" id="edit-assign-options"></div>
            </div>
            <div class="edit-assigned-avatars" id="edit-assigned-avatars"></div>
        </div>`;
}


/**
 * Returns the subtask input row and list HTML for the edit form.
 * @returns {string} HTML string.
 */
function buildEditSubtaskField() {
    return `
        <div class="edit-form-group">
            <label class="edit-label">Subtasks</label>
            <div class="edit-subtask-input-row">
                <input id="edit-subtask-input" class="edit-input" type="text"
                    placeholder="Add new subtask"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();addEditSubtask();}">
                <button type="button" class="edit-subtask-add-btn" onclick="addEditSubtask()">&#43;</button>
            </div>
            <ul class="edit-subtask-list" id="edit-subtask-list"></ul>
        </div>`;
}



/**
 * Returns the save button HTML for the edit overlay.
 * @param {string|number} taskId - Task id for the save event binding.
 * @returns {string} HTML string.
 */
function buildEditSaveButton(taskId) {
    return `
        <div class="edit-save-row">
            <button type="button" class="btn-add-task"
                onmousedown="event.preventDefault(); event.stopPropagation();"
                onclick="event.stopPropagation(); saveEditedTask(${taskId})">
                OK
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 6L6 11L15 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
        </div>`;
}


/**
 * Returns HTML for all assign dropdown options in the edit overlay.
 * @param {Array} boardContacts - All available contacts with id, color, initials, name.
 * @param {Array} editAssignedIds - Array of currently assigned contact id strings.
 * @returns {string} HTML string.
 */
function renderEditAssignOptionsHTML(boardContacts, editAssignedIds) {
    return boardContacts.map(c => {
        const selected = editAssignedIds.includes(String(c.id));
        return `<div class="assign-option ${selected ? 'assign-option--active' : ''}"
                    role="checkbox" tabindex="0" aria-checked="${selected}"
                    onclick="toggleEditPerson('${c.id}'); event.stopPropagation();"
                    onkeydown="if(event.key==='Enter' || event.key===' '){event.preventDefault(); toggleEditPerson('${c.id}');}">
                    <span class="assign-option-left">
                        <span class="card-avatar" style="background:${c.color}">${avatarInnerHTML(c)}</span>
                        <span class="assign-option-name">${escapeHtml(c.name)}</span>
                    </span>
                    <span class="assign-checkbox" aria-hidden="true">${selected ? '&#x2611;' : '&#x2610;'}</span>
                </div>`;
    }).join('');
}


/**
 * Returns avatar chip HTML for assigned contacts in the edit overlay, with +N overflow.
 * @param {Array} boardContacts - All available contacts.
 * @param {Array} editAssignedIds - Array of currently assigned contact id strings.
 * @returns {string} HTML string.
 */
function renderEditAssignedAvatarsHTML(boardContacts, editAssignedIds) {
    const selected = boardContacts.filter(c => editAssignedIds.includes(String(c.id)));
    const max = 5;
    const visible = selected.slice(0, max);
    let html = visible.map(c => `<span class="card-avatar" style="background:${c.color}" title="${escapeHtml(c.name)}">${avatarInnerHTML(c)}</span>`).join('');
    if (selected.length > max) html += `<span class="card-avatar card-avatar-more" title="${selected.length - max} more">+${selected.length - max}</span>`;
    return html;
}


/**
 * Returns the list item HTML for each subtask in the edit overlay.
 * @param {Array} editSubtasks - Array of subtask objects with a title property.
 * @returns {string} HTML string.
 */
function renderEditSubtasksHTML(editSubtasks) {
    return editSubtasks.map((s, i) => `
        <li class="edit-subtask-item" id="edit-sub-item-${i}">
            <span class="subtask-text">&#8226; ${escapeHtml(s.title)}</span>
            <div class="edit-subtask-item-actions">
                <button type="button" class="subtask-icon-btn" onclick="startEditSubtask(${i})"><img src="../assets/icons/edit.svg" alt="Edit"></button>
                <span class="subtask-action-divider"></span>
                <button type="button" class="subtask-icon-btn" onclick="deleteEditSubtask(${i})"><img src="../assets/icons/delete.svg" alt="Delete"></button>
            </div>
        </li>`).join('');
}


/**
 * Returns the inline edit input HTML for a single subtask in the edit overlay.
 * @param {number} index - Subtask index in the editSubtasks array.
 * @param {string} title - Current subtask title to pre-fill the input.
 * @returns {string} HTML string.
 */
function renderEditSubtaskInputHTML(index, title) {
    return `
        <input id="edit-sub-input-${index}" class="edit-input edit-subtask-inline-input"
            value="${escapeHtml(title)}"
            onkeydown="if(event.key==='Enter'){saveEditSubtask(${index});}">
        <div class="edit-subtask-item-actions">
            <button type="button" class="subtask-icon-btn" onclick="saveEditSubtask(${index})"><img src="../assets/icons/checkbox-checked.svg" alt="Save"></button>
            <button type="button" class="subtask-icon-btn" onclick="deleteEditSubtask(${index})"><img src="../assets/icons/delete.svg" alt="Delete"></button>
        </div>`;
}
