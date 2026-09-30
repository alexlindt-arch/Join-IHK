/**
 * Opens the edit modal, loading contacts if not yet cached.
 * @async 
 * @param {number|string} id
 * @returns {Promise<void>}
 */
async function openEditModal(id) {
  const task = allTasks.find(t => t.id == id);
  if (!task) return;
  initEditState(task);
  if (!boardContacts.length) boardContacts = await loadBoardContacts();
  renderEditModal(task);
}


/**
 * Initialises module-level edit state from the given task.
 * @param {Object} task
 * @returns {void}
 */
function initEditState(task) {
  editSelectedPrio = task.priority || 'medium';
  editSelectedCategory = task.category || '';
  editSubtasks = (task.subtasks || []).map(s => ({ ...s }));
  editAssignedIds = (task.assignedTo || []).map(a => String(a.id));
}


/**
 * Injects the edit form into the overlay and wires up supporting behaviour.
 * @param {Object} task
 * @returns {void}
 */
function renderEditModal(task) {
  document.getElementById('board-detail-box').classList.add('d-none');
  document.getElementById('board-edit-box').innerHTML = editTaskTemplate(task);
  document.getElementById('board-edit-box').classList.remove('d-none');
  renderEditAssignOptions();
  renderEditAssignedAvatars();
  renderEditSubtasks();
  setAttachments('edit', task.attachments);
  attachEditModalListeners();
}


/**
 * Attaches datepicker and assign outside-click listeners asynchronously.
 * @returns {void}
 */
function attachEditModalListeners() {
  setTimeout(() => { if (window.attachDatepickers) window.attachDatepickers(); }, 0);
  setTimeout(() => { document.addEventListener('click', handleEditAssignOutsideClick, true); }, 0);
}


/**
 * Closes the assign and category dropdowns of the edit form on clicks outside of them.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleEditAssignOutsideClick(event) {
  if (!event.target.closest('.edit-assign-wrapper')) document.getElementById('edit-assign-options')?.classList.add('d-none');
  if (!event.target.closest('.edit-category-select')) document.getElementById('edit-category-options')?.classList.add('d-none');
}


/**
 * Loads all contacts from the database for the assign dropdown and the avatars.
 * @async
 * @returns {Promise<Array>} Normalised contacts.
 */
async function loadBoardContacts() {
  try {
    const response = await fetch(`${BOARD_BASE_URL}/contacts.json`);
    return mapContacts(toEntryList(await response.json()));
  } catch (e) {
    notify('Contacts could not be loaded.', true);
    return [];
  }
}


/**
 * Normalises raw contacts into a sorted, uniform shape.
 * @param {Array} raw - Raw contact objects.
 * @returns {Array}
 */
function mapContacts(raw) {
  return raw
    .map(c => ({
      id: String(c.id),
      name: c.name || '',
      color: c.color || '#888',
      initials: getInitials(c.name),
      photo: c.photo || ''
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * Toggles visibility of the assign-contact dropdown.
 * @returns {void}
 */
function toggleEditAssignDropdown() {
  document.getElementById('edit-assign-options').classList.toggle('d-none');
}


/**
 * Re-renders the selectable contact list inside the assign dropdown.
 * @returns {void}
 */
function renderEditAssignOptions() {
  const el = document.getElementById('edit-assign-options');
  if (!el) return;
  el.innerHTML = renderEditAssignOptionsHTML(boardContacts, editAssignedIds);
}


/**
 * Adds or removes a contact from the current assignment.
 * @param {number|string} id
 * @returns {void}
 */
function toggleEditPerson(id) {
  const sid = String(id);
  if (editAssignedIds.includes(sid)) {
    editAssignedIds = editAssignedIds.filter(x => x !== sid);
  } else {
    if (!canAssignMorePersons()) return;
    editAssignedIds.push(sid);
  }
  renderEditAssignOptions();
  renderEditAssignedAvatars();
}


/** Returns true when another person may be assigned; notifies user otherwise. 
 * @returns {boolean} 
 * */
function canAssignMorePersons() {
  if (editAssignedIds.length >= 99) {
    notify('A maximum of 99 contacts can be assigned.', true);
    return false;
  }
  return true;
}


/**
 * Re-renders the row of assigned-contact avatars below the dropdown.
 * @returns {void}
 */
function renderEditAssignedAvatars() {
  const el = document.getElementById('edit-assigned-avatars');
  if (!el) return;
  el.innerHTML = renderEditAssignedAvatarsHTML(boardContacts, editAssignedIds);
}


/**
 * Marks the clicked priority button active and stores the selected priority.
 * @param {HTMLElement} button
 * @param {string} prio - 'low' | 'medium' | 'urgent'
 * @returns {void}
 */
function selectEditPrio(button, prio) {
  document.querySelectorAll('.edit-prio-group .prio-btn').forEach(b => b.classList.remove('prio-active'));
  button.classList.add('prio-active');
  editSelectedPrio = prio;
}


/**
 * Opens or closes the category dropdown of the edit form.
 * @returns {void}
 */
function toggleEditCategoryDropdown() {
  const options = document.getElementById('edit-category-options');
  const isOpen = options.classList.toggle('d-none') === false;
  document.getElementById('edit-category-toggle').setAttribute('aria-expanded', String(isOpen));
  if (isOpen) options.scrollIntoView({ block: 'nearest' });
}


/**
 * Stores the chosen category and shows it in the dropdown toggle.
 * @param {string} category - 'Technical Task' or 'User Story'.
 * @returns {void}
 */
function selectEditCategory(category) {
  editSelectedCategory = category;
  document.getElementById('edit-category-selected').textContent = category;
  toggleEditCategoryDropdown();
}


/**
 * Reads the subtask input, appends a new entry and re-renders the list.
 * @returns {void}
 */
function addEditSubtask() {
  const input = document.getElementById('edit-subtask-input');
  const title = input.value.trim();
  if (!title) return;
  editSubtasks.push({ title, done: false });
  input.value = '';
  renderEditSubtasks();
}


/**
 * Removes the subtask at the given index and re-renders.
 * @param {number} index
 * @returns {void}
 */
function deleteEditSubtask(index) {
  editSubtasks.splice(index, 1);
  renderEditSubtasks();
}


/**
 * Replaces a subtask list item with an inline text input.
 * @param {number} index
 * @returns {void}
 */
function startEditSubtask(index) {
  const item = document.getElementById(`edit-sub-item-${index}`);
  item.innerHTML = renderEditSubtaskInputHTML(index, editSubtasks[index].title);
  document.getElementById(`edit-sub-input-${index}`)?.focus();
}


/**
 * Saves the inline-edited title, or deletes the entry if empty.
 * @param {number} index
 * @returns {void}
 */
function saveEditSubtask(index) {
  const val = document.getElementById(`edit-sub-input-${index}`)?.value.trim();
  if (!val) { deleteEditSubtask(index); return; }
  editSubtasks[index].title = val;
  renderEditSubtasks();
}


/**
 * Re-renders the full subtask list inside the edit modal.
 * @returns {void}
 */
function renderEditSubtasks() {
  const list = document.getElementById('edit-subtask-list');
  if (!list) return;
  list.innerHTML = renderEditSubtasksHTML(editSubtasks);
}


/**
 * Validates the form, applies updates to the task object and persists them.
 * @async 
 * @param {number|string} id
 * @returns {Promise<void>}
 */
async function saveEditedTask(id) {
  const task = allTasks.find(t => t.id == id);
  if (!task) return;
  const title = document.getElementById('edit-title').value.trim();
  if (!isEditFormValid(title, task)) return;
  const updates = buildTaskUpdates(title, task);
  Object.assign(task, updates);
  await saveTaskUpdates(id, updates);
  resetEditState();
}


/**
 * Checks the required fields of the edit form and shows a message for the first problem.
 * An unchanged due date is accepted even if it has passed, so old tasks stay editable.
 * @param {string} title - Entered title.
 * @param {Object} task - Task before editing.
 * @returns {boolean} True when the task can be saved.
 */
function isEditFormValid(title, task) {
  const dueDate = document.getElementById('edit-due').value;
  const dueDateError = dueDate === task.dueDate ? '' : getDueDateError(dueDate);
  const dueErrorElement = document.getElementById('edit-error-due');
  dueErrorElement.textContent = dueDateError || 'This field is required';
  dueErrorElement.classList.toggle('d-none', !dueDateError);
  document.getElementById('edit-error-title').classList.toggle('d-none', Boolean(title));
  return Boolean(title && !dueDateError);
}


/**
 * Builds the assignedTo array from selected contact IDs.
 * @returns {Array<{id: string, name: string, color: string, initials: string}>}
 */
function buildAssignedTo() {
  return boardContacts
    .filter(c => editAssignedIds.includes(String(c.id)))
    .map(c => ({ id: c.id, name: c.name, color: c.color, initials: c.initials }));
}


/**
 * Collects all edited field values into an update object.
 * @param {string} title
 * @param {Object} task - Used as fallback for priority.
 * @returns {Object}
 */
function buildTaskUpdates(title, task) {
  return {
    title,
    description: document.getElementById('edit-desc').value.trim(),
    dueDate: document.getElementById('edit-due').value,
    priority: editSelectedPrio || task.priority,
    category: editSelectedCategory || task.category,
    assignedTo: buildAssignedTo(),
    subtasks: editSubtasks,
    attachments: getAttachments('edit')
  };
}


/**
 * Saves the changed fields of a task in the database.
 * @async
 * @param {number|string} id - Task id.
 * @param {Object} updates - Changed task fields.
 * @returns {Promise<void>}
 */
async function saveTaskUpdates(id, updates) {
  await updateTaskRemote(id, updates);
}


/**
 * Returns fetch options for a PATCH request with a JSON body.
 * @param {Object} data
 * @returns {RequestInit}
 */
function buildPatchOptions(data) {
  return { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}


/**
 * PATCHes the updated task to the API and refreshes the board.
 * @async 
 * @returns {Promise<void>}
 */
async function updateTaskRemote(id, updates) {
  try {
    await recordGuestChange('tasks', id);
    const response = await fetch(`${BOARD_BASE_URL}/tasks/${id}.json`, buildPatchOptions(updates));
    if (!response.ok) throw new Error(`Saving failed with status ${response.status}`);
    closeOverlay();
    displayTasks(allTasks);
    notify('Task updated');
  } catch (e) {
    notify('Task could not be saved. Please try again.', true);
  }
}


/**
 * Resets all module-level edit state variables to their defaults.
 * @returns {void}
 */
function resetEditState() {
  editSelectedPrio = null;
  editSelectedCategory = '';
  editAssignedIds = [];
  editSubtasks = [];
}
