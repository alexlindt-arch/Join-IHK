/**
 * Central backend configuration.
 * Replace JOIN_DB_URL with the URL of your own Firebase Realtime Database
 * (Firebase console → Build → Realtime Database, shown at the top of the data view).
 * @type {string}
 */
const JOIN_DB_URL = 'https://join-ihk-lindt-default-rtdb.europe-west1.firebasedatabase.app';



/**
 * EmailJS account used to send the "forgot password" emails (https://www.emailjs.com).
 * The public key is meant to be used in the browser; allowed domains are restricted in the EmailJS dashboard.
 * The email template receives the variables to_email, to_name and reset_link.
 * @type {{serviceId: string, templateId: string, publicKey: string}}
 */
const EMAILJS_CONFIG = {
    serviceId: '',
    templateId: 'template_1llu43l',
    publicKey: 'eIKXGDKzVSl-e1H3V'
};


/** Minutes a password reset link stays valid. */
const PASSWORD_RESET_VALID_MINUTES = 30;
