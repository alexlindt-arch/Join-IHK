/**
 * "Move to" menu of the task cards: lets touch users move a task to another column without drag & drop.
 * Needs board.js (allTasks, filterTasks), board_drag.js (updateTaskStatusRemote) and board_move_template.js.
 */


/**
 * Opens the "Move to" menu below the clicked button of a task card.
 * @param {MouseEvent} event - Click on the move button.
 * @param {number|string} taskId - Task id.
 * @returns {void}
 */
function openMoveMenu(event, taskId) {
    event.stopPropagation();
    const task = allTasks.find(t => t.id == taskId);
    if (!task) return;
    closeMoveMenu();
    const menu = createMoveMenu(task);
    positionMoveMenu(menu, event.currentTarget);
    menu.querySelector('.move-menu-option')?.focus();
    document.addEventListener('click', handleMoveMenuOutsideClick, true);
    document.addEventListener('keydown', handleMoveMenuKeydown);
    window.addEventListener('scroll', closeMoveMenu, { capture: true, once: true });
}


/**
 * Creates the menu element and adds it to the page.
 * @param {Object} task - Task with id and status.
 * @returns {HTMLElement} The menu.
 */
function createMoveMenu(task) {
    const menu = document.createElement('div');
    menu.className = 'move-menu';
    menu.id = 'move-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Move task to');
    menu.innerHTML = moveMenuTemplate(task);
    document.body.appendChild(menu);
    return menu;
}


/**
 * Places the menu below the button, right-aligned, and above it when there is not enough space below.
 * @param {HTMLElement} menu - The menu.
 * @param {HTMLElement} button - The move button of the card.
 * @returns {void}
 */
function positionMoveMenu(menu, button) {
    const rect = button.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const fitsBelow = rect.bottom + 8 + menuHeight < window.innerHeight;
    menu.style.top = `${fitsBelow ? rect.bottom + 8 : Math.max(8, rect.top - 8 - menuHeight)}px`;
    menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`;
}


/**
 * Moves a task to another column, saves the new status and redraws the board.
 * @async
 * @param {number|string} taskId - Task id.
 * @param {string} status - Id of the target column.
 * @returns {Promise<void>}
 */
async function moveTaskToColumn(taskId, status) {
    closeMoveMenu();
    const task = allTasks.find(t => t.id == taskId);
    if (!task || task.status === status) return;
    task.status = status;
    await updateTaskStatusRemote(task.id, status);
    filterTasks();
}


/**
 * Closes the menu when the user clicks somewhere else.
 * @param {MouseEvent} event - Document click.
 * @returns {void}
 */
function handleMoveMenuOutsideClick(event) {
    if (!event.target.closest('#move-menu')) closeMoveMenu();
}


/**
 * Closes the menu with Escape.
 * @param {KeyboardEvent} event - Key press.
 * @returns {void}
 */
function handleMoveMenuKeydown(event) {
    if (event.key === 'Escape') closeMoveMenu();
}


/**
 * Removes the menu and its listeners.
 * @returns {void}
 */
function closeMoveMenu() {
    document.getElementById('move-menu')?.remove();
    document.removeEventListener('click', handleMoveMenuOutsideClick, true);
    document.removeEventListener('keydown', handleMoveMenuKeydown);
}
