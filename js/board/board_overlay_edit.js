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
 * Closes the assign dropdown on clicks outside the assign wrapper.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleEditAssignOutsideClick(event) {
  if (event.target.closest('.edit-assign-wrapper')) return;
  const opts = document.getElementById('edit-assign-options');
  if (opts && !opts.classList.contains('d-none')) opts.classList.add('d-none');
}


/** Loads board contacts from the appropriate source. 
 * @async 
 * @returns {Promise<Array>} 
 */
async function loadBoardContacts() {
  const contacts = await loadRemoteContacts();
  return contacts.length || !checkIsGuest() ? contacts : await loadGuestContacts();
}


/** Fetches contacts from local db.json for guest users. 
 * @async 
 * @returns {Promise<Array>} 
 */
async function loadGuestContacts() {
  try {
    const res = await fetch('../db.json');
    const data = await res.json();
    return mapContacts(Object.values(data.contacts || {}), true);
  } catch (e) { return []; }
}


/** Fetches contacts from the remote Firebase endpoint. 
 * @async 
 * @returns {Promise<Array>} 
 */
async function loadRemoteContacts() {
  try {
    const response = await fetch(`${BOARD_BASE_URL}/contacts.json`);
    const data = await response.json();
    if (!data) return [];
    const raw = Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
    return mapContacts(raw, false);
  } catch (e) {
    console.error('Error loading contacts:', e);
    showNotification('Error loading contacts!', true);
    return [];
  }
}


/**
 * Normalises raw contacts into a sorted, uniform shape.
 * @param {Array} raw - Raw contact objects.
 * @param {boolean} isGuest - Use index-based IDs when true.
 * @returns {Array}
 */
function mapContacts(raw, isGuest) {
  return raw
    .filter(Boolean)
    .map((c, i) => ({
      id: String(isGuest ? (c.id || i + 1) : c.id),
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
    notify('Maximal 99 Personen können zugewiesen werden.', true);
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
  document.querySelectorAll('.edit-prio-btn').forEach(b => b.classList.remove('edit-prio-btn--active'));
  button.classList.add('edit-prio-btn--active');
  editSelectedPrio = prio;
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
  if (!title) { notify('Title is required.', true); return; }
  const updates = buildTaskUpdates(title, task);
  Object.assign(task, updates);
  await saveTaskUpdates(id, updates);
  resetEditState();
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
    assignedTo: buildAssignedTo(),
    subtasks: editSubtasks,
    attachments: getAttachments('edit')
  };
}


/**
 * Saves updates locally for guests or via the remote API.
 * @async 
 * @returns {Promise<void>}
 */
async function saveTaskUpdates(id, updates) {
  const task = allTasks.find(t => t.id == id);
  if (task && !checkIsGuest()) {
    await updateTaskRemote(task.id, updates);
  } else {
    saveGuestTasks(allTasks);
    closeOverlay();
    displayTasks(allTasks);
  }
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
    await fetch(`${BOARD_BASE_URL}/tasks/${id}.json`, buildPatchOptions(updates));
    closeOverlay();
    displayTasks(allTasks);
  } catch (e) {
    console.error('Error saving task:', e);
    showNotification('Error saving task!', true);
  }
}


/**
 * Resets all module-level edit state variables to their defaults.
 * @returns {void}
 */
function resetEditState() {
  editSelectedPrio = null;
  editAssignedIds = [];
  editSubtasks = [];
}
