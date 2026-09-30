/**
 * "My account": shows the data of the logged-in user from the avatar menu and lets the user edit
 * name, email, phone and photo. Name and email are stored in the user account (so the login uses
 * the new email), everything is stored in the user's contact as well, so the contact list stays in sync.
 * Needs config.js (JOIN_DB_URL), image_utils.js (fileToAvatar, imgEscape), script.js (getCurrentUser,
 * getInitials, getRandomColor) and assets/templates/profile_template.js.
 */
const PROFILE_DB_URL = JOIN_DB_URL;

/** Firebase key and data of the contact that belongs to the logged-in user. */
let profileContactKey = null;
let profileContact = null;

/** Photo shown in the dialog until it is saved (data URL or empty). */
let profilePendingPhoto = '';

/** True while the dialog is in "Edit account" mode. */
let profileEditMode = false;

document.addEventListener('DOMContentLoaded', initProfileMenu);
window.addEventListener('load', showHeaderPhoto);


/**
 * Hides "Account" when nobody is logged in; guests keep it to set their profile photo.
 * @returns {void}
 */
function initProfileMenu() {
    const user = getCurrentUser();
    if (!user) {
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
    if (!avatar || !user) return;
    avatar.innerHTML = user.photo
        ? `<img class="user-avatar-photo" src="${imgEscape(user.photo)}" alt="">`
        : getInitials(user.name);
}


/**
 * Opens the account dialog in view mode with the current data of the logged-in user.
 * @async
 * @returns {Promise<void>}
 */
async function openProfileDialog() {
    document.getElementById('avatar-menu')?.classList.add('d-none');
    const user = getCurrentUser();
    if (!user) return;
    const dialog = getProfileDialog();
    if (!user.isGuest) await loadProfileContact(user);
    fillProfileForm(user);
    if (user.isGuest) await fillGuestAccount(user);
    setProfileMode(false);
    lockPageScroll(true);
    dialog.showModal();
    document.getElementById('profile-save').focus();
}


/**
 * Returns the account dialog and creates it on first use.
 * @returns {HTMLDialogElement}
 */
function getProfileDialog() {
    let dialog = document.getElementById('profile-dialog');
    if (dialog) return dialog;
    document.body.insertAdjacentHTML('beforeend', profileDialogTemplate());
    dialog = document.getElementById('profile-dialog');
    dialog.addEventListener('click', event => { if (event.target === dialog) closeProfileDialog(); });
    dialog.addEventListener('close', handleProfileDialogClosed);
    return dialog;
}


/**
 * Unlocks the page and gives the focus back to the avatar button that opened the menu.
 * @returns {void}
 */
function handleProfileDialogClosed() {
    lockPageScroll(false);
    document.getElementById('user-avatar')?.focus();
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
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = profileContact?.phone || '';
    profilePendingPhoto = profileContact?.photo || user.photo || '';
    renderProfileAvatar();
}


/**
 * Switches the dialog between "My account" (read-only) and "Edit account" (editable).
 * @param {boolean} edit - True for edit mode.
 * @returns {void}
 */
function setProfileMode(edit) {
    profileEditMode = edit;
    const dialog = document.getElementById('profile-dialog');
    dialog.classList.toggle('account-dialog--edit', edit);
    document.getElementById('profile-dialog-title').textContent = edit ? 'Edit account' : 'My account';
    document.getElementById('profile-save').textContent = edit ? 'Save ✓' : 'Edit';
    dialog.querySelectorAll('.account-field-input').forEach(input => { input.readOnly = !edit; });
    document.getElementById('profile-camera').classList.toggle('d-none', !edit);
    applyGuestRestrictions();
    clearProfileErrors();
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
        ? `<img class="account-avatar-photo" src="${imgEscape(profilePendingPhoto)}" alt="">`
        : getInitials(name);
    document.getElementById('profile-photo-remove').classList.toggle('d-none', !profilePendingPhoto || !profileEditMode);
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
    document.getElementById('profile-camera').focus();
}


/**
 * Hides the error of a field while the user types; the name also updates the initials.
 * @param {string} key - Field key (name, email or phone).
 * @returns {void}
 */
function handleProfileInput(key) {
    setProfileFieldError(key, '');
    if (key === 'name') renderProfileAvatar();
}


/**
 * Shows a short confirmation at the bottom of the page (above open dialogs).
 * @param {string} text - Message.
 * @returns {void}
 */
function showProfileToast(text) {
    const toast = document.createElement('div');
    toast.className = 'profile-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('popover', 'manual');
    toast.textContent = text;
    document.body.appendChild(toast);
    toast.showPopover?.();
    setTimeout(() => toast.remove(), 2500);
}


/**
 * Shows a general error in the dialog (photo or saving problems).
 * @param {string} text - Error text, empty to hide it.
 * @returns {void}
 */
function setProfileError(text) {
    const box = document.getElementById('profile-error');
    if (box) box.textContent = text;
}


/**
 * Shows or hides the red hint under a field and marks the field as invalid.
 * @param {string} key - Field key (name, email or phone).
 * @param {string} text - Error text, empty to hide it.
 * @returns {void}
 */
function setProfileFieldError(key, text) {
    document.getElementById(`profile-${key}-error`).textContent = text;
    document.getElementById(`profile-${key}`).classList.toggle('account-field-input--invalid', Boolean(text));
    document.getElementById(`profile-${key}`).setAttribute('aria-invalid', String(Boolean(text)));
}


/**
 * Hides all errors of the account form.
 * @returns {void}
 */
function clearProfileErrors() {
    Object.keys(PROFILE_RULES).forEach(key => setProfileFieldError(key, ''));
    setProfileError('');
}


/**
 * Closes the account dialog.
 * @returns {void}
 */
function closeProfileDialog() {
    document.getElementById('profile-dialog')?.close();
    lockPageScroll(false);
}
