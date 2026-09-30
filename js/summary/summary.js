const SUMMARY_BASE_URL = JOIN_DB_URL;
const SUMMARY_TASKS_URL = `${SUMMARY_BASE_URL}/tasks.json`;


document.addEventListener('DOMContentLoaded', initSummary);


/**
 * Initializes the summary page: greeting first, then the live task stats.
 * @async
 * @returns {Promise<void>}
 */
async function initSummary() {
    initMain();
    renderGreeting();
    const tasks = await loadTasks();
    renderStats(tasks);
}


/**
 * Loads all tasks: from sessionStorage for guests, from Firebase for users.
 * @async
 * @returns {Promise<Object[]>} List of task objects (empty if none/unreachable).
 */
async function loadTasks() {
    if (typeof checkIsGuest === 'function' && checkIsGuest()) return loadGuestTasks();
    try {
        const response = await fetch(SUMMARY_TASKS_URL);
        const data = await response.json();
        if (!data) return [];
        return Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
}


/**
 * Merges demo file tasks with locally stored guest tasks, sorted by id.
 * @async
 * @returns {Promise<Object[]>} Merged and sorted guest task list.
 */
async function loadGuestTasks() {
    try {
        const fileTasks = await safeFetchFileTasks('../demo-task.json');
        const local = JSON.parse(sessionStorage.getItem('guestTasks')) || [];
        return mergeTasksById(fileTasks || [], local || []);
    } catch (e) {
        try { return JSON.parse(sessionStorage.getItem('guestTasks')) || []; } catch (e) { return []; }
    }
}


/**
 * Merges two task arrays by id (local entries overwrite file entries) and sorts by id.
 * @param {Object[]} fileTasks - Tasks loaded from the demo JSON file.
 * @param {Object[]} localTasks - Tasks stored in sessionStorage.
 * @returns {Object[]} Deduplicated, id-sorted task array.
 */
function mergeTasksById(fileTasks, localTasks) {
    const map = new Map();
    fileTasks.forEach(t => map.set(String(t.id), t));
    localTasks.forEach(t => map.set(String(t.id), t));
    return Array.from(map.values()).sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
}


/**
 * Counts how many tasks currently have the given board status.
 * @param {Object[]} tasks - All tasks.
 * @param {string} status - One of 'todo' | 'inProgress' | 'awaitFeedback' | 'done'.
 * @returns {number} Number of matching tasks.
 */
function countTasks(tasks, status) {
    return tasks.filter(task => task.status === status).length;
}


/**
 * Writes all dashboard numbers and the next deadline into the DOM.
 * @param {Object[]} tasks - All tasks.
 * @returns {void}
 */
function renderStats(tasks) {
    setNumber('stat-todo', countTasks(tasks, 'todo'));
    setNumber('stat-done', countTasks(tasks, 'done'));
    setNumber('stat-progress', countTasks(tasks, 'inProgress'));
    setNumber('stat-feedback', countTasks(tasks, 'awaitFeedback'));
    setNumber('stat-total', tasks.length);
    setNumber('stat-urgent', tasks.filter(task => task.priority === 'urgent').length);
    renderDeadline(tasks);
}


/**
 * Sets the text content of a stat element if it exists.
 * @param {string} id - Element id.
 * @param {number} value - Value to display.
 * @returns {void}
 */
function setNumber(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}


/**
 * Renders the next upcoming deadline (urgent tasks first, otherwise any task).
 * @param {Object[]} tasks - All tasks.
 * @returns {void}
 */
function renderDeadline(tasks) {
    const element = document.getElementById('stat-deadline');
    if (!element) return;
    const next = getNextDeadline(tasks.filter(task => task.priority === 'urgent')) || getNextDeadline(tasks);
    element.textContent = next
        ? next.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'No upcoming deadline';
}


/**
 * Returns the earliest valid due date from the given tasks.
 * @param {Object[]} tasks - Tasks to inspect.
 * @returns {Date|undefined} Earliest due date or undefined.
 */
function getNextDeadline(tasks) {
    return tasks
        .filter(task => task.dueDate)
        .map(task => {
            // dd.mm.yyyy → yyyy-mm-dd
            const iso = /^\d{2}\.\d{2}\.\d{4}$/.test(task.dueDate)
                ? task.dueDate.split('.').reverse().join('-')
                : task.dueDate;
            return new Date(iso);
        })
        .filter(date => !isNaN(date))
        .sort((a, b) => a - b)[0];
}


/**
 * Renders the time-based greeting, the user's name and the header avatar.
 * @returns {void}
 */
function renderGreeting() {
    const user = getCurrentUser();
    const name = user?.name || 'Guest';
    setText('greeting-time', `${getDaytimeGreeting()}${user ? ',' : ''}`);
    setText('greeting-name', user ? name : '');
    setText('user-avatar', getInitials(name));
}


/**
 * Returns the logged-in user from session storage, or null for guests.
 * @returns {Object|null} Current user object or null.
 */
function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('currentUser'));
    } catch (error) {
        return null;
    }
}


/**
 * Returns a greeting based on the current hour of the day.
 * @returns {string} 'Good morning' | 'Good afternoon' | 'Good evening'.
 */
function getDaytimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

/**
 * Sets the text content of an element if it exists.
 * @param {string} id - Element id.
 * @param {string} value - Text to display.
 * @returns {void}
 */
function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

/**
 * Safely fetches and normalizes tasks from a local JSON file (used for guest view).
 * @async
 * @param {string} path - Relative path to the JSON file.
 * @returns {Promise<Object[]>} Array of task objects, empty on error.
 */
async function safeFetchFileTasks(path) {
    try {
        const res = await fetch(path);
        if (!res || !res.ok) return [];
        const data = await res.json();
        const raw = data?.tasks || data;
        if (!raw) return [];
        return Array.isArray(raw) ? raw.filter(Boolean) : Object.keys(raw).map(k => ({ ...raw[k], id: k }));
    } catch (e) {
        return [];
    }
}