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
const CAMERA_BADGE_HTML = `<span class="avatar-upload-hint" aria-hidden="true"><svg width="30" height="30" viewBox="12 12 30 30" fill="none" aria-hidden="true"><path d="M40.125 34.5C40.125 34.9973 39.9275 35.4742 39.5758 35.8258C39.2242 36.1775 38.7473 36.375 38.25 36.375H15.75C15.2527 36.375 14.7758 36.1775 14.4242 35.8258C14.0725 35.4742 13.875 34.9973 13.875 34.5V23.25C13.875 22.7527 14.0725 22.2758 14.4242 21.9242C14.7758 21.5725 15.2527 21.375 15.75 21.375H17.9475C19.4386 21.3742 20.8683 20.7814 21.9225 19.7269L23.4788 18.1744C23.8294 17.8236 24.3047 17.6261 24.8006 17.625H29.1956C29.6929 17.6251 30.1697 17.8227 30.5212 18.1744L32.0738 19.7269C32.5962 20.2495 33.2165 20.664 33.8992 20.9468C34.5818 21.2296 35.3136 21.3751 36.0525 21.375H38.25C38.7473 21.375 39.2242 21.5725 39.5758 21.9242C39.9275 22.2758 40.125 22.7527 40.125 23.25V34.5ZM15.75 19.5C14.7554 19.5 13.8016 19.8951 13.0983 20.5983C12.3951 21.3016 12 22.2554 12 23.25V34.5C12 35.4946 12.3951 36.4484 13.0983 37.1516C13.8016 37.8549 14.7554 38.25 15.75 38.25H38.25C39.2446 38.25 40.1984 37.8549 40.9016 37.1516C41.6049 36.4484 42 35.4946 42 34.5V23.25C42 22.2554 41.6049 21.3016 40.9016 20.5983C40.1984 19.8951 39.2446 19.5 38.25 19.5H36.0525C35.058 19.4998 34.1043 19.1046 33.4012 18.4013L31.8488 16.8487C31.1457 16.1454 30.192 15.7502 29.1975 15.75H24.8025C23.808 15.7502 22.8543 16.1454 22.1512 16.8487L20.5988 18.4013C19.8957 19.1046 18.942 19.4998 17.9475 19.5H15.75Z" fill="currentColor"/><path d="M27 32.625C25.7568 32.625 24.5645 32.1311 23.6854 31.2521C22.8064 30.373 22.3125 29.1807 22.3125 27.9375C22.3125 26.6943 22.8064 25.502 23.6854 24.6229C24.5645 23.7439 25.7568 23.25 27 23.25C28.2432 23.25 29.4355 23.7439 30.3146 24.6229C31.1936 25.502 31.6875 26.6943 31.6875 27.9375C31.6875 29.1807 31.1936 30.373 30.3146 31.2521C29.4355 32.1311 28.2432 32.625 27 32.625ZM27 34.5C28.7405 34.5 30.4097 33.8086 31.6404 32.5779C32.8711 31.3472 33.5625 29.678 33.5625 27.9375C33.5625 26.197 32.8711 24.5278 31.6404 23.2971C30.4097 22.0664 28.7405 21.375 27 21.375C25.2595 21.375 23.5903 22.0664 22.3596 23.2971C21.1289 24.5278 20.4375 26.197 20.4375 27.9375C20.4375 29.678 21.1289 31.3472 22.3596 32.5779C23.5903 33.8086 25.2595 34.5 27 34.5ZM17.625 24.1875C17.625 24.4361 17.5262 24.6746 17.3504 24.8504C17.1746 25.0262 16.9361 25.125 16.6875 25.125C16.4389 25.125 16.2004 25.0262 16.0246 24.8504C15.8488 24.6746 15.75 24.4361 15.75 24.1875C15.75 23.9389 15.8488 23.7004 16.0246 23.5246C16.2004 23.3488 16.4389 23.25 16.6875 23.25C16.9361 23.25 17.1746 23.3488 17.3504 23.5246C17.5262 23.7004 17.625 23.9389 17.625 24.1875Z" fill="currentColor"/></svg></span>`;


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
