/** Database base URL and contacts URL used by the add task page and the add task dialog of the board. */
const ADDTASK_BASE_URL = JOIN_DB_URL;
const ADDTASK_CONTACTS_URL = `${ADDTASK_BASE_URL}/contacts.json`;


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
 * Shows a temporary toast notification.
 * @param {string} message - Message to display.
 * @param {boolean} [isError=false] - Whether the toast is an error.
 * @returns {void}
 */
function showTaskNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = 'notification';
    if (isError) notification.classList.add('notification--error');
    notification.classList.remove('d-none');
    setTimeout(() => notification.classList.add('d-none'), 3000);
}
