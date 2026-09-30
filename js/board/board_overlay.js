/** Element that had the focus before the task overlay opened; it gets the focus back on close. */
let overlayTrigger = null;


/**
 * Shows the board overlay.
 * @returns {void}
 */
function openOverlay() {
  if (document.getElementById('board-overlay').classList.contains('d-none')) overlayTrigger = document.activeElement;
  document.getElementById('board-overlay').classList.remove('d-none');
  document.addEventListener('keydown', closeOverlayOnEscape);
  document.querySelector('#board-overlay .detail-close-btn')?.focus();
}


/**
 * Closes the task overlay with the Escape key, unless the image viewer is open on top of it.
 * @param {KeyboardEvent} event - Keydown event.
 * @returns {void}
 */
function closeOverlayOnEscape(event) {
  if (event.key !== 'Escape' || document.getElementById('image-viewer')?.open) return;
  closeOverlay();
}


/**
 * Opens a task with Enter or Space when its card has the keyboard focus.
 * @param {KeyboardEvent} event - Keydown event on the card.
 * @param {number|string} taskId - Task id.
 * @returns {void}
 */
function handleTaskCardKey(event, taskId) {
  if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  openTaskDetail(taskId);
}


/**
 * Hides the overlay, clears its content and removes the outside-click listener.
 * @returns {void}
 */
function closeOverlay() {
  document.getElementById('board-overlay').classList.add('d-none');
  clearOverlayContent();
  document.removeEventListener('click', handleEditAssignOutsideClick, true);
  document.removeEventListener('keydown', closeOverlayOnEscape);
  overlayTrigger?.focus();
  overlayTrigger = null;
}


/**
 * Empties the detail and edit boxes and resets their visibility.
 * @returns {void}
 */
function clearOverlayContent() {
  document.getElementById('board-detail-box').innerHTML = '';
  document.getElementById('board-edit-box').innerHTML = '';
  document.getElementById('board-edit-box').classList.add('d-none');
  document.getElementById('board-detail-box').classList.remove('d-none');
}


/**
 * Closes the overlay when the user clicks the backdrop.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleOverlayClick(event) {
  if (event.target.id === 'board-overlay') closeOverlay();
}


/**
 * Renders the task detail view and opens the overlay.
 * @param {number|string} id
 * @returns {void}
 */
function openTaskDetail(id) {
  const task = allTasks.find(t => t.id == id);
  if (!task) return;
  document.getElementById('board-detail-box').innerHTML = taskDetailTemplate(task);
  document.getElementById('board-detail-box').classList.remove('d-none');
  document.getElementById('board-edit-box').classList.add('d-none');
  openOverlay();
}


/**
 * Opens an attachment of a task in the image viewer.
 * @param {number|string} taskId - Task id.
 * @param {number} index - Index of the attachment.
 * @returns {void}
 */
function openTaskAttachment(taskId, index) {
  const task = allTasks.find(t => t.id == taskId);
  if (task) openImageViewer(task.attachments || [], index);
}


/**
 * Downloads an attachment of a task.
 * @param {number|string} taskId - Task id.
 * @param {number} index - Index of the attachment.
 * @returns {void}
 */
function downloadTaskAttachment(taskId, index) {
  const task = allTasks.find(t => t.id == taskId);
  const attachment = task?.attachments?.[index];
  if (attachment) downloadAttachment(attachment);
}


/**
 * Removes a task from allTasks and deletes it in the database.
 * @async
 * @param {number|string} id
 * @returns {Promise<void>}
 */
async function deleteTask(id) {
  allTasks = allTasks.filter(t => t.id != id);
  await deleteTaskRemote(id);
}


/**
 * Sends DELETE to the API and refreshes the board.
 * @async 
 * @param {number|string} id
 * @returns {Promise<void>}
 */
async function deleteTaskRemote(id) {
  try {
    await fetch(`${BOARD_BASE_URL}/tasks/${id}.json`, { method: 'DELETE' });
    closeOverlay();
    displayTasks(allTasks);
    notify('Task deleted');
  } catch (e) {
    notify('Task could not be deleted. Please try again.', true);
  }
}


/**
 * Toggles a subtask's done-state and persists the change.
 * @async 
 * @param {number|string} taskId
 * @param {number} subtaskIndex
 * @returns {Promise<void>}
 */
async function toggleSubtask(taskId, subtaskIndex) {
  const task = allTasks.find(t => t.id == taskId);
  if (!task || !task.subtasks) return;
  task.subtasks[subtaskIndex].done = !task.subtasks[subtaskIndex].done;
  await saveSubtaskState(taskId, task.subtasks);
  refreshTaskCard(taskId);
  refreshSubtaskChecks(task);
}


/**
 * Saves the done state of all subtasks of a task in the database.
 * @async
 * @param {number|string} taskId - Task id.
 * @param {Array} subtasks - Subtasks of the task.
 * @returns {Promise<void>}
 */
async function saveSubtaskState(taskId, subtasks) {
  await updateSubtasksRemote(taskId, subtasks);
}


/**
 * PATCHes updated subtasks to the remote API.
 * @async 
 * @returns {Promise<void>}
 */
async function updateSubtasksRemote(taskId, subtasks) {
  try {
    await fetch(`${BOARD_BASE_URL}/tasks/${taskId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtasks })
    });
  } catch (e) {
    notify('Subtask could not be saved. Please try again.', true);
  }
}


/**
 * Replaces the task card DOM node with a freshly rendered version.
 * @param {number|string} taskId
 * @returns {void}
 */
function refreshTaskCard(taskId) {
  const task = allTasks.find(t => t.id == taskId);
  if (!task) return;
  const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
  if (!card) return;
  card.outerHTML = taskCardTemplate(task);
  const newCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
  attachTouchListenersToCard(newCard, taskId);
}


/**
 * Syncs subtask checkbox states in the detail view with the task data.
 * @param {Object} task
 * @returns {void}
 */
function refreshSubtaskChecks(task) {
  (task.subtasks || []).forEach((s, i) => {
    const cb = document.getElementById(`sub-check-${i}`);
    if (cb) cb.checked = s.done;
  });
}