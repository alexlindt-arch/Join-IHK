/**
 * Builds one selectable contact row for the "Assigned to" dropdown.
 * @param {Object} contact - Contact with id, name, color and avatar initials.
 * @param {boolean} isSelected - Whether the contact is currently assigned.
 * @returns {string} HTML for a single dropdown option.
 */
function assignOptionTemplate(contact, isSelected) {
    return `
        <div class="assign-option ${isSelected ? 'assign-option--active' : ''}" role="checkbox" tabindex="0"
            aria-checked="${isSelected}" onclick="togglePerson('${contact.id}'); event.stopPropagation();"
            onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();togglePerson('${contact.id}');}">
            <span class="assign-option-left">
                <span class="avatar-chip" style="background-color:${contact.color}">${avatarInnerHTML(contact)}</span>
                <span class="assign-option-name">${escapeHtml(contact.name)}</span>
            </span>
            <span class="assign-checkbox" aria-hidden="true">${isSelected ? '&#x2611;' : '&#x2610;'}</span>
        </div>`;
}


/**
 * Builds a small avatar chip shown beneath the assignment field.
 * @param {Object} contact - Contact with color and avatar initials.
 * @returns {string} HTML for an avatar chip.
 */
function avatarChipTemplate(contact) {
    return `<span class="avatar-chip" style="background-color:${contact.color}">${avatarInnerHTML(contact)}</span>`;
}


/**
 * Builds one subtask list item with hover edit/delete actions.
 * @param {Object} subtask - Subtask with a title.
 * @param {number} index - Position in the subtask list.
 * @returns {string} HTML for a subtask list item.
 */
function subtaskItemTemplate(subtask, index) {
    return `
        <li class="subtask-item" ondblclick="editSubtask(${index})">
            <span class="subtask-text">&bull; ${escapeHtml(subtask.title)}</span>
            <span class="subtask-item-actions">
                <button type="button" class="subtask-icon-btn" title="Edit" onclick="editSubtask(${index})">&#9998;</button>
                <span class="subtask-action-divider"></span>
                <button type="button" class="subtask-icon-btn" title="Delete" onclick="deleteSubtask(${index})">&#128465;</button>
            </span>
        </li>`;
}


/**
 * Builds the inline edit row for an existing subtask.
 * @param {Object} subtask - Subtask being edited.
 * @param {number} index - Position in the subtask list.
 * @returns {string} HTML for the editable subtask row.
 */
function subtaskEditTemplate(subtask, index) {
    return `
        <li class="subtask-item subtask-item--editing">
            <input class="subtask-edit-input" id="subtask-edit-${index}" value="${escapeHtml(subtask.title)}"
                onkeydown="if(event.key==='Enter'){event.preventDefault();saveSubtaskEdit(${index});}">
            <span class="subtask-item-actions">
                <button type="button" class="subtask-icon-btn" title="Delete" onclick="deleteSubtask(${index})">&#128465;</button>
                <span class="subtask-action-divider"></span>
                <button type="button" class="subtask-icon-btn" title="Save" onclick="saveSubtaskEdit(${index})">&#10003;</button>
            </span>
        </li>`;
}
