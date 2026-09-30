let touchDragClone = null;
let touchDragOffsetX = 0;
let touchDragOffsetY = 0;

const COLUMN_IDS = ['todo', 'inProgress', 'awaitFeedback', 'done'];


/**
 * Sets the currently dragged task ID.
 * @param {number|string} id
 * @returns {void}
 */
function startDragging(id) {
  currentDraggedTaskId = id;
}


/**
 * Prevents default browser behaviour to allow dropping.
 * @param {DragEvent} ev
 * @returns {void}
 */
function allowDrop(ev) {
  ev.preventDefault();
}


/**
 * Adds the drag-active highlight to the given column.
 * @param {string} id
 * @returns {void}
 */
function highlight(id) {
  document.getElementById(`drag-hl-${id}`)?.classList.add('drag-active');
}


/**
 * Removes the drag-active highlight from the given column.
 * @param {string} id
 * @returns {void}
 */
function removeHighlight(id) {
  document.getElementById(`drag-hl-${id}`)?.classList.remove('drag-active');
}


/**
 * Updates the dragged task's status and refreshes the board.
 * @async 
 * @param {string} status - Target column ID.
 * @returns {Promise<void>}
 */
async function moveTo(status) {
  if (currentDraggedTaskId === null) return;
  const task = allTasks.find(t => t.id == currentDraggedTaskId);
  if (!task) return;
  task.status = status;
  await updateTaskStatus(task);
  displayTasks(allTasks);
  currentDraggedTaskId = null;
}


/**
 * Persists the updated task status for guests or remote users.
 * @async 
 * @param {Object} task
 * @returns {Promise<void>}
 */
async function updateTaskStatus(task) {
  if (!checkIsGuest()) {
    await updateTaskStatusRemote(task.id, task.status);
  } else {
    saveGuestTasks(allTasks);
  }
}


/**
 * Sends a PATCH request to update the task status on the remote API.
 * @async 
 * @param {number|string} taskId
 * @param {string} status
 * @returns {Promise<void>}
 */
async function updateTaskStatusRemote(taskId, status) {
  try {
    await fetch(`${BOARD_BASE_URL}/tasks/${taskId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  } catch (e) {
    console.error('Error updating task status:', e);
    showNotification('Error updating task status!', true);
  }
}


/**
 * Calculates and stores the pointer offset relative to the drag card.
 * @param {Touch} touch
 * @param {DOMRect} rect
 * @returns {void}
 */
function setTouchDragOffset(touch, rect) {
  touchDragOffsetX = touch.clientX - rect.left;
  touchDragOffsetY = touch.clientY - rect.top;
}


/** Hold time before a card starts moving; a quicker swipe scrolls the board instead. */
const TOUCH_DRAG_DELAY = 350;

/** Finger movement (px) that turns a pending long press into a normal scroll. */
const TOUCH_SCROLL_TOLERANCE = 10;

/** Start point and timer of a touch that may become a drag. */
let touchPress = null;


/**
 * Touch on a card: a long press starts dragging, a swipe keeps scrolling the board.
 * @param {TouchEvent} event
 * @param {number|string} id
 * @returns {void}
 */
function touchDragStart(event, id) {
  const card = event.currentTarget;
  const touch = event.touches[0];
  cancelTouchPress();
  touchPress = { x: touch.clientX, y: touch.clientY };
  touchPress.timer = setTimeout(() => beginTouchDrag(card, id, touch), TOUCH_DRAG_DELAY);
}


/**
 * Starts dragging the card after the long press: records the task ID, offset and creates the clone.
 * @param {HTMLElement} card
 * @param {number|string} id
 * @param {Touch} touch - Touch at the start of the press.
 * @returns {void}
 */
function beginTouchDrag(card, id, touch) {
  touchPress = null;
  currentDraggedTaskId = id;
  const rect = card.getBoundingClientRect();
  setTouchDragOffset(touch, rect);
  createTouchClone(card, rect);
  card.classList.add('card--dragging');
  if (navigator.vibrate) navigator.vibrate(15);
}


/**
 * Cancels a long press that has not started dragging yet.
 * @returns {void}
 */
function cancelTouchPress() {
  if (touchPress) clearTimeout(touchPress.timer);
  touchPress = null;
}


/**
 * A finger that moves before the long press is over means scrolling: the drag is not started.
 * @param {Touch} touch
 * @returns {void}
 */
function cancelPressWhenScrolling(touch) {
  if (!touchPress || !touch) return;
  const moved = Math.hypot(touch.clientX - touchPress.x, touch.clientY - touchPress.y);
  if (moved > TOUCH_SCROLL_TOLERANCE) cancelTouchPress();
}


/**
 * Creates a fixed-position visual clone of the dragged card.
 * @param {HTMLElement} card
 * @param {DOMRect} rect
 * @returns {void}
 */
function createTouchClone(card, rect) {
  touchDragClone = card.cloneNode(true);
  touchDragClone.classList.add('card--ghost');
  touchDragClone.style.left = `${rect.left}px`;
  touchDragClone.style.top = `${rect.top}px`;
  touchDragClone.style.width = `${rect.width}px`;
  document.body.appendChild(touchDragClone);
}


/**
 * Repositions the clone to follow the touch pointer.
 * @param {Touch} touch
 * @returns {void}
 */
function moveTouchClone(touch) {
  touchDragClone.style.left = (touch.clientX - touchDragOffsetX) + 'px';
  touchDragClone.style.top = (touch.clientY - touchDragOffsetY) + 'px';
}


/**
 * Moves the clone and updates column highlights during a touch drag.
 * @param {TouchEvent} event
 * @returns {void}
 */
function touchDragMove(event) {
  if (!touchDragClone) {
    cancelPressWhenScrolling(event.touches[0]);
    return;
  }
  event.preventDefault();
  const touch = event.touches[0];
  moveTouchClone(touch);
  updateColumnHighlights(touch);
}


/**
 * Returns true when the touch point lies inside the given column element.
 * @param {Touch} touch
 * @param {HTMLElement} col
 * @returns {boolean}
 */
function isTouchInsideColumn(touch, col) {
  const r = col.getBoundingClientRect();
  return touch.clientX >= r.left && touch.clientX <= r.right &&
    touch.clientY >= r.top && touch.clientY <= r.bottom;
}


/**
 * Highlights the column under the touch point and removes all others.
 * @param {Touch} touch
 * @returns {void}
 */
function updateColumnHighlights(touch) {
  COLUMN_IDS.forEach(colId => {
    const col = document.getElementById(colId);
    if (!col) return;
    isTouchInsideColumn(touch, col) ? highlight(colId) : removeHighlight(colId);
  });
}


/**
 * Cleans up the touch drag and triggers a drop into the column under the finger.
 * @param {TouchEvent} event
 * @returns {void}
 */
function touchDragEnd(event) {
  cancelTouchPress();
  if (!touchDragClone) return;
  const touch = event.changedTouches[0];
  cleanupTouchDrag(event.currentTarget);
  checkDropZone(touch);
}


/**
 * Removes the clone and restores the original card's opacity.
 * @param {HTMLElement} card
 * @returns {void}
 */
function cleanupTouchDrag(card) {
  if (touchDragClone) {
    touchDragClone.remove();
    touchDragClone = null;
  }
  card.classList.remove('card--dragging');
}


/**
 * Removes all highlights and calls moveTo for the column under the touch point.
 * @param {Touch} touch
 * @returns {void}
 */
function checkDropZone(touch) {
  COLUMN_IDS.forEach(colId => {
    removeHighlight(colId);
    const col = document.getElementById(colId);
    if (col && isTouchInsideColumn(touch, col)) moveTo(colId);
  });
}