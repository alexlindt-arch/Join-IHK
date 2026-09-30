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
 * Loads all tasks from the database.
 * @async
 * @returns {Promise<Object[]>} List of task objects (empty if none/unreachable).
 */
async function loadTasks() {
    try {
        const response = await fetch(SUMMARY_TASKS_URL);
        return toEntryList(await response.json());
    } catch (error) {
        return [];
    }
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
 * Renders the time-based greeting with the user's name; guests only get the greeting ("Good morning!").
 * @returns {void}
 */
function renderGreeting() {
    const user = getCurrentUser();
    const isNamedUser = Boolean(user && !user.isGuest);
    setText('greeting-time', `${getDaytimeGreeting()}${isNamedUser ? ',' : '!'}`);
    setText('greeting-name', isNamedUser ? user.name : '');
    setText('user-avatar', getInitials(user?.name || 'Guest'));
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
