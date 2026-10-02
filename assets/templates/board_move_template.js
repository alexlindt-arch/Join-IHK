/** Columns of the board in their order, with the label shown in the "Move to" menu. */
const BOARD_COLUMNS = [
    { id: 'todo', label: 'To do' },
    { id: 'inProgress', label: 'In progress' },
    { id: 'awaitFeedback', label: 'Await feedback' },
    { id: 'done', label: 'Done' }
];


/**
 * Returns the small button on a task card that opens the "Move to" menu (phones, tablets and touch screens).
 * The button stops click, mouse and touch events, so it never opens the task or starts dragging.
 * @param {number|string} taskId - Task id.
 * @returns {string} HTML string.
 */
function moveButtonTemplate(taskId) {
    return `
        <button type="button" class="card-move-btn" aria-label="Move task to another column" aria-haspopup="menu"
            draggable="false" onclick="openMoveMenu(event, ${taskId})" onkeydown="event.stopPropagation()"
            onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation()">
            <svg width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true"><path d="M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287h-80ZM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56L600-80Z" fill="currentColor"/></svg>
        </button>`;
}


/**
 * Returns the "Move to" menu with one entry for every other column.
 * @param {Object} task - Task with id and status.
 * @returns {string} HTML string.
 */
function moveMenuTemplate(task) {
    const options = BOARD_COLUMNS.filter(column => column.id !== task.status).map(column => `
        <button type="button" class="move-menu-option" role="menuitem"
            onclick="moveTaskToColumn(${task.id}, '${column.id}')">${moveArrowIcon(column.id, task.status)} ${column.label}</button>`);
    return `<span class="move-menu-title">Move to</span>${options.join('')}`;
}


/**
 * Returns an arrow pointing up for columns before the current one and down for columns after it.
 * @param {string} targetId - Column the task would move to.
 * @param {string} currentId - Column the task is in now.
 * @returns {string} SVG string.
 */
function moveArrowIcon(targetId, currentId) {
    const ids = BOARD_COLUMNS.map(column => column.id);
    const isUp = ids.indexOf(targetId) < ids.indexOf(currentId);
    const path = isUp
        ? 'M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z'
        : 'M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z';
    return `<svg width="20" height="20" viewBox="0 -960 960 960" aria-hidden="true"><path d="${path}" fill="currentColor"/></svg>`;
}
