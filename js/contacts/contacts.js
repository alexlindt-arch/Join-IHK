const dialog = document.getElementById("add-contact-dialog");
const contactListContainer = document.getElementById("contacts-list-import");
const contactDetailsContainer = document.getElementById("contact-details-view");
const CONTACTS_URL = `${JOIN_DB_URL}/contacts.json`;
let loadedContacts = [];
let pendingContactPhoto = '';
let dialogContactBase = {};


/**
 * Initializes the contacts view: loads the contacts from Firebase
 * and renders them into the DOM.
 * @async
 * @returns {Promise<void>}
 */
async function init() {
    initMain();
    loadedContacts = [];
    await loadAndPrepareContacts();
    renderContacts();
}


/**
 * Loads the contacts from Firebase into `loadedContacts`.
 * Guests and registered users read the same data.
 * Shows a notification if the contacts cannot be loaded.
 * @async
 * @returns {Promise<void>}
 */
async function loadAndPrepareContacts() {
    try {
        const response = await fetch(CONTACTS_URL);
        if (!response.ok) throw new Error(`Firebase answered ${response.status}`);
        const raw = await response.json();
        const arr = Object.keys(raw || {}).map(key => ({ ...raw[key], id: key }));
        loadedContacts = [];
        addContactsToLoaded(arr.filter(c => c && c.name));
    } catch (error) {
        showToastFeedback('Contacts could not be loaded. Please try again.');
    }
}


/**
 * Reloads the contacts from Firebase and re-renders the list.
 * @async
 * @returns {Promise<void>}
 */
async function reloadContacts() {
    await loadAndPrepareContacts();
    renderContacts();
}


/**
 * Adds an array of raw contact objects to the global `loadedContacts`
 * array, normalizing fields (color, avatar, photo) and avoiding
 * duplicate entries by id.
 * @param {Array<Object>} contactsFromDB - Raw contact objects from Firebase.
 * @returns {void}
 */
function addContactsToLoaded(contactsFromDB) {
    contactsFromDB.forEach(c => {
        const cId = String(c.id);
        if (loadedContacts.some(lc => String(lc.id) === cId)) return;
        loadedContacts.push({
            id: cId, name: c.name, email: c.email || '', phone: c.phone || '',
            color: c.color || getRandomColor(),
            avatar: c.avatar || getInitials(c.name),
            photo: c.photo || ''
        });
    });
}


/**
 * Groups all loaded contacts alphabetically by the first letter of
 * their name, sorting the contacts within each group.
 * @returns {Object<string, Array<Object>>} A map of letter -> array of contacts.
 */
function groupContactsByLetter() {
    const groups = {};
    const sorted = [...loadedContacts].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(contact => {
        const firstLetter = contact.name.charAt(0).toUpperCase();
        if (!groups[firstLetter]) groups[firstLetter] = [];
        groups[firstLetter].push(contact);
    });
    return groups;
}


/**
 * Checks whether a contact belongs to the logged-in user (same email).
 * @param {Object} contact - A loaded contact.
 * @returns {boolean} True if it is the user's own contact.
 */
function isOwnContact(contact) {
    const email = String(getCurrentUser()?.email || '').toLowerCase();
    return email !== '' && String(contact.email).toLowerCase() === email;
}


/**
 * Returns the name shown in the list; the user's own contact is marked with "(You)".
 * @param {Object} contact - A loaded contact.
 * @returns {string} Display name.
 */
function getContactDisplayName(contact) {
    return isOwnContact(contact) ? `${contact.name} (You)` : contact.name;
}


/**
 * Renders the HTML markup for a single letter group (e.g. all contacts
 * starting with "A"), including the group header and its contact items.
 * @param {[string, Array<Object>]} entry - A `[letter, contacts]` pair from `Object.entries`.
 * @returns {string} HTML markup for the letter group.
 */
function renderLetterGroup([letter, contactsInGroup]) {
    const itemsHtml = contactsInGroup
        .map(contact => renderContactlist(contact, getContactDisplayName(contact)))
        .join('');
    return renderLetterGroupTemplate(letter, itemsHtml);
}


/**
 * Renders the full contacts list into the `contactListContainer`,
 * grouped alphabetically by first letter.
 * @returns {void}
 */
function renderContacts() {
    if (!contactListContainer) return;
    if (loadedContacts.length === 0) {
        contactListContainer.innerHTML = renderEmptyContactsTemplate();
        return;
    }
    const groupedData = groupContactsByLetter();
    contactListContainer.innerHTML = Object.entries(groupedData).map(renderLetterGroup).join('');
}


/**
 * Opens the add/edit contact dialog as a modal.
 * @returns {void}
 */
function openDialog() {
    dialog.showModal();
}


/**
 * Closes the add/edit contact dialog.
 * @returns {void}
 */
function closeDialog() {
    dialog.close();
}


/**
 * Closes the dialog when the backdrop (the dialog element itself) is clicked.
 * @param {MouseEvent} event - The click event on the dialog.
 * @returns {void}
 */
function closeDialogOnBackdrop(event) {
    if (event.target === dialog) closeDialog();
}


/**
 * Displays the detail view for a given contact, marks the
 * corresponding list item as active, and switches to the detail
 * view on mobile viewports.
 * @param {string|number} contactId - The id of the contact to display.
 * @returns {void}
 */
function showContactDetails(contactId) {
    clearActiveContact();
    const clickedElement = document.getElementById(contactId);
    if (clickedElement) {
        clickedElement.classList.add('active');
        clickedElement.setAttribute('aria-current', 'true');
    }
    const contact = loadedContacts.find(c => String(c.id) === String(contactId));
    if (contact) contactDetailsContainer.innerHTML = renderContactDetails(contact);
    if (window.innerWidth <= 768) toggleMobileContactView(true);
}


/**
 * Removes the active marking from the currently selected list item.
 * @returns {void}
 */
function clearActiveContact() {
    const currentActive = document.querySelector('.contact-item.active');
    if (!currentActive) return;
    currentActive.classList.remove('active');
    currentActive.removeAttribute('aria-current');
}


/**
 * Toggles between the contacts list and the contact detail view
 * on mobile/narrow viewports by show/hiding the split panels.
 * @param {boolean} showDetails - If `true`, shows the detail panel and hides the list.
 * @returns {void}
 */
function toggleMobileContactView(showDetails) {
    const left = document.querySelector('.contacts-split-left');
    const right = document.querySelector('.contacts-split-right');
    if (left && right) {
        left.style.display = showDetails ? 'none' : '';
        right.style.display = showDetails ? 'flex' : '';
    }
}


/**
 * Resets the mobile view back to the contacts list and clears the
 * currently active contact selection.
 * @returns {void}
 */
function resetMobileContactView() {
    toggleMobileContactView(false);
    clearActiveContact();
}


/**
 * Toggles the visibility of the mobile contact options menu and
 * registers an outside-click listener to close it when open.
 * @param {MouseEvent} event - The triggering click event (propagation is stopped).
 * @returns {void}
 */
function toggleMobileOptions(event) {
    event.stopPropagation();
    const menu = document.getElementById('mobile-options-menu');
    if (!menu) return;
    const isOpen = menu.classList.toggle('show');
    event.currentTarget.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) document.addEventListener('click', closeMobileOptionsOutside);
}


/**
 * Closes the mobile options menu on the next click (outside or on a menu
 * entry) and removes itself as a document click listener.
 * @returns {void}
 */
function closeMobileOptionsOutside() {
    document.getElementById('mobile-options-menu')?.classList.remove('show');
    document.querySelector('.btn-options-mobile')?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', closeMobileOptionsOutside);
}


/**
 * Resets the split-view layout to its default (desktop) state
 * whenever the window is resized above the mobile breakpoint.
 * @returns {void}
 */
function resetSplitViewOnResize() {
    if (window.innerWidth <= 768) return;
    const left = document.querySelector('.contacts-split-left');
    const right = document.querySelector('.contacts-split-right');
    if (left && right) {
        left.style.display = '';
        right.style.display = '';
    }
}


window.addEventListener('resize', resetSplitViewOnResize);


/**
 * Displays a transient toast notification with the given message.
 * While the modal dialog is open, the toast is placed inside it so it stays visible.
 * @param {string} message - The text to display in the toast.
 * @returns {void}
 */
function showToastFeedback(message) {
    const toast = document.createElement('div');
    toast.className = 'contact-success-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    (dialog?.open ? dialog : document.body).appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => removeToastFeedback(toast), 3000);
}


/**
 * Hides and then removes a toast notification element from the DOM.
 * @param {HTMLElement} toast - The toast element to remove.
 * @returns {void}
 */
function removeToastFeedback(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
}
