/**
 * Opens the add-task modal for the given status column.
 * @async 
 * @param {string} [status='todo'] - Target column; new tasks start in To do by default.
 * @returns {Promise<void>}
 */
async function openAddTaskModal(status = 'todo') {
  modalDefaultStatus = status || 'todo';
  showModalOverlay();
  if (modalContacts.length === 0) modalContacts = await loadAssignContacts();
  clearModalTaskForm();
  setMinModalDueDate();
  document.addEventListener('click', handleModalOutsideClick, true);
}


/**
 * Opens the add-task dialog; Escape closes it through the cancel event.
 * @returns {void}
 */
function showModalOverlay() {
  const overlay = document.getElementById('add-task-overlay');
  if (!overlay.open) overlay.showModal();
  overlay.addEventListener('cancel', closeAddTaskModal);
}


/**
 * Closes the modal when the backdrop or Escape triggers a cancel event.
 * @param {Event} [event]
 * @returns {void}
 */
function closeAddTaskModal(event) {
  if (event && event.target.id !== 'add-task-overlay') return;
  closeModalOverlay();
  clearModalTaskForm();
  document.removeEventListener('click', handleModalOutsideClick, true);
}


/**
 * Closes the add-task dialog.
 * @returns {void}
 */
function closeModalOverlay() {
  const overlay = document.getElementById('add-task-overlay');
  overlay.close();
  overlay.removeEventListener('cancel', closeAddTaskModal);
}


/**
 * Closes open dropdowns when a click lands outside their containers.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleModalOutsideClick(event) {
  if (!event.target.closest('#modal-assign-select')) closeModalAssignDropdown();
  if (!event.target.closest('#modal-category-select')) closeModalCategoryDropdown();
}


/**
 * Sets the due-date input's minimum value to today's date.
 * @returns {void}
 */
function setMinModalDueDate() {
  const today = new Date().toISOString().split('T')[0];
  const input = document.getElementById('modal-task-due');
  if (input) input.setAttribute('min', today);
}