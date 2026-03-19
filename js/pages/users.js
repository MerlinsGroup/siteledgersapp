/**
 * SiteLedgers — Users (Team & Contacts) Page Script
 * Lists team members, search, invite modal with invite link generation.
 */

import { getState, getOrgId } from '../state.js';
import {
  fetchCollection,
  updateDocument,
  logActivity,
  where,
} from '../api.js';
import { escapeHTML, showToast, setButtonLoading, applyPermissionVisibility } from '../ui.js';
import { formatDate } from '../utils/date.js';
import { createInvite } from '../auth.js';

let allUsers = [];

export async function init() {
  applyPermissionVisibility();
  bindEvents();
  await loadUsers();
}

// ─── Load Users ──────────────────────────────────────────

async function loadUsers() {
  const container = document.getElementById('users-list');
  const emptyState = document.getElementById('users-empty');

  try {
    allUsers = await fetchCollection('users');
    renderUsers(allUsers);
  } catch (err) {
    console.error('Error loading users:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load team members.</p>';
  }
}

function renderUsers(users) {
  const container = document.getElementById('users-list');
  const emptyState = document.getElementById('users-empty');

  if (users.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = '';
    applyPermissionVisibility();
    return;
  }

  container.style.display = '';
  emptyState.style.display = 'none';

  container.innerHTML = users.map((user) => `
    <div class="issue-row" style="display:flex;align-items:center;">
      <div style="width:36px;height:36px;border-radius:var(--radius-full);background:var(--color-gray-100);display:flex;align-items:center;justify-content:center;font-weight:var(--font-weight-semibold);font-size:var(--font-size-sm);color:var(--color-charcoal);flex-shrink:0;">
        ${escapeHTML((user.name || '?').charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;min-width:0;margin-left:var(--space-3);">
        <div style="font-weight:var(--font-weight-medium);color:var(--color-charcoal);">${escapeHTML(user.name || 'Unknown')}</div>
        <div class="text-xs text-muted">${escapeHTML(user.email || '')}</div>
      </div>
      <span class="badge badge--${user.role}" style="text-transform:capitalize;">${escapeHTML(user.role ? user.role.replace(/_/g, ' ') : '')}</span>
      <span class="badge badge--${user.status === 'active' ? 'open' : user.status === 'invited' ? 'acknowledged' : 'closed'}" style="margin-left:var(--space-2);">${escapeHTML(user.status || 'active')}</span>
    </div>
  `).join('');
}

// ─── Search ──────────────────────────────────────────────

function handleSearch() {
  const query = document.getElementById('user-search')?.value.toLowerCase().trim() || '';
  if (!query) {
    renderUsers(allUsers);
    return;
  }
  const filtered = allUsers.filter((u) =>
    (u.name || '').toLowerCase().includes(query) ||
    (u.email || '').toLowerCase().includes(query) ||
    (u.role || '').toLowerCase().includes(query)
  );
  renderUsers(filtered);
}

// ─── Invite Modal ────────────────────────────────────────

function openInviteModal() {
  document.getElementById('invite-modal').style.display = '';
  document.getElementById('invite-result').style.display = 'none';
  document.getElementById('invite-footer').style.display = '';
  document.getElementById('invite-name').focus();
}

function closeInviteModal() {
  document.getElementById('invite-modal').style.display = 'none';
  document.getElementById('invite-form').reset();
  document.getElementById('invite-result').style.display = 'none';
  document.getElementById('invite-footer').style.display = '';
}

async function handleInvite(e) {
  e.preventDefault();

  const name = document.getElementById('invite-name').value.trim();
  const email = document.getElementById('invite-email').value.trim();
  const role = document.getElementById('invite-role').value;

  if (!name || !email) {
    showToast('Name and email are required.', 'error');
    return;
  }

  const btn = document.getElementById('send-invite-btn');
  setButtonLoading(btn, true);

  try {
    const { user } = getState();
    const orgId = getOrgId();

    const result = await createInvite(email, name, role, orgId, '', user.id);

    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }

    await logActivity({
      action: 'user_invited',
      entityType: 'user',
      entityTitle: name,
      details: { email, role },
    });

    // Show the invite URL
    document.getElementById('invite-url').value = result.inviteUrl;
    document.getElementById('invite-result').style.display = '';
    document.getElementById('invite-footer').style.display = 'none';

    showToast('Invite created! Share the link with your team member.', 'success');
    await loadUsers();
  } catch (err) {
    console.error('Error creating invite:', err);
    showToast('Failed to create invite.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

function handleCopyLink() {
  const url = document.getElementById('invite-url').value;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied to clipboard.', 'success');
  }).catch(() => {
    // Fallback: select the input
    document.getElementById('invite-url').select();
    showToast('Press Ctrl+C to copy.', 'info');
  });
}

// ─── Events ──────────────────────────────────────────────

function bindEvents() {
  // Search
  document.getElementById('user-search')?.addEventListener('input', handleSearch);

  // Invite modal open
  document.getElementById('invite-user-btn')?.addEventListener('click', openInviteModal);
  document.getElementById('invite-user-empty-btn')?.addEventListener('click', openInviteModal);

  // Invite modal close
  document.getElementById('close-invite-modal')?.addEventListener('click', closeInviteModal);
  document.getElementById('cancel-invite-btn')?.addEventListener('click', closeInviteModal);
  document.getElementById('invite-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'invite-modal') closeInviteModal();
  });

  // Invite form
  document.getElementById('invite-form')?.addEventListener('submit', handleInvite);

  // Copy link
  document.getElementById('copy-invite-btn')?.addEventListener('click', handleCopyLink);
}
