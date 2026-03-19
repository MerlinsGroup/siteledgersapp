/**
 * SiteLedgers — New Issue Page Script
 * Form to log a new issue against a property.
 */

import { getState } from '../state.js';
import {
  fetchAccessibleProperties,
  fetchCollection,
  createDoc,
  logActivity,
  where,
  Timestamp,
} from '../api.js';
import { showToast, setButtonLoading, escapeHTML } from '../ui.js';
import { navigateTo } from '../router.js';

export async function init() {
  await Promise.all([loadProperties(), loadTeamMembers()]);
  bindEvents();
  prefillFromUrl();
}

// ─── Load Properties ─────────────────────────────────────

async function loadProperties() {
  try {
    const properties = await fetchAccessibleProperties();
    const select = document.getElementById('issue-property');
    properties.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      opt.dataset.name = p.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading properties:', err);
  }
}

// ─── Load Team Members ───────────────────────────────────

async function loadTeamMembers() {
  try {
    const users = await fetchCollection('users', [
      where('status', '==', 'active'),
    ]);
    const select = document.getElementById('issue-assignee');
    users.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `${u.name} (${u.role.replace(/_/g, ' ')})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading team members:', err);
  }
}

// ─── Prefill from URL params ─────────────────────────────

function prefillFromUrl() {
  const hash = window.location.hash;
  const match = hash.match(/propertyId=([^&]+)/);
  if (match) {
    const select = document.getElementById('issue-property');
    if (select) select.value = match[1];
  }
}

// ─── Form Submit ─────────────────────────────────────────

async function handleSubmit(e) {
  e.preventDefault();

  const propertyId = document.getElementById('issue-property').value;
  const title = document.getElementById('issue-title').value.trim();
  const description = document.getElementById('issue-description').value.trim();
  const priority = document.getElementById('issue-priority').value;
  const category = document.getElementById('issue-category').value;
  const dueDateVal = document.getElementById('issue-due-date').value;
  const assigneeId = document.getElementById('issue-assignee').value;
  const location = document.getElementById('issue-location').value.trim();

  if (!propertyId || !title) {
    showToast('Property and title are required.', 'error');
    return;
  }

  const btn = document.getElementById('submit-issue-btn');
  setButtonLoading(btn, true);

  try {
    const { user } = getState();
    const propertySelect = document.getElementById('issue-property');
    const propertyName = propertySelect.options[propertySelect.selectedIndex].dataset.name || '';

    const issueData = {
      propertyId,
      propertyName,
      title,
      description,
      priority,
      category,
      location,
      status: assigneeId ? 'assigned' : 'open',
      assignedTo: assigneeId || null,
      assignedToName: assigneeId ? document.getElementById('issue-assignee').options[document.getElementById('issue-assignee').selectedIndex].textContent : null,
      reportedBy: user.id,
      reportedByName: user.name,
      dueDate: dueDateVal ? Timestamp.fromDate(new Date(dueDateVal)) : null,
      resolvedAt: null,
    };

    const issueId = await createDoc('issues', issueData);

    await logActivity({
      action: 'issue_created',
      entityType: 'issue',
      entityId: issueId,
      entityTitle: title,
      propertyId,
      propertyName,
      details: { priority, category },
    });

    showToast('Issue logged successfully.', 'success');
    navigateTo('/issues/' + issueId);
  } catch (err) {
    console.error('Error creating issue:', err);
    showToast('Failed to log issue. Please try again.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── Events ──────────────────────────────────────────────

function bindEvents() {
  document.getElementById('new-issue-form')?.addEventListener('submit', handleSubmit);
}
