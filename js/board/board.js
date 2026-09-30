const BOARD_BASE_URL = JOIN_DB_URL;

let allTasks = [];
let currentDraggedTaskId = null;
let editSelectedPrio = null;
let editAssignedIds = [];
let editSubtasks = [];
let boardContacts = [];

/**
 * Reads guest tasks from sessionStorage.
 * @returns {Array} Parsed task array or empty array on error.
 */
function getGuestTasks() {
    try { return JSON.parse(sessionStorage.getItem('guestTasks')) || []; } catch (e) { return []; }
}


/**
 * Persists guest tasks to sessionStorage.
 * @param {Array} tasks - Task array to store.
 * @returns {void}
 */
function saveGuestTasks(tasks) {
    sessionStorage.setItem('guestTasks', JSON.stringify(tasks));
}


/**
 * Initialises the board page.
 * @returns {void}
 */
function init() {
    initMain();
}


/**
 * Loads all tasks and renders them onto the board.
 * @returns {Promise<void>}
 */
async function initTasks() {
    boardContacts = await loadBoardContacts();
    allTasks = await loadBoardTasks();
    displayTasks(allTasks);
}


/**
 * Loads tasks from guest storage or remote database depending on login state.
 * @returns {Promise<Array>} Array of task objects.
 */
async function loadBoardTasks() {
    if (checkIsGuest()) return await loadGuestTasks();
    return await loadRemoteTasks();
}


/**
 * Fetches tasks from the remote Firebase database.
 * @returns {Promise<Array>} Array of task objects or empty array on error.
 */
async function loadRemoteTasks() {
    try {
        const response = await fetch(`${BOARD_BASE_URL}/tasks.json`);
        const data = await response.json();
        if (!data) return [];
        return Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
}


/**
 * Loads guest tasks by merging demo data with session-stored changes.
 * @returns {Promise<Array>} Merged task array.
 */
async function loadGuestTasks() {
    try {
        const fileTasks = await fetchDemoTasks();
        return mergeWithSessionTasks(fileTasks);
    } catch (e) {
        console.error('Error loading guest tasks:', e);
        return getGuestTasks();
    }
}


/**
 * Fetches tasks from the local demo-task.json file.
 * @returns {Promise<Array>} Array of demo task objects.
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
 * Merges file-based demo tasks with locally modified session tasks.
 * Session tasks overwrite demo tasks with the same id.
 * @param {Array} fileTasks - Tasks loaded from the demo file.
 * @returns {Array} Sorted, merged task array.
 */
function mergeWithSessionTasks(fileTasks) {
    const local = getGuestTasks() || [];
    const mergedMap = new Map();
    fileTasks.forEach(t => mergedMap.set(String(t.id), t));
    local.forEach(t => mergedMap.set(String(t.id), t));
    const merged = Array.from(mergedMap.values());
    merged.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    return merged;
}


/**
 * Clears all columns, renders every task card, adds placeholders and drag boxes.
 * @param {Array} tasks - Tasks to display.
 * @returns {void}
 */
function displayTasks(tasks) {
    clearBoardColumns();
    tasks.forEach(task => renderTaskCard(task));
    showEmptyPlaceholders();
    addDragHighlightBoxes();
}


/**
 * Empties the inner HTML of all board columns.
 * @returns {void}
 */
function clearBoardColumns() {
    COLUMN_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}


/**
 * Inserts a task card into the matching column and attaches touch listeners.
 * @param {Object} task - Task object with a status and id property.
 * @returns {void}
 */
function renderTaskCard(task) {
    const col = document.getElementById(task.status);
    if (!col) return;
    col.insertAdjacentHTML('beforeend', taskCardTemplate(task));
    const card = col.querySelector(`.task-card[data-task-id="${task.id}"]`);
    attachTouchListenersToCard(card, task.id);
}


/**
 * Attaches touch drag event listeners to a task card element.
 * @param {HTMLElement} card - The task card DOM element.
 * @param {string|number} id - The task id used during drag operations.
 * @returns {void}
 */
function attachTouchListenersToCard(card, id) {
    if (!card) return;
    try {
        card.addEventListener('touchstart', function (e) { touchDragStart(e, id); }, { passive: true });
        card.addEventListener('touchmove', touchDragMove, { passive: false });
        card.addEventListener('touchend', touchDragEnd, { passive: true });
        card.addEventListener('touchcancel', () => { cancelTouchPress(); cleanupTouchDrag(card); }, { passive: true });
    } catch (e) {
        card.addEventListener('touchstart', function (e) { touchDragStart(e, id); });
        card.addEventListener('touchmove', touchDragMove);
        card.addEventListener('touchend', touchDragEnd);
    }
}


/**
 * Shows an empty-state placeholder in any column that has no task cards.
 * Skips rendering if a no-results message is already present.
 * @returns {void}
 */
function showEmptyPlaceholders() {
    if (document.getElementById('board-no-results')) return;
    getEmptyColumnTexts().forEach(([id, text]) => renderEmptyPlaceholder(id, text));
}


/**
 * Returns column id / placeholder text pairs for all board columns.
 * @returns {Array} Array of [id, text] tuples.
 */
function getEmptyColumnTexts() {
    return Object.entries({
        todo: 'No tasks To do',
        inProgress: 'No tasks progress',
        awaitFeedback: 'No tasks feedback',
        done: 'No tasks done'
    });
}


/**
 * Inserts an empty-state div into a column if the column is empty.
 * @param {string} id - Column element id.
 * @param {string} text - Placeholder text to display.
 * @returns {void}
 */
function renderEmptyPlaceholder(id, text) {
    const el = document.getElementById(id);
    if (el && el.innerHTML.trim() === '') {
        el.innerHTML = `<div class="board-empty">${text}</div>`;
    }
}


/**
 * Appends a drag-highlight box to each board column.
 * @returns {void}
 */
function addDragHighlightBoxes() {
    COLUMN_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.insertAdjacentHTML('beforeend', `<div id="drag-hl-${id}" class="drag-highlight-box"></div>`);
    });
}


/**
 * Reads the search input and filters tasks, or resets the board if empty.
 * @returns {void}
 */
function filterTasks() {
    const term = getSearchTerm();
    if (!term) { resetFilter(); return; }
    const filtered = filterTasksByTerm(term);
    renderFilterResults(filtered);
}


/**
 * Reads and lowercases the board search input value.
 * @returns {string} The current search term.
 */
function getSearchTerm() {
    return (document.getElementById('board-search')?.value || '').toLowerCase();
}


/**
 * Hides the no-results message and re-renders all tasks.
 * @returns {void}
 */
function resetFilter() {
    hideNoResultsMessage();
    displayTasks(allTasks);
}


/**
 * Filters tasks whose title or description contains the search term.
 * @param {string} term - Lowercased search term.
 * @returns {Array} Matching task objects.
 */
function filterTasksByTerm(term) {
    return allTasks.filter(t =>
        (t.title || '').toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term)
    );
}


/**
 * Renders filtered tasks or shows a no-results message if none match.
 * @param {Array} filtered - Array of matching task objects.
 * @returns {void}
 */
function renderFilterResults(filtered) {
    if (filtered.length === 0) {
        displayTasks([]);
        showNoResultsMessage();
    } else {
        hideNoResultsMessage();
        displayTasks(filtered);
    }
}


/**
 * Creates and appends a no-results message element to the board columns container.
 * @returns {void}
 */
function showNoResultsMessage() {
    hideNoResultsMessage();
    const container = document.querySelector('.board-columns');
    if (!container) return;
    const el = document.createElement('div');
    el.id = 'board-no-results';
    el.className = 'board-no-results';
    el.innerHTML = `<div class="board-empty">Keine Ergebnisse gefunden</div>`;
    container.appendChild(el);
}


/**
 * Removes the no-results message element from the DOM if present.
 * @returns {void}
 */
function hideNoResultsMessage() {
    const existing = document.getElementById('board-no-results');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
}


/**
 * Closes the edit assign dropdown when a click occurs outside the assign wrapper.
 * @param {MouseEvent} event - The document click event.
 * @returns {void}
 */
function handleEditOutsideClick(event) {
    if (!event.target.closest('.edit-assign-wrapper')) {
        const opts = document.getElementById('edit-assign-options');
        if (opts) opts.classList.add('d-none');
    }
}