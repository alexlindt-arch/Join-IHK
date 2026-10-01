const mo = new MutationObserver(onMutation);


/**
 * Returns the Flatpickr configuration options.
 * @returns {Object} Flatpickr options object
 */
function buildFlatpickrOptions() {
  return {
    allowInput: true,
    dateFormat: 'd/m/Y',
    minDate: 'today',
    clickOpens: true,
    disableMobile: true  // prevents native mobile date picker overlay
  };
}


/**
 * Initializes Flatpickr on a single element if not already initialized.
 * @param {HTMLElement} el - The input element to initialize
 * @returns {void}
 */
function initFor(el) {
  if (!el || el._flatpickr) return;
  try {
    if (typeof flatpickr === 'function') {
      flatpickr(el, buildFlatpickrOptions());
    }
  } catch (e) { /* ignore */ }
}


/**
 * Attaches Flatpickr to all `.date-picker` input elements in the document.
 * @returns {void}
 */
function runAttach() {
  document.querySelectorAll('input.date-picker').forEach(initFor);
}


/**
 * Schedules a delayed call to runAttach.
 * @param {number} [delay=50] - Delay in milliseconds
 * @returns {void}
 */
function scheduleAttach(delay = 50) {
  setTimeout(runAttach, delay);
}


/**
 * Schedules attach with a fixed delay of 100ms, used by the MutationObserver.
 * @returns {void}
 */
function onMutation() {
  scheduleAttach(100);
}


/**
 * Starts the MutationObserver and runs an initial attach.
 * @returns {void}
 */
function startObserverAndAttach() {
  runAttach();
  mo.observe(document.body, { childList: true, subtree: true });
}


/**
 * Schedules the next retry for waiting on Flatpickr to load.
 * @param {number} retries - Remaining retry attempts
 * @param {number} delay - Delay in milliseconds between retries
 * @returns {void}
 */
function scheduleRetry(retries, delay) {
  setTimeout(() => waitForFlatpickrAndInit(retries - 1, delay), delay);
}


/**
 * Waits recursively for Flatpickr to become available, then starts initialization.
 * @param {number} [retries=50] - Number of remaining retry attempts
 * @param {number} [delay=100] - Wait time between attempts in milliseconds
 * @returns {void}
 */
function waitForFlatpickrAndInit(retries = 50, delay = 100) {
  if (typeof flatpickr === 'function') { startObserverAndAttach(); return; }
  if (retries <= 0) { startObserverAndAttach(); return; }
  scheduleRetry(retries, delay);
}


/**
 * Starts the initialization process once the DOM is ready.
 * @returns {void}
 */
function onDomReady() {
  waitForFlatpickrAndInit();
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDomReady);
} else {
  waitForFlatpickrAndInit();
}


window.attachDatepickers = runAttach;