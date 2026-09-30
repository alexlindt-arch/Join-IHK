const ADDTASK_BASE_URL = JOIN_DB_URL;
const ADDTASK_CONTACTS_URL = `${ADDTASK_BASE_URL}/contacts.json`;

let modalSelectedPriority = 'medium';
let modalSelectedCategory = '';
let modalAssignedIds = [];
let modalSubtasks = [];
let modalContacts = [];
let modalDefaultStatus = 'todo';


/**
 * Loads all contacts from the database for the assign dropdown of the modal.
 * @async
 * @returns {Promise<Array>} Normalised contacts.
 */
async function loadAssignContacts() {
    try {
        const response = await fetch(ADDTASK_CONTACTS_URL);
        return normalizeContacts(toEntryList(await response.json()));
    } catch (error) {
        notify('Contacts could not be loaded.', true);
        return [];
    }
}


/**
 * Normalizes raw contacts: filters nulls, maps to consistent shape, sorts by name.
 * @param {Array} raw - Raw contact objects.
 * @returns {Array} Sorted, normalized contacts.
 */
function normalizeContacts(raw) {
    return raw
        .map(contact => ({
            id: String(contact.id),
            name: contact.name,
            color: contact.color || (typeof getRandomColor === 'function' ? getRandomColor() : '#ccc'),
            avatar: getInitials(contact.name),
            photo: contact.photo || ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Activates the clicked priority button and stores the selection.
 * @param {HTMLElement} button - The clicked priority button.
 * @returns {void}
 */
function setModalPriority(button) {
    document.querySelectorAll('#add-task-overlay .prio-btn').forEach(btn => btn.classList.remove('prio-active'));
    button.classList.add('prio-active');
    modalSelectedPriority = button.dataset.prio;
}


/**
 * Toggles the category dropdown (closes assign dropdown first).
 * @returns {void}
 */
function toggleModalCategoryDropdown() {
    closeModalAssignDropdown();
    const options = document.getElementById('modal-category-options');
    const isOpen = options.classList.toggle('d-none') === false;
    if (isOpen) options.scrollIntoView({ block: 'nearest' });
}


/**
 * Closes the category dropdown.
 * @returns {void}
 */
function closeModalCategoryDropdown() {
    document.getElementById('modal-category-options').classList.add('d-none');
}


/**
 * Selects a category, updates the label, hides the error, and refreshes the button.
 * @param {string} value - The selected category value.
 * @returns {void}
 */
function selectModalCategory(value) {
    modalSelectedCategory = value;
    const label = document.getElementById('modal-category-selected');
    label.textContent = value;
    label.classList.remove('select-placeholder');
    closeModalCategoryDropdown();
    document.getElementById('modal-error-category').classList.add('d-none');
    updateModalCreateButton();
}


/**
 * Toggles the assign dropdown (closes category dropdown first).
 * @returns {void}
 */
function toggleModalAssignDropdown() {
    closeModalCategoryDropdown();
    renderModalAssignOptions();
    document.getElementById('modal-assign-options').classList.toggle('d-none');
}


/**
 * Closes the assign dropdown.
 * @returns {void}
 */
function closeModalAssignDropdown() {
    document.getElementById('modal-assign-options').classList.add('d-none');
}


/**
 * Renders all contact options in the assign dropdown.
 * @returns {void}
 */
function renderModalAssignOptions() {
    const options = document.getElementById('modal-assign-options');
    options.innerHTML = modalContacts
        .map(contact => modalAssignOptionTemplate(contact, modalAssignedIds.includes(contact.id)))
        .join('');
}


/**
 * Returns the HTML for one assign dropdown option.
 * @param {Object} contact - Contact with id, name, color, avatar.
 * @param {boolean} isSelected - Whether the contact is currently assigned.
 * @returns {string} HTML string.
 */
function modalAssignOptionTemplate(contact, isSelected) {
    return `
        <div class="assign-option ${isSelected ? 'assign-option--active' : ''}"
             role="checkbox" tabindex="0" aria-checked="${isSelected}"
             onclick="toggleModalPerson('${contact.id}'); event.stopPropagation();"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleModalPerson('${contact.id}');}">
            <span class="assign-option-left">
                <span class="avatar-chip" style="background-color:${contact.color}">${avatarInnerHTML(contact)}</span>
                <span class="assign-option-name">${escapeHtml(contact.name)}</span>
            </span>
            <span class="assign-checkbox" aria-hidden="true">${isSelected ? '&#x2611;' : '&#x2610;'}</span>
        </div>`;
}


/**
 * Toggles a contact's assignment state and refreshes the UI.
 * @param {string} id - Contact id to toggle.
 * @returns {void}
 */
function toggleModalPerson(id) {
    if (modalAssignedIds.includes(id)) {
        modalAssignedIds = modalAssignedIds.filter(assignedId => assignedId !== id);
    } else {
        if (!canAssignMoreModalPersons()) return;
        modalAssignedIds.push(id);
    }
    renderModalAssignOptions();
    renderModalAssignedAvatars();
}


/**
 * Returns false and notifies the user if the 10-person limit is reached.
 * @returns {boolean}
 */
function canAssignMoreModalPersons() {
    if (modalAssignedIds.length >= 99) {
        notify('A maximum of 99 contacts can be assigned.', true);
        return false;
    }
    return true;
}


/**
 * Renders assigned contact avatars with a "+N" overflow chip after 5.
 * @returns {void}
 */
function renderModalAssignedAvatars() {
    const container = document.getElementById('modal-assigned-avatars');
    const selected = modalContacts.filter(contact => modalAssignedIds.includes(contact.id));
    const visible = selected.slice(0, 5);
    let html = visible.map(c => `<span class="avatar-chip" style="background-color:${c.color}">${avatarInnerHTML(c)}</span>`).join('');
    if (selected.length > 5) html += `<span class="avatar-chip avatar-chip-more">+${selected.length - 5}</span>`;
    container.innerHTML = html;
}


/**
 * Adds a subtask when Enter is pressed inside the subtask input.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleModalSubtaskKey(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addModalSubtask();
}


/**
 * Shows or hides subtask action buttons based on whether the input has text.
 * @returns {void}
 */
function updateModalSubtaskActions() {
    const hasText = document.getElementById('modal-task-subtask').value.trim().length > 0;
    const editActions = document.getElementById('modal-subtask-edit-actions');
    if (editActions) editActions.classList.toggle('d-none', !hasText);
}


/**
 * Reads the subtask input, appends a new subtask object, and re-renders.
 * @returns {void}
 */
function addModalSubtask() {
    const input = document.getElementById('modal-task-subtask');
    const title = input.value.trim();
    if (!title) return;
    modalSubtasks.push({ title, done: false });
    input.value = '';
    updateModalSubtaskActions();
    renderModalSubtasks();
}


/**
 * Clears the subtask input and hides the action buttons.
 * @returns {void}
 */
function clearModalSubtaskInput() {
    document.getElementById('modal-task-subtask').value = '';
    updateModalSubtaskActions();
}


/**
 * Removes a subtask by index and re-renders the list.
 * @param {number} index
 * @returns {void}
 */
function deleteModalSubtask(index) {
    modalSubtasks.splice(index, 1);
    renderModalSubtasks();
}


/**
 * Replaces a subtask list item with an inline edit input.
 * @param {number} index
 * @returns {void}
 */
function editModalSubtask(index) {
    const list = document.getElementById('modal-subtask-list');
    list.children[index].outerHTML = modalSubtaskEditTemplate(modalSubtasks[index], index);
    document.getElementById(`modal-subtask-edit-${index}`).focus();
}


/**
 * Saves the edited subtask; deletes it if the input is empty.
 * @param {number} index
 * @returns {void}
 */
function saveModalSubtaskEdit(index) {
    const value = document.getElementById(`modal-subtask-edit-${index}`).value.trim();
    if (!value) return deleteModalSubtask(index);
    modalSubtasks[index].title = value;
    renderModalSubtasks();
}


/**
 * Re-renders all subtask list items.
 * @returns {void}
 */
function renderModalSubtasks() {
    const list = document.getElementById('modal-subtask-list');
    list.innerHTML = modalSubtasks.map((subtask, index) => modalSubtaskItemTemplate(subtask, index)).join('');
}


/**
 * Returns the HTML for a single read-only subtask item.
 * @param {Object} subtask
 * @param {number} index
 * @returns {string}
 */
function modalSubtaskItemTemplate(subtask, index) {
    return `
        <li class="subtask-item" ondblclick="editModalSubtask(${index})">
            <span class="subtask-text">&bull; ${escapeHtml(subtask.title)}</span>
            <span class="subtask-item-actions">
                <button type="button" class="subtask-icon-btn" title="Edit" onclick="editModalSubtask(${index})">&#9998;</button>
                <span class="subtask-action-divider"></span>
                <button type="button" class="subtask-icon-btn" title="Delete" onclick="deleteModalSubtask(${index})">&#128465;</button>
            </span>
        </li>`;
}


/**
 * Returns the HTML for an inline subtask edit input.
 * @param {Object} subtask
 * @param {number} index
 * @returns {string}
 */
function modalSubtaskEditTemplate(subtask, index) {
    return `
        <li class="subtask-item subtask-item--editing">
            <input class="subtask-edit-input" id="modal-subtask-edit-${index}" value="${escapeHtml(subtask.title)}"
                onkeydown="if(event.key==='Enter'){event.preventDefault();saveModalSubtaskEdit(${index});}">
            <span class="subtask-item-actions">
                <button type="button" class="subtask-icon-btn" title="Delete" onclick="deleteModalSubtask(${index})">&#128465;</button>
                <span class="subtask-action-divider"></span>
                <button type="button" class="subtask-icon-btn" title="Save" onclick="saveModalSubtaskEdit(${index})">&#10003;</button>
            </span>
        </li>`;
}
