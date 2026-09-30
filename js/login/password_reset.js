/** Database path of the one-time password reset tokens. */
const PASSWORD_RESETS_URL = `${JOIN_DB_URL}/passwordResets`;

/** EmailJS REST endpoint for sending an email with a template. */
const EMAILJS_SEND_URL = 'https://api.emailjs.com/api/v1.0/email/send';

/** Token of the reset link the page was opened with. */
let activeResetToken = '';


/**
 * Opens the reset form when the page was opened with a reset link (login.html?reset=TOKEN).
 * @async
 * @returns {Promise<void>}
 */
async function openResetFromLink() {
    const token = new URLSearchParams(location.search).get('reset');
    if (!token) return;
    const reset = await loadPasswordReset(token);
    if (!isValidReset(reset)) {
        removeResetParameter();
        showNotification('This reset link is invalid or has expired. Please request a new one.', true);
        return;
    }
    activeResetToken = token;
    switchForm('login_section', 'reset_section');
}


/**
 * Sends the reset email for the entered address.
 * For unknown addresses the same confirmation is shown, so nobody can find out which emails have an account.
 * @async
 * @param {SubmitEvent} event - Submit event of the forgot-password form.
 * @returns {Promise<void>}
 */
async function requestPasswordReset(event) {
    event.preventDefault();
    const email = document.getElementById('forgot_email').value.trim().toLowerCase();
    if (!validateEmailFormat(email)) return showResetError('forgot_error', 'Please enter a valid email address.');
    setResetBusy('forgot_submit', true, 'Sending …');
    try {
        await sendResetForEmail(email);
        finishResetRequest();
    } catch (error) {
        showResetError('forgot_error', error.message || 'The email could not be sent. Please try again.');
    } finally {
        setResetBusy('forgot_submit', false, 'Send me the email');
    }
}


/**
 * Creates a reset token for the user with this email and emails the reset link.
 * @async
 * @param {string} email - Entered email address (lower case).
 * @returns {Promise<void>}
 */
async function sendResetForEmail(email) {
    if (!isEmailServiceConfigured()) throw new Error('Password reset by email is not set up yet.');
    const user = (await loadUsers()).find(entry => String(entry.email || '').toLowerCase() === email);
    if (!user) return;
    const token = createResetToken();
    await savePasswordReset(token, user);
    await sendResetEmail(user, buildResetLink(token));
}


/**
 * Shows the confirmation and returns to the login form.
 * @returns {void}
 */
function finishResetRequest() {
    showNotification('An E-Mail has been sent to you');
    document.getElementById('forgot_email').value = '';
    switchForm('forgot_section', 'login_section');
}


/**
 * Saves the new password of the user that belongs to the active reset link.
 * @async
 * @param {SubmitEvent} event - Submit event of the reset form.
 * @returns {Promise<void>}
 */
async function resetPassword(event) {
    event.preventDefault();
    const password = document.getElementById('reset_password').value;
    const error = getNewPasswordError(password, document.getElementById('reset_password_confirm').value);
    if (error) return showResetError('reset_error', error);
    setResetBusy('reset_submit', true, 'Saving …');
    try {
        await storeNewPassword(password);
        finishPasswordReset();
    } catch (saveError) {
        showResetError('reset_error', saveError.message || 'The password could not be changed. Please try again.');
    } finally {
        setResetBusy('reset_submit', false, 'Continue');
    }
}


/**
 * Checks the token once more, saves the password and deletes the token so the link works only once.
 * @async
 * @param {string} password - New password.
 * @returns {Promise<void>}
 */
async function storeNewPassword(password) {
    const reset = await loadPasswordReset(activeResetToken);
    if (!isValidReset(reset)) throw new Error('This reset link has expired. Please request a new one.');
    await sendJson(`${JOIN_DB_URL}/users/${reset.userId}.json`, 'PATCH', { password });
    await sendJson(`${PASSWORD_RESETS_URL}/${activeResetToken}.json`, 'DELETE');
}


/**
 * Shows the confirmation, clears the reset form and returns to the login form.
 * @returns {void}
 */
function finishPasswordReset() {
    showNotification('You reset your password');
    activeResetToken = '';
    removeResetParameter();
    ['reset_password', 'reset_password_confirm'].forEach(id => { document.getElementById(id).value = ''; });
    switchForm('reset_section', 'login_section');
}


/**
 * Leaves the reset form without changing the password.
 * @returns {void}
 */
function cancelPasswordReset() {
    activeResetToken = '';
    removeResetParameter();
    switchForm('reset_section', 'login_section');
}


/**
 * Returns the error text for a new password, or an empty string when it is valid.
 * Uses the same rules as the sign-up form.
 * @param {string} password - New password.
 * @param {string} confirmation - Repeated password.
 * @returns {string} Error text.
 */
function getNewPasswordError(password, confirmation) {
    if (!password) return 'Please enter a new password.';
    if (/\s/.test(password)) return 'Passwords must not contain spaces.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return password === confirmation ? '' : "Passwords don't match.";
}
