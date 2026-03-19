/**
 * SiteLedgers — Dashboard Page Script
 * Loads stats, recent issues, properties overview, and recent activity.
 */

import { getState } from '../state.js';
import {
  fetchAccessibleProperties,
  fetchCollection,
  where,
  orderBy,
  limit,
} from '../api.js';
import { escapeHTML, applyPermissionVisibility } from '../ui.js';
import { timeAgo, isPast } from '../utils/date.js';

export async function init() {
  applyPermissionVisibility();

  // Load all sections in parallel
  await Promise.all([
    loadStats(),
    loadRecentIssues(),
    loadProperties(),
    loadRecentActivity(),
  ]);
}

// ─── Stats ──────────────────────────────────────────────

async function loadStats() {
  try {
    const { role, assignedProperties } = getState();

    // Fetch properties
    const properties = await fetchAccessibleProperties();
    document.getElementById('stat-properties').textContent = properties.length;

    // Fetch all issues in a single query (avoids composite index requirements)
    const allIssues = await fetchCollection('issues');
    const scoped = scopeIssues(allIssues, role, assignedProperties);

    // Open issues (anything not verified or closed)
    const openStatuses = ['open', 'acknowledged', 'in_progress', 'resolved'];
    const openIssues = scoped.filter((i) => openStatuses.includes(i.status));
    document.getElementById('stat-open-issues').textContent = openIssues.length;

    // Overdue
    const overdue = openIssues.filter((i) => i.dueDate && isPast(i.dueDate));
    document.getElementById('stat-overdue').textContent = overdue.length;

    // Resolved this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const resolvedThisMonth = scoped.filter((i) => {
      if (!['verified', 'closed'].includes(i.status)) return false;
      if (!i.resolvedAt) return false;
      const d = i.resolvedAt.toDate ? i.resolvedAt.toDate() : new Date(i.resolvedAt);
      return d >= startOfMonth;
    });
    document.getElementById('stat-resolved').textContent = resolvedThisMonth.length;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// ─── Recent Issues ──────────────────────────────────────

async function loadRecentIssues() {
  const container = document.getElementById('recent-issues');
  try {
    const { role, assignedProperties, user } = getState();

    let issues;
    if (role === 'contractor') {
      issues = await fetchCollection('issues', [
        where('assignedTo', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(10),
      ]);
    } else {
      issues = await fetchCollection('issues', [
        orderBy('createdAt', 'desc'),
        limit(20),
      ]);
      issues = scopeIssues(issues, role, assignedProperties);
    }

    if (issues.length === 0) {
      container.innerHTML = '<div class="empty-state"><p class="empty-state__text">No issues yet.</p></div>';
      return;
    }

    container.innerHTML = issues.slice(0, 10).map((issue) => `
      <a href="#/issues/${issue.id}" class="issue-row" style="text-decoration:none;display:flex;">
        <span class="badge badge--${issue.status}">${escapeHTML(issue.status.replace('_', ' '))}</span>
        <span class="issue-row__title">${escapeHTML(issue.title)}</span>
        <span class="badge badge--${issue.priority} mr-2">${escapeHTML(issue.priority)}</span>
        <span class="issue-row__meta">${escapeHTML(issue.propertyName || '')} &middot; ${timeAgo(issue.createdAt)}</span>
      </a>
    `).join('');
  } catch (err) {
    console.error('Error loading issues:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load issues.</p>';
  }
}

// ─── Properties ─────────────────────────────────────────

async function loadProperties() {
  const container = document.getElementById('dashboard-properties');
  try {
    const properties = await fetchAccessibleProperties();

    if (properties.length === 0) {
      container.innerHTML = '<div class="empty-state"><p class="empty-state__text">No properties yet.</p></div>';
      return;
    }

    container.innerHTML = properties.slice(0, 6).map((prop) => `
      <a href="#/properties/${prop.id}" class="property-card card card--clickable" style="text-decoration:none;display:flex;gap:var(--space-4);padding:var(--space-4);margin-bottom:var(--space-3);">
        <div class="property-card__info">
          <div class="property-card__name">${escapeHTML(prop.name)}</div>
          <div class="property-card__address">${escapeHTML(prop.address || '')}</div>
          <div class="property-card__stats">
            <span>${prop.openIssueCount || 0} open issues</span>
            <span>&middot;</span>
            <span class="badge badge--${prop.type || 'other'}">${escapeHTML(prop.type || 'other')}</span>
          </div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    console.error('Error loading properties:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load properties.</p>';
  }
}

// ─── Recent Activity ────────────────────────────────────

async function loadRecentActivity() {
  const container = document.getElementById('recent-activity');
  try {
    const logs = await fetchCollection('activityLog', [
      orderBy('createdAt', 'desc'),
      limit(15),
    ]);

    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state"><p class="empty-state__text">No activity yet.</p></div>';
      return;
    }

    container.innerHTML = logs.map((log) => `
      <div class="issue-row">
        <span class="issue-row__title">
          <strong>${escapeHTML(log.performedByName || 'Someone')}</strong>
          ${escapeHTML(formatAction(log.action))}
          <em>${escapeHTML(log.entityTitle || '')}</em>
        </span>
        <span class="issue-row__meta">${timeAgo(log.createdAt)}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading activity:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load activity.</p>';
  }
}

// ─── Helpers ────────────────────────────────────────────

function scopeIssues(issues, role, assignedProperties) {
  if (role === 'owner' || assignedProperties.length === 0) return issues;
  return issues.filter((i) => assignedProperties.includes(i.propertyId));
}

function formatAction(action) {
  const labels = {
    issue_created: 'created issue',
    issue_status_changed: 'updated status on',
    issue_assigned: 'assigned',
    issue_reassigned: 'reassigned',
    issue_commented: 'commented on',
    issue_closed: 'closed',
    issue_deleted: 'deleted',
    evidence_uploaded: 'uploaded evidence for',
    inspection_created: 'created inspection',
    inspection_started: 'started inspection',
    inspection_completed: 'completed inspection',
    inspection_signed_off: 'signed off inspection',
    property_created: 'added property',
    property_updated: 'updated property',
    property_archived: 'archived property',
    user_invited: 'invited user',
    user_role_changed: 'changed role for',
    user_deactivated: 'deactivated',
  };
  return labels[action] || action.replace(/_/g, ' ');
}
