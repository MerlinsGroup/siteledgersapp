/**
 * SiteLedgers — Login Page Script
 */

import { login, resetPassword } from '../auth.js';
import { navigateTo } from '../router.js';
import { showToast, setButtonLoading } from '../ui.js';

export function init() {
  const loginForm = document.getElementById('login-form');
  const resetForm = document.getElementById('reset-form');
  const loginError = document.getElementById('login-error');

  if (!loginForm) return;

  // ── Login submit ──
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      loginError.textContent = 'Please enter your email and password.';
      loginError.style.display = '';
      return;
    }

    const btn = document.getElementById('login-btn');
    setButtonLoading(btn, true);

    const result = await login(email, password);

    if (result.success) {
      navigateTo('/dashboard');
    } else if (result.error === 'EMAIL_NOT_VERIFIED') {
      navigateTo('/verify-email');
    } else {
      loginError.textContent = result.error;
      loginError.style.display = '';
      setButtonLoading(btn, false);
    }
  });

  // ── Forgot password toggle ──
  document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    resetForm.style.display = '';
    loginError.style.display = 'none';
  });

  document.getElementById('back-to-login')?.addEventListener('click', () => {
    resetForm.style.display = 'none';
    loginForm.style.display = '';
  });

  // ── Password reset submit ──
  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim();
    if (!email) return;

    const btn = document.getElementById('reset-btn');
    setButtonLoading(btn, true);

    const result = await resetPassword(email);
    setButtonLoading(btn, false);

    if (result.success) {
      showToast('Reset link sent. Check your email.', 'success');
      resetForm.style.display = 'none';
      loginForm.style.display = '';
    } else {
      showToast(result.error, 'error');
    }
  });
}
