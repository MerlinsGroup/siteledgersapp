/**
 * SiteLedgers — Verify Email Page Script
 */

import { auth } from '../firebase-init.js';
import { resendVerification } from '../auth.js';
import { navigateTo } from '../router.js';
import { showToast, setButtonLoading } from '../ui.js';

export function init() {
  // Resend verification email
  document.getElementById('resend-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('resend-btn');
    setButtonLoading(btn, true);

    const result = await resendVerification();
    setButtonLoading(btn, false);

    if (result.success) {
      showToast('Verification email sent. Check your inbox.', 'success');
    } else {
      showToast(result.error, 'error');
    }
  });

  // Check if email has been verified
  document.getElementById('check-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('check-btn');
    setButtonLoading(btn, true);

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          showToast('Email verified! Please sign in.', 'success');
          navigateTo('/login');
          return;
        }
      }
      showToast('Email not yet verified. Please check your inbox.', 'warning');
    } catch (err) {
      showToast('Unable to check verification status.', 'error');
    }

    setButtonLoading(btn, false);
  });
}
