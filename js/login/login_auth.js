/**
 * Displays an invalid-credentials error inline or as a notification.
 * @param {HTMLElement|null} loginErrorEl - Inline error element, if present.
 * @returns {void}
 */
function showLoginError(loginErrorEl) {
    if (loginErrorEl) {
        loginErrorEl.textContent = 'Invalid email address or password.';
        showHint('login_error');
    } else {
        showNotification('Invalid email address or password.', true);
    }
}


/**
 * Stores the authenticated user's basic data in sessionStorage.
 * @param {Object} user - User object with id, name, and email.
 * @param {string} [photo] - Profile photo of the user's contact, shown in the header.
 * @returns {void}
 */
function saveUserSession(user, photo = '') {
    sessionStorage.setItem('currentUser', JSON.stringify({ id: user.id, name: user.name, email: user.email, photo }));
}


/**
 * Returns the profile photo stored in the contact with the user's email.
 * @async
 * @param {string} email - Email of the user.
 * @returns {Promise<string>} Photo data URL or empty string.
 */
async function loadUserPhoto(email) {
    const entry = await findContactByEmail(email);
    return entry?.contact?.photo || '';
}


/**
 * Reads the login form credentials.
 * @returns {{email: string, password: string}}
 */
function getLoginCredentials() {
    return {
        email: document.getElementById('login_email').value.trim(),
        password: document.getElementById('login_passwort').value
    };
}


/**
 * Authenticates the user against Firebase and redirects on success.
 * @async 
 * @returns {Promise<void>}
 */
async function login() {
    const { email, password } = getLoginCredentials();
    const users = await loadUsers();
    const user = users.find(u => u.email === email && u.password === password);
    const loginErrorEl = document.getElementById('login_error');
    if (!user) { showLoginError(loginErrorEl); return; }
    saveUserSession(user, await loadUserPhoto(user.email));
    clearLoginError();
    window.location.href = './html/summary.html';
}


/**
 * Tests whether an email matches a basic valid format.
 * @param {string} email - Email string to validate.
 * @returns {boolean} True if the format is valid.
 */
function validateEmailFormat(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email);
}


/**
 * Marks an input as touched so validation hints become eligible to show.
 * @param {string} id - Element id to mark.
 * @returns {void}
 */
function markTouched(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.touched = 'true';
}


/**
 * Reads all registration form values into a plain object.
 * @returns {{name: string, email: string, pw: string, pwConfirm: string, privacy: boolean}}
 */
function getRegValues() {
    return {
        name: document.getElementById('reg_name').value.trim(),
        email: document.getElementById('reg_email').value.trim(),
        pw: document.getElementById('reg_passwort').value,
        pwConfirm: document.getElementById('reg_password_confirm').value,
        privacy: document.getElementById('reg_datenschutz').checked
    };
}


/**
 * Returns whether a specific input has been touched by the user.
 * @param {string} id - Element id to check.
 * @returns {boolean}
 */
function isFieldTouched(id) {
    const el = document.getElementById(id);
    return el && el.dataset && el.dataset.touched === 'true';
}


/**
 * Shows or hides the password-mismatch hint based on current values and touched state.
 * @param {HTMLElement|null} hint - The hint element to update.
 * @param {string} pw - Current password value.
 * @param {string} pwConfirm - Current confirm-password value.
 * @returns {void}
 */
function updatePasswordHint(hint, pw, pwConfirm) {
    if (!hint) return;
    const mismatch = pwConfirm.length > 0 && pw !== pwConfirm && isFieldTouched('reg_password_confirm');
    hint.textContent = mismatch ? "Passwords don't match" : hint.textContent;
    if (mismatch) { showHint('pw_match_hint'); } else { hideHint('pw_match_hint'); }
}


/**
 * Validates the password field and shows or hides the relevant hint.
 * @param {string} pw - Password value to validate.
 * @returns {boolean} True if the password has spaces or is too short.
 */
function setPasswordValidity(pw) {
    const hint = document.getElementById('pw_hint');
    const hasSpaces = /\s/.test(pw);
    const tooShort = pw.length > 0 && pw.length < 8 && isFieldTouched('reg_passwort');
    if (pw && hasSpaces) {
        hint.textContent = 'Passwords must not contain spaces.';
        showHint('pw_hint');
    } else if (tooShort) {
        hint.textContent = 'Password must be at least 8 characters.';
        showHint('pw_hint');
    } else {
        hideHint('pw_hint');
    }
    return hasSpaces || tooShort;
}


/**
 * Shows or hides the email format hint based on input value and touched state.
 * @param {string} email - Current email value.
 * @param {boolean} emailValid - Whether the email passes format validation.
 * @returns {void}
 */
function setEmailValidity(email, emailValid) {
    const showError = email && !emailValid && isFieldTouched('reg_email');
    if (showError) { showHint('email_format_hint'); } else { hideHint('email_format_hint'); }
}


/**
 * Enables or disables the registration submit button.
 * @param {boolean} isValid - Whether all fields pass validation.
 * @returns {void}
 */
function updateSubmitState(isValid) {
    document.getElementById('reg_submit_btn').disabled = !isValid;
}


/**
 * Runs all registration field validations and updates the submit button state.
 * @returns {void}
 */
function validateRegistrationForm() {
    const { name, email, pw, pwConfirm, privacy } = getRegValues();
    updatePasswordHint(document.getElementById('pw_match_hint'), pw, pwConfirm);
    const emailValid = validateEmailFormat(email);
    const pwHasSpaces = setPasswordValidity(pw);
    setEmailValidity(email, emailValid);
    const isValid = name && email && emailValid && pw && pw.length >= 8 && pw === pwConfirm && privacy && !pwHasSpaces;
    updateSubmitState(isValid);
}


/**
 * Validates password format rules and shows a notification on failure.
 * @param {string} password - Password to validate.
 * @returns {boolean} True if the password is valid.
 */
function validatePasswordFormat(password) {
    if (/\s/.test(password)) { showNotification('Passwords must not contain spaces.', true); return false; }
    if (password.length < 8) { showNotification('Password must be at least 8 characters.', true); return false; }
    return true;
}


/**
 * Validates password format and email format before registration proceeds.
 * @param {string} password - Password value.
 * @param {string} email - Email value.
 * @returns {boolean} True if both fields are valid.
 */
function validateRegisterInput(password, email) {
    if (!validatePasswordFormat(password)) return false;
    if (!validateEmailFormat(email)) {
        showNotification('Please enter a valid email address', true);
        return false;
    }
    return true;
}


/**
 * Checks for duplicate email and returns the next id that is free for users and contacts,
 * so the new contact never overwrites an existing one.
 * @async
 * @param {string} email - Email to check for uniqueness.
 * @returns {Promise<number|null>} Next id, or null if the email is already taken.
 */
async function getNextUserId(email) {
    const [users, contacts] = await Promise.all([loadUsers(), loadContactEntries()]);
    if (users.some(u => u.email === email)) return null;
    const maxUserId = users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0);
    const maxContactId = contacts.reduce((max, c) => Math.max(max, Number(c.key) || 0, Number(c.contact.id) || 0), 0);
    return Math.max(maxUserId, maxContactId) + 1;
}


/**
 * Finds a contact that already uses this email, e.g. one added on the contacts page.
 * @async
 * @param {string} email - Email of the new user.
 * @returns {Promise<{key: string, contact: Object}|undefined>} The existing contact entry, if any.
 */
async function findContactByEmail(email) {
    const contacts = await loadContactEntries();
    const wanted = email.toLowerCase();
    return contacts.find(c => String(c.contact.email || '').toLowerCase() === wanted);
}


/**
 * Builds a new user object and matching contact object from registration data.
 * @param {number} id - New user id.
 * @param {string} name - User's full name.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {{newUser: Object, newContact: Object}}
 */
function buildNewUserAndContact(id, name, email, password) {
    return {
        newUser: { id, name, email, password },
        newContact: { id, name, email, phone: '', color: getRandomColor(), avatar: getInitials(name) }
    };
}


/**
 * Saves a new user and contact to Firebase, then notifies and switches to login.
 * @async 
 * @param {number} newId - The new user id.
 * @param {Object} newUser - User data object.
 * @param {Object} newContact - Contact data object.
 * @returns {Promise<void>}
 */
async function saveRegistration(newId, newUser, newContact) {
    try {
        await saveUserToFirebase(newId, newUser);
        const existing = await findContactByEmail(newContact.email);
        if (!existing) await saveContactToFirebase(newId, newContact);
        showNotification('Registration successful!');
        setTimeout(() => switchForm('registration_section', 'login_section'), 2000);
    } catch (e) {
        showNotification('Registration failed.', true);
    }
}


/**
 * Reads only the fields needed for account creation from the registration form.
 * @returns {{name: string, email: string, password: string}}
 */
function getRegFormValues() {
    return {
        name: document.getElementById('reg_name').value.trim(),
        email: document.getElementById('reg_email').value.trim(),
        password: document.getElementById('reg_passwort').value
    };
}


/**
 * Validates inputs, checks for duplicates, and submits the registration.
 * @async 
 * @returns {Promise<void>}
 */
async function register() {
    const { name, email, password } = getRegFormValues();
    if (!validateRegisterInput(password, email)) return;
    const newId = await getNextUserId(email);
    if (!newId) { showNotification('This email address is already registered.', true); return; }
    const { newUser, newContact } = buildNewUserAndContact(newId, name, email, password);
    await saveRegistration(newId, newUser, newContact);
}
