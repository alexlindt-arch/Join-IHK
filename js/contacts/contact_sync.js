/**
 * Copies name and email of the user's own contact to the account and the session,
 * so the header and the login use the new values too.
 * @async
 * @param {Object} contact - Contact before the update.
 * @param {{name: string, email: string}} updated - New contact values.
 * @returns {Promise<void>}
 */
async function syncOwnAccount(contact, updated) {
    const user = getCurrentUser();
    if (!user || user.isGuest || !isOwnContact(contact)) return;
    await fetch(`${JOIN_DB_URL}/users/${user.id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updated.name, email: updated.email })
    });
    sessionStorage.setItem('currentUser', JSON.stringify({ ...user, name: updated.name, email: updated.email }));
    setHeaderAvatar();
}


/**
 * Removes a deleted contact from every task it was assigned to.
 * @async
 * @param {string|number} contactId - Id of the deleted contact.
 * @returns {Promise<void>}
 */
async function removeContactFromTasks(contactId) {
    const response = await fetch(`${JOIN_DB_URL}/tasks.json`);
    const tasks = toEntryList(await response.json());
    const affectedTasks = tasks.filter(task => isAssignedToTask(task, contactId));
    await Promise.all(affectedTasks.map(task => saveTaskAssignees(task, contactId)));
}


/**
 * Tells whether a contact is assigned to a task.
 * @param {Object} task - Task with optional assignedTo list.
 * @param {string|number} contactId - Contact id.
 * @returns {boolean} True when the contact is assigned.
 */
function isAssignedToTask(task, contactId) {
    return (task.assignedTo || []).some(assignee => String(assignee.id) === String(contactId));
}


/**
 * Saves the assignees of a task without the deleted contact.
 * @async
 * @param {Object} task - Task that contains the contact.
 * @param {string|number} contactId - Id of the deleted contact.
 * @returns {Promise<void>}
 */
async function saveTaskAssignees(task, contactId) {
    const assignedTo = task.assignedTo.filter(assignee => String(assignee.id) !== String(contactId));
    await recordGuestChange('tasks', task.id);
    await fetch(`${JOIN_DB_URL}/tasks/${task.id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo })
    });
}
