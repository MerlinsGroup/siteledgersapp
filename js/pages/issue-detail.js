/**
 * SiteLedgers — Issue Detail Page Script
 * Shows issue details, status management, assignment, comments, and activity.
 */

import { getState } from '../state.js';
import {
  fetchDoc,
  fetchCollection,
  fetchSubcollection,
  createSubDoc,
  updateDocument,
  deleteDocument,
  logActivity,
  where,
  orderBy,
} from '../api.js';
import { escapeHTML, showToast, setButtonLoading, applyPermissionVisibility } from '../ui.js';
import { formatDate, formatDateTime, timeAgo } from '../utils/date.js';
import { navigateTo } from '../router.js';
import { canTransitionTo, ISSUE_STATUS, hasPermission } from '../roles.js';

let issueId = null;
let issueData = null;

export async function init(params) {
  issueId = params.id;
  if (!issueId) {
    navigateTo('/dashboard');
    return;
  }

  await loadIssue();
  applyPermissionVisibility();

  if (issueData) {
    await Promise.all([loadActivity(), loadTeamMembers()]);
    bindEvents();
  }
}

// ─── Load Issue ──────────────────────────────────────────

async function loadIssue() {
  try {
    issueData = await fetchDoc('issues', issueId);
    if (!issueData) {
      document.getElementById('issue-title').textContent = 'Issue Not Found';
      return;
    }

    document.getElementById('issue-title').textContent = issueData.title;
    document.getElementById('issue-property-name').textContent = issueData.propertyName || '';
    document.getElementById('issue-description').textContent = issueData.description || 'No description provided.';
    document.getElementById('issue-category').textContent = issueData.category ? issueData.category.replace(/_/g, ' ') : '—';
    document.getElementById('issue-location').textContent = issueData.location || '—';
    document.getElementById('issue-due-date').textContent = formatDate(issueData.dueDate) || '—';
    document.getElementById('issue-created').textContent = formatDateTime(issueData.createdAt) || '—';

    // Status badge
    const statusBadge = document.getElementById('issue-status-badge');
    statusBadge.className = `badge badge--${issueData.status}`;
    statusBadge.textContent = issueData.status.replace(/_/g, ' ');

    // Priority badge
    const priorityBadge = document.getElementById('issue-priority-badge');
    priorityBadge.className = `badge badge--${issueData.priority}`;
    priorityBadge.textContent = issueData.priority;

    // Assignee
    document.getElementById('issue-assignee').textContent = issueData.assignedToName || 'Unassigned';

    // Back link
    if (issueData.propertyId) {
      const backLink = document.getElementById('back-link');
      if (backLink) backLink.href = '#/properties/' + issueData.propertyId;
    }

    // Status action buttons
    renderStatusActions();
  } catch (err) {
    console.error('Error loading issue:', err);
    document.getElementById('issue-title').textContent = 'Error loading issue';
  }
}

// ─── Status Actions ──────────────────────────────────────

function renderStatusActions() {
  const container = document.getElementById('status-actions');
  const { role } = getState();

  const transitions = {
    open: ['acknowledged', 'in_progress'],
    acknowledged: ['in_progress'],
    in_progress: ['resolved'],
    resolved: ['verified', 'in_progress'],
    verified: ['closed'],
    closed: [],
  };

  const available = (transitions[issueData.status] || []).filter((s) => canTransitionTo(role, s));

  if (available.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted">No status changes available.</p>';
    return;
  }

  container.innerHTML = available.map((status) => `
    <button class="btn btn--sm btn--secondary status-btn" data-status="${status}" style="margin-bottom:var(--space-2);width:100%;text-transform:capitalize;">
      Mark as ${status.replace(/_/g, ' ')}
    </button>
  `).join('');

  container.querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleStatusChange(btn.dataset.status));
  });
}

async function handleStatusChange(newStatus) {
  try {
    const updates = { status: newStatus };
    if (newStatus === 'resolved' || newStatus === 'verified' || newStatus === 'closed') {
      updates.resolvedAt = new Date();
    }

    await updateDocument('issues', issueId, updates);

    await logActivity({
      action: 'issue_status_changed',
      entityType: 'issue',
      entityId: issueId,
      entityTitle: issueData.title,
      propertyId: issueData.propertyId,
      propertyName: issueData.propertyName,
      details: { from: issueData.status, to: newStatus },
    });

    showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}.`, 'success');
    issueData.status = newStatus;

    const statusBadge = document.getElementById('issue-status-badge');
    statusBadge.className = `badge badge--${newStatus}`;
    statusBadge.textContent = newStatus.replace(/_/g, ' ');

    renderStatusActions();
    await loadActivity();
  } catch (err) {
    console.error('Error updating status:', err);
    showToast('Failed to update status.', 'error');
  }
}

// ─── Assignment ──────────────────────────────────────────

async function loadTeamMembers() {
  const { role } = getState();
  if (!hasPermission(role, 'issue_assign')) return;

  const assignSection = document.getElementById('assign-section');
  if (assignSection) assignSection.style.display = '';

  try {
    const users = await fetchCollection('users', [where('status', '==', 'active')]);
    const select = document.getElementById('assign-select');
    users.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `${u.name} (${u.role.replace(/_/g, ' ')})`;
      select.appendChild(opt);
    });
    if (issueData.assignedTo) select.value = issueData.assignedTo;
  } catch (err) {
    console.error('Error loading team members:', err);
  }
}

async function handleAssign() {
  const select = document.getElementById('assign-select');
  const userId = select.value;
  const userName = userId ? select.options[select.selectedIndex].textContent : null;

  try {
    await updateDocument('issues', issueId, {
      assignedTo: userId || null,
      assignedToName: userName,
      status: userId ? 'assigned' : issueData.status,
    });

    await logActivity({
      action: userId ? 'issue_assigned' : 'issue_reassigned',
      entityType: 'issue',
      entityId: issueId,
      entityTitle: issueData.title,
      propertyId: issueData.propertyId,
      propertyName: issueData.propertyName,
      details: { assignedTo: userName },
    });

    document.getElementById('issue-assignee').textContent = userName || 'Unassigned';
    showToast(userId ? 'Issue assigned.' : 'Assignment removed.', 'success');
  } catch (err) {
    console.error('Error assigning issue:', err);
    showToast('Failed to assign issue.', 'error');
  }
}

// ─── Comments ────────────────────────────────────────────

async function handleAddComment() {
  const textarea = document.getElementById('comment-text');
  const text = textarea.value.trim();
  if (!text) return;

  const btn = document.getElementById('add-comment-btn');
  setButtonLoading(btn, true);

  try {
    const { user } = getState();

    await createSubDoc('issues', issueId, 'updates', {
      type: 'comment',
      text,
      authorId: user.id,
      authorName: user.name,
    });

    await logActivity({
      action: 'issue_commented',
      entityType: 'issue',
      entityId: issueId,
      entityTitle: issueData.title,
      propertyId: issueData.propertyId,
      propertyName: issueData.propertyName,
    });

    textarea.value = '';
    showToast('Comment added.', 'success');
    await loadActivity();
  } catch (err) {
    console.error('Error adding comment:', err);
    showToast('Failed to add comment.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── Activity ────────────────────────────────────────────

async function loadActivity() {
  const container = document.getElementById('issue-activity');
  try {
    const updates = await fetchSubcollection('issues', issueId, 'updates', [
      orderBy('createdAt', 'desc'),
    ]);

    if (updates.length === 0) {
      container.innerHTML = '<p class="text-sm text-muted" style="padding:var(--space-4);">No activity yet.</p>';
      return;
    }

    container.innerHTML = updates.map((u) => `
      <div class="activity-item" style="padding:var(--space-3) var(--space-4);">
        <div class="activity-item__content">
          <div class="activity-item__text">
            <strong>${escapeHTML(u.authorName || 'System')}</strong>
            ${u.type === 'comment' ? '' : `<span class="badge badge--sm badge--${u.type || 'info'}">${escapeHTML(u.type || '')}</span>`}
          </div>
          ${u.text ? `<p class="text-sm" style="margin-top:var(--space-1);white-space:pre-wrap;">${escapeHTML(u.text)}</p>` : ''}
          <span class="activity-item__time">${timeAgo(u.createdAt)}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading activity:', err);
    container.innerHTML = '<p class="text-sm text-muted" style="padding:var(--space-4);">Could not load activity.</p>';
  }
}

// ─── Delete ──────────────────────────────────────────────

async function handleDelete() {
  if (!confirm('Are you sure you want to delete this issue? This cannot be undone.')) return;

  try {
    await deleteDocument('issues', issueId);
    await logActivity({
      action: 'issue_deleted',
      entityType: 'issue',
      entityId: issueId,
      entityTitle: issueData.title,
      propertyId: issueData.propertyId,
      propertyName: issueData.propertyName,
    });
    showToast('Issue deleted.', 'success');
    navigateTo('/properties/' + issueData.propertyId);
  } catch (err) {
    console.error('Error deleting issue:', err);
    showToast('Failed to delete issue.', 'error');
  }
}

// ─── Events ──────────────────────────────────────────────

function bindEvents() {
  document.getElementById('add-comment-btn')?.addEventListener('click', handleAddComment);
  document.getElementById('assign-btn')?.addEventListener('click', handleAssign);
  document.getElementById('delete-issue-btn')?.addEventListener('click', handleDelete);
}
