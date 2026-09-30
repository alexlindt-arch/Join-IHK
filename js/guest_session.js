/**
 * Guest sessions: every guest login gets its own session that ends after GUEST_SESSION_MINUTES.
 * Before a guest changes or deletes a task or contact, its original is saved in the session;
 * new tasks and contacts are marked as created. When the session ends, created entries are deleted,
 * originals are restored and the guest account is removed, so the data of real users stays as it was.
 * Needs js/config.js (JOIN_DB_URL) and script.js (getCurrentUser).
 */

/** Minutes a guest may work before all guest changes are reset. */
const GUEST_SESSION_MINUTES = 15;

/** Database path of all guest sessions. */
const GUEST_SESSIONS_URL = `${JOIN_DB_URL}/guestSessions`;


/**
 * Creates a new guest session and returns the user object for the browser session.
 * @async
 * @returns {Promise<Object>} Guest user with session id and expiry time.
 */
async function startGuestSession() {
    const sessionId = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = Date.now() + GUEST_SESSION_MINUTES * 60 * 1000;
    const account = { name: 'Guest', email: '', phone: '', photo: '' };
    await sendGuestRequest(`${GUEST_SESSIONS_URL}/${sessionId}.json`, 'PUT', { expiresAt, account });
    return { id: 'guest', name: 'Guest', email: '', isGuest: true, guestSessionId: sessionId, expiresAt };
}


/**
 * Returns the session id of the logged-in guest, or an empty string for registered users.
 * @returns {string} Guest session id.
 */
function getGuestSessionId() {
    const user = getCurrentUser();
    return user?.isGuest ? user.guestSessionId || '' : '';
}


/**
 * Marks a task or contact as created by the guest, so it is deleted when the session ends.
 * @async
 * @param {string} collection - 'tasks' or 'contacts'.
 * @param {string|number} id - Database key of the new entry.
 * @returns {Promise<void>}
 */
async function recordGuestCreate(collection, id) {
    const sessionId = getGuestSessionId();
    if (!sessionId) return;
    await sendGuestRequest(`${GUEST_SESSIONS_URL}/${sessionId}/created/${collection}/${id}.json`, 'PUT', true);
}


/**
 * Saves the original of an existing task or contact before the guest changes or deletes it.
 * Only the first change counts, so the state before the guest login is restored.
 * @async
 * @param {string} collection - 'tasks' or 'contacts'.
 * @param {string|number} id - Database key of the entry.
 * @returns {Promise<void>}
 */
async function recordGuestChange(collection, id) {
    const sessionId = getGuestSessionId();
    if (!sessionId) return;
    const sessionUrl = `${GUEST_SESSIONS_URL}/${sessionId}`;
    if (await isTrackedByGuest(sessionUrl, collection, id)) return;
    const original = await getGuestJson(`${JOIN_DB_URL}/${collection}/${id}.json`);
    if (original) await sendGuestRequest(`${sessionUrl}/originals/${collection}/${id}.json`, 'PUT', original);
}


/**
 * Tells whether an entry was already created or saved as original in this guest session.
 * @async
 * @param {string} sessionUrl - URL of the guest session.
 * @param {string} collection - 'tasks' or 'contacts'.
 * @param {string|number} id - Database key of the entry.
 * @returns {Promise<boolean>} True when the entry is already tracked.
 */
async function isTrackedByGuest(sessionUrl, collection, id) {
    const [created, original] = await Promise.all([
        getGuestJson(`${sessionUrl}/created/${collection}/${id}.json`),
        getGuestJson(`${sessionUrl}/originals/${collection}/${id}.json`)
    ]);
    return Boolean(created || original);
}


/**
 * Resets every guest session whose 15 minutes are over (also sessions of guests who closed the tab).
 * @async
 * @returns {Promise<void>}
 */
async function cleanupExpiredGuestSessions() {
    const sessions = (await getGuestJson(`${GUEST_SESSIONS_URL}.json`)) || {};
    const expired = Object.entries(sessions).filter(([, session]) => session && session.expiresAt <= Date.now());
    for (const [sessionId, session] of expired) await resetGuestSession(sessionId, session);
}


/**
 * Restores the originals, deletes the created entries and removes the session with the guest account.
 * @async
 * @param {string} sessionId - Guest session id.
 * @param {Object} session - Stored session with created and originals.
 * @returns {Promise<void>}
 */
async function resetGuestSession(sessionId, session) {
    await restoreGuestOriginals(session.originals || {});
    await deleteGuestCreations(session.created || {});
    await sendGuestRequest(`${GUEST_SESSIONS_URL}/${sessionId}.json`, 'DELETE');
}


/**
 * Writes the saved originals back, including entries the guest deleted.
 * @async
 * @param {Object<string, Object>} originals - Originals per collection and key.
 * @returns {Promise<void>}
 */
async function restoreGuestOriginals(originals) {
    const writes = Object.entries(originals).flatMap(([collection, entries]) =>
        storedEntries(entries).map(([id, entry]) =>
            sendGuestRequest(`${JOIN_DB_URL}/${collection}/${id}.json`, 'PUT', entry)));
    await Promise.all(writes);
}


/**
 * Deletes every task and contact the guest created.
 * @async
 * @param {Object<string, Object>} created - Created keys per collection.
 * @returns {Promise<void>}
 */
async function deleteGuestCreations(created) {
    const deletes = Object.entries(created).flatMap(([collection, entries]) =>
        storedEntries(entries).map(([id]) => sendGuestRequest(`${JOIN_DB_URL}/${collection}/${id}.json`, 'DELETE')));
    await Promise.all(deletes);
}


/**
 * Returns the [key, value] pairs of a stored collection without empty slots.
 * Firebase returns objects with numeric keys as arrays with null gaps; those gaps must never be deleted.
 * @param {Object|Array|null} entries - Stored collection.
 * @returns {Array<[string, *]>} Keys with their values.
 */
function storedEntries(entries) {
    return Object.entries(entries || {}).filter(([, value]) => value !== null && value !== undefined);
}


/**
 * Ends the session of the logged-in guest when its time is over, now or later with a timer.
 * @returns {void}
 */
function watchGuestSession() {
    const user = getCurrentUser();
    if (!user?.isGuest || !user.expiresAt) return;
    const remaining = user.expiresAt - Date.now();
    if (remaining <= 0) endGuestSession();
    else setTimeout(endGuestSession, remaining);
}


/**
 * Resets all changes of the logged-in guest right away (session end or logout).
 * @async
 * @returns {Promise<void>}
 */
async function resetOwnGuestSession() {
    const sessionId = getGuestSessionId();
    const session = sessionId ? await getGuestJson(`${GUEST_SESSIONS_URL}/${sessionId}.json`) : null;
    if (session) await resetGuestSession(sessionId, session);
}


/**
 * Resets the data of the logged-in guest, logs the guest out and tells the reason on the login page.
 * @async
 * @returns {Promise<void>}
 */
async function endGuestSession() {
    await resetOwnGuestSession();
    sessionStorage.removeItem('currentUser');
    const loginPath = location.pathname.includes('/html/') ? '../login.html' : './login.html';
    location.href = `${loginPath}?guestEnded=1`;
}


/**
 * Reads JSON from Firebase.
 * @async
 * @param {string} url - Firebase URL ending in .json.
 * @returns {Promise<*>} Stored value, or null when it is missing or unreachable.
 */
async function getGuestJson(url) {
    try {
        return await (await fetch(url)).json();
    } catch (error) {
        return null;
    }
}


/**
 * Sends a write request to Firebase.
 * @async
 * @param {string} url - Firebase URL ending in .json.
 * @param {string} method - PUT, PATCH or DELETE.
 * @param {*} [data] - Request body.
 * @returns {Promise<void>}
 */
async function sendGuestRequest(url, method, data) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data !== undefined) options.body = JSON.stringify(data);
    await fetch(url, options);
}


/**
 * On every page: resets expired guest sessions and watches the session of the logged-in guest.
 * @returns {void}
 */
function initGuestSessions() {
    cleanupExpiredGuestSessions();
    watchGuestSession();
}


document.addEventListener('DOMContentLoaded', initGuestSessions);
