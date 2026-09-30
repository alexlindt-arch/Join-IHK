/**
 * "My profile": lets a logged-in user edit name, email, phone and photo from the avatar menu.
 * Name and email are stored in the user account (so the login uses the new email),
 * everything is stored in the user's contact as well, so the contact list stays in sync.
 * Needs config.js (JOIN_DB_URL), image_utils.js (fileToAvatar) and script.js (getCurrentUser, getInitials).
 */
const PROFILE_DB_URL = JOIN_DB_URL;

/** Firebase key and data of the contact that belongs to the logged-in user. */
let profileContactKey = null;
let profileContact = null;

/** Photo shown in the dialog until it is saved (data URL or empty). */
let profilePendingPhoto = '';

document.addEventListener('DOMContentLoaded', initProfileMenu);
window.addEventListener('load', showHeaderPhoto);


/**
 * Hides "My profile" for guests, because guests have no account to edit.
 * @returns {void}
 */
function initProfileMenu() {
    const user = getCurrentUser();
    if (!user || user.isGuest) {
        document.querySelectorAll('.avatar-menu-btn--profile').forEach(btn => btn.remove());
    }
}


/**
 * Shows the saved profile photo in the header avatar instead of the initials.
 * @returns {void}
 */
function showHeaderPhoto() {
    const user = getCurrentUser();
    const avatar = document.getElementById('user-avatar');
    if (!avatar || !user || user.isGuest) return;
    avatar.innerHTML = user.photo
        ? `<img class="user-avatar-photo" src="${user.photo}" alt="">`
        : getInitials(user.name);
}


/**
 * Opens the profile dialog with the current data of the logged-in user.
 * @async
 * @returns {Promise<void>}
 */
async function openProfileDialog() {
    document.getElementById('avatar-menu')?.classList.add('d-none');
    const user = getCurrentUser();
    if (!user || user.isGuest) return;
    const dialog = getProfileDialog();
    await loadProfileContact(user);
    fillProfileForm(user);
    lockPageScroll(true);
    dialog.showModal();
    document.getElementById('profile-name').focus();
}


/**
 * Returns the profile dialog and creates it on first use.
 * @returns {HTMLDialogElement}
 */
function getProfileDialog() {
    let dialog = document.getElementById('profile-dialog');
    if (dialog) return dialog;
    document.body.insertAdjacentHTML('beforeend', profileDialogTemplate());
    dialog = document.getElementById('profile-dialog');
    dialog.addEventListener('click', event => { if (event.target === dialog) closeProfileDialog(); });
    dialog.addEventListener('close', () => lockPageScroll(false));
    return dialog;
}


/**
 * Stops the page behind the dialog from scrolling while the dialog is open.
 * @param {boolean} locked - True while the dialog is open.
 * @returns {void}
 */
function lockPageScroll(locked) {
    document.documentElement.classList.toggle('profile-dialog-open', locked);
    document.body.classList.toggle('profile-dialog-open', locked);
}


/**
 * Finds the contact of the user: the one with the user's email, otherwise the one stored under the user id.
 * @async
 * @param {Object} user - Logged-in user from the session.
 * @returns {Promise<void>}
 */
async function loadProfileContact(user) {
    profileContactKey = null;
    profileContact = null;
    try {
        const data = await (await fetch(`${PROFILE_DB_URL}/contacts.json`)).json();
        const entries = Object.entries(data || {}).filter(([, contact]) => contact);
        const email = String(user.email || '').toLowerCase();
        const match = entries.find(([, c]) => String(c.email || '').toLowerCase() === email)
            || entries.find(([key]) => String(key) === String(user.id));
        if (match) [profileContactKey, profileContact] = match;
    } catch (error) {
        profileContact = null;
    }
}


/**
 * Writes the current values into the form.
 * @param {Object} user - Logged-in user from the session.
 * @returns {void}
 */
function fillProfileForm(user) {
    const phone = profileContact?.phone;
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = phone || '';
    profilePendingPhoto = profileContact?.photo || user.photo || '';
    setProfileError('');
    renderProfileAvatar();
}


/**
 * Shows the photo, or the initials of the entered name, in the dialog avatar.
 * @returns {void}
 */
function renderProfileAvatar() {
    const circle = document.getElementById('profile-avatar-circle');
    const name = document.getElementById('profile-name').value;
    circle.style.backgroundColor = profileContact?.color || '#2A3647';
    circle.innerHTML = profilePendingPhoto
        ? `<img class="profile-dialog-photo" src="${profilePendingPhoto}" alt="">`
        : getInitials(name);
    document.getElementById('profile-photo-remove').classList.toggle('d-none', !profilePendingPhoto);
}


/**
 * Compresses the selected image and shows it as the new profile photo.
 * @async
 * @param {HTMLInputElement} input - File input.
 * @returns {Promise<void>}
 */
async function handleProfilePhotoSelect(input) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
        profilePendingPhoto = await fileToAvatar(file);
        setProfileError('');
        renderProfileAvatar();
    } catch (error) {
        setProfileError(error.message || 'This image could not be used.');
    }
}


/**
 * Removes the photo in the dialog; the initials are shown again.
 * @returns {void}
 */
function removeProfilePhoto() {
    profilePendingPhoto = '';
    renderProfileAvatar();
}


/**
 * Reads and validates the form.
 * @returns {{name: string, email: string, phone: string}|null} Values, or null after showing an error.
 */
function readProfileForm() {
    const name = document.getElementById('profile-name').value.trim().replace(/\s+/g, ' ');
    const email = document.getElementById('profile-email').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    if (!name) return setProfileError('Please enter your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return setProfileError('Please enter a valid email address.');
    if (phone && !/^\+?[\d\s/-]{4,}$/.test(phone)) return setProfileError('Please enter a valid phone number.');
    return { name, email, phone };
}


/**
 * Saves the profile: user account, matching contact and session, then refreshes the header.
 * @async
 * @param {SubmitEvent} event - Form submit.
 * @returns {Promise<void>}
 */
async function saveProfile(event) {
    event.preventDefault();
    const user = getCurrentUser();
    const values = readProfileForm();
    if (!user || !values) return;
    setProfileSaving(true);
    try {
        await storeProfile(user, values);
    } catch (error) {
        setProfileError('Saving failed. Please try again.');
    } finally {
        setProfileSaving(false);
    }
}


/**
 * Stores valid profile changes everywhere and closes the dialog; rejects emails of other accounts.
 * @async
 * @param {Object} user - Logged-in user.
 * @param {Object} values - Values of the profile form.
 * @returns {Promise<void>}
 */
async function storeProfile(user, values) {
    if (await isEmailTakenByOtherUser(values.email, user.id)) {
        setProfileError('This email address is already used by another account.');
        return;
    }
    await saveProfileToFirebase(user, values);
    updateProfileSession(user, values);
    closeProfileDialog();
    showHeaderPhoto();
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
 * Updates the page parts that show the user: greeting on the summary, list on the contacts page.
 * @returns {void}
 */
function refreshPageAfterProfileSave() {
    if (typeof renderGreeting === 'function') renderGreeting();
    if (typeof init === 'function' && document.querySelector('.contacts-list')) init();
    showProfileToast('Profile saved');
}


/**
 * Shows a short confirmation at the bottom of the page.
 * @param {string} text - Message.
 * @returns {void}
 */
function showProfileToast(text) {
    const toast = document.createElement('div');
    toast.className = 'profile-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}


/**
 * Shows an error in the dialog.
 * @param {string} text - Error text, empty to hide it.
 * @returns {null} Always null, so validation can `return setProfileError(...)`.
 */
function setProfileError(text) {
    const box = document.getElementById('profile-error');
    if (box) box.textContent = text;
    return null;
}


/**
 * Disables the save button while saving.
 * @param {boolean} saving
 * @returns {void}
 */
function setProfileSaving(saving) {
    const button = document.getElementById('profile-save');
    button.disabled = saving;
    button.textContent = saving ? 'Saving …' : 'Save';
}


/**
 * Closes the profile dialog.
 * @returns {void}
 */
function closeProfileDialog() {
    document.getElementById('profile-dialog')?.close();
    lockPageScroll(false);
}


/**
 * Markup of the profile dialog.
 * @returns {string} HTML string.
 */
function profileDialogTemplate() {
    return `
        <dialog class="profile-dialog" id="profile-dialog" aria-labelledby="profile-dialog-title">
            <form class="profile-dialog-form" onsubmit="saveProfile(event)" novalidate>
                <button type="button" class="profile-dialog-close" onclick="closeProfileDialog()" aria-label="Close">&times;</button>
                <h2 class="profile-dialog-title" id="profile-dialog-title">My profile</h2>
                <span class="profile-dialog-divider" aria-hidden="true"></span>
                <label class="profile-dialog-avatar" for="profile-photo" title="Change photo (JPG/PNG)">
                    <span class="profile-dialog-circle" id="profile-avatar-circle"></span>
                    <span class="profile-dialog-camera" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                            <circle cx="12" cy="13" r="3.5" />
                        </svg>
                    </span>
                </label>
                <input type="file" id="profile-photo" accept="image/jpeg,image/png" hidden onchange="handleProfilePhotoSelect(this)">
                <button type="button" class="profile-dialog-link d-none" id="profile-photo-remove" onclick="removeProfilePhoto()">Remove photo</button>
                <label class="profile-dialog-field">
                    <span>Name</span>
                    <input type="text" id="profile-name" autocomplete="name" oninput="renderProfileAvatar()">
                </label>
                <label class="profile-dialog-field">
                    <span>Email</span>
                    <input type="email" id="profile-email" autocomplete="email">
                </label>
                <label class="profile-dialog-field">
                    <span>Phone</span>
                    <input type="tel" id="profile-phone" autocomplete="tel" placeholder="optional">
                </label>
                <p class="profile-dialog-error" id="profile-error" aria-live="polite"></p>
                <div class="profile-dialog-actions">
                    <button type="button" class="profile-dialog-btn profile-dialog-btn--secondary" onclick="closeProfileDialog()">Cancel</button>
                    <button type="submit" class="profile-dialog-btn" id="profile-save">Save</button>
                </div>
            </form>
        </dialog>`;
}
