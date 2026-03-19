/**
 * SiteLedgers — Reports & Audit Trail Page Script
 * Shows issue stats, breakdowns by property/status, and audit trail.
 */

import { getState } from '../state.js';
import {
  fetchCollection,
  fetchAccessibleProperties,
  where,
  orderBy,
  limit,
} from '../api.js';
import { escapeHTML } from '../ui.js';
import { timeAgo } from '../utils/date.js';

export async function init() {
  await Promise.all([loadStats(), loadByProperty(), loadByStatus(), loadAuditTrail()]);
}

// ─── Stats ───────────────────────────────────────────────

async function loadStats() {
  try {
    const { role, assignedProperties } = getState();
    const allIssues = await fetchCollection('issues');
    const scoped = scopeIssues(allIssues, role, assignedProperties);

    const openStatuses = ['open', 'acknowledged', 'in_progress', 'assigned', 'resolved'];
    const resolvedStatuses = ['verified', 'closed'];

    const openIssues = scoped.filter((i) => openStatuses.includes(i.status));
    const resolved = scoped.filter((i) => resolvedStatuses.includes(i.status));

    document.getElementById('report-total-issues').textContent = scoped.length;
    document.getElementById('report-open-issues').textContent = openIssues.length;
    document.getElementById('report-resolved-issues').textContent = resolved.length;

    // Avg resolution time
    const withResolution = resolved.filter((i) => i.createdAt && i.resolvedAt);
    if (withResolution.length > 0) {
      const totalDays = withResolution.reduce((sum, i) => {
        const created = i.createdAt.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
        const resolvedAt = i.resolvedAt.toDate ? i.resolvedAt.toDate() : new Date(i.resolvedAt);
        return sum + (resolvedAt - created) / (1000 * 60 * 60 * 24);
      }, 0);
      const avg = Math.round(totalDays / withResolution.length);
      document.getElementById('report-avg-resolution').textContent = `${avg} days`;
    }
  } catch (err) {
    console.error('Error loading report stats:', err);
  }
}

// ─── Issues by Property ─────────────────────────────────

async function loadByProperty() {
  const container = document.getElementById('issues-by-property');
  try {
    const properties = await fetchAccessibleProperties();
    const allIssues = await fetchCollection('issues');

    if (properties.length === 0) {
      container.innerHTML = '<p class="text-sm text-muted" style="padding:var(--space-4);">No properties.</p>';
      return;
    }

    const rows = properties.map((prop) => {
      const propIssues = allIssues.filter((i) => i.propertyId === prop.id);
      const open = propIssues.filter((i) => !['verified', 'closed'].includes(i.status)).length;
      const total = propIssues.length;
      return { name: prop.name, id: prop.id, open, total };
    }).sort((a, b) => b.open - a.open);

    container.innerHTML = `
      <table class="table" style="width:100%;">
        <thead><tr><th>Property</th><th>Open</th><th>Total</th></tr></thead>
        <tbody>
          ${rows.map((r) => `
            <tr>
              <td><a href="#/properties/${r.id}" style="color:var(--color-charcoal);font-weight:var(--font-weight-medium);">${escapeHTML(r.name)}</a></td>
              <td><span class="${r.open > 0 ? 'text-warning' : ''}">${r.open}</span></td>
              <td>${r.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Error loading issues by property:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load data.</p>';
  }
}

// ─── Issues by Status ───────────────────────────────────

async function loadByStatus() {
  const container = document.getElementById('issues-by-status');
  try {
    const { role, assignedProperties } = getState();
    const allIssues = await fetchCollection('issues');
    const scoped = scopeIssues(allIssues, role, assignedProperties);

    const statusCounts = {};
    scoped.forEach((i) => {
      statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
    });

    const statuses = ['open', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'verified', 'closed'];
    const total = scoped.length || 1;

    container.innerHTML = `
      <div style="padding:var(--space-4);">
        ${statuses.map((s) => {
          const count = statusCounts[s] || 0;
          const pct = Math.round((count / total) * 100);
          return `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
              <span class="badge badge--${s}" style="min-width:100px;text-align:center;">${s.replace(/_/g, ' ')}</span>
              <div style="flex:1;background:var(--color-gray-100);border-radius:var(--radius-full);height:8px;overflow:hidden;">
                <div style="background:var(--color-primary);height:100%;width:${pct}%;border-radius:var(--radius-full);"></div>
              </div>
              <span class="text-sm" style="min-width:40px;text-align:right;">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Error loading issues by status:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load data.</p>';
  }
}

// ─── Audit Trail ─────────────────────────────────────────

async function loadAuditTrail() {
  const container = document.getElementById('audit-trail');
  try {
    const logs = await fetchCollection('activityLog', [
      orderBy('createdAt', 'desc'),
      limit(50),
    ]);

    if (logs.length === 0) {
      container.innerHTML = '<p class="text-sm text-muted" style="padding:var(--space-4);">No activity recorded.</p>';
      return;
    }

    container.innerHTML = logs.map((log) => `
      <div class="issue-row">
        <span class="issue-row__title">
          <strong>${escapeHTML(log.performedByName || 'System')}</strong>
          ${escapeHTML(formatAction(log.action))}
          <em>${escapeHTML(log.entityTitle || '')}</em>
        </span>
        <span class="issue-row__meta">${timeAgo(log.createdAt)}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading audit trail:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load audit trail.</p>';
  }
}

// ─── Helpers ─────────────────────────────────────────────

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
