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
                    <svg width="30" height="30" viewBox="12 12 30 30" fill="none" aria-hidden="true"><path d="M40.125 34.5C40.125 34.9973 39.9275 35.4742 39.5758 35.8258C39.2242 36.1775 38.7473 36.375 38.25 36.375H15.75C15.2527 36.375 14.7758 36.1775 14.4242 35.8258C14.0725 35.4742 13.875 34.9973 13.875 34.5V23.25C13.875 22.7527 14.0725 22.2758 14.4242 21.9242C14.7758 21.5725 15.2527 21.375 15.75 21.375H17.9475C19.4386 21.3742 20.8683 20.7814 21.9225 19.7269L23.4788 18.1744C23.8294 17.8236 24.3047 17.6261 24.8006 17.625H29.1956C29.6929 17.6251 30.1697 17.8227 30.5212 18.1744L32.0738 19.7269C32.5962 20.2495 33.2165 20.664 33.8992 20.9468C34.5818 21.2296 35.3136 21.3751 36.0525 21.375H38.25C38.7473 21.375 39.2242 21.5725 39.5758 21.9242C39.9275 22.2758 40.125 22.7527 40.125 23.25V34.5ZM15.75 19.5C14.7554 19.5 13.8016 19.8951 13.0983 20.5983C12.3951 21.3016 12 22.2554 12 23.25V34.5C12 35.4946 12.3951 36.4484 13.0983 37.1516C13.8016 37.8549 14.7554 38.25 15.75 38.25H38.25C39.2446 38.25 40.1984 37.8549 40.9016 37.1516C41.6049 36.4484 42 35.4946 42 34.5V23.25C42 22.2554 41.6049 21.3016 40.9016 20.5983C40.1984 19.8951 39.2446 19.5 38.25 19.5H36.0525C35.058 19.4998 34.1043 19.1046 33.4012 18.4013L31.8488 16.8487C31.1457 16.1454 30.192 15.7502 29.1975 15.75H24.8025C23.808 15.7502 22.8543 16.1454 22.1512 16.8487L20.5988 18.4013C19.8957 19.1046 18.942 19.4998 17.9475 19.5H15.75Z" fill="currentColor"/><path d="M27 32.625C25.7568 32.625 24.5645 32.1311 23.6854 31.2521C22.8064 30.373 22.3125 29.1807 22.3125 27.9375C22.3125 26.6943 22.8064 25.502 23.6854 24.6229C24.5645 23.7439 25.7568 23.25 27 23.25C28.2432 23.25 29.4355 23.7439 30.3146 24.6229C31.1936 25.502 31.6875 26.6943 31.6875 27.9375C31.6875 29.1807 31.1936 30.373 30.3146 31.2521C29.4355 32.1311 28.2432 32.625 27 32.625ZM27 34.5C28.7405 34.5 30.4097 33.8086 31.6404 32.5779C32.8711 31.3472 33.5625 29.678 33.5625 27.9375C33.5625 26.197 32.8711 24.5278 31.6404 23.2971C30.4097 22.0664 28.7405 21.375 27 21.375C25.2595 21.375 23.5903 22.0664 22.3596 23.2971C21.1289 24.5278 20.4375 26.197 20.4375 27.9375C20.4375 29.678 21.1289 31.3472 22.3596 32.5779C23.5903 33.8086 25.2595 34.5 27 34.5ZM17.625 24.1875C17.625 24.4361 17.5262 24.6746 17.3504 24.8504C17.1746 25.0262 16.9361 25.125 16.6875 25.125C16.4389 25.125 16.2004 25.0262 16.0246 24.8504C15.8488 24.6746 15.75 24.4361 15.75 24.1875C15.75 23.9389 15.8488 23.7004 16.0246 23.5246C16.2004 23.3488 16.4389 23.25 16.6875 23.25C16.9361 23.25 17.1746 23.3488 17.3504 23.5246C17.5262 23.7004 17.625 23.9389 17.625 24.1875Z" fill="currentColor"/></svg>
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
