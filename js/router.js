/**
 * SiteLedgers — Client-Side Router
 * Hash-based routing for single-page app navigation.
 * Integrates with auth state and role-based page access.
 */

import { isAuthenticated, getState } from './state.js';
import { canAccessPage } from './roles.js';

// ─── Route Definitions ──────────────────────────────────

const routes = {
  // Public pages
  '/':              { page: 'pages/public/landing.html',          script: null,                            auth: false,  title: 'SiteLedgers — Property Oversight & Accountability' },
  '/login':         { page: 'pages/public/login.html',            script: 'js/pages/login.js',             auth: false,  title: 'Sign In — SiteLedgers' },
  '/signup':        { page: 'pages/public/signup.html',           script: 'js/pages/signup.js',            auth: false,  title: 'Create Account — SiteLedgers' },
  '/verify-email':  { page: 'pages/public/verify-email.html',     script: 'js/pages/verify-email.js',      auth: false,  title: 'Verify Email — SiteLedgers' },
  '/join':          { page: 'pages/public/join.html',             script: 'js/pages/join.js',              auth: false,  title: 'Join Organisation — SiteLedgers' },
  '/join/:code':    { page: 'pages/public/join.html',             script: 'js/pages/join.js',              auth: false,  title: 'Join Organisation — SiteLedgers' },
  '/pricing':       { page: 'pages/public/pricing.html',           script: 'js/pages/pricing.js',           auth: false,  title: 'Pricing — SiteLedgers' },
  '/contact':       { page: 'pages/public/contact.html',          script: null,                            auth: false,  title: 'Contact Us — SiteLedgers' },

  // Authenticated app pages
  '/dashboard':       { page: 'pages/app/dashboard.html',           script: 'js/pages/dashboard.js',       auth: true,   title: 'Portfolio Dashboard — SiteLedgers' },
  '/properties':      { page: 'pages/app/properties.html',          script: 'js/pages/properties.js',      auth: true,   title: 'Properties — SiteLedgers' },
  '/properties/:id':  { page: 'pages/app/property-detail.html',     script: 'js/pages/property-detail.js', auth: true,   title: 'Property Overview — SiteLedgers' },
  '/issues/new':      { page: 'pages/app/issue-new.html',           script: 'js/pages/issue-new.js',       auth: true,   title: 'Log Issue — SiteLedgers' },
  '/issues/:id':      { page: 'pages/app/issue-detail.html',        script: 'js/pages/issue-detail.js',    auth: true,   title: 'Issue Detail — SiteLedgers' },
  '/inspections':     { page: 'pages/app/inspections.html',         script: 'js/pages/inspections.js',     auth: true,   title: 'Inspections — SiteLedgers' },
  '/inspections/:id': { page: 'pages/app/inspection-detail.html',   script: 'js/pages/inspection-detail.js', auth: true, title: 'Inspection Detail — SiteLedgers' },
  '/reports':         { page: 'pages/app/reports.html',              script: 'js/pages/reports.js',         auth: true,   title: 'Reports & Audit Trail — SiteLedgers' },
  '/users':           { page: 'pages/app/users.html',               script: 'js/pages/users.js',           auth: true,   title: 'Team & Contacts — SiteLedgers' },
  '/profile':         { page: 'pages/app/profile.html',             script: 'js/pages/profile.js',         auth: true,   title: 'Profile — SiteLedgers' },
};

// Track the currently loaded page script module for cleanup
let currentPageModule = null;

// ─── Route Matching ─────────────────────────────────────

/**
 * Match a URL path against the route table.
 * Supports dynamic segments like :id.
 * Returns { route, params, pattern } or null.
 */
function matchRoute(path) {
  // Try exact match first
  if (routes[path]) {
    return { route: routes[path], params: {}, pattern: path };
  }

  // Try pattern matching for dynamic routes
  for (const [pattern, route] of Object.entries(routes)) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let match = true;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return { route, params, pattern };
    }
  }

  return null;
}

// ─── Navigation ─────────────────────────────────────────

/**
 * Navigate to a route. Updates URL hash and triggers page load.
 */
function navigateTo(path) {
  window.location.hash = '#' + path;
}

/**
 * Get the current path from the URL hash.
 */
function getCurrentPath() {
  const hash = window.location.hash.slice(1); // Remove #
  return hash || '/';
}

// ─── Route Handler ──────────────────────────────────────

/**
 * Handle route changes. Called on hash change and initial load.
 */
async function handleRouteChange() {
  const path = getCurrentPath();
  const result = matchRoute(path);

  if (!result) {
    navigateTo('/');
    return;
  }

  const { route, params, pattern } = result;

  // ── Auth guard ──
  if (route.auth && !isAuthenticated()) {
    navigateTo('/login');
    return;
  }

  // If already authenticated and trying to visit public auth pages, redirect to dashboard
  if (['/login', '/signup', '/verify-email'].includes(path) && !path.startsWith('/join') && isAuthenticated()) {
    navigateTo('/dashboard');
    return;
  }

  // ── Role-based access guard ──
  if (route.auth) {
    const { role } = getState();
    if (role && !canAccessPage(role, pattern)) {
      navigateTo('/dashboard');
      return;
    }
  }

  // ── Update page title ──
  document.title = route.title;

  // ── Cleanup previous page module ──
  if (currentPageModule && typeof currentPageModule.destroy === 'function') {
    currentPageModule.destroy();
  }
  currentPageModule = null;

  // ── Toggle navbar visibility ──
  const navbarContainer = document.getElementById('navbar-container');
  if (navbarContainer) {
    navbarContainer.style.display = route.auth ? '' : 'none';
  }

  // ── Load page HTML into the app container ──
  const container = document.getElementById('app');
  if (container && route.page) {
    try {
      const response = await fetch(route.page);
      if (response.ok) {
        container.innerHTML = await response.text();
      } else {
        container.innerHTML = '<div class="page-error"><h1>Page not found</h1><p><a href="#/dashboard">Go to Dashboard</a></p></div>';
      }
    } catch (err) {
      container.innerHTML = '<div class="page-error"><h1>Error loading page</h1><p>Please check your connection and try again.</p></div>';
    }
  }

  // ── Load page-specific script ──
  if (route.script) {
    try {
      const module = await import('../' + route.script);
      currentPageModule = module;
      if (module.init) {
        module.init(params);
      }
    } catch (err) {
      console.error('Error loading page script:', err);
    }
  }
}

// ─── Router Init ────────────────────────────────────────

/**
 * Initialize the router. Called once from app.js after auth is ready.
 */
function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange(); // Handle the initial URL
}

export { routes, navigateTo, getCurrentPath, matchRoute, initRouter };
