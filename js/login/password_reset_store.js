/**
 * Creates a random, hard-to-guess token for a reset link.
 * @returns {string} Token.
 */
function createResetToken() {
    return crypto.randomUUID().replace(/-/g, '');
}


/**
 * Builds the link that opens the reset form of this page with the token.
 * @param {string} token - Reset token.
 * @returns {string} Absolute URL.
 */
function buildResetLink(token) {
    return `${location.origin}${location.pathname}?reset=${token}`;
}


/**
 * Saves a reset token with the user id and its expiry time.
 * @async
 * @param {string} token - Reset token.
 * @param {{id: string|number}} user - User that asked for the reset.
 * @returns {Promise<void>}
 */
async function savePasswordReset(token, user) {
    const expiresAt = Date.now() + PASSWORD_RESET_VALID_MINUTES * 60 * 1000;
    await sendJson(`${PASSWORD_RESETS_URL}/${token}.json`, 'PUT', { userId: user.id, expiresAt });
}


/**
 * Loads a reset token from the database.
 * @async
 * @param {string} token - Reset token from the link.
 * @returns {Promise<{userId: string|number, expiresAt: number}|null>} Stored reset, or null.
 */
async function loadPasswordReset(token) {
    if (!/^[a-f0-9]{32}$/.test(token || '')) return null;
    try {
        const response = await fetch(`${PASSWORD_RESETS_URL}/${token}.json`);
        return await response.json();
    } catch (error) {
        return null;
    }
}


/**
 * Tells whether a stored reset exists and has not expired.
 * @param {{userId: string|number, expiresAt: number}|null} reset - Stored reset.
 * @returns {boolean} True when the link may still be used.
 */
function isValidReset(reset) {
    return Boolean(reset && reset.userId !== undefined && reset.expiresAt > Date.now());
}


/**
 * Tells whether the EmailJS keys are filled in js/config.js.
 * @returns {boolean} True when emails can be sent.
 */
function isEmailServiceConfigured() {
    return Boolean(EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId && EMAILJS_CONFIG.publicKey);
}


/**
 * Sends the reset email through the EmailJS REST API.
 * @async
 * @param {{name: string, email: string}} user - Recipient.
 * @param {string} resetLink - Link to the reset form.
 * @returns {Promise<void>}
 */
async function sendResetEmail(user, resetLink) {
    const response = await fetch(EMAILJS_SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: EMAILJS_CONFIG.serviceId,
            template_id: EMAILJS_CONFIG.templateId,
            user_id: EMAILJS_CONFIG.publicKey,
            template_params: { to_email: user.email, to_name: user.name, reset_link: resetLink }
        })
    });
    if (!response.ok) throw new Error('The email could not be sent. Please try again later.');
}


/**
 * Sends a JSON request to Firebase and throws when Firebase answers with an error.
 * @async
 * @param {string} url - Firebase URL ending in .json.
 * @param {string} method - HTTP method.
 * @param {Object} [data] - Request body.
 * @returns {Promise<void>}
 */
async function sendJson(url, method, data) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('The database could not be reached. Please try again.');
}


/**
 * Removes ?reset=… from the address bar, so reloading the page does not open the reset form again.
 * @returns {void}
 */
function removeResetParameter() {
    history.replaceState(null, '', location.pathname);
}


/**
 * Shows an error text below a reset form.
 * @param {string} errorId - Id of the error element.
 * @param {string} message - Error text.
 * @returns {void}
 */
function showResetError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = message;
    errorElement.classList.add('visible');
}


/**
 * Clears the error text of a reset form.
 * @param {string} errorId - Id of the error element.
 * @returns {void}
 */
function clearResetError(errorId) {
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
}


/**
 * Disables a submit button while a request is running and shows a short status text.
 * @param {string} buttonId - Id of the submit button.
 * @param {boolean} isBusy - True while the request is running.
 * @param {string} label - Button text to show.
 * @returns {void}
 */
function setResetBusy(buttonId, isBusy, label) {
    const button = document.getElementById(buttonId);
    button.disabled = isBusy;
    button.textContent = label;
}


document.addEventListener('DOMContentLoaded', openResetFromLink);
