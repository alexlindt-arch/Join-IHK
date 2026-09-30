/**
 * Builds the Firebase URL of a single contact.
 * @param {string|number} key - Firebase key of the contact.
 * @returns {string} URL of the contact entry.
 */
function getContactUrl(key) {
    return `${JOIN_DB_URL}/contacts/${key}.json`;
}


/**
 * Sends a contact request to Firebase and throws if Firebase answers with an error.
 * @async
 * @param {string|number} key - Firebase key of the contact.
 * @param {string} method - 'PUT', 'PATCH' or 'DELETE'.
 * @param {Object} [data] - Contact data for PUT/PATCH.
 * @returns {Promise<void>}
 * @throws {Error} When the request fails.
 */
async function sendContactRequest(key, method, data) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    const response = await fetch(getContactUrl(key), options);
    if (!response.ok) throw new Error(`Firebase answered ${response.status}`);
}


/**
 * Returns the next free numeric contact id.
 * @returns {number} Highest loaded id + 1.
 */
function getNextContactId() {
    return loadedContacts.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1;
}


/**
 * Assigns id, avatar and color to a new contact and saves it to Firebase.
 * Guests and registered users use the same database.
 * @async
 * @param {Object} newContact - The new contact data (name, email, phone, photo).
 * @returns {Promise<boolean>} True if the contact was saved.
 */
async function saveContactToDB(newContact) {
    newContact.id = getNextContactId();
    newContact.avatar = getInitials(newContact.name);
    newContact.color = getRandomColor();
    try {
        await recordGuestCreate('contacts', newContact.id);
        await sendContactRequest(newContact.id, 'PUT', newContact);
        await reloadContacts();
        return true;
    } catch (error) {
        showToastFeedback('Contact could not be saved. Please try again.');
        return false;
    }
}


/**
 * Handles submission of the "Edit contact" form: reads the updated values
 * and saves them to Firebase.
 * @async
 * @param {SubmitEvent} event - The form submit event.
 * @param {string|number} id - The id of the contact being updated.
 * @returns {Promise<void>}
 */
async function updateContact(event, id) {
    event.preventDefault();
    const contact = loadedContacts.find(c => String(c.id) === String(id));
    if (!contact) return;
    const updated = { ...readContactForm(event.target), color: contact.color };
    updated.avatar = getInitials(updated.name);
    try {
        await recordGuestChange('contacts', contact.id);
        await sendContactRequest(contact.id, 'PATCH', updated);
        await syncOwnAccount(contact, updated);
        await reloadContacts();
        finalizeUpdate(contact.id);
    } catch (error) {
        showToastFeedback('Contact could not be updated. Please try again.');
    }
}


/**
 * Common cleanup after a contact update: closes the dialog,
 * re-renders the contact list, and re-opens the detail view
 * for the updated contact.
 * @param {string|number} id - The id of the updated contact.
 * @returns {void}
 */
function finalizeUpdate(id) {
    closeDialog();
    showContactDetails(String(id));
    showToastFeedback('Contact successfully updated');
}


/**
 * Deletes a contact from Firebase, closes the dialog and clears the detail view.
 * @async
 * @param {string|number} id - The id of the contact to delete.
 * @returns {Promise<void>}
 */
async function deleteContact(id) {
    if (!id) return;
    try {
        await recordGuestChange('contacts', id);
        await sendContactRequest(id, 'DELETE');
        await removeContactFromTasks(id);
        await reloadContacts();
        finalizeDelete();
    } catch (error) {
        showToastFeedback('Contact could not be deleted. Please try again.');
    }
}


/**
 * Cleanup after a contact was deleted: closes the dialog, clears the
 * detail view, returns to the list on mobile and shows a confirmation.
 * @returns {void}
 */
function finalizeDelete() {
    if (dialog?.open) closeDialog();
    if (contactDetailsContainer) contactDetailsContainer.innerHTML = '';
    resetMobileContactView();
    showToastFeedback('Contact successfully deleted');
}
