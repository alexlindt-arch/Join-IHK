/**
 * Saves a new task from the board modal in the database.
 * @async
 * @param {Object} task
 * @returns {Promise<void>}
 */
async function saveModalTask(task) {
  await saveModalTaskRemote(task);
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
 * Assigns the next remote ID and PUTs the task to the API.
 * @async 
 * @param {Object} task
 * @returns {Promise<void>}
 */
async function saveModalTaskRemote(task) {
  task.id = await getNextModalTaskId();
  await recordGuestCreate('tasks', task.id);
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
    return Date.now();
  }
}


