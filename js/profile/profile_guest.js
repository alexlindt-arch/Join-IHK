/**
 * Account of a guest: every guest session has its own account (name, email, phone, photo) that is
 * stored in the guest session and removed together with all guest changes when the session ends.
 * Needs js/guest_session.js, profile.js and profile_store.js.
 */

/** Validation rules for guests: any name, email and phone are optional. */
const GUEST_PROFILE_RULES = {
    name: { rule: /^[\p{L}'-]+(\s+[\p{L}'-]+)*$/u, required: true, text: 'Please enter a name (letters only).' },
    email: { rule: PROFILE_RULES.email.rule, required: false, text: PROFILE_RULES.email.text },
    phone: PROFILE_RULES.phone
};


/**
 * Tells whether the logged-in user is a guest.
 * @returns {boolean} True for guests.
 */
function isGuestProfile() {
    return getCurrentUser()?.isGuest === true;
}


/**
 * Returns the URL of the account of the current guest session.
 * @returns {string} Firebase URL ending in .json.
 */
function getGuestAccountUrl() {
    return `${GUEST_SESSIONS_URL}/${getGuestSessionId()}/account.json`;
}


/**
 * Fills the account form with the stored guest account.
 * @async
 * @param {Object} user - Guest user from the session.
 * @returns {Promise<void>}
 */
async function fillGuestAccount(user) {
    const account = (await getGuestJson(getGuestAccountUrl())) || {};
    document.getElementById('profile-name').value = account.name || user.name || 'Guest';
    document.getElementById('profile-email').value = account.email || '';
    document.getElementById('profile-phone').value = account.phone || '';
    profilePendingPhoto = account.photo || user.photo || '';
    renderProfileAvatar();
}


/**
 * Hides "Delete my account" for guests: their account is removed automatically after the session.
 * @returns {void}
 */
function applyGuestRestrictions() {
    document.getElementById('profile-delete').classList.toggle('d-none', isGuestProfile());
}


/**
 * Saves the guest account and shows the new name and photo in the header.
 * @async
 * @param {Object} user - Guest user from the session.
 * @param {{name: string, email: string, phone: string}} values - Validated form values.
 * @returns {Promise<void>}
 */
async function storeGuestProfile(user, values) {
    const account = { ...values, photo: profilePendingPhoto };
    await sendGuestRequest(getGuestAccountUrl(), 'PUT', account);
    const session = { ...user, name: values.name, email: values.email, photo: profilePendingPhoto };
    sessionStorage.setItem('currentUser', JSON.stringify(session));
    setProfileMode(false);
    refreshPageAfterProfileSave();
}
