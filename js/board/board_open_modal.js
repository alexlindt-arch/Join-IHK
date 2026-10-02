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
 * Shows the add-task overlay, preferring the native <dialog> API when available.
 * @returns {void}
 */
function showModalOverlay() {
  const overlay = document.getElementById('add-task-overlay');
  if (!overlay) return;
  if (typeof overlay.showModal === 'function') {
    try { overlay.showModal(); } catch (e) { /* ignore if already open */ }
    overlay.addEventListener('cancel', closeAddTaskModal);
  } else {
    overlay.classList.remove('d-none');
  }
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
  try { document.removeEventListener('click', handleModalOutsideClick, true); } catch (e) { /* ignore */ }
}


/**
 * Hides the add-task overlay and restores body scroll.
 * @returns {void}
 */
function closeModalOverlay() {
  const overlay = document.getElementById('add-task-overlay');
  if (!overlay) return;
  if (typeof overlay.close === 'function') {
    try { overlay.close(); } catch (e) { /* ignore */ }
    try { overlay.removeEventListener('cancel', closeAddTaskModal); } catch (e) { /* ignore */ }
  } else {
    overlay.classList.add('d-none');
  }
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