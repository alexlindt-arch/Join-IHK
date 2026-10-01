/**
 * Validation rules for the contact form. Every field is required.
 * name: at least first and last name, letters only (no digits).
 * email: a valid email address (no double @, no double dots, no colons or spaces).
 * phone: digits only, optionally starting with "+".
 * @type {Object<string, {id: string, errorId: string, rule: RegExp, invalidText: string}>}
 */
const CONTACT_VALIDATION = {
    name: {
        id: 'modal-name', errorId: 'name-error', rule: /^[\p{L}'-]+(\s+[\p{L}'-]+)+$/u,
        invalidText: 'Please enter first and last name (letters only, no numbers).'
    },
    email: {
        id: 'modal-email', errorId: 'email-error', rule: /^[A-Za-z0-9_%+-]+(\.[A-Za-z0-9_%+-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
        invalidText: 'Please enter a valid email address.'
    },
    phone: {
        id: 'modal-phone', errorId: 'phone-error', rule: /^\+?[0-9]+$/,
        invalidText: 'Only numbers are allowed (optionally starting with +).'
    }
};


/** @type {string} Hint shown when a required field is left empty. */
const CONTACT_REQUIRED_TEXT = 'This field is required.';


/**
 * Validates a single field by its configuration name (used on blur and on submit).
 * Empty values are invalid because every field is required.
 * @param {string} fieldName - Key in CONTACT_VALIDATION ('name', 'email', 'phone').
 * @returns {boolean} True if the field is valid, otherwise false.
 */
function validateField(fieldName) {
    const config = CONTACT_VALIDATION[fieldName];
    const input = config && document.getElementById(config.id);
    const errorBox = config && document.getElementById(config.errorId);
    if (!input || !errorBox) return false;
    const value = input.value.trim();
    const errorText = getFieldErrorText(value, config);
    showFieldError(input, errorBox, errorText);
    return errorText === '';
}


/**
 * Returns the hint text for a field value, or an empty string if the value is valid.
 * @param {string} value - Trimmed input value.
 * @param {{rule: RegExp, invalidText: string}} config - Validation config of the field.
 * @returns {string} Error text or ''.
 */
function getFieldErrorText(value, config) {
    if (value === '') return CONTACT_REQUIRED_TEXT;
    return config.rule.test(value) ? '' : config.invalidText;
}


/**
 * Shows or hides the red hint text below an input and marks the input as invalid.
 * @param {HTMLInputElement} input - The validated input.
 * @param {HTMLElement} errorBox - The hint element below the input.
 * @param {string} errorText - Text to show; '' hides the hint.
 * @returns {void}
 */
function showFieldError(input, errorBox, errorText) {
    if (errorText) errorBox.textContent = errorText;
    errorBox.classList.toggle('visible', errorText !== '');
    input.setAttribute('aria-invalid', String(errorText !== ''));
}


/**
 * Validates all contact form fields, so every hint is shown at once.
 * @returns {boolean} True if all fields are valid.
 */
function validateContactForm() {
    const results = Object.keys(CONTACT_VALIDATION).map(validateField);
    return results.every(Boolean);
}


/**
 * Returns a stored phone number in the format the form accepts:
 * spaces are removed; values that are not a phone number become ''.
 * @param {string} phone - Stored phone value.
 * @returns {string} Phone number for the edit form.
 */
function toFormPhone(phone) {
    const compact = String(phone || '').replace(/\s/g, '');
    return CONTACT_VALIDATION.phone.rule.test(compact) ? compact : '';
}
