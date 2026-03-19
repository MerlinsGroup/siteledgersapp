/**
 * SiteLedgers — App Initialization
 * Entry point for the application.
 *
 * 1. Waits for Firebase Auth to resolve the initial auth state
 * 2. Shows the app shell (hides loader)
 * 3. Starts the router which loads the correct page
 */

import { initAuth } from './auth.js';
import { initRouter } from './router.js';
import './ui.js'; // Initialises navbar state listener

// ─── Boot Sequence ──────────────────────────────────────

async function boot() {
  try {
    // Wait for Firebase Auth to check if user is already signed in
    await initAuth();

    // Hide loader, show app container
    const loader = document.getElementById('app-loader');
    const appContainer = document.getElementById('app');
    if (loader) loader.style.display = 'none';
    if (appContainer) appContainer.style.display = '';

    // Start the router (handles initial page load + hash changes)
    initRouter();

  } catch (err) {
    console.error('SiteLedgers boot error:', err);
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.innerHTML = '<p>Something went wrong loading SiteLedgers. Please refresh.</p>';
    }
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
