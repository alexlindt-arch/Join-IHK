/**
 * Attaches a flatpickr date picker to the modal due-date input.
 * @returns {void}
 */
function initModalDatepicker() {
    const modalDue = document.getElementById('modal-task-due');
    if (modalDue && window.flatpickr) flatpickr(modalDue, getModalDatepickerOptions());
    if (window.attachDatepickers) window.attachDatepickers();
}


/**
 * Returns the flatpickr options of the modal: no past dates, opens above the input inside the modal.
 * @returns {Object} Flatpickr options.
 */
function getModalDatepickerOptions() {
    return {
        dateFormat: 'd/m/Y',
        minDate: 'today',
        allowInput: false,
        disableMobile: true,
        position: 'above',
        appendTo: document.querySelector('.add-task-modal') || document.body,
        onReady: raiseDatepickerLayer,
        onChange: updateModalCreateButton
    };
}


/**
 * Keeps the calendar above the modal.
 * @param {Date[]} selectedDates - Selected dates (unused).
 * @param {string} dateString - Selected date as text (unused).
 * @param {Object} instance - Flatpickr instance.
 * @returns {void}
 */
function raiseDatepickerLayer(selectedDates, dateString, instance) {
    instance.calendarContainer.style.zIndex = '99999';
}


/**
 * Initialises the date picker of the add-task modal once the page is ready.
 * @returns {void}
 */
function initAddTaskModal() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModalDatepicker);
    } else {
        initModalDatepicker();
    }
}


initAddTaskModal();
