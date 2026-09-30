/**
 * Escapes special HTML characters in a string to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


/**
 * Converts various date formats to ISO 8601 (YYYY-MM-DD).
 * @param {string} value - Date string in ISO, European (dd.mm.yyyy), or parseable format.
 * @returns {string} ISO date string or empty string if conversion fails.
 */
function toIsoDate(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
        const parts = value.split('.');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(value);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return '';
}


/**
 * Truncates a string to a maximum length and appends an ellipsis if needed.
 * @param {string} str - The string to truncate.
 * @param {number} len - Maximum allowed length.
 * @returns {string} Truncated string.
 */
function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
}


/**
 * Returns the CSS class for a task category badge.
 * @param {string} category - Task category string.
 * @returns {string} CSS class name.
 */
function categoryColorClass(category) {
    if (!category) return '';
    const c = category.toLowerCase();
    if (c.includes('technical')) return 'category-technical';
    if (c.includes('user')) return 'category-user-story';
    return '';
}


/**
 * Returns an inline SVG icon for the given priority level.
 * @param {string} prio - Priority value: 'urgent', 'medium', or 'low'.
 * @returns {string} SVG HTML string or empty string for unknown values.
 */
function prioSvg(prio) {
    if (!prio) return '';
    const p = prio.toLowerCase();
    if (p === 'urgent') return `<svg width="20" height="15" viewBox="0 0 20 14.51" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8.76 L10 0 L20 8.76 L17.5 8.76 L10 2.5 L2.5 8.76 Z" fill="#FF3D00"/><path d="M0 14.51 L10 5.75 L20 14.51 L17.5 14.51 L10 8.25 L2.5 14.51 Z" fill="#FF3D00"/></svg>`;
    if (p === 'medium') return `<svg width="20" height="8" viewBox="0 0 20 8" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="20" height="2.21" rx="1.1" fill="#FFA800"/><rect x="0" y="5.24" width="20" height="2.21" rx="1.1" fill="#FFA800"/></svg>`;
    if (p === 'low') return `<svg width="20" height="15" viewBox="0 0 20 14.51" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L10 8.76 L20 0 L17.5 0 L10 6.26 L2.5 0 Z" fill="#7AE229"/><path d="M0 5.75 L10 14.51 L20 5.75 L17.5 5.75 L10 12.01 L2.5 5.75 Z" fill="#7AE229"/></svg>`;
    return '';
}


/**
 * Returns the full HTML string for a draggable task card on the board.
 * @param {Object} task - Task object with id, status, category, title, description, subtasks, assignedTo, priority.
 * @returns {string} HTML string.
 */
function taskCardTemplate(task) {
    const progress = buildProgressBar(task.subtasks || [], task.id);
    const avatars = buildAvatars(task.assignedTo || []);
    return `
        <div class="task-card" data-task-id="${task.id}" draggable="true"
            ondragstart="startDragging(${task.id})"
            onclick="openTaskDetail(${task.id})">
            <span class="task-card-category ${categoryColorClass(task.category)}">${escapeHtml(task.category || '')}</span>
            <div class="task-card-title">${escapeHtml(task.title || '')}</div>
            ${task.description ? `<div class="task-card-desc">${escapeHtml(truncate(task.description, 60))}</div>` : ''}
            ${progress}
            <div class="task-card-footer">
                <div class="task-card-avatars">${avatars}</div>
                <div class="task-card-prio">${prioSvg(task.priority)}</div>
            </div>
        </div>`;
}


/**
 * Returns a progress bar HTML string for the subtask completion state.
 * @param {Array} subtasks - Array of subtask objects with a done property.
 * @param {string|number} taskId - Parent task id for event binding.
 * @returns {string} HTML string or empty string if there are no subtasks.
 */
function buildProgressBar(subtasks, taskId) {
    const done = subtasks.filter(s => s.done).length;
    const total = subtasks.length;
    if (total === 0) return '';
    return `
        <div class="card-progress" data-task-id="${taskId}"
             onclick="toggleProgressDetails(event, ${taskId})"
             onmouseenter="showProgressTooltip(event, ${taskId})"
             onmouseleave="hideProgressTooltip()">
            <div class="card-progressbar">
                <div class="card-progressbar-fill" style="width:${Math.round(100 / total * done)}%"></div>
            </div>
            <span class="card-progress-label" title="${done} of ${total} subtasks done">${done}/${total}</span>
        </div>`;
}


/**
 * Returns avatar chip HTML for the assigned contacts, with +N overflow chip.
 * @param {Array} assignedTo - Array of contact objects with color and initials.
 * @returns {string} HTML string.
 */
function buildAvatars(assignedTo) {
    const max = 5;
    const visible = (assignedTo || []).slice(0, max);
    let html = visible.map(a => `<span class="card-avatar" style="background:${a.color || '#ccc'}">${avatarInnerHTML(withContactPhoto(a))}</span>`).join('');
    if ((assignedTo || []).length > max) html += `<span class="card-avatar card-avatar-more">+${(assignedTo || []).length - max}</span>`;
    return html;
}


/**
 * Returns the full detail overlay HTML for a task.
 * @param {Object} task - Task object with all fields.
 * @returns {string} HTML string assembled from sub-builders.
 */
function taskDetailTemplate(task) {
    const prioLabel = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '–';
    const assignees = buildDetailAssignees(task.assignedTo || []);
    const subtaskList = buildDetailSubtasks(task.subtasks || [], task.id);
    return buildDetailHTML(task, prioLabel, assignees, subtaskList);
}


/**
 * Returns HTML for all assigned contact rows in the detail view.
 * @param {Array} assignedTo - Array of contact objects with color, initials, name.
 * @returns {string} HTML string or empty string if no contacts are assigned.
 */
function buildDetailAssignees(assignedTo) {
    const assignees = assignedTo || [];
    const max = 5;
    const html = assignees.slice(0, max).map(detailAssigneeTemplate).join('');
    return assignees.length > max ? html + detailMoreAssigneesTemplate(assignees.length - max) : html;
}


/**
 * Returns one assigned contact of the detail view.
 * @param {Object} assignee - Contact with color, initials and name.
 * @returns {string} HTML string.
 */
function detailAssigneeTemplate(assignee) {
    return `
        <div class="detail-assignee">
            <span class="card-avatar" style="background:${assignee.color || '#ccc'}">${avatarInnerHTML(withContactPhoto(assignee))}</span>
            ${fitNameHTML('detail-assignee-name', assignee.name || '')}
        </div>`;
}


/**
 * Returns the "+N and N more" row for assignees that are not shown.
 * @param {number} more - Number of hidden assignees.
 * @returns {string} HTML string.
 */
function detailMoreAssigneesTemplate(more) {
    return `
        <div class="detail-assignee detail-more">
            <span class="card-avatar card-avatar-more">+${more}</span>
            <span class="detail-assignee-name">and ${more} more</span>
        </div>`;
}


/**
 * Returns HTML list items for each subtask with a toggle checkbox.
 * @param {Array} subtasks - Array of subtask objects with title and done.
 * @param {string|number} taskId - Parent task id for change event binding.
 * @returns {string} HTML string.
 */
function buildDetailSubtasks(subtasks, taskId) {
    return subtasks.map((s, i) => `
        <li class="detail-subtask-item">
            <input type="checkbox" id="sub-check-${i}" ${s.done ? 'checked' : ''}
                onchange="toggleSubtask(${taskId}, ${i})">
            <label for="sub-check-${i}">${escapeHtml(s.title || '')}</label>
        </li>`).join('');
}


/**
 * Assembles the full detail view HTML from its constituent sections.
 * @param {Object} task - Task object.
 * @param {string} prioLabel - Capitalised priority label.
 * @param {string} assignees - Pre-built assignee HTML.
 * @param {string} subtaskList - Pre-built subtask list HTML.
 * @returns {string} Combined HTML string.
 */
function buildDetailHTML(task, prioLabel, assignees, subtaskList) {
    return buildDetailHeader(task)
        + buildDetailInfo(task, prioLabel)
        + buildDetailAssignSection(task, assignees)
        + detailAttachmentSectionTemplate(task)
        + buildDetailSubtaskSection(task, subtaskList)
        + '</div>'
        + buildDetailActions(task);
}


/**
 * Returns the detail overlay header HTML including category badge and close button.
 * @param {Object} task - Task object with category, title, description.
 * @returns {string} HTML string.
 */
function buildDetailHeader(task) {
    const description = task.description || '';
    return `
        <div class="detail-header">
            <div class="detail-header-labels">
                <span class="task-card-category ${categoryColorClass(task.category)}">${escapeHtml(task.category || '')}</span>
            </div>
            <button class="detail-close-btn" aria-label="Close" onmousedown="event.stopPropagation(); event.preventDefault();" onclick="closeOverlay(); event.stopPropagation();">
                <svg viewBox="461 58 24 24" width="24" height="24" aria-hidden="true"><path d="M473 71.4L468.1 76.3C467.916 76.4834 467.683 76.575 467.4 76.575C467.116 76.575 466.883 76.4834 466.7 76.3C466.516 76.1167 466.425 75.8834 466.425 75.6C466.425 75.3167 466.516 75.0834 466.7 74.9L471.6 70L466.7 65.1C466.516 64.9167 466.425 64.6834 466.425 64.4C466.425 64.1167 466.516 63.8834 466.7 63.7C466.883 63.5167 467.116 63.425 467.4 63.425C467.683 63.425 467.916 63.5167 468.1 63.7L473 68.6L477.9 63.7C478.083 63.5167 478.316 63.425 478.6 63.425C478.883 63.425 479.116 63.5167 479.3 63.7C479.483 63.8834 479.575 64.1167 479.575 64.4C479.575 64.6834 479.483 64.9167 479.3 65.1L474.4 70L479.3 74.9C479.483 75.0834 479.575 75.3167 479.575 75.6C479.575 75.8834 479.483 76.1167 479.3 76.3C479.116 76.4834 478.883 76.575 478.6 76.575C478.316 76.575 478.083 76.4834 477.9 76.3L473 71.4Z" fill="currentColor"/></svg>
            </button>
        </div>
        <div class="show-detail">
        <h2 class="detail-title">${escapeHtml(task.title || '')}</h2>
        ${description ? `<p class="detail-desc">${escapeHtml(description)}</p>` : ''}`;
}


/**
 * Returns the due date and priority row HTML for the detail view.
 * @param {Object} task - Task object with dueDate and priority.
 * @param {string} prioLabel - Capitalised priority label.
 * @returns {string} HTML string.
 */
function buildDetailInfo(task, prioLabel) {
    return `
        <div class="detail-row">
            <span class="detail-label">Due date:</span>
            <span>${task.dueDate || '–'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Priority:</span>
            <span class="detail-prio">${prioLabel} ${prioSvg(task.priority)}</span>
        </div>`;
}


/**
 * Returns the assigned-to section HTML or empty string if no contacts.
 * @param {Object} task - Task object with assignedTo array.
 * @param {string} assignees - Pre-built assignee HTML.
 * @returns {string} HTML string.
 */
function buildDetailAssignSection(task, assignees) {
    if (!(task.assignedTo || []).length) return '';
    return `
        <div class="detail-section">
            <span class="detail-label">Assigned To:</span>
            <div class="detail-assignees">${assignees}</div>
        </div>`;
}


/**
 * Returns the subtask section HTML or empty string if there are no subtasks.
 * @param {Object} task - Task object with subtasks array.
 * @param {string} subtaskList - Pre-built subtask list HTML.
 * @returns {string} HTML string.
 */
function buildDetailSubtaskSection(task, subtaskList) {
    if (!(task.subtasks || []).length) return '';
    return `
        <div class="detail-section">
            <span class="detail-label">Subtasks</span>
            <ul class="detail-subtask-list">${subtaskList}</ul>
        </div>`;
}


/**
 * Returns the delete and edit action buttons HTML for the detail overlay.
 * @param {Object} task - Task object with id.
 * @returns {string} HTML string.
 */
function buildDetailActions(task) {
    const taskId = task.id;
    return `
        <div class="detail-actions">
            <button class="detail-btn" onclick="deleteTask(${taskId})">
                <img src="../assets/icons/delete.svg" alt="Delete"> Delete
            </button>
            <div class="detail-divider-v"></div>
            <button class="detail-btn" onclick="openEditModal(${taskId})">
                <img src="../assets/icons/edit.svg" alt="Edit"> Edit
            </button>
        </div>`;
}



/**
 * Adds the current photo of the matching board contact to an assignee object.
 * @param {Object} assignee - Assignee object with id.
 * @returns {Object} Assignee enriched with photo if one exists.
 */
function withContactPhoto(assignee) {
    const contacts = typeof boardContacts !== 'undefined' ? boardContacts : [];
    const match = contacts.find(c => String(c.id) === String(assignee.id));
    return match?.photo ? { ...assignee, photo: match.photo } : assignee;
}

/**
 * Short form of a name: first name and the initial of the last name, e.g. "Julia Weißenberger" → "Julia W.".
 * Single words (like an email address) stay unchanged.
 * @param {string} name - Full name.
 * @returns {string} Short name.
 */
function shortPersonName(name) {
    const full = String(name || '').trim().replace(/\s+/g, ' ');
    const parts = full.split(' ');
    if (parts.length < 2) return full;
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}


/**
 * Returns a name element that shows the full name when it fits and the short form only when it does not
 * (see fitNames). The full name is always available as tooltip.
 * @param {string} className - CSS class of the element.
 * @param {string} name - Full name.
 * @returns {string} HTML string.
 */
function fitNameHTML(className, name) {
    const full = String(name || '').trim().replace(/\s+/g, ' ');
    const attrs = `data-full="${escapeHtml(full)}" data-short="${escapeHtml(shortPersonName(full))}" title="${escapeHtml(full)}"`;
    return `<span class="${className} fit-name" ${attrs}>${escapeHtml(full)}</span>`;
}


/**
 * Shows every name in full if it fits into its space, otherwise the short form.
 * Hidden names (no width yet) keep the full name until they are visible.
 * @param {ParentNode} [root=document]
 * @returns {void}
 */
function fitNames(root = document) {
    root.querySelectorAll('.fit-name').forEach(el => {
        if (el.textContent !== el.dataset.full) el.textContent = el.dataset.full;
        if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) el.textContent = el.dataset.short;
    });
}


/** Pending animation frame for fitNames, so many changes cause only one measurement. */
let fitNamesFrame = 0;


/**
 * Runs fitNames once in the next frame.
 * @returns {void}
 */
function scheduleFitNames() {
    if (fitNamesFrame) return;
    fitNamesFrame = requestAnimationFrame(() => {
        fitNamesFrame = 0;
        fitNames();
    });
}


/**
 * Re-checks the names after the board or a ticket was rendered and whenever the window size changes.
 * Text changes made by fitNames itself are ignored, so the observer does not loop.
 * @returns {void}
 */
function watchFitNames() {
    window.addEventListener('resize', scheduleFitNames);
    new MutationObserver(mutations => {
        if (mutations.some(m => !(m.target.classList && m.target.classList.contains('fit-name')))) scheduleFitNames();
    }).observe(document.body, { childList: true, subtree: true });
    scheduleFitNames();
}

document.addEventListener('DOMContentLoaded', watchFitNames);
