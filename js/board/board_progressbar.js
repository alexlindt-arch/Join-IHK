/** Creates or returns the singleton progress popover element. 
 * @returns {HTMLElement} 
 * */
function createProgressPopover() {
  let pop = document.getElementById('progress-popover');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'progress-popover';
    pop.className = 'progress-popover d-none';
    document.body.appendChild(pop);
  }
  return pop;
}


/**
 * Returns subtask statistics for the given task.
 * @param {number|string} taskId
 * @returns {{ subtasks: Array, done: number, total: number } | null}
 */
function getSubtaskStats(taskId) {
  const task = allTasks.find(t => String(t.id) == String(taskId));
  if (!task) return null;
  const subtasks = task.subtasks || [];
  const done = subtasks.filter(s => s.done).length;
  return { subtasks, done, total: subtasks.length };
}


/**
 * Calculates the page-relative position for the popover below the event target.
 * @param {MouseEvent} event
 * @returns {{ left: number, top: number }}
 */
function getPopoverPosition(event) {
  const rect = event.target?.getBoundingClientRect?.() || { left: event.clientX, bottom: event.clientY };
  return { left: rect.left + window.scrollX, top: rect.bottom + window.scrollY + 8 };
}


/**
 * Applies absolute positioning to the popover based on the event coordinates.
 * @returns {void}
 */
function positionPopover(pop, event) {
  const pos = getPopoverPosition(event);
  pop.style.left = pos.left + 'px';
  pop.style.top = pos.top + 'px';
}


/**
 * Returns the popover header HTML showing completion progress.
 * @returns {string}
 */
function renderPopoverHeader(done, total) {
  return `<div class="progress-popover-header">${done} of ${total} subtasks done</div>`;
}


/**
 * Escapes < and > characters in a subtask title.
 * @param {string} title
 * @returns {string}
 */
function escapedTitle(title) {
  return (title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


/**
 * Returns the HTML for a single subtask list item.
 * @param {Object} subtask
 * @returns {string}
 */
function renderSubtaskItem(subtask) {
  const doneClass = subtask.done ? 'done' : '';
  const icon = subtask.done ? '✓' : '○';
  return `<li class="progress-popover-item ${doneClass}">
    <span class="progress-popover-check">${icon}</span>
    <span class="progress-popover-title">${escapedTitle(subtask.title)}</span>
  </li>`;
}


/**
 * Returns the HTML for the full subtask list.
 * @param {Array} subtasks
 * @returns {string}
 */
function renderPopoverList(subtasks) {
  return `<ul class="progress-popover-list">${subtasks.map(renderSubtaskItem).join('')}</ul>`;
}


/**
 * Shows the progress tooltip with the completion summary above the progress bar.
 * @returns {void}
 */
function showProgressTooltip(event, taskId) {
  const stats = getSubtaskStats(taskId);
  if (!stats) return;
  const pop = createProgressPopover();
  pop.innerHTML = renderPopoverHeader(stats.done, stats.total);
  positionPopover(pop, event);
  pop.dataset.taskId = taskId;
  pop.classList.remove('d-none');
}


/**
 * Hides the progress tooltip popover.
 * @returns {void}
 */
function hideProgressTooltip() {
  const pop = document.getElementById('progress-popover');
  if (pop) pop.classList.add('d-none');
}


/**
 * Returns true when the popover is currently visible for the given task.
 * @param {HTMLElement} pop
 * @param {number|string} taskId
 * @returns {boolean}
 */
function isPopoverVisibleForTask(pop, taskId) {
  return pop.dataset.taskId == String(taskId) && !pop.classList.contains('d-none');
}


/**
 * Toggles the detailed subtask list popover on click.
 * @returns {void}
 */
function toggleProgressDetails(event, taskId) {
  event.stopPropagation();
  event.preventDefault();
  const stats = getSubtaskStats(taskId);
  if (!stats) return;
  const pop = createProgressPopover();
  if (isPopoverVisibleForTask(pop, taskId)) { pop.classList.add('d-none'); return; }
  pop.innerHTML = renderPopoverHeader(stats.done, stats.total) + renderPopoverList(stats.subtasks);
  positionPopover(pop, event);
  pop.dataset.taskId = taskId;
  pop.classList.remove('d-none');
}