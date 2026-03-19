/**
 * SiteLedgers — App State
 * Simple reactive state store for the current session.
 * Holds the authenticated user, their role, org, and assigned properties.
 * Other modules read from here — only auth.js writes to it.
 */

const state = {
  // Firebase Auth user object (null if not signed in)
  firebaseUser: null,

  // Firestore user document data (null if not loaded)
  user: null,

  // Organisation ID (null if not loaded)
  orgId: null,

  // Shortcut fields derived from user doc
  role: null,
  assignedProperties: [],

  // Whether the initial auth check has completed
  initialized: false,
};

// Listeners notified when state changes
const listeners = [];

/**
 * Subscribe to state changes. Returns an unsubscribe function.
 */
function onStateChange(callback) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

/**
 * Update state and notify listeners.
 * Only auth.js should call this directly.
 */
function setState(updates) {
  Object.assign(state, updates);
  listeners.forEach((fn) => fn(state));
}

/**
 * Get current state (read-only snapshot).
 */
function getState() {
  return { ...state };
}

/**
 * Check if the user is currently signed in and their data is loaded.
 */
function isAuthenticated() {
  return state.firebaseUser !== null && state.user !== null;
}

/**
 * Get the current user's role. Returns null if not signed in.
 */
function getCurrentRole() {
  return state.role;
}

/**
 * Get the current org ID. Returns null if not signed in.
 */
function getOrgId() {
  return state.orgId;
}

/**
 * Check if the current user has access to a specific property.
 * Owners have access to all properties (empty assignedProperties array).
 * Other roles are scoped to their assigned properties.
 */
function hasPropertyAccess(propertyId) {
  if (!state.user) return false;
  if (state.role === 'owner') return true;
  if (state.assignedProperties.length === 0) return true;
  return state.assignedProperties.includes(propertyId);
}

/**
 * Clear all session state (used on logout).
 */
function clearState() {
  setState({
    firebaseUser: null,
    user: null,
    orgId: null,
    role: null,
    assignedProperties: [],
    initialized: true,
  });
}

export {
  getState,
  setState,
  onStateChange,
  isAuthenticated,
  getCurrentRole,
  getOrgId,
  hasPropertyAccess,
  clearState,
};
