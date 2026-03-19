/**
 * SiteLedgers — Signup Page Script
 */

import { signup } from '../auth.js';
import { navigateTo } from '../router.js';
import { setButtonLoading } from '../ui.js';

export function init() {
  const form = document.getElementById('signup-form');
  const errorEl = document.getElementById('signup-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const orgName = document.getElementById('signup-org').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!orgName || !name || !email || !password) {
      errorEl.textContent = 'All fields are required.';
      errorEl.style.display = '';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters.';
      errorEl.style.display = '';
      return;
    }

    const btn = document.getElementById('signup-btn');
    setButtonLoading(btn, true);

    const result = await signup(email, password, name, orgName);

    if (result.success) {
      navigateTo('/verify-email');
    } else {
      errorEl.textContent = result.error;
      errorEl.style.display = '';
      setButtonLoading(btn, false);
    }
  });
}
