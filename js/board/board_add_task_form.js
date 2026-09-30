/**
 * Resets all modal form fields, state variables, and error messages.
 * @returns {void}
 */
function clearModalTaskForm() {
    clearModalTextFields();
    resetModalPriority();
    resetModalCategory();
    resetModalAssignAndSubtasks();
    hideModalFieldErrors();
    updateModalCreateButton();
}


/**
 * Clears all text inputs and hides subtask action buttons.
 * @returns {void}
 */
function clearModalTextFields() {
    document.getElementById('modal-task-title').value = '';
    document.getElementById('modal-task-desc').value = '';
    document.getElementById('modal-task-due').value = '';
    document.getElementById('modal-task-subtask').value = '';
    updateModalSubtaskActions();
}


/**
 * Resets priority state to 'medium' and updates button active classes.
 * @returns {void}
 */
function resetModalPriority() {
    modalSelectedPriority = 'medium';
    document.querySelectorAll('#add-task-overlay .prio-btn').forEach(btn => {
        btn.classList.remove('prio-active');
        if (btn.dataset.prio === 'medium') btn.classList.add('prio-active');
    });
}


/**
 * Resets the category dropdown label to its placeholder state.
 * @returns {void}
 */
function resetModalCategory() {
    modalSelectedCategory = '';
    const categoryLabel = document.getElementById('modal-category-selected');
    categoryLabel.textContent = 'Select task category';
    categoryLabel.classList.add('select-placeholder');
}


/**
 * Clears assigned contacts and subtasks arrays, then re-renders both.
 * @returns {void}
 */
function resetModalAssignAndSubtasks() {
    modalAssignedIds = [];
    modalSubtasks = [];
    renderModalAssignedAvatars();
    renderModalSubtasks();
}


/**
 * Hides all field error elements inside the add-task overlay.
 * @returns {void}
 */
function hideModalFieldErrors() {
    document.querySelectorAll('#add-task-overlay .field-error').forEach(el => el.classList.add('d-none'));
}


/**
 * Handles the create-task form submission: validates and saves the task.
 * @async
 * @param {Event} event - The submit event.
 * @returns {Promise<void>}
 */
async function createTaskFromModal(event) {
    event.preventDefault();
    const task = collectModalTask();
    if (!validateModalTask(task)) return;
    const button = document.getElementById('modal-btn-create');
    button.disabled = true;
    await trySaveModalTask(task, button);
}


/**
 * Attempts to save the task; shows success or error notification.
 * @async
 * @param {Object} task - Task data object.
 * @param {HTMLElement} button - Submit button to re-enable on failure.
 * @returns {Promise<void>}
 */
async function trySaveModalTask(task, button) {
    try {
        await saveModalTask(task);
        showTaskNotification('Task added to board');
        closeAddTaskModal();
        await initTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        showTaskNotification('Could not save task. Please try again.', true);
        button.disabled = false;
    }
}


/**
 * Maps selected contact ids to full contact objects for the assignedTo field.
 * @returns {Array} Array of assigned contact objects.
 */
function collectModalAssignedTo() {
    return modalContacts
        .filter(c => modalAssignedIds.includes(c.id))
        .map(c => ({ id: c.id, name: c.name, color: c.color, initials: c.avatar }));
}


/**
 * Reads all form fields and returns a task data object.
 * @returns {Object} Task object ready for validation and saving.
 */
function collectModalTask() {
    return {
        title: document.getElementById('modal-task-title').value.trim(),
        description: document.getElementById('modal-task-desc').value.trim(),
        dueDate: document.getElementById('modal-task-due').value,
        priority: modalSelectedPriority,
        category: modalSelectedCategory,
        assignedTo: collectModalAssignedTo(),
        subtasks: modalSubtasks,
        status: modalDefaultStatus,
        createdAt: new Date().toISOString()
    };
}


/**
 * Validates a single required field and toggles its error element visibility.
 * @param {string} value - Field value to check.
 * @param {string} errorId - Id of the error element.
 * @returns {boolean} True if the field is not empty.
 */
function validateModalField(value, errorId) {
    const errorEl = document.getElementById(errorId);
    const isValid = Boolean(value);
    errorEl.classList.toggle('d-none', isValid);
    return isValid;
}


/**
 * Validates all required task fields and returns the combined result.
 * @param {Object} task - Task object to validate.
 * @returns {boolean} True if title, dueDate and category are all present.
 */
function validateModalTask(task) {
    const titleOk = validateModalField(task.title, 'modal-error-title');
    const dueOk = validateModalField(task.dueDate, 'modal-error-due');
    const catOk = validateModalField(task.category, 'modal-error-category');
    return titleOk && dueOk && catOk;
}


/**
 * Enables or disables the create button based on required field values.
 * @returns {void}
 */
function updateModalCreateButton() {
    const title = document.getElementById('modal-task-title').value.trim();
    const due = document.getElementById('modal-task-due').value;
    const btn = document.getElementById('modal-btn-create');
    btn.disabled = !(title && due && modalSelectedCategory);
}
