/**
 * SiteLedgers — Join Organisation Page Script
 * Handles invite code lookup and account creation for invited members.
 */

import { getInvite, joinOrganisation } from '../auth.js';
import { navigateTo } from '../router.js';
import { setButtonLoading } from '../ui.js';

let currentInvite = null;
let currentInviteCode = null;

export function init(params) {
  const code = params.code;
  const loadingEl = document.getElementById('join-loading');
  const invalidEl = document.getElementById('join-invalid');
  const formContainer = document.getElementById('join-form-container');

  if (!code) {
    // No invite code — show message
    if (loadingEl) loadingEl.style.display = 'none';
    if (invalidEl) {
      invalidEl.style.display = '';
      invalidEl.querySelector('.login-card__subtitle').textContent = 'No invite code provided';
      invalidEl.querySelector('p:last-of-type').textContent =
        'You need an invite link from your organisation admin to join.';
    }
    return;
  }

  currentInviteCode = code;

  // Look up the invite
  lookupInvite(code, loadingEl, invalidEl, formContainer);
}

async function lookupInvite(code, loadingEl, invalidEl, formContainer) {
  const invite = await getInvite(code);

  if (loadingEl) loadingEl.style.display = 'none';

  if (!invite) {
    if (invalidEl) invalidEl.style.display = '';
    return;
  }

  currentInvite = invite;

  // Show the join form with pre-filled data
  if (formContainer) formContainer.style.display = '';
  document.getElementById('join-org-name').textContent = invite.orgName;
  document.getElementById('join-name').value = invite.name;
  document.getElementById('join-email').value = invite.email;

  // Bind form submit
  const form = document.getElementById('join-form');
  const errorEl = document.getElementById('join-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const password = document.getElementById('join-password').value;

    if (!password || password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters.';
      errorEl.style.display = '';
      return;
    }

    const btn = document.getElementById('join-btn');
    setButtonLoading(btn, true);

    const result = await joinOrganisation(currentInviteCode, password);

    if (result.success) {
      navigateTo('/verify-email');
    } else {
      errorEl.textContent = result.error;
      errorEl.style.display = '';
      setButtonLoading(btn, false);
    }
  });
}
