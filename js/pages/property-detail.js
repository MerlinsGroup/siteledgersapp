/**
 * SiteLedgers — Property Detail Page Script
 * Shows property info, issues list, and inspections list for a single property.
 */

import { getState } from '../state.js';
import {
  fetchDoc,
  fetchCollection,
  where,
  orderBy,
  limit,
} from '../api.js';
import { escapeHTML, applyPermissionVisibility } from '../ui.js';
import { timeAgo, formatDate } from '../utils/date.js';
import { navigateTo } from '../router.js';

let propertyId = null;

export async function init(params) {
  propertyId = params.id;
  if (!propertyId) {
    navigateTo('/properties');
    return;
  }

  applyPermissionVisibility();
  bindEvents();

  await loadProperty();
  await Promise.all([loadIssues(), loadInspections()]);
}

// ─── Load Property ───────────────────────────────────────

async function loadProperty() {
  try {
    const prop = await fetchDoc('properties', propertyId);
    if (!prop) {
      document.getElementById('property-name').textContent = 'Property Not Found';
      return;
    }

    document.getElementById('property-name').textContent = prop.name;
    document.getElementById('property-address').textContent = prop.address || '';
    document.getElementById('prop-type').textContent = prop.type || '—';
    document.getElementById('prop-units').textContent = prop.units ?? '—';
    document.getElementById('prop-open-issues').textContent = prop.openIssueCount || 0;

    if (prop.description) {
      document.getElementById('prop-desc-section').style.display = '';
      document.getElementById('prop-desc').textContent = prop.description;
    }
  } catch (err) {
    console.error('Error loading property:', err);
    document.getElementById('property-name').textContent = 'Error loading property';
  }
}

// ─── Issues ──────────────────────────────────────────────

async function loadIssues() {
  const container = document.getElementById('property-issues');
  try {
    const issues = await fetchCollection('issues', [
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc'),
      limit(50),
    ]);

    if (issues.length === 0) {
      container.innerHTML = '<div class="empty-state"><p class="empty-state__text">No issues logged for this property.</p></div>';
      return;
    }

    container.innerHTML = issues.map((issue) => `
      <a href="#/issues/${issue.id}" class="issue-row" style="text-decoration:none;display:flex;">
        <span class="badge badge--${issue.status}">${escapeHTML(issue.status.replace(/_/g, ' '))}</span>
        <span class="issue-row__title">${escapeHTML(issue.title)}</span>
        <span class="badge badge--${issue.priority}">${escapeHTML(issue.priority)}</span>
        <span class="issue-row__meta">${timeAgo(issue.createdAt)}</span>
      </a>
    `).join('');
  } catch (err) {
    console.error('Error loading issues:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load issues.</p>';
  }
}

// ─── Inspections ─────────────────────────────────────────

async function loadInspections() {
  const container = document.getElementById('property-inspections');
  try {
    const inspections = await fetchCollection('inspections', [
      where('propertyId', '==', propertyId),
      orderBy('scheduledDate', 'desc'),
      limit(20),
    ]);

    if (inspections.length === 0) {
      container.innerHTML = '<div class="empty-state"><p class="empty-state__text">No inspections scheduled.</p></div>';
      return;
    }

    container.innerHTML = inspections.map((insp) => `
      <a href="#/inspections/${insp.id}" class="issue-row" style="text-decoration:none;display:flex;">
        <span class="badge badge--${insp.status}">${escapeHTML(insp.status)}</span>
        <span class="issue-row__title">${escapeHTML(insp.title || insp.templateName || 'Inspection')}</span>
        <span class="issue-row__meta">${formatDate(insp.scheduledDate)}</span>
      </a>
    `).join('');
  } catch (err) {
    console.error('Error loading inspections:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load inspections.</p>';
  }
}

// ─── Events ──────────────────────────────────────────────

function bindEvents() {
  const logIssueBtn = document.getElementById('log-issue-btn');
  if (logIssueBtn) {
    logIssueBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/issues/new?propertyId=' + propertyId);
    });
  }
}
