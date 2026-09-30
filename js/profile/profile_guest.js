/** Database path of the shared guest account (guests have no own user entry). */
const GUEST_ACCOUNT_PATH = 'users/guest';


/**
 * Tells whether the logged-in user is the guest.
 * @returns {boolean} True for the guest.
 */
function isGuestProfile() {
    return getCurrentUser()?.isGuest === true;
}


/**
 * Loads the profile photo of the guest account.
 * @async
 * @returns {Promise<string>} Photo as base64 data URL, or an empty string.
 */
async function loadGuestPhoto() {
    try {
        const response = await fetch(`${JOIN_DB_URL}/${GUEST_ACCOUNT_PATH}/photo.json`);
        return (await response.json()) || '';
    } catch (error) {
        return '';
    }
}


/**
 * Shows the guest photo in the dialog; the stored photo wins over the one in the session.
 * @async
 * @param {Object} user - Guest user from the session.
 * @returns {Promise<void>}
 */
async function fillGuestPhoto(user) {
    profilePendingPhoto = (await loadGuestPhoto()) || user.photo || '';
    renderProfileAvatar();
}


/**
 * Guests may only change the photo: name, email and phone stay read-only and "Delete my account" is hidden.
 * @returns {void}
 */
function applyGuestRestrictions() {
    const isGuest = isGuestProfile();
    document.getElementById('profile-delete').classList.toggle('d-none', isGuest);
    if (!isGuest) return;
    document.querySelectorAll('#profile-dialog .account-field-input').forEach(input => { input.readOnly = true; });
}


/**
 * Saves the photo of the guest account and shows it in the header.
 * @async
 * @param {Object} user - Guest user from the session.
 * @returns {Promise<void>}
 */
async function storeGuestProfile(user) {
    await patchProfile(GUEST_ACCOUNT_PATH, { name: 'Guest', photo: profilePendingPhoto });
    sessionStorage.setItem('currentUser', JSON.stringify({ ...user, photo: profilePendingPhoto }));
    setProfileMode(false);
    refreshPageAfterProfileSave();
}
