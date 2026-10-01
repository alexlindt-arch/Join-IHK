document.addEventListener('DOMContentLoaded', initPage);


/**
 * Initialises the shared parts of every page: header avatar and closing of the avatar menu.
 * @returns {void}
 */
function initPage() {
    initMain();
    document.addEventListener('click', closeAvatarMenuOnOutsideClick);
}


/**
 * Initialises the shared page header.
 * @returns {void}
 */
function initMain() {
    setHeaderAvatar();
}


/**
 * Closes the avatar dropdown when a click occurs outside the avatar wrapper.
 * @param {MouseEvent} e - The document click event.
 * @returns {void}
 */
function closeAvatarMenuOnOutsideClick(e) {
    if (e.target.closest('#user-avatar-wrapper')) return;
    document.getElementById('avatar-menu')?.classList.add('d-none');
    document.getElementById('user-avatar')?.setAttribute('aria-expanded', 'false');
}


/**
 * Toggles the avatar dropdown menu visibility.
 * @returns {void}
 */
function toggleAvatarMenu() {
    const menu = document.getElementById('avatar-menu');
    if (!menu) return;
    const isOpen = menu.classList.toggle('d-none') === false;
    document.getElementById('user-avatar')?.setAttribute('aria-expanded', String(isOpen));
}


/**
 * Reads and parses the current user from sessionStorage.
 * @returns {Object|null} The current user object, or null if not logged in.
 */
function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('currentUser')) || null;
    } catch (e) {
        return null;
    }
}


/**
 * Returns whether the current session belongs to a guest user.
 * @returns {boolean}
 */
function checkIsGuest() {
    const user = getCurrentUser();
    return user?.isGuest === true;
}


/**
 * Removes the current user session and redirects to the login page.
 * For guests all guest changes are reset first (see js/guest_session.js).
 * @async
 * @returns {Promise<void>}
 */
async function logout() {
    if (checkIsGuest() && typeof resetOwnGuestSession === 'function') await resetOwnGuestSession();
    sessionStorage.removeItem('currentUser');
    window.location.href = '../login.html';
}


/**
 * Extracts up to two initials from a full name string.
 * @param {string} name - Full name to derive initials from.
 * @returns {string} One or two uppercase initials, or 'G' as fallback.
 */
function getInitials(name) {
    if (!name) return 'G';
    const nameParts = name.trim().split(' ');
    const first = nameParts[0]?.charAt(0).toUpperCase() || '';
    const last = nameParts[1]?.charAt(0).toUpperCase() || '';
    return (first + last) || 'G';
}


/**
 * Generates a random hexadecimal color string.
 * @returns {string} Color in the format '#RRGGBB'.
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


/**
 * Returns the filename of the current page.
 * @returns {string} E.g. 'board.html'.
 */
function getCurrentPage() {
    return window.location.pathname.split('/').pop();
}


/**
 * Sets the header avatar initials from the current user's name.
 * @returns {void}
 */
function setHeaderAvatar() {
    const avatar = document.getElementById('user-avatar');
    if (!avatar) return;
    const user = getCurrentUser();
    avatar.textContent = user ? getInitials(user.name) : 'G';
}


/**
 * Displays a notification message, moving it into the add-task dialog if open.
 * Falls back to showNotification() if the notification element is missing.
 * @param {string} message - Text to display.
 * @param {boolean} [isError] - Whether this is an error notification.
 * @returns {void}
 */
function notify(message, isError) {
    const dialog = document.getElementById('add-task-overlay');
    const dialogIsOpen = dialog && dialog.open;
    const notifEl = document.getElementById('notification');
    if (notifEl) {
        if (dialogIsOpen) { dialog.appendChild(notifEl); } else { document.body.appendChild(notifEl); }
        notifEl.textContent = message;
        notifEl.classList.remove('d-none');
        setTimeout(() => notifEl.classList.add('d-none'), 5000);
        return;
    }
    if (typeof showNotification === 'function') showNotification(message, isError);
}


/**
 * Redirects unauthenticated users away from protected pages to the login page.
 * @returns {void}
 */
function redirectIfUnauthorized() {
    const protectedPages = ['summary.html', 'add_task.html', 'board.html', 'contacts.html', 'help.html'];
    if (protectedPages.includes(getCurrentPage()) && !sessionStorage.getItem('currentUser')) {
        window.location.href = '../login.html';
    }
}

redirectIfUnauthorized();

/**
 * Highlights the nav link that matches the current page URL
 * by adding the 'aktiv' class to both sidebar and mobile nav links.
 * @returns {void}
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();

    const navMap = {
        'summary.html': '[id="nav_overview"], .mobil-nav-link:nth-child(1)',
        'add_task.html': '[id="nav_addtask"],  .mobil-nav-link:nth-child(2)',
        'board.html': '[id="nav_board"],    .mobil-nav-link:nth-child(3)',
        'contacts.html': '[id="nav_contacts"], .mobil-nav-link:nth-child(4)',
        'privacy_policy.html': '[id="nav_privacy"], .nav-bottom-left .nav-link:nth-child(1)',
        'legal_notice.html': '[id="nav_legal"], .nav-bottom-left .nav-link:nth-child(2)',
    };

    const selector = navMap[currentPage];
    if (!selector) return;

    document.querySelectorAll(selector).forEach(link => link.classList.add('aktiv'));
}


setActiveNavLink();


/**
 * Turns a Firebase collection (object or array, depending on its keys) into a list of entries.
 * The database key becomes the id when the entry has no id of its own.
 * @param {Object|Array|null} data - Collection as returned by Firebase.
 * @returns {Array<Object>} Entries with an id.
 */
function toEntryList(data) {
    return Object.entries(data || {})
        .filter(([, entry]) => entry)
        .map(([key, entry]) => ({ ...entry, id: entry.id ?? key }));
}


/**
 * Tells whether a due date in the format dd.mm.yyyy lies before today.
 * @param {string} dueDate - Date as shown in the date inputs.
 * @returns {boolean} True for dates in the past.
 */
function isPastDueDate(dueDate) {
    const [day, month, year] = (dueDate || '').split('.').map(Number);
    if (!day || !month || !year) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(year, month - 1, day) < today;
}


/**
 * Returns the error text for a due date field, or an empty string when the date is valid.
 * @param {string} dueDate - Date as shown in the date inputs.
 * @returns {string} Error text.
 */
function getDueDateError(dueDate) {
    if (!dueDate) return 'This field is required';
    return isPastDueDate(dueDate) ? 'The due date must not be in the past' : '';
}

/**
 * Phone fields: removes every character except digits and a leading "+" while typing,
 * so letters can not be entered at all.
 * @param {HTMLInputElement|null} input - The phone input.
 * @returns {void}
 */
function allowOnlyPhoneCharacters(input) {
    if (!input) return;
    const cleaned = input.value.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '');
    if (cleaned !== input.value) input.value = cleaned;
}
