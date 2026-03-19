/**
 * SiteLedgers — Validation Utilities
 * Client-side validation helpers for forms.
 */

/**
 * Validate an email address format.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check that a string is non-empty after trimming.
 */
export function isRequired(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check minimum length.
 */
export function minLength(value, min) {
  return typeof value === 'string' && value.trim().length >= min;
}

/**
 * Check maximum length.
 */
export function maxLength(value, max) {
  return typeof value === 'string' && value.trim().length <= max;
}

/**
 * Validate a phone number (basic: allows digits, spaces, dashes, parens, +).
 */
export function isValidPhone(phone) {
  if (!phone) return true; // Optional field
  return /^[+\d][\d\s\-()]{6,20}$/.test(phone.trim());
}

/**
 * Run a set of validation rules against a form data object.
 * Returns an object mapping field names to error messages (empty = valid).
 *
 * Usage:
 *   const errors = validateForm({
 *     title: [required('Title is required')],
 *     email: [required('Email is required'), email('Invalid email')],
 *   }, formData);
 */
export function validateForm(rules, data) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator(data[field]);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  }
  return errors;
}

/**
 * Validation rule factories for use with validateForm().
 */
export const rules = {
  required: (msg = 'This field is required') => (value) =>
    isRequired(value) ? null : msg,

  email: (msg = 'Please enter a valid email') => (value) =>
    !value || isValidEmail(value) ? null : msg,

  phone: (msg = 'Please enter a valid phone number') => (value) =>
    isValidPhone(value) ? null : msg,

  min: (min, msg) => (value) =>
    minLength(value, min) ? null : (msg || `Must be at least ${min} characters`),

  max: (max, msg) => (value) =>
    maxLength(value, max) ? null : (msg || `Must be no more than ${max} characters`),
};

/**
 * Display validation errors on a form.
 * Expects each field to have a sibling or nearby element with class "field-error"
 * and a data-field attribute matching the field name.
 */
export function showFormErrors(errors, formElement) {
  // Clear previous errors
  formElement.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
    el.style.display = 'none';
  });
  formElement.querySelectorAll('.field--invalid').forEach((el) => {
    el.classList.remove('field--invalid');
  });

  // Show new errors
  for (const [field, message] of Object.entries(errors)) {
    const errorEl = formElement.querySelector(`.field-error[data-field="${field}"]`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = '';
    }
    const inputEl = formElement.querySelector(`[name="${field}"]`);
    if (inputEl) {
      inputEl.classList.add('field--invalid');
    }
  }
}

/**
 * Check if a validation result has any errors.
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
