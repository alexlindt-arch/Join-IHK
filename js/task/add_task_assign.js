/**
 * Loads all contacts from the database for the assign dropdown.
 * @async
 * @returns {Promise<Object[]>} Normalized contacts (empty if unreachable).
 */
async function loadAssignContacts() {
    try {
        const response = await fetch(ADDTASK_CONTACTS_URL);
        return normalizeContacts(toEntryList(await response.json()));
    } catch (error) {
        showTaskNotification('Contacts could not be loaded.', true);
        return [];
    }
}


/**
 * Maps raw contact entries into a consistent shape with id, name, color, avatar.
 * @param {Object[]} raw - Raw contacts from Firebase.
 * @returns {Object[]} Normalized, name-sorted contacts.
 */
function normalizeContacts(raw) {
    return raw
        .map(contact => ({
            id: String(contact.id),
            name: contact.name,
            color: contact.color || getRandomColor(),
            avatar: getInitials(contact.name),
            photo: contact.photo || ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * Opens or closes the "Assigned to" dropdown and renders its options.
 * @returns {void}
 */
function toggleAssignDropdown() {
    const options = document.getElementById('assign-options');
    closeCategoryDropdown();
    renderAssignOptions();
    options.classList.toggle('d-none');
}


/**
 * Renders all contact options into the assignment dropdown.
 * @returns {void}
 */
function renderAssignOptions() {
    const options = document.getElementById('assign-options');
    options.innerHTML = addTaskContacts
        .map(contact => assignOptionTemplate(contact, assignedIds.includes(contact.id)))
        .join('');
}


/**
 * Toggles a contact's assignment state and refreshes options and avatars.
 * @param {string} id - Contact id.
 * @returns {void}
 */
function togglePerson(id) {
    if (assignedIds.includes(id)) {
        assignedIds = assignedIds.filter(assignedId => assignedId !== id);
    } else {
        if (!canAssignMorePersons()) return;
        assignedIds.push(id);
    }
    renderAssignOptions();
    renderAssignedAvatars();
}


/**
 * Enforces a maximum of 99 assigned persons and shows a notification.
 * @returns {boolean} True when another person can be assigned.
 */
function canAssignMorePersons() {
    if (assignedIds.length >= 99) {
        notify('A maximum of 99 contacts can be assigned.', true);
        return false;
    }
    return true;
}


/**
 * Returns the HTML for a single avatar chip.
 * @param {Object} contact - Contact with color and avatar properties.
 * @returns {string} HTML string for one avatar chip.
 */
function avatarChipTemplate(contact) {
    return `<span class="avatar-chip" style="background-color:${contact.color}">${avatarInnerHTML(contact)}</span>`;
}


/**
 * Returns the HTML for the overflow chip showing the remaining count.
 * @param {number} count - Number of hidden contacts.
 * @returns {string} HTML string for the overflow chip.
 */
function avatarOverflowTemplate(count) {
    return `<span class="avatar-chip avatar-chip-more">+${count}</span>`;
}


/**
 * Renders avatar chips for all currently assigned contacts.
 * @returns {void}
 */
function renderAssignedAvatars() {
    const container = document.getElementById('assigned-avatars');
    const selected = addTaskContacts.filter(contact => assignedIds.includes(contact.id));
    const max = 5;
    const visible = selected.slice(0, max);
    let html = visible.map(avatarChipTemplate).join('');
    if (selected.length > max) html += avatarOverflowTemplate(selected.length - max);
    container.innerHTML = html;
}


/**
 * Closes the assignment dropdown.
 * @returns {void}
 */
function closeAssignDropdown() {
    document.getElementById('assign-options').classList.add('d-none');
}


/**
 * Returns the assigned contacts as compact objects for the board.
 * @returns {Object[]} Assigned contacts with id, name, color, initials.
 */
function getAssignedContacts() {
    return addTaskContacts
        .filter(contact => assignedIds.includes(contact.id))
        .map(contact => ({ id: contact.id, name: contact.name, color: contact.color, initials: contact.avatar }));
}