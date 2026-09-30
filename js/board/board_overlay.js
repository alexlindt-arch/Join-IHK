/**
 * Shows the board overlay.
 * @returns {void}
 */
function openOverlay() {
  document.getElementById('board-overlay').classList.remove('d-none');
}


/**
 * Hides the overlay, clears its content and removes the outside-click listener.
 * @returns {void}
 */
function closeOverlay() {
  document.getElementById('board-overlay').classList.add('d-none');
  clearOverlayContent();
  document.removeEventListener('click', handleEditAssignOutsideClick, true);
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
 * Removes a task from allTasks and persists the deletion.
 * @async 
 * @param {number|string} id
 * @returns {Promise<void>}
 */
async function deleteTask(id) {
  const task = allTasks.find(t => t.id == id);
  allTasks = allTasks.filter(t => t.id != id);
  if (task && !checkIsGuest()) {
    await deleteTaskRemote(task.id);
  } else {
    deleteTaskGuest();
  }
}


/**
 * Persists deletion for guest users and refreshes the board.
 * @returns {void}
 */
function deleteTaskGuest() {
  saveGuestTasks(allTasks);
  closeOverlay();
  displayTasks(allTasks);
  notify('Der Task wurde gelöscht.');
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
    notify('Der Task wurde gelöscht.');
  } catch (e) {
    console.error('Error deleting task:', e);
    showNotification('Error saving task!', true);
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
 * Persists subtask state for guests locally or via the API.
 * @async 
 * @returns {Promise<void>}
 */
async function saveSubtaskState(taskId, subtasks) {
  const task = allTasks.find(t => t.id == taskId);
  if (task && !checkIsGuest()) {
    await updateSubtasksRemote(task.id, subtasks);
  } else {
    saveGuestTasks(allTasks);
  }
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
    console.error('Error updating subtask:', e);
    showNotification('Error updating subtask!', true);
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