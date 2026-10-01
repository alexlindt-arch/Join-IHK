/**
 * Guest sessions: every guest login gets its own session (own account data). With GUEST_RESET_ENABLED
 * the session ends after GUEST_SESSION_MINUTES.
 * Before a guest changes or deletes a task or contact, its original is saved in the session;
 * new tasks and contacts are marked as created. When the session ends, created entries are deleted,
 * originals are restored and the guest account is removed, so the data of real users stays as it was.
 * Needs js/config.js (JOIN_DB_URL) and script.js (getCurrentUser).
 */

/**
 * Switches the automatic reset of guest data on or off. Off for the exam submission,
 * so testers keep their tasks, contacts and attachments; can be switched on again later.
 */
const GUEST_RESET_ENABLED = false;

/** Minutes a guest may work before all guest changes are reset (only when GUEST_RESET_ENABLED). */
const GUEST_SESSION_MINUTES = 60;

/** Database path of all guest sessions (account, created entries, originals). */
const GUEST_SESSIONS_URL = `${JOIN_DB_URL}/guestSessions`;

/** Small status per session (expiry, last sign of life, closing time), read by every page. */
const GUEST_STATUS_URL = `${JOIN_DB_URL}/guestSessionStatus`;

/** A closed guest page is reset when no Join page of the guest reopened within this time. */
const GUEST_CLOSE_GRACE_MS = 15 * 1000;

/** A guest without any sign of life for this time counts as gone (e.g. crashed browser). */
const GUEST_IDLE_MS = 5 * 60 * 1000;

/** Interval of the sign of life of the guest and of the check for ended sessions. */
const GUEST_CHECK_INTERVAL_MS = 30 * 1000;


/**
 * Creates a new guest session and returns the user object for the browser session.
 * Without automatic reset the session never expires (expiresAt 0).
 * @async
 * @returns {Promise<Object>} Guest user with session id and expiry time.
 */
async function startGuestSession() {
    const sessionId = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = GUEST_RESET_ENABLED ? Date.now() + GUEST_SESSION_MINUTES * 60 * 1000 : 0;
    const account = { name: 'Guest', email: '', phone: '', photo: '' };
    await sendGuestRequest(`${GUEST_SESSIONS_URL}/${sessionId}.json`, 'PUT', { expiresAt, account });
    await sendGuestRequest(`${GUEST_STATUS_URL}/${sessionId}.json`, 'PUT', { expiresAt, lastSeen: Date.now(), closingAt: 0 });
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
    if (!sessionId || !GUEST_RESET_ENABLED) return;
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
    if (!sessionId || !GUEST_RESET_ENABLED) return;
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
 * Resets every guest session that has ended: time over, page closed or no sign of life.
 * @async
 * @returns {Promise<void>}
 */
async function cleanupExpiredGuestSessions() {
    const statuses = (await getGuestJson(`${GUEST_STATUS_URL}.json`)) || {};
    const ended = Object.entries(statuses).filter(([, status]) => isGuestSessionOver(status)).map(([id]) => id);
    ended.push(...(await findEndedSessionsWithoutStatus(statuses)));
    for (const sessionId of ended) {
        const session = await getGuestJson(`${GUEST_SESSIONS_URL}/${sessionId}.json`);
        await resetGuestSession(sessionId, session || {});
    }
}


/**
 * Finds expired sessions that have no status entry (sessions created before the status existed).
 * @async
 * @param {Object} statuses - Status entries per session id.
 * @returns {Promise<string[]>} Ids of expired sessions without status.
 */
async function findEndedSessionsWithoutStatus(statuses) {
    const sessionIds = Object.keys((await getGuestJson(`${GUEST_SESSIONS_URL}.json?shallow=true`)) || {});
    const withoutStatus = sessionIds.filter(id => !statuses[id]);
    const expiries = await Promise.all(withoutStatus.map(id => getGuestJson(`${GUEST_SESSIONS_URL}/${id}/expiresAt.json`)));
    return withoutStatus.filter((id, index) => !expiries[index] || expiries[index] <= Date.now());
}


/**
 * Tells whether a guest session has ended.
 * @param {{expiresAt: number, lastSeen: number, closingAt: number}} status - Session status.
 * @returns {boolean} True when the time is over, the page was closed or the guest is gone.
 */
function isGuestSessionOver(status) {
    const now = Date.now();
    if (!status || now >= status.expiresAt) return true;
    if (status.closingAt && now - status.closingAt > GUEST_CLOSE_GRACE_MS) return true;
    return now - (status.lastSeen || 0) > GUEST_IDLE_MS;
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
    await sendGuestRequest(`${GUEST_STATUS_URL}/${sessionId}.json`, 'DELETE');
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
    if (!sessionId || !GUEST_RESET_ENABLED) return;
    const session = await getGuestJson(`${GUEST_SESSIONS_URL}/${sessionId}.json`);
    await resetGuestSession(sessionId, session || {});
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
 * Sign of life of the guest: updates the last activity and cancels a closing mark of a page change.
 * When the session was already reset (e.g. the tab slept too long), the guest is logged out.
 * @async
 * @returns {Promise<void>}
 */
async function markGuestSessionActive() {
    const sessionId = getGuestSessionId();
    if (!sessionId) return;
    const statusUrl = `${GUEST_STATUS_URL}/${sessionId}.json`;
    if (!(await getGuestJson(statusUrl))) return endGuestSession();
    await sendGuestRequest(statusUrl, 'PATCH', { lastSeen: Date.now(), closingAt: 0 });
}


/**
 * Marks the session as closing when the guest leaves a page. A page change clears the mark again,
 * a closed tab keeps it, so the session is reset after GUEST_CLOSE_GRACE_MS.
 * keepalive lets the request finish even while the tab is closing.
 * @returns {void}
 */
function markGuestSessionClosing() {
    const sessionId = getGuestSessionId();
    if (!sessionId) return;
    fetch(`${GUEST_STATUS_URL}/${sessionId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingAt: Date.now() }),
        keepalive: true
    });
}


/**
 * Starts the sign of life and the closing mark of the logged-in guest.
 * @returns {void}
 */
function trackGuestPresence() {
    if (!getGuestSessionId()) return;
    markGuestSessionActive();
    setInterval(markGuestSessionActive, GUEST_CHECK_INTERVAL_MS);
    window.addEventListener('pagehide', markGuestSessionClosing);
    window.addEventListener('pageshow', markGuestSessionActive);
}


/**
 * On every page: resets ended guest sessions now and every 30 seconds, and watches the own guest session.
 * Does nothing while the automatic reset is switched off.
 * @returns {void}
 */
function initGuestSessions() {
    if (!GUEST_RESET_ENABLED) return;
    trackGuestPresence();
    watchGuestSession();
    cleanupExpiredGuestSessions();
    setInterval(cleanupExpiredGuestSessions, GUEST_CHECK_INTERVAL_MS);
}


document.addEventListener('DOMContentLoaded', initGuestSessions);
