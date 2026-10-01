/** Session flag set by the guest login, so the notice is shown once right after it. */
const GUEST_NOTICE_KEY = 'showGuestNotice';

/** How long the guest notice stays visible. */
const GUEST_NOTICE_MS = 7000;


/**
 * Shows the guest notice once right after the guest login (only while guest data is reset automatically).
 * @returns {void}
 */
function initGuestNotice() {
    if (!sessionStorage.getItem(GUEST_NOTICE_KEY)) return;
    sessionStorage.removeItem(GUEST_NOTICE_KEY);
    if (!GUEST_RESET_ENABLED) return;
    document.body.insertAdjacentHTML('beforeend', guestNoticeTemplate());
    setTimeout(hideGuestNotice, GUEST_NOTICE_MS);
}


/**
 * Returns the markup of the guest notice.
 * @returns {string} HTML of the notice.
 */
function guestNoticeTemplate() {
    return `
        <div class="guest-notice" id="guest-notice" role="status">
            <span class="guest-notice-icon" aria-hidden="true">i</span>
            <p class="guest-notice-text">
                <strong>You are using a guest account</strong>
                All your data will be deleted after ${GUEST_SESSION_MINUTES} minutes, when you log out or when you close the page.
            </p>
            <button type="button" class="guest-notice-close" aria-label="Close notice" onclick="hideGuestNotice()">&#10005;</button>
        </div>`;
}


/**
 * Fades the guest notice out and removes it.
 * @returns {void}
 */
function hideGuestNotice() {
    const notice = document.getElementById('guest-notice');
    if (!notice) return;
    notice.classList.add('guest-notice-hidden');
    setTimeout(() => notice.remove(), 100);
}


document.addEventListener('DOMContentLoaded', initGuestNotice);
