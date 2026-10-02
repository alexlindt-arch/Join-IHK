


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