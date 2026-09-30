/**
 * Attaches a flatpickr date picker to the modal due-date input.
 * @returns {void}
 */
function initModalDatepicker() {
    const modalDue = document.getElementById('modal-task-due');
    const modalContainer = document.querySelector('.add-task-modal');
    if (modalDue && window.flatpickr) {
        flatpickr(modalDue, {
            dateFormat: 'd.m.Y',
            minDate: 'today',
            allowInput: false,
            disableMobile: true,
            position: 'above',
            appendTo: modalContainer || document.body,
            onReady: function (selectedDates, dateStr, instance) {
                instance.calendarContainer.style.zIndex = '99999';
            },
            onChange: function () {
                if (typeof updateModalCreateButton === 'function') updateModalCreateButton();
            }
        });
    }
    if (window.attachDatepickers) try { window.attachDatepickers(); } catch (e) {}
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
