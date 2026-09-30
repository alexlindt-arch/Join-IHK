const ADDTASK_BASE_URL = JOIN_DB_URL;
const ADDTASK_TASKS_URL = `${ADDTASK_BASE_URL}/tasks.json`;
const ADDTASK_CONTACTS_URL = `${ADDTASK_BASE_URL}/contacts.json`;

let selectedPriority = 'medium';
let selectedCategory = '';
let assignedIds = [];
let subtasks = [];
let addTaskContacts = [];


document.addEventListener('DOMContentLoaded', initTaskPage);


/**
 * Initializes the Add Task page (avatar, min date, contacts, outside-click).
 * @async
 * @returns {Promise<void>}
 */
async function initTaskPage() {
    setHeaderAvatar();
    setMinDueDate();
    initDatePicker();
    document.addEventListener('click', handleOutsideClick);
    addTaskContacts = await loadAssignContacts();
}


/**
 * Initializes the flatpickr date picker for the due date field.
 * @returns {void}
 */
function initDatePicker() {
    flatpickr('#task-due', {
        dateFormat: 'd.m.Y',
        minDate: 'today',
        allowInput: false,
        disableMobile: true,
        onChange: function () { updateCreateButton(); }
    });
}


/**
 * Sets the active priority and highlights the matching button.
 * @param {HTMLElement} button - The clicked priority button.
 * @returns {void}
 */
function setPriority(button) {
    document.querySelectorAll('.prio-btn').forEach(btn => btn.classList.remove('prio-active'));
    button.classList.add('prio-active');
    selectedPriority = button.dataset.prio;
}


/**
 * Opens or closes the category dropdown.
 * @returns {void}
 */
function toggleCategoryDropdown() {
    closeAssignDropdown();
    document.getElementById('category-options').classList.toggle('d-none');
}


/**
 * Selects a task category and shows it in the toggle.
 * @param {string} value - 'Technical Task' or 'User Story'.
 * @returns {void}
 */
function selectCategory(value) {
    selectedCategory = value;
    const label = document.getElementById('category-selected');
    label.textContent = value;
    label.classList.remove('select-placeholder');
    closeCategoryDropdown();
    hideError('error-category');
    updateCreateButton();
}


/**
 * Enables the Create Task button only when all required fields are filled.
 * @returns {void}
 */
function updateCreateButton() {
    const title = document.getElementById('task-title').value.trim();
    const due = document.getElementById('task-due').value;
    const btn = document.getElementById('btn-create');
    btn.disabled = !(title && due && selectedCategory);
}


/**
 * Closes the category dropdown.
 * @returns {void}
 */
function closeCategoryDropdown() {
    document.getElementById('category-options').classList.add('d-none');
}


/**
 * Closes both dropdowns when a click happens outside of them.
 * @param {MouseEvent} event - The document click event.
 * @returns {void}
 */
function handleOutsideClick(event) {
    if (!event.target.closest('#assign-select')) closeAssignDropdown();
    if (!event.target.closest('#category-select')) closeCategoryDropdown();
}


/**
 * Collects all form values into a task object ready to be saved.
 * @returns {Object} The task to persist.
 */
function collectTask() {
    return {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-desc').value.trim(),
        dueDate: document.getElementById('task-due').value,
        category: selectedCategory,
        priority: selectedPriority,
        assignedTo: getAssignedContacts(),
        subtasks: subtasks,
        status: 'todo',
        createdAt: new Date().toISOString()
    };
}


/**
 * Validates the required fields and shows inline errors.
 * @param {Object} task - The collected task.
 * @returns {boolean} True when all required fields are filled.
 */
function validateTask(task) {
    toggleError('error-title', !task.title);
    toggleError('error-due', !task.dueDate);
    toggleError('error-category', !task.category);
    return Boolean(task.title && task.dueDate && task.category);
}


/**
 * Handles a successful task save: shows notification and redirects to board.
 * @returns {void}
 */
function handleTaskSaveSuccess() {
    showTaskNotification('Task added to board');
    setTimeout(() => { window.location.href = 'board.html'; }, 1400);
}


/**
 * Handles a failed task save: shows error and re-enables the create button.
 * @param {Error} error - The caught error.
 * @param {HTMLElement} button - The create button to re-enable.
 * @returns {void}
 */
function handleTaskSaveError(error, button) {
    console.error('Error saving task:', error);
    showTaskNotification('Could not save task. Please try again.', true);
    button.disabled = false;
}


/**
 * Creates the task: validates, saves to Firebase and redirects to the board.
 * @async
 * @returns {Promise<void>}
 */
async function createTask() {
    const task = collectTask();
    if (!validateTask(task)) return;
    const button = document.querySelector('.btn-create');
    button.disabled = true;
    try {
        await saveTask(task);
        handleTaskSaveSuccess();
    } catch (error) {
        handleTaskSaveError(error, button);
    }
}


/**
 * Persists a task to sessionStorage when logged in as guest.
 * @async
 * @param {Object} task - The task to save.
 * @returns {Promise<void>}
 */
async function saveGuestTask(task) {
    const guestTasks = JSON.parse(sessionStorage.getItem('guestTasks') || '[]');
    task.id = await resolveGuestTaskId(guestTasks);
    guestTasks.push(task);
    sessionStorage.setItem('guestTasks', JSON.stringify(guestTasks));
}


/**
 * Resolves a unique numeric id for a new guest task.
 * @async
 * @param {Object[]} guestTasks - Existing guest tasks from sessionStorage.
 * @returns {Promise<number>} A unique task id.
 */
async function resolveGuestTaskId(guestTasks) {
    try {
        const fileTasks = await fetchDemoTasks();
        const maxFileId = fileTasks.length ? Math.max(...fileTasks.map(t => Number(t.id) || 0)) : 0;
        const maxLocalId = guestTasks.length ? Math.max(...guestTasks.map(t => Number(t.id) || 0)) : 0;
        return Math.max(maxFileId, maxLocalId) + 1;
    } catch (e) {
        return guestTasks.length ? Math.max(...guestTasks.map(t => Number(t.id) || 0)) + 1 : 1;
    }
}


/**
 * Fetches and normalizes tasks from the demo-task.json file.
 * @async
 * @returns {Promise<Object[]>} Array of demo tasks.
 */
async function fetchDemoTasks() {
    const res = await fetch('../demo-task.json');
    if (!res || !res.ok) return [];
    const data = await res.json();
    const raw = data?.tasks || data;
    if (!raw) return [];
    return Array.isArray(raw) ? raw.filter(Boolean) : Object.keys(raw).map(k => ({ ...raw[k], id: k })).filter(Boolean);
}


/**
 * Persists a task under a fresh id in Firebase.
 * @async
 * @param {Object} task - The task to save.
 * @returns {Promise<void>}
 */
async function saveTask(task) {
    if (checkIsGuest()) return saveGuestTask(task);
    const id = await getNextTaskId();
    task.id = id;
    await fetch(`${ADDTASK_BASE_URL}/tasks/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
}


/**
 * Determines the next free numeric task id from Firebase.
 * @async
 * @returns {Promise<number>} The next id.
 */
async function getNextTaskId() {
    try {
        const response = await fetch(ADDTASK_TASKS_URL);
        const data = await response.json();
        if (!data) return 1;
        const ids = Object.values(data).filter(Boolean).map(task => Number(task.id) || 0);
        return (ids.length ? Math.max(...ids) : 0) + 1;
    } catch (error) {
        return Date.now();
    }
}


/**
 * Resets the whole form to its initial state.
 * @returns {void}
 */
function clearTaskForm() {
    document.getElementById('task-form').reset();
    subtasks = [];
    assignedIds = [];
    selectedCategory = '';
    resetCategoryLabel();
    renderSubtasks();
    renderAssignedAvatars();
    updateSubtaskActions();
    setPriority(document.querySelector('.prio-medium'));
    ['error-title', 'error-due', 'error-category'].forEach(hideError);
    document.getElementById('btn-create').disabled = true;
}


/**
 * Restores the category toggle to its placeholder text.
 * @returns {void}
 */
function resetCategoryLabel() {
    const label = document.getElementById('category-selected');
    label.textContent = 'Select task category';
    label.classList.add('select-placeholder');
}


/**
 * Sets the minimum selectable due date to today.
 * @returns {void}
 */
function setMinDueDate() {
    const due = document.getElementById('task-due');
    if (due) due.min = new Date().toISOString().split('T')[0];
}


/**
 * Shows the logged-in user's initials in the header avatar.
 * @returns {void}
 */
function setHeaderAvatar() {
    const avatar = document.getElementById('user-avatar');
    if (!avatar) return;
    let user = null;
    try { user = JSON.parse(sessionStorage.getItem('currentUser')); } catch (error) { user = null; }
    avatar.textContent = user ? getInitials(user.name) : 'G';
}


/**
 * Returns a random hex color (used as a fallback avatar color).
 * @returns {string} Hex color string.
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
}


/**
 * Shows or hides a field error element.
 * @param {string} id - Error element id.
 * @param {boolean} show - Whether to show the error.
 * @returns {void}
 */
function toggleError(id, show) {
    document.getElementById(id).classList.toggle('d-none', !show);
}


/**
 * Hides a field error element.
 * @param {string} id - Error element id.
 * @returns {void}
 */
function hideError(id) {
    document.getElementById(id).classList.add('d-none');
}


/**
 * Shows a temporary toast notification.
 * @param {string} message - Message to display.
 * @param {boolean} [isError=false] - Whether the toast is an error.
 * @returns {void}
 */
function showTaskNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = 'notification';
    if (isError) notification.classList.add('notification--error');
    notification.classList.remove('d-none');
    setTimeout(() => notification.classList.add('d-none'), 3000);
}


/**
 * Escapes HTML special characters to prevent markup injection.
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

