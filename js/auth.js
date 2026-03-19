/**
 * SiteLedgers — Authentication Module
 * Handles login, logout, auth state observation, and user data loading.
 * Writes session data to state.js — all other modules read from there.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';

import { auth, db } from './firebase-init.js';
import { setState, clearState } from './state.js';

// ─── Login ──────────────────────────────────────────────

/**
 * Sign in with email and password.
 * On success, fetches the user's org and profile, then populates state.
 * Returns { success: true } or { success: false, error: string }.
 */
async function login(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Load org mapping and user profile into state
    const loaded = await loadUserSession(uid);
    if (!loaded) {
      // User authenticated but has no org/user doc — sign them out
      await signOut(auth);
      return { success: false, error: 'Account not found. Contact your administrator.' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: friendlyAuthError(err.code) };
  }
}

// ─── Logout ─────────────────────────────────────────────

/**
 * Sign the user out and clear all session state.
 */
async function logout() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
  }
  clearState();
}

// ─── Password Reset ─────────────────────────────────────

/**
 * Send a password reset email.
 * Returns { success: true } or { success: false, error: string }.
 */
async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    return { success: false, error: friendlyAuthError(err.code) };
  }
}

// ─── Auth State Observer ────────────────────────────────

/**
 * Start listening to Firebase auth state changes.
 * Called once on app init. Loads user session when already signed in,
 * or clears state when signed out.
 *
 * Returns a Promise that resolves once the initial auth check is done.
 */
function initAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserSession(firebaseUser.uid);
      } else {
        clearState();
      }
      setState({ initialized: true });
      resolve();
    });
  });
}

// ─── Session Loader ─────────────────────────────────────

/**
 * Given a Firebase Auth UID, load the user's org mapping and Firestore
 * user document, then populate state.
 * Returns true if successful, false if user data is missing.
 */
async function loadUserSession(uid) {
  try {
    // Step 1: Get the org mapping from userOrgs/{uid}
    const orgSnap = await getDoc(doc(db, 'userOrgs', uid));
    if (!orgSnap.exists()) {
      console.warn('No userOrgs document for UID:', uid);
      return false;
    }

    const { orgId } = orgSnap.data();

    // Step 2: Get the full user document from organisations/{orgId}/users/{uid}
    const userSnap = await getDoc(doc(db, 'organisations', orgId, 'users', uid));
    if (!userSnap.exists()) {
      console.warn('No user document in org:', orgId);
      return false;
    }

    const userData = userSnap.data();

    // Step 3: Check the user is active
    if (userData.status === 'deactivated') {
      console.warn('User account is deactivated');
      return false;
    }

    // Step 4: Populate state
    setState({
      firebaseUser: auth.currentUser,
      user: { id: uid, ...userData },
      orgId,
      role: userData.role,
      assignedProperties: userData.assignedProperties || [],
    });

    // Step 5: Update lastLoginAt (fire-and-forget)
    updateDoc(doc(db, 'organisations', orgId, 'users', uid), {
      lastLoginAt: serverTimestamp(),
    }).catch(() => {});

    return true;
  } catch (err) {
    console.error('Error loading user session:', err);
    return false;
  }
}

// ─── Helpers ────────────────────────────────────────────

/**
 * Convert Firebase Auth error codes to user-friendly messages.
 */
function friendlyAuthError(code) {
  const messages = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Contact your administrator.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  };
  return messages[code] || 'An error occurred. Please try again.';
}

export { login, logout, resetPassword, initAuth };
