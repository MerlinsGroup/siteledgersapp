/**
 * SiteLedgers — Contact Page Script
 * Lightweight, backend-free handling: validates the message form and opens the
 * visitor's email client (mailto) pre-filled with their details.
 */

const CONTACT_EMAIL = 'hello@bordodesign.co';

export function init() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const success = document.getElementById('contact-success');

  function setError(input, show) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.toggle('field--invalid', show);
    const err = group.querySelector('.field-error');
    if (err) err.style.display = show ? 'block' : 'none';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name');
    const company = document.getElementById('contact-company');
    const email = document.getElementById('contact-email');
    const message = document.getElementById('contact-message');

    const nameOk = name.value.trim().length > 0;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    const msgOk = message.value.trim().length > 0;

    setError(name, !nameOk);
    setError(email, !emailOk);
    setError(message, !msgOk);

    if (!nameOk || !emailOk || !msgOk) {
      const firstInvalid = form.querySelector('.field--invalid .form-input, .field--invalid .form-textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const body = [
      `Name: ${name.value.trim()}`,
      company.value.trim() ? `Company: ${company.value.trim()}` : null,
      `Email: ${email.value.trim()}`,
      '',
      message.value.trim(),
    ].filter((line) => line !== null).join('\n');

    const subject = `SiteLedgers enquiry from ${name.value.trim()}`;
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (success) success.style.display = 'block';
    form.reset();
  });

  // Clear the error styling as soon as the visitor starts fixing a field.
  form.querySelectorAll('.form-input, .form-textarea').forEach((input) => {
    input.addEventListener('input', () => setError(input, false));
  });
}
