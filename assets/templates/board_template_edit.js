/**
 * Returns the edit form of a task (Figma: two columns like the add-task form).
 * @param {Object} task - Task object with all editable fields.
 * @returns {string} HTML string.
 */
function editTaskTemplate(task) {
    return `
        <button type="button" class="detail-close-btn edit-close-btn" aria-label="Close"
            onmousedown="event.stopPropagation(); event.preventDefault();" onclick="closeOverlay(); event.stopPropagation();">&#x2715;</button>
        <form class="task-form edit-task-form" novalidate onsubmit="event.preventDefault(); saveEditedTask(${task.id})">
            <div class="form-columns">
                <div class="form-col">
                    ${buildEditBasicFields(task)}
                    ${buildEditPrioField(task.priority)}
                    ${buildEditCategoryField(task.category)}
                </div>
                <div class="form-divider-vertical"></div>
                <div class="form-col">
                    ${attachmentPickerTemplate('edit')}
                    ${buildEditSubtaskField()}
                    ${buildEditAssignField()}
                </div>
            </div>
            ${buildEditFooter()}
        </form>`;
}


/**
 * Returns the title, description and due date fields of the edit form.
 * @param {Object} task - Task object with title, description, dueDate.
 * @returns {string} HTML string.
 */
function buildEditBasicFields(task) {
    return `
        <div class="form-group">
            <label class="form-label" for="edit-title">Title <span class="required">*</span></label>
            <input class="form-input" type="text" id="edit-title" value="${escapeHtml(task.title || '')}" placeholder="Enter a title">
            <span class="field-error d-none" id="edit-error-title">This field is required</span>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-desc">Description</label>
            <textarea class="form-input form-textarea" id="edit-desc" placeholder="Enter a description">${escapeHtml(task.description || '')}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-due">Due date <span class="required">*</span></label>
            <div class="form-input-icon">
                <input class="form-input date-picker flatpickr-edit" type="text" id="edit-due" placeholder="dd/mm/yyyy"
                    value="${escapeHtml(toDisplayDate(task.dueDate))}" readonly>
                <img class="input-icon" src="../assets/icons/event.svg" alt="">
            </div>
            <span class="field-error d-none" id="edit-error-due">This field is required</span>
        </div>`;
}


/**
 * Returns the priority buttons of the edit form.
 * @param {string} currentPrio - Currently selected priority.
 * @returns {string} HTML string.
 */
function buildEditPrioField(currentPrio) {
    const buttons = ['urgent', 'medium', 'low'].map(prio => `
        <button type="button" class="prio-btn prio-${prio} ${currentPrio === prio ? 'prio-active' : ''}"
            data-prio="${prio}" onclick="selectEditPrio(this, '${prio}')">
            ${prio.charAt(0).toUpperCase() + prio.slice(1)} ${prioSvg(prio)}
        </button>`).join('');
    return `
        <div class="form-group">
            <span class="form-label" id="edit-prio-label">Prio</span>
            <div class="prio-buttons edit-prio-group" role="group" aria-labelledby="edit-prio-label">${buttons}</div>
        </div>`;
}


/**
 * Returns the category dropdown of the edit form.
 * @param {string} category - Current category of the task.
 * @returns {string} HTML string.
 */
function buildEditCategoryField(category) {
    return `
        <div class="form-group">
            <label class="form-label" id="edit-category-label" for="edit-category-toggle">Category <span class="required">*</span></label>
            <div class="custom-select edit-category-select">
                <button type="button" class="form-input select-toggle" id="edit-category-toggle" aria-haspopup="listbox"
                    aria-expanded="false" onclick="toggleEditCategoryDropdown()">
                    <span id="edit-category-selected">${escapeHtml(category || 'Select task category')}</span>
                    <span class="select-caret" aria-hidden="true">&#9662;</span>
                </button>
                <div class="select-options d-none" id="edit-category-options" role="listbox" aria-labelledby="edit-category-label">
                    <button type="button" class="select-option" role="option" onclick="selectEditCategory('Technical Task')">Technical Task</button>
                    <button type="button" class="select-option" role="option" onclick="selectEditCategory('User Story')">User Story</button>
                </div>
            </div>
        </div>`;
}


/**
 * Returns the subtask input and list of the edit form.
 * @returns {string} HTML string.
 */
function buildEditSubtaskField() {
    return `
        <div class="form-group">
            <label class="form-label" for="edit-subtask-input">Subtasks</label>
            <div class="subtask-input-wrapper">
                <input class="form-input" type="text" id="edit-subtask-input" placeholder="Add new subtask"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();addEditSubtask();}">
                <div class="subtask-actions">
                    <button type="button" class="subtask-icon-btn" aria-label="Add subtask" onclick="addEditSubtask()">&#43;</button>
                </div>
            </div>
            <ul class="edit-subtask-list" id="edit-subtask-list"></ul>
        </div>`;
}


/**
 * Returns the assigned-to dropdown and the avatars of the edit form.
 * @returns {string} HTML string.
 */
function buildEditAssignField() {
    return `
        <div class="form-group">
            <label class="form-label" for="edit-assign-toggle">Assigned to</label>
            <div class="custom-select edit-assign-wrapper">
                <button type="button" class="form-input select-toggle" id="edit-assign-toggle" aria-haspopup="listbox"
                    aria-expanded="false" onclick="toggleEditAssignDropdown()">
                    <span>Select contacts to assign</span>
                    <span class="select-caret" aria-hidden="true">&#9662;</span>
                </button>
                <div class="select-options d-none" id="edit-assign-options"></div>
            </div>
            <div class="edit-assigned-avatars" id="edit-assigned-avatars"></div>
        </div>`;
}


/**
 * Returns the footer of the edit form with the required hint and the OK button.
 * @returns {string} HTML string.
 */
function buildEditFooter() {
    return `
        <div class="form-footer">
            <span class="required-hint"><span class="required">*</span>This field is required</span>
            <div class="form-actions">
                <button type="submit" class="btn-create" onmousedown="event.stopPropagation();">
                    Ok <img src="../assets/icons/done.svg" alt="" class="btn-icon">
                </button>
            </div>
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
