/** @type {?function(SubmitEvent): Promise<void>} Action executed after the contact form is valid. */
let contactSubmitAction = null;


/**
 * Opens the dialog in "add contact" mode with an empty form and
 * default avatar placeholder.
 * @returns {void}
 */
function openAddContactModal() {
    if (!dialog) return;
    contactSubmitAction = createNewContact;
    dialog.innerHTML = renderDialogContact('Add contact', renderDialogCreateContactButton(), true);
    pendingContactPhoto = '';
    dialogContactBase = {};
    renderDialogAvatar();
    openDialog();
}


/**
 * Opens the dialog pre-filled with an existing contact's data for editing.
 * @param {string|number} id - The id of the contact to edit.
 * @returns {void}
 */
function editContact(id) {
    const contact = loadedContacts.find(c => String(c.id) === String(id));
    if (!dialog || !contact) return;
    contactSubmitAction = (event) => updateContact(event, contact.id);
    dialog.innerHTML = renderDialogContact('Edit contact', renderDialogContactEditButton(contact), false);
    fillEditForm(contact);
    openDialog();
}


/**
 * Fills the edit-contact form fields (avatar, name, email, phone)
 * with the given contact's current values using their unique element IDs.
 * @param {Object} contact - The contact whose data should populate the form.
 * @returns {void}
 */
function fillEditForm(contact) {
    pendingContactPhoto = contact.photo || '';
    dialogContactBase = contact;
    renderDialogAvatar();
    document.getElementById('modal-name').value = contact.name;
    document.getElementById('modal-email').value = contact.email;
    document.getElementById('modal-phone').value = toFormPhone(contact.phone);
}


/**
 * Reads the trimmed contact values and the pending photo from the form.
 * @param {HTMLFormElement} form - The contact form.
 * @returns {{name: string, email: string, phone: string, photo: string}}
 */
function readContactForm(form) {
    const formData = new FormData(form);
    return {
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        photo: pendingContactPhoto
    };
}


/**
 * Handles submission of the "Add contact" form: saves the new contact,
 * then closes the dialog and shows a confirmation.
 * @async
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>}
 */
async function createNewContact(event) {
    const saved = await saveContactToDB(readContactForm(event.target));
    if (!saved) return;
    closeDialog();
    showToastFeedback('Contact successfully created');
}


/**
 * Handles the form submission: validates all fields and runs the current
 * submit action only if everything is valid. The submit button is
 * disabled while saving.
 * @async
 * @param {SubmitEvent} event - The submit event of the contact form.
 * @returns {Promise<void>}
 */
async function handleContactSubmit(event) {
    event.preventDefault();
    if (!validateContactForm() || typeof contactSubmitAction !== 'function') return;
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
        await contactSubmitAction(event);
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}


/** Small camera button on the edge of the avatar that opens the photo selection. */
const CAMERA_BADGE_HTML = `<span class="avatar-upload-hint" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
        <circle cx="12" cy="13" r="3.5" />
    </svg>
</span>`;


/**
 * Renders the avatar inside the contact dialog: photo, initials or the default icon.
 * @returns {void}
 */
function renderDialogAvatar() {
    const avatarBox = dialog?.querySelector('.profile-placeholder');
    if (!avatarBox) return;
    const person = { ...dialogContactBase, photo: pendingContactPhoto };
    const inner = person.photo || person.avatar
        ? `<span class="big-avatar" style="background-color: ${person.color || '#ccc'}">${avatarInnerHTML(person)}</span>`
        : '<img class="big-avatar" src="../assets/icons/person.svg" alt="">';
    avatarBox.innerHTML = inner + CAMERA_BADGE_HTML;
    document.getElementById('avatar-remove-btn')?.classList.toggle('d-none', !pendingContactPhoto);
}


/**
 * Compresses the selected image and shows it as the contact photo preview.
 * @async
 * @param {HTMLInputElement} input - The file input.
 * @returns {Promise<void>}
 */
async function handleContactPhotoSelect(input) {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    try {
        pendingContactPhoto = await fileToAvatar(file);
        renderDialogAvatar();
    } catch (e) {
        showToastFeedback(e.message);
    }
}


/**
 * Removes the photo from the contact in the dialog.
 * @returns {void}
 */
function removeContactPhoto() {
    pendingContactPhoto = '';
    renderDialogAvatar();
}
