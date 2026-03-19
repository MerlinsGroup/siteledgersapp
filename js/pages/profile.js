/**
 * SiteLedgers — Profile Page Script
 * View and edit personal info, notification preferences.
 */

import { getState, getOrgId } from '../state.js';
import { fetchDoc, updateDocument } from '../api.js';
import { showToast, setButtonLoading } from '../ui.js';
import { formatDate } from '../utils/date.js';

export async function init() {
  loadProfile();
  bindEvents();
}

// ─── Load Profile ────────────────────────────────────────

async function loadProfile() {
  try {
    const { user, role, orgId } = getState();
    if (!user) return;

    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-company').value = user.company || '';
    document.getElementById('profile-role').textContent = (role || '').replace(/_/g, ' ');
    document.getElementById('profile-since').textContent = formatDate(user.createdAt) || '—';

    // Load org name
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');
      const { db } = await import('../firebase-init.js');
      const orgSnap = await getDoc(doc(db, 'organisations', orgId));
      if (orgSnap.exists()) {
        document.getElementById('profile-org').textContent = orgSnap.data().name || orgId;
      }
    } catch {
      document.getElementById('profile-org').textContent = orgId || '—';
    }

    // Notification prefs
    const prefs = user.notificationPrefs || {};
    document.getElementById('pref-assignment').checked = prefs.emailOnAssignment !== false;
    document.getElementById('pref-overdue').checked = prefs.emailOnOverdue !== false;
    document.getElementById('pref-status-change').checked = prefs.emailOnStatusChange !== false;
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

// ─── Save Profile ────────────────────────────────────────

async function handleSaveProfile(e) {
  e.preventDefault();

  const name = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const company = document.getElementById('profile-company').value.trim();

  if (!name) {
    showToast('Name is required.', 'error');
    return;
  }

  const btn = document.getElementById('save-profile-btn');
  setButtonLoading(btn, true);

  try {
    const { user } = getState();
    await updateDocument('users', user.id, { name, phone, company });
    showToast('Profile updated.', 'success');
  } catch (err) {
    console.error('Error saving profile:', err);
    showToast('Failed to save profile.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── Save Notification Preferences ───────────────────────

async function handleSavePrefs() {
  const btn = document.getElementById('save-prefs-btn');
  setButtonLoading(btn, true);

  try {
    const { user } = getState();
    const prefs = {
      emailOnAssignment: document.getElementById('pref-assignment').checked,
      emailOnOverdue: document.getElementById('pref-overdue').checked,
      emailOnStatusChange: document.getElementById('pref-status-change').checked,
    };

    await updateDocument('users', user.id, { notificationPrefs: prefs });
    showToast('Preferences saved.', 'success');
  } catch (err) {
    console.error('Error saving preferences:', err);
    showToast('Failed to save preferences.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── Events ──────────────────────────────────────────────

function bindEvents() {
  document.getElementById('profile-form')?.addEventListener('submit', handleSaveProfile);
  document.getElementById('save-prefs-btn')?.addEventListener('click', handleSavePrefs);
}
