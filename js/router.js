/**
 * SiteLedgers — Client-Side Router
 * Hash-based routing for single-page app navigation.
 */

const routes = {
  // Public pages
  '/':              { page: 'pages/public/landing.html',          script: null,                            auth: false,  title: 'SiteLedgers — Property Oversight & Accountability' },
  '/login':         { page: 'pages/public/login.html',            script: null,                            auth: false,  title: 'Sign In — SiteLedgers' },
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

/**
 * Match a URL path against the route table.
 * Supports dynamic segments like :id.
 * Returns { route, params } or null.
 */
function matchRoute(path) {
  // Try exact match first
  if (routes[path]) {
    return { route: routes[path], params: {} };
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
      return { route, params };
    }
  }

  return null;
}

/**
 * Navigate to a route. Updates URL hash and loads the page.
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

/**
 * Handle route changes. Called on hash change and initial load.
 */
async function handleRouteChange() {
  const path = getCurrentPath();
  const result = matchRoute(path);

  if (!result) {
    // 404 — redirect to landing or show not found
    navigateTo('/');
    return;
  }

  const { route, params } = result;

  // TODO: Auth check — redirect to /login if route.auth && !isLoggedIn

  // Update page title
  document.title = route.title;

  // Load page HTML into the app container
  const container = document.getElementById('app');
  if (container && route.page) {
    try {
      const response = await fetch(route.page);
      if (response.ok) {
        container.innerHTML = await response.text();
      } else {
        container.innerHTML = '<h1>Page not found</h1>';
      }
    } catch (err) {
      container.innerHTML = '<h1>Error loading page</h1>';
    }
  }

  // Load page-specific script if defined
  if (route.script) {
    try {
      const module = await import('../' + route.script);
      if (module.init) {
        module.init(params);
      }
    } catch (err) {
      console.error('Error loading page script:', err);
    }
  }
}

// Listen for hash changes
window.addEventListener('hashchange', handleRouteChange);

// Initial route on page load
window.addEventListener('DOMContentLoaded', handleRouteChange);

export { routes, navigateTo, getCurrentPath, matchRoute };
