const FIREBASE_BASE = JOIN_DB_URL;
const USERS_URL = `${FIREBASE_BASE}/users.json`;


/**
 * Logs in as a guest with a new guest session (own guest account) and redirects to the summary page.
 * @async
 * @returns {Promise<void>}
 */
async function guestLogin() {
    try {
        const guestUser = await startGuestSession();
        sessionStorage.setItem('currentUser', JSON.stringify(guestUser));
        sessionStorage.setItem('showGuestNotice', '1');
        window.location.href = './html/summary.html';
    } catch (error) {
        showNotification('Guest login failed. Please try again.', true);
    }
}


/**
 * Tells the guest on the login page that the guest time is over and all guest changes were reset.
 * @returns {void}
 */
function showGuestSessionEnded() {
    if (new URLSearchParams(location.search).get('guestEnded') !== '1') return;
    history.replaceState(null, '', location.pathname);
    showNotification(`Your ${GUEST_SESSION_MINUTES}-minute guest session has ended. All guest changes were reset.`);
}


document.addEventListener('DOMContentLoaded', showGuestSessionEnded);


/**
 * Switches visibility between two form sections and resets the hidden one.
 * @param {string} currentForm - Id of the form to hide.
 * @param {string} targetForm - Id of the form to show.
 * @returns {void}
 */
function switchForm(currentForm, targetForm) {
    hideForm(currentForm);
    showForm(targetForm);
    if (currentForm === 'registration_section') clearRegistrationForm();
    if (currentForm === 'login_section') clearLoginForm();
    updateSignupButton(targetForm);
}


/**
 * Hides a form section.
 * @param {string} formId - Element id to hide.
 * @returns {void}
 */
function hideForm(formId) {
    const el = document.getElementById(formId);
    if (el) el.classList.add('d-none');
}


/**
 * Shows a form section.
 * @param {string} formId - Element id to show.
 * @returns {void}
 */
function showForm(formId) {
    const el = document.getElementById(formId);
    if (el) el.classList.remove('d-none');
}


/**
 * Shows the sign-up button only when the login section is active.
 * @param {string} activeForm - Id of the currently visible form.
 * @returns {void}
 */
function updateSignupButton(activeForm) {
    const signupBtn = document.getElementById('signup_btn');
    if (!signupBtn) return;
    signupBtn.classList.toggle('d-none', activeForm !== 'login_section');
}


/**
 * Makes a hint element visible (uses visibility, no layout shift).
 * @param {string} id - Element id.
 * @returns {void}
 */
function showHint(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('visible');
}


/**
 * Hides a hint element (uses visibility, no layout shift).
 * @param {string} id - Element id.
 * @returns {void}
 */
function hideHint(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
}


/**
 * Clears an input field value and removes its validation state attributes.
 * @param {string} id - Element id of the input to clear.
 * @returns {void}
 */
function clearFieldValue(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = '';
    if (el.tagName === 'INPUT') el.removeAttribute('data-touched');
    if (typeof el.setCustomValidity === 'function') el.setCustomValidity('');
}


/**
 * Clears all registration input fields.
 * @returns {void}
 */
function clearRegFields() {
    ['reg_name', 'reg_email', 'reg_password', 'reg_password_confirm'].forEach(clearFieldValue);
}


/**
 * Hides all registration hint and error messages.
 * @returns {void}
 */
function clearRegHints() {
    ['pw_hint', 'email_format_hint', 'pw_match_hint'].forEach(hideHint);
}


/**
 * Resets the registration form including checkbox and submit button state.
 * @returns {void}
 */
function clearRegistrationForm() {
    clearRegFields();
    clearRegHints();
    const checkbox = document.getElementById('reg_privacy');
    if (checkbox) checkbox.checked = false;
    const submitBtn = document.getElementById('reg_submit_btn');
    if (submitBtn) submitBtn.disabled = true;
}


/**
 * Clears all login input fields.
 * @returns {void}
 */
function clearLoginFields() {
    ['login_email', 'login_password'].forEach(clearFieldValue);
}


/**
 * Clears the login error message and hides its hint.
 * @returns {void}
 */
function clearLoginError() {
    const el = document.getElementById('login_error');
    if (!el) return;
    el.textContent = '';
    hideHint('login_error');
}


/**
 * Resets the full login form including error state.
 * @returns {void}
 */
function clearLoginForm() {
    clearLoginFields();
    clearLoginError();
}


/**
 * Displays a notification banner and auto-hides it after 5 seconds.
 * @param {string} message - Text to display.
 * @param {boolean} [isError=false] - Whether this is an error notification.
 * @returns {void}
 */
function showNotification(message, isError = false) {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.textContent = message;
    notif.classList.remove('d-none');
    setTimeout(() => notif.classList.add('d-none'), 5000);
}


/**
 * Loads all users from Firebase.
 * @async
 * @returns {Promise<Array>} Array of user objects or empty array on error.
 */
async function loadUsers() {
    try {
        const response = await fetch(USERS_URL);
        const data = await response.json();
        if (!data) return [];
        return Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
    } catch (e) {
        showNotification('Error loading users!', true);
        return [];
    }
}


/**
 * Loads all contacts from Firebase together with their database keys.
 * @async
 * @returns {Promise<Array<{key: string, contact: Object}>>} Contacts, or an empty array on error.
 */
async function loadContactEntries() {
    try {
        const response = await fetch(`${FIREBASE_BASE}/contacts.json`);
        const data = await response.json();
        if (!data) return [];
        return Object.entries(data).filter(([, c]) => c).map(([key, contact]) => ({ key, contact }));
    } catch (e) {
        return [];
    }
}


/**
 * Builds a PUT fetch options object for Firebase writes.
 * @param {Object} body - Data to serialize as JSON body.
 * @returns {Object} Fetch options with method, headers, and body.
 */
function buildPutOptions(body) {
    return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}


/**
 * Saves a user object to Firebase under /users/{id}.
 * @async
 * @param {string|number} id - Firebase key.
 * @param {Object} user - User data.
 * @returns {Promise<void>}
 */
async function saveUserToFirebase(id, user) {
    await fetch(`${FIREBASE_BASE}/users/${id}.json`, buildPutOptions(user));
}


/**
 * Saves a contact object to Firebase under /contacts/{id}.
 * @async
 * @param {string|number} id - Firebase key.
 * @param {Object} contact - Contact data.
 * @returns {Promise<void>}
 */
async function saveContactToFirebase(id, contact) {
    await fetch(`${FIREBASE_BASE}/contacts/${id}.json`, buildPutOptions(contact));
}


/**
 * Silently clears all forms on page unload or back-navigation.
 * @returns {void}
 */
function clearAllForms() {
    clearRegistrationForm();
    clearLoginForm();
}


window.addEventListener('beforeunload', clearAllForms);
window.addEventListener('popstate', clearAllForms);
window.addEventListener('pageshow', e => { if (e && e.persisted) clearAllForms(); });


/**
 * Opens the sign-up form directly when the page is called as login.html#signup
 * (used by the "Sign up" link on the welcome page).
 * @returns {void}
 */
function openSignupFromHash() {
    if (window.location.hash === '#signup') switchForm('login_section', 'registration_section');
}

document.addEventListener('DOMContentLoaded', openSignupFromHash);
