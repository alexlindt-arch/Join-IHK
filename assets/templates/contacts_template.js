/**
 * Renders the HTML template for a single contact item within the contact list.
 * @param {Contact} contact - The contact object to be rendered.
 * @param {string} displayName - Name shown in the list (the own contact is marked with "(You)").
 * @returns {string} The HTML string template for the list item.
 */
function renderContactlist(contact, displayName) {
    return `<button type="button" class="contact-item" id="${imgEscape(contact.id)}" onclick="showContactDetails('${imgEscape(contact.id)}')">
        <span class="avatar" style="background-color: ${imgEscape(contact.color)};">${avatarInnerHTML(contact)}</span>
        <span class="contact-info">
            <span class="name">${imgEscape(displayName)}</span>
            <span class="email">${imgEscape(contact.email)}</span>
        </span>
    </button>`;
}


/**
 * Renders a letter group container (e.g., "A", "B", "C") used for alphabetical sorting in the contact list.
 * @param {string} letter - The initial letter of the group.
 * @param {string} itemsHtml - The pre-rendered HTML string of contacts belonging to this letter group.
 * @returns {string} The HTML string template for the letter group.
 */
function renderLetterGroupTemplate(letter, itemsHtml) {
    return `
        <div class="letter-group">
            <h2 class="letter-group-title">${imgEscape(letter)}</h2>
            ${itemsHtml}
        </div>
    `;
}


/**
 * Renders the hint shown when there are no contacts yet.
 * @returns {string} The HTML string for the empty list.
 */
function renderEmptyContactsTemplate() {
    return `<p class="contacts-empty">No contacts yet. Add your first contact!</p>`;
}


/**
 * Renders the detailed profile view of a contact, including action buttons for both desktop and mobile views.
 * @param {Contact} contact - The contact object whose details are to be displayed.
 * @returns {string} The HTML string template for the detailed profile view.
 */
function renderContactDetails(contact) {
    return `
        <div class="profile-header">
            <div class="profile-avatar" style="background-color: ${imgEscape(contact.color)};">${avatarInnerHTML(contact)}</div>
            <div class="profile-meta">
                <h2 class="profile-name">${imgEscape(contact.name)}</h2>
                <div class="profile-actions for-mobile-hide" id="profile">${contactActionButtons(contact.id, 'profile-btn')}</div>
            </div>
        </div>
        <div class="profile-body">
            <h3 class="section-title">Contact Information</h3>
            ${contactInfoTemplate(contact)}
            ${contactMobileOptionsTemplate(contact.id)}
        </div>`;
}


/**
 * Returns the email and phone rows of the contact details.
 * @param {Contact} contact - Contact to show.
 * @returns {string} HTML string.
 */
function contactInfoTemplate(contact) {
    return `
        <div class="info-group">
            <span class="info-label">Email</span>
            <a class="info-value email-link" href="mailto:${imgEscape(contact.email)}">${imgEscape(contact.email)}</a>
        </div>
        <div class="info-group">
            <span class="info-label">Phone</span>
            <a class="info-value phone-link" href="tel:${imgEscape(contact.phone)}">${imgEscape(contact.phone)}</a>
        </div>`;
}


/**
 * Returns the Edit and Delete buttons of a contact.
 * @param {string} contactId - Contact id.
 * @param {string} className - CSS class of the buttons ('profile-btn' on desktop, 'menu-item' in the mobile menu).
 * @returns {string} HTML string.
 */
function contactActionButtons(contactId, className) {
    const id = imgEscape(contactId);
    return `
        <button type="button" class="${className}" onclick="editContact('${id}')">
            <img src="../assets/icons/edit_contacts.svg" alt=""> <span>Edit</span>
        </button>
        <button type="button" class="${className}" onclick="deleteContact('${id}')">
            <img src="../assets/icons/delete.svg" alt=""> <span>Delete</span>
        </button>`;
}


/**
 * Returns the round options button of the mobile contact view and its Edit / Delete menu.
 * @param {string} contactId - Contact id.
 * @returns {string} HTML string.
 */
function contactMobileOptionsTemplate(contactId) {
    return `
        <button type="button" class="btn-options-mobile" onclick="toggleMobileOptions(event)"
            aria-label="More options" aria-haspopup="true" aria-expanded="false" aria-controls="mobile-options-menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="5" r="2" fill="white"/><circle cx="12" cy="12" r="2" fill="white"/><circle cx="12" cy="19" r="2" fill="white"/>
            </svg>
        </button>
        <div id="mobile-options-menu" class="mobile-options-popup">${contactActionButtons(contactId, 'menu-item')}</div>`;
}


/**
 * Renders the layout framework of the modal dialog used for adding or editing a contact.
 * The form is validated by JavaScript only (novalidate), see handleContactSubmit.
 * @param {string} title - The title of the dialog (e.g., "Add contact" or "Edit contact").
 * @param {string} buttonHtml - The pre-rendered HTML string for the footer buttons (context-dependent).
 * @param {boolean} showTagline - Whether the "Tasks are better with a team!" tagline is shown.
 * @returns {string} The HTML string template for the modal dialog.
 */
function renderDialogContact(title, buttonHtml, showTagline) {
    return `<div class="modal-content">
            ${contactDialogSideTemplate(title, showTagline)}
            <form class="modal-right" novalidate onsubmit="handleContactSubmit(event)">
                <button type="button" class="close-dialog dp-hidden-mobile" onclick="closeDialog()" aria-label="Close">×</button>
                ${contactDialogAvatarTemplate()}
                ${contactFieldTemplate('name', 'text', 'Name', 'person.svg', 'Please enter first and last name (letters only, no numbers).')}
                ${contactFieldTemplate('email', 'email', 'Email', 'mail.svg', 'Please enter a valid email address.')}
                ${contactFieldTemplate('phone', 'tel', 'Phone', 'call.svg', 'Only numbers are allowed (optionally starting with +).')}
                <div class="modal-footer">${buttonHtml}</div>
            </form>
        </div>`;
}


/**
 * Returns the dark side of the contact dialog with logo, title, tagline and the mobile close button.
 * @param {string} title - Dialog title.
 * @param {boolean} showTagline - Whether the tagline is shown.
 * @returns {string} HTML string.
 */
function contactDialogSideTemplate(title, showTagline) {
    return `
            <div class="modal-left">
                <button type="button" class="close-dialog dp-show-mobile" onclick="closeDialog()" aria-label="Close">×</button>
                <div class="modal-logo for-mobile-hide"><img src="../assets/img/logo_white.svg" alt="Join logo"></div>
                <h2 id="contact-dialog-title">${title}</h2>
                <p class="${showTagline ? 'modal-tagline' : 'modal-tagline d-none'}">Tasks are better with a team!</p>
                <div class="modal-divider"></div>
            </div>`;
}


/**
 * Returns the avatar of the contact dialog with the camera button, the hidden file input and "Remove photo".
 * @returns {string} HTML string.
 */
function contactDialogAvatarTemplate() {
    return `
                <div class="avatar-upload">
                    <div class="profile-placeholder"></div>
                    <button type="button" class="avatar-upload-hint" title="Upload photo (JPEG or PNG)"
                        aria-label="Upload photo (JPEG or PNG)" onclick="document.getElementById('modal-photo').click()">
                        ${CAMERA_ICON_SVG}
                    </button>
                    <input type="file" id="modal-photo" accept="image/jpeg,image/png" hidden onchange="handleContactPhotoSelect(this)">
                    <button type="button" class="avatar-remove-btn d-none" id="avatar-remove-btn" onclick="removeContactPhoto()">Remove photo</button>
                </div>`;
}


/**
 * Returns one input of the contact dialog with its icon and the error text below.
 * Phone input only accepts digits and a leading "+".
 * @param {string} field - Field name ('name', 'email' or 'phone').
 * @param {string} type - Input type.
 * @param {string} label - Placeholder and accessible name.
 * @param {string} icon - Icon file in assets/icons.
 * @param {string} errorText - Default error text.
 * @returns {string} HTML string.
 */
function contactFieldTemplate(field, type, label, icon, errorText) {
    const phoneFilter = field === 'phone' ? 'oninput="allowOnlyPhoneCharacters(this)"' : '';
    return `
                <div class="input-group">
                    <input type="${type}" id="modal-${field}" name="${field}" placeholder="${label}" aria-label="${label}"
                        aria-describedby="${field}-error" ${phoneFilter} onblur="validateField('${field}')" autocomplete="off">
                    <img class="input-icon" src="../assets/icons/${icon}" alt="" aria-hidden="true">
                </div>
                <div id="${field}-error" class="error-message" aria-live="polite">${errorText}</div>`;
}


/**
 * Renders the action buttons for the dialog when an existing contact is being *edited* (Delete & Save).
 * @param {Contact} contact - The contact object currently being edited.
 * @returns {string} The HTML string template for the "Delete" and "Save" buttons.
 */
function renderDialogContactEditButton(contact) {
    return `<button type="button" class="btn-cancel" onclick="deleteContact('${imgEscape(contact.id)}')">Delete</button>
            <button type="submit" class="btn-submit">Save <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5L10 17.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
}


/**
 * Renders the action buttons for the dialog when a new contact is being *created* (Cancel & Create contact).
 * @returns {string} The HTML string template for the "Cancel" and "Create contact" buttons.
 */
function renderDialogCreateContactButton() {
    return `<button type="button" class="btn-cancel btn-mobile-hide" onclick="closeDialog()">Cancel <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
            <button type="submit" class="btn-submit">Create contact <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5L10 17.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
}
