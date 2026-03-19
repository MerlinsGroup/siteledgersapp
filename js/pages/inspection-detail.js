/**
 * SiteLedgers — Inspection Detail Page Script
 * Shows inspection info, checklist with progress, and action buttons.
 */

import { getState } from '../state.js';
import {
  fetchDoc,
  updateDocument,
  logActivity,
} from '../api.js';
import { escapeHTML, showToast, applyPermissionVisibility } from '../ui.js';
import { formatDate } from '../utils/date.js';
import { navigateTo } from '../router.js';
import { hasPermission } from '../roles.js';

let inspectionId = null;
let inspectionData = null;

export async function init(params) {
  inspectionId = params.id;
  if (!inspectionId) {
    navigateTo('/inspections');
    return;
  }

  await loadInspection();
  applyPermissionVisibility();
  bindEvents();
}

// ─── Load Inspection ─────────────────────────────────────

async function loadInspection() {
  try {
    inspectionData = await fetchDoc('inspections', inspectionId);
    if (!inspectionData) {
      document.getElementById('inspection-title').textContent = 'Inspection Not Found';
      return;
    }

    document.getElementById('inspection-title').textContent = inspectionData.title || 'Inspection';
    document.getElementById('inspection-property').textContent = inspectionData.propertyName || '';
    document.getElementById('insp-date').textContent = formatDate(inspectionData.scheduledDate) || '—';
    document.getElementById('insp-inspector').textContent = inspectionData.assignedToName || 'Unassigned';

    // Status badge
    const badge = document.getElementById('inspection-status-badge');
    badge.className = `badge badge--${inspectionData.status}`;
    badge.textContent = inspectionData.status.replace(/_/g, ' ');

    // Notes
    if (inspectionData.notes) {
      document.getElementById('insp-notes-section').style.display = '';
      document.getElementById('insp-notes').textContent = inspectionData.notes;
    }

    // Checklist
    renderChecklist();

    // Action buttons
    renderActions();
  } catch (err) {
    console.error('Error loading inspection:', err);
    document.getElementById('inspection-title').textContent = 'Error loading inspection';
  }
}

// ─── Checklist ───────────────────────────────────────────

function renderChecklist() {
  const container = document.getElementById('inspection-checklist');
  const checklist = inspectionData.checklist || [];

  if (checklist.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted" style="padding:var(--space-4);">No checklist items.</p>';
    document.getElementById('insp-progress').textContent = '—';
    return;
  }

  const completed = checklist.filter((item) => item.checked).length;
  const total = checklist.length;
  const pct = Math.round((completed / total) * 100);

  document.getElementById('insp-progress').textContent = `${completed}/${total}`;
  document.getElementById('progress-fill').style.width = pct + '%';

  const { role } = getState();
  const canEdit = hasPermission(role, 'inspection_conduct') && inspectionData.status !== 'completed';

  container.innerHTML = checklist.map((item, idx) => `
    <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--color-gray-100);">
      <input type="checkbox" class="checklist-item" data-index="${idx}" ${item.checked ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
      <span class="text-sm" style="${item.checked ? 'text-decoration:line-through;color:var(--color-gray-400);' : ''}">${escapeHTML(item.label)}</span>
    </div>
  `).join('');

  if (canEdit) {
    container.querySelectorAll('.checklist-item').forEach((cb) => {
      cb.addEventListener('change', () => handleChecklistToggle(parseInt(cb.dataset.index), cb.checked));
    });
  }
}

async function handleChecklistToggle(index, checked) {
  try {
    const checklist = [...inspectionData.checklist];
    checklist[index] = { ...checklist[index], checked };

    const completed = checklist.filter((item) => item.checked).length;

    await updateDocument('inspections', inspectionId, {
      checklist,
      completedItems: completed,
    });

    inspectionData.checklist = checklist;
    inspectionData.completedItems = completed;
    renderChecklist();
  } catch (err) {
    console.error('Error updating checklist:', err);
    showToast('Failed to update checklist.', 'error');
  }
}

// ─── Actions ─────────────────────────────────────────────

function renderActions() {
  const container = document.getElementById('inspection-actions');
  const { role } = getState();

  if (!hasPermission(role, 'inspection_conduct')) {
    container.innerHTML = '';
    return;
  }

  const buttons = [];

  if (inspectionData.status === 'scheduled') {
    buttons.push(`<button class="btn btn--primary" id="start-inspection-btn">Start Inspection</button>`);
  } else if (inspectionData.status === 'in_progress') {
    buttons.push(`<button class="btn btn--primary" id="complete-inspection-btn">Complete Inspection</button>`);
  }

  container.innerHTML = buttons.join('');

  document.getElementById('start-inspection-btn')?.addEventListener('click', () => handleStatusChange('in_progress', 'inspection_started'));
  document.getElementById('complete-inspection-btn')?.addEventListener('click', () => handleStatusChange('completed', 'inspection_completed'));
}

async function handleStatusChange(newStatus, action) {
  try {
    await updateDocument('inspections', inspectionId, { status: newStatus });

    await logActivity({
      action,
      entityType: 'inspection',
      entityId: inspectionId,
      entityTitle: inspectionData.title,
      propertyId: inspectionData.propertyId,
      propertyName: inspectionData.propertyName,
    });

    inspectionData.status = newStatus;
    const badge = document.getElementById('inspection-status-badge');
    badge.className = `badge badge--${newStatus}`;
    badge.textContent = newStatus.replace(/_/g, ' ');

    renderActions();
    renderChecklist();
    showToast(`Inspection ${newStatus.replace(/_/g, ' ')}.`, 'success');
  } catch (err) {
    console.error('Error updating inspection:', err);
    showToast('Failed to update inspection.', 'error');
  }
}

// ─── Events ──────────────────────────────────────────────

function bindEvents() {
  // Events bound dynamically in renderActions and renderChecklist
}
