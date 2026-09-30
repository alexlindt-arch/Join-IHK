/**
 * Markup of the "My account" dialog (view and edit mode share the same markup).
 * @returns {string} HTML string.
 */
function profileDialogTemplate() {
    return `
        <dialog class="account-dialog" id="profile-dialog" aria-labelledby="profile-dialog-title">
            <div class="account-dialog-inner">
                <button type="button" class="account-dialog-close" onclick="closeProfileDialog()" aria-label="Close">&times;</button>
                <section class="account-dialog-side">
                    <img class="account-dialog-logo" src="../assets/img/logo_white.svg" alt="Join logo">
                    <h2 class="account-dialog-title" id="profile-dialog-title">My account</h2>
                    <span class="account-dialog-bar" aria-hidden="true"></span>
                </section>
                <form class="account-dialog-main" id="profile-form" onsubmit="saveProfile(event)" novalidate>
                    ${profileAvatarTemplate()}
                    <div class="account-dialog-fields">
                        ${profileFieldTemplate('name', 'Name', 'text', 'name', profilePersonIcon())}
                        ${profileFieldTemplate('email', 'Email', 'email', 'email', profileMailIcon())}
                        ${profileFieldTemplate('phone', 'Phone', 'tel', 'tel', profilePhoneIcon())}
                        <p class="account-dialog-error" id="profile-error" aria-live="polite"></p>
                        <div class="account-dialog-actions">
                            <button type="button" class="account-btn account-btn--outline" id="profile-delete"
                                onclick="openDeleteAccountDialog()">Delete my account</button>
                            <button type="submit" class="account-btn account-btn--filled" id="profile-save">Edit</button>
                        </div>
                    </div>
                </form>
            </div>
        </dialog>`;
}


/**
 * Markup of the round avatar with the camera button and the "Remove photo" link.
 * @returns {string} HTML string.
 */
function profileAvatarTemplate() {
    return `
        <div class="account-avatar-col">
            <div class="account-avatar">
                <span class="account-avatar-circle" id="profile-avatar-circle"></span>
                <button type="button" class="account-avatar-camera" id="profile-camera" aria-label="Change photo (JPEG or PNG)"
                    title="Change photo (JPEG or PNG)" onclick="document.getElementById('profile-photo').click()">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                        <circle cx="12" cy="13" r="3.5" />
                    </svg>
                </button>
            </div>
            <input type="file" id="profile-photo" accept="image/jpeg,image/png" hidden onchange="handleProfilePhotoSelect(this)">
            <button type="button" class="account-avatar-remove d-none" id="profile-photo-remove"
                onclick="removeProfilePhoto()">Remove photo</button>
        </div>`;
}


/**
 * Markup of one input field with its icon and its error hint.
 * @param {string} key - Field key, used for the ids (profile-{key}, profile-{key}-error).
 * @param {string} label - Visible placeholder and accessible name.
 * @param {string} type - Input type.
 * @param {string} autocomplete - Autocomplete token.
 * @param {string} icon - Icon markup shown inside the input on the right.
 * @returns {string} HTML string.
 */
function profileFieldTemplate(key, label, type, autocomplete, icon) {
    return `
        <div class="account-field">
            <label class="account-field-box">
                <span class="account-field-label">${label}</span>
                <input class="account-field-input" type="${type}" id="profile-${key}" placeholder="${label}"
                    autocomplete="${autocomplete}" aria-describedby="profile-${key}-error" oninput="handleProfileInput('${key}')">
                ${icon}
            </label>
            <p class="account-field-error" id="profile-${key}-error" aria-live="polite"></p>
        </div>`;
}


/**
 * Person icon for the name field.
 * @returns {string} HTML string.
 */
function profilePersonIcon() {
    return `<img class="account-field-icon" src="../assets/icons/person.svg" alt="" aria-hidden="true">`;
}


/**
 * Mail icon for the email field.
 * @returns {string} HTML string.
 */
function profileMailIcon() {
    return `<img class="account-field-icon" src="../assets/icons/mail.svg" alt="" aria-hidden="true">`;
}


/**
 * Phone icon for the phone field.
 * @returns {string} HTML string.
 */
function profilePhoneIcon() {
    return `
        <svg class="account-field-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path fill="#A8A8A8" d="M19.95 21q-3.125 0-6.175-1.363t-5.55-3.862q-2.5-2.5-3.862-5.55T3 4.05q0-.45.3-.75t.75-.3H8.1q.35 0 .625.238t.325.562l.65 3.5q.05.4-.025.675T9.4 8.45L6.975 10.9q.5.925 1.187 1.787t1.513 1.663q.775.775 1.625 1.438T13.1 17l2.35-2.35q.225-.225.588-.337t.712-.063l3.45.7q.35.1.575.363T21 15.9v4.05q0 .45-.3.75t-.75.3Z"/>
        </svg>`;
}


/**
 * Markup of the small "Delete my account" confirmation dialog.
 * @returns {string} HTML string.
 */
function deleteAccountDialogTemplate() {
    return `
        <dialog class="account-confirm" id="account-delete-dialog" aria-labelledby="account-delete-text">
            <button type="button" class="account-confirm-close" onclick="closeDeleteAccountDialog()" aria-label="Close">&times;</button>
            <span class="account-confirm-icon" aria-hidden="true">!</span>
            <p class="account-confirm-text" id="account-delete-text">Are you sure you want to delete your account?</p>
            <p class="account-dialog-error" id="account-delete-error" aria-live="polite"></p>
            <div class="account-confirm-actions">
                <button type="button" class="account-btn account-btn--outline" id="account-delete-yes"
                    onclick="confirmDeleteAccount()">Yes</button>
                <button type="button" class="account-btn account-btn--filled" id="account-delete-no"
                    onclick="closeDeleteAccountDialog()">No</button>
            </div>
        </dialog>`;
}
