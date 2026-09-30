/**
 * Saving and deleting the account of the logged-in user.
 * Save: validates the account form and writes the values into the user account, the user's contact and the session.
 * Delete: asks for confirmation, then removes the user account, the user's own contact and every
 * task assignment of that contact, and logs the user out.
 * Needs profile.js, assets/templates/profile_template.js and script.js (getCurrentUser, getInitials, getRandomColor, logout).
 */

/** Validation rules of the account form: rule, text when invalid, and whether the field is required. */
const PROFILE_RULES = {
    name: { rule: /^[\p{L}'-]+(\s+[\p{L}'-]+)+$/u, required: true, text: 'Please enter first and last name (letters only).' },
    email: { rule: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, required: true, text: 'Please enter a valid email address.' },
    phone: { rule: /^\+?[0-9]+$/, required: false, text: 'Only numbers are allowed (optionally starting with +).' }
};


/**
 * Returns the error text of one field, or '' when the value is valid.
 * @param {string} key - Field key (name, email or phone).
 * @param {string} value - Trimmed field value.
 * @returns {string} Error text.
 */
function getProfileFieldError(key, value) {
    const rules = typeof isGuestProfile === 'function' && isGuestProfile() ? GUEST_PROFILE_RULES : PROFILE_RULES;
    const config = rules[key];
    if (!value) return config.required ? 'This field is required.' : '';
    return config.rule.test(value) ? '' : config.text;
}


/**
 * Reads and validates the form; shows a red hint under every invalid field.
 * @returns {{name: string, email: string, phone: string}|null} Values, or null when a field is invalid.
 */
function readProfileForm() {
    const values = {
        name: document.getElementById('profile-name').value.trim().replace(/\s+/g, ' '),
        email: document.getElementById('profile-email').value.trim(),
        phone: document.getElementById('profile-phone').value.trim()
    };
    const invalid = Object.keys(PROFILE_RULES).filter(key => {
        const text = getProfileFieldError(key, values[key]);
        setProfileFieldError(key, text);
        return text !== '';
    });
    if (invalid.length) document.getElementById(`profile-${invalid[0]}`).focus();
    return invalid.length ? null : values;
}


/**
 * Form submit: in view mode it switches to edit mode, in edit mode it saves the account.
 * @async
 * @param {SubmitEvent} event - Form submit.
 * @returns {Promise<void>}
 */
async function saveProfile(event) {
    event.preventDefault();
    if (!profileEditMode) return startProfileEdit();
    const user = getCurrentUser();
    const values = readProfileForm();
    if (!user || !values) return;
    setProfileSaving(true);
    try {
        await (user.isGuest ? storeGuestProfile(user, values) : storeProfile(user, values));
    } catch (error) {
        setProfileError('Saving failed. Please try again.');
    } finally {
        setProfileSaving(false);
    }
}


/**
 * Switches to edit mode and puts the cursor into the name field.
 * @returns {void}
 */
function startProfileEdit() {
    setProfileMode(true);
    document.getElementById('profile-name').focus({ preventScroll: true });
    scrollProfileToTop();
}


/**
 * Stores valid changes everywhere and goes back to view mode; rejects emails of other accounts.
 * @async
 * @param {Object} user - Logged-in user.
 * @param {Object} values - Values of the account form.
 * @returns {Promise<void>}
 */
async function storeProfile(user, values) {
    if (await isEmailTakenByOtherUser(values.email, user.id)) {
        setProfileFieldError('email', 'This email address is already used by another account.');
        return;
    }
    await saveProfileToFirebase(user, values);
    updateProfileSession(user, values);
    profileContact = { ...profileContact, phone: values.phone, email: values.email };
    setProfileMode(false);
    refreshPageAfterProfileSave();
}


/**
 * Checks whether another account already uses the email.
 * @async
 * @param {string} email - New email.
 * @param {string|number} userId - Id of the logged-in user.
 * @returns {Promise<boolean>}
 */
async function isEmailTakenByOtherUser(email, userId) {
    const data = await (await fetch(`${PROFILE_DB_URL}/users.json`)).json();
    const users = Object.values(data || {}).filter(Boolean);
    const wanted = email.toLowerCase();
    return users.some(u => String(u.email || '').toLowerCase() === wanted && String(u.id) !== String(userId));
}


/**
 * Writes the new values into the user account and into the user's contact.
 * @async
 * @param {Object} user - Logged-in user.
 * @param {{name: string, email: string, phone: string}} values - New values.
 * @returns {Promise<void>}
 */
async function saveProfileToFirebase(user, values) {
    await patchProfile(`users/${user.id}`, { name: values.name, email: values.email });
    const key = profileContactKey ?? user.id;
    await patchProfile(`contacts/${key}`, {
        id: profileContact?.id ?? Number(key),
        name: values.name,
        email: values.email,
        phone: values.phone || '',
        avatar: getInitials(values.name),
        color: profileContact?.color || getRandomColor(),
        photo: profilePendingPhoto
    });
}


/**
 * Sends a PATCH request to Firebase.
 * @async
 * @param {string} path - Path below the database root.
 * @param {Object} data - Fields to update.
 * @returns {Promise<void>}
 * @throws {Error} When Firebase answers with an error.
 */
async function patchProfile(path, data) {
    const response = await fetch(`${PROFILE_DB_URL}/${path}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Firebase answered ${response.status}`);
}


/**
 * Stores the new name, email and photo in the session, so every page shows them.
 * @param {Object} user - Logged-in user.
 * @param {{name: string, email: string}} values - New values.
 * @returns {void}
 */
function updateProfileSession(user, values) {
    const session = { ...user, name: values.name, email: values.email, photo: profilePendingPhoto };
    sessionStorage.setItem('currentUser', JSON.stringify(session));
}


/**
 * Updates the page parts that show the user: greeting on the summary, list on the contacts page
 * and the header avatar (after the greeting, which writes the initials into it).
 * @returns {void}
 */
function refreshPageAfterProfileSave() {
    if (typeof renderGreeting === 'function') renderGreeting();
    if (typeof init === 'function' && document.querySelector('.contacts-list')) init();
    showHeaderPhoto();
    showProfileToast('Account updated');
}


/**
 * Disables the save button while saving.
 * @param {boolean} saving - True while the request runs.
 * @returns {void}
 */
function setProfileSaving(saving) {
    const button = document.getElementById('profile-save');
    button.disabled = saving;
    button.textContent = saving ? 'Saving …' : (profileEditMode ? 'Save ✓' : 'Edit');
}


/**
 * Opens the confirmation dialog on top of the account dialog.
 * @returns {void}
 */
function openDeleteAccountDialog() {
    const dialog = getDeleteAccountDialog();
    document.getElementById('account-delete-error').textContent = '';
    setDeleteAccountBusy(false);
    dialog.showModal();
    document.getElementById('account-delete-no').focus();
}


/**
 * Returns the confirmation dialog and creates it on first use.
 * @returns {HTMLDialogElement}
 */
function getDeleteAccountDialog() {
    let dialog = document.getElementById('account-delete-dialog');
    if (dialog) return dialog;
    document.body.insertAdjacentHTML('beforeend', deleteAccountDialogTemplate());
    dialog = document.getElementById('account-delete-dialog');
    dialog.addEventListener('click', event => { if (event.target === dialog) closeDeleteAccountDialog(); });
    dialog.addEventListener('close', () => document.getElementById('profile-delete')?.focus());
    return dialog;
}


/**
 * Closes the confirmation dialog; the account dialog stays open.
 * @returns {void}
 */
function closeDeleteAccountDialog() {
    document.getElementById('account-delete-dialog')?.close();
}


/**
 * Deletes the account after "Yes" and logs out; shows an error when something fails.
 * @async
 * @returns {Promise<void>}
 */
async function confirmDeleteAccount() {
    const user = getCurrentUser();
    if (!user || user.isGuest) return;
    setDeleteAccountBusy(true);
    try {
        await deleteAccountData(user);
        showProfileToast('Account deleted');
        setTimeout(logout, 1200);
    } catch (error) {
        document.getElementById('account-delete-error').textContent = 'Deleting failed. Please try again.';
        setDeleteAccountBusy(false);
    }
}


/**
 * Removes the contact from all tasks, then deletes the contact and the user account.
 * @async
 * @param {Object} user - Logged-in user.
 * @returns {Promise<void>}
 */
async function deleteAccountData(user) {
    await loadProfileContact(user);
    if (profileContactKey !== null) {
        const ids = [String(profileContactKey), String(profileContact?.id ?? profileContactKey)];
        await removeAccountFromTasks(ids);
        await deleteFromDatabase(`contacts/${profileContactKey}`);
    }
    await deleteFromDatabase(`users/${user.id}`);
}


/**
 * Removes the user's contact from the assignedTo list of every task (tasks may be an array or an object).
 * @async
 * @param {string[]} contactIds - Ids under which the contact can be assigned.
 * @returns {Promise<void>}
 */
async function removeAccountFromTasks(contactIds) {
    const response = await fetch(`${PROFILE_DB_URL}/tasks.json`);
    if (!response.ok) throw new Error(`Firebase answered ${response.status}`);
    const entries = Object.entries(await response.json() || {}).filter(([, task]) => task);
    const updates = entries
        .map(([key, task]) => [key, Object.values(task.assignedTo || {}).filter(Boolean)])
        .filter(([, assigned]) => assigned.some(a => contactIds.includes(String(a.id))));
    await Promise.all(updates.map(([key, assigned]) =>
        patchProfile(`tasks/${key}`, { assignedTo: assigned.filter(a => !contactIds.includes(String(a.id))) })));
}


/**
 * Sends a DELETE request to Firebase.
 * @async
 * @param {string} path - Path below the database root.
 * @returns {Promise<void>}
 * @throws {Error} When Firebase answers with an error.
 */
async function deleteFromDatabase(path) {
    const response = await fetch(`${PROFILE_DB_URL}/${path}.json`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Firebase answered ${response.status}`);
}


/**
 * Disables both buttons while the account is being deleted.
 * @param {boolean} busy - True while the requests run.
 * @returns {void}
 */
function setDeleteAccountBusy(busy) {
    document.getElementById('account-delete-yes').disabled = busy;
    document.getElementById('account-delete-no').disabled = busy;
    document.getElementById('account-delete-yes').textContent = busy ? 'Deleting …' : 'Yes';
}
