/**
 * SiteLedgers — Shared UI Helpers
 * Toast notifications, loading states, navbar rendering, and common DOM helpers.
 * Used across all pages to keep UI behaviour consistent.
 */

import { getState, isAuthenticated, onStateChange } from './state.js';
import { logout } from './auth.js';
import { navigateTo, getCurrentPath } from './router.js';
import { canAccessPage, hasPermission } from './roles.js';

// ─── Toast Notifications ────────────────────────────────

/**
 * Show a toast message. Automatically dismisses after `duration` ms.
 * @param {string} message — the text to display
 * @param {'success' | 'error' | 'info' | 'warning'} type
 * @param {number} duration — ms before auto-dismiss (default 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger enter animation on next frame
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

// ─── Loading States ─────────────────────────────────────

/**
 * Show a loading spinner inside a container element.
 */
function showLoading(container) {
  if (typeof container === 'string') {
    container = document.getElementById(container);
  }
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';
}

/**
 * Show/hide a button's loading state.
 */
function setButtonLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
    button.classList.add('btn--loading');
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.classList.remove('btn--loading');
    delete button.dataset.originalText;
  }
}

// ─── Navbar ─────────────────────────────────────────────

/**
 * Render the app navbar into #navbar-container.
 * Shows navigation links filtered by the user's role.
 */
function renderNavbar() {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const { user, role } = getState();
  if (!user) {
    container.innerHTML = '';
    return;
  }

  const currentPath = getCurrentPath();

  // Navigation items with role-based visibility
  const navItems = [
    { path: '/dashboard',   label: 'Dashboard',   icon: 'grid' },
    { path: '/properties',  label: 'Properties',  icon: 'building' },
    { path: '/inspections', label: 'Inspections', icon: 'clipboard-check' },
    { path: '/reports',     label: 'Reports',     icon: 'bar-chart' },
    { path: '/users',       label: 'Team',        icon: 'users' },
  ];

  const visibleItems = navItems.filter((item) => canAccessPage(role, item.path));

  const navLinksHTML = visibleItems
    .map((item) => {
      const active = currentPath === item.path || currentPath.startsWith(item.path + '/');
      return `<a href="#${item.path}" class="nav-link${active ? ' nav-link--active' : ''}">${item.label}</a>`;
    })
    .join('');

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar__brand">
        <a href="#/dashboard" class="navbar__logo">SiteLedgers</a>
      </div>
      <div class="navbar__links">
        ${navLinksHTML}
      </div>
      <div class="navbar__user">
        <a href="#/profile" class="navbar__user-name">${escapeHTML(user.name || user.email)}</a>
        <button id="logout-btn" class="btn btn--text btn--sm">Sign Out</button>
      </div>
      <button class="navbar__mobile-toggle" id="mobile-nav-toggle" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
    </nav>
  `;

  // Bind logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      navigateTo('/login');
    });
  }

  // Bind mobile toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      container.querySelector('.navbar__links')?.classList.toggle('navbar__links--open');
    });
  }
}

// Re-render navbar whenever state changes (e.g. after login)
onStateChange((state) => {
  if (state.initialized) {
    renderNavbar();
  }
});

// ─── DOM Helpers ────────────────────────────────────────

/**
 * Escape HTML to prevent XSS when inserting user-provided text.
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/**
 * Simple helper to get an element by ID with an optional fallback.
 */
function getEl(id) {
  return document.getElementById(id);
}

/**
 * Show or hide an element.
 */
function toggleVisible(elementOrId, visible) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;
  el.style.display = visible ? '' : 'none';
}

/**
 * Conditionally show/hide elements based on the current user's role.
 * Elements with [data-role="owner,property_manager"] will only be visible
 * if the user has one of those roles.
 */
function applyRoleVisibility() {
  const { role } = getState();
  document.querySelectorAll('[data-role]').forEach((el) => {
    const allowed = el.dataset.role.split(',').map((r) => r.trim());
    el.style.display = allowed.includes(role) ? '' : 'none';
  });
}

/**
 * Conditionally show/hide elements based on permissions.
 * Elements with [data-permission="issue_create"] will only be visible
 * if the user has that permission.
 */
function applyPermissionVisibility() {
  const { role } = getState();
  document.querySelectorAll('[data-permission]').forEach((el) => {
    el.style.display = hasPermission(role, el.dataset.permission) ? '' : 'none';
  });
}

export {
  showToast,
  showLoading,
  setButtonLoading,
  renderNavbar,
  escapeHTML,
  getEl,
  toggleVisible,
  applyRoleVisibility,
  applyPermissionVisibility,
};
