/**
 * Routes task saving to guest or remote storage.
 * @async 
 * @param {Object} task
 * @returns {Promise<void>}
 */
async function saveModalTask(task) {
  if (checkIsGuest()) {
    await saveModalTaskAsGuest(task);
  } else {
    await saveModalTaskRemote(task);
  }
}


/**
 * Assigns an ID and persists a new task in guest (local) storage.
 * @async 
 * @param {Object} task
 * @returns {Promise<void>}
 */
async function saveModalTaskAsGuest(task) {
  const guestTasks = getGuestTasks();
  task.id = await resolveGuestTaskId(guestTasks);
  guestTasks.push(task);
  saveGuestTasks(guestTasks);
}


/**
 * Returns the next available task ID by taking the max of demo and local IDs.
 * @async 
 * @param {Array} guestTasks
 * @returns {Promise<number>}
 */
async function resolveGuestTaskId(guestTasks) {
  const maxLocalId = calcMaxId(guestTasks);
  try {
    const fileTasks = await fetchDemoTaskList();
    return Math.max(calcMaxId(fileTasks), maxLocalId) + 1;
  } catch (e) {
    return maxLocalId + 1;
  }
}


/**
 * Returns the highest numeric id in an array of tasks, or 0 if empty.
 * @param {Array} tasks
 * @returns {number}
 */
function calcMaxId(tasks) {
  return tasks.length ? Math.max(...tasks.map(t => Number(t.id) || 0)) : 0;
}


/**
 * Fetches the demo task list from the static JSON file.
 * @async 
 * @returns {Promise<Array>}
 */
async function fetchDemoTaskList() {
  const res = await fetch('../demo-task.json');
  if (!res || !res.ok) return [];
  const data = await res.json();
  const raw = data?.tasks || data;
  if (!raw) return [];
  return Array.isArray(raw) ? raw.filter(Boolean) : Object.keys(raw).map(k => ({ ...raw[k], id: k })).filter(Boolean);
}


/**
 * Assigns the next remote ID and PUTs the task to the API.
 * @async 
 * @param {Object} task
 * @returns {Promise<void>}
 */
async function saveModalTaskRemote(task) {
  task.id = await getNextModalTaskId();
  const response = await fetch(`${ADDTASK_BASE_URL}/tasks/${task.id}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (!response.ok) throw new Error(`Saving failed with status ${response.status}`);
}


/**
 * Fetches all remote tasks and returns the next available numeric ID.
 * @async 
 * @returns {Promise<number>}
 */
async function getNextModalTaskId() {
  try {
    const response = await fetch(`${ADDTASK_BASE_URL}/tasks.json`);
    const data = await response.json();
    if (!data) return 1;
    const tasks = Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
    return calcMaxId(tasks) + 1;
  } catch (error) {
    console.error('Error getting next task ID:', error);
    showNotification('Error getting next task ID!', true);
    return 1;
  }
}


/**
 * Displays a temporary notification banner.
 * @param {string} message
 * @param {boolean} [isError=false]
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