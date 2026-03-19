/**
 * SiteLedgers — Inspections List Page Script
 * Lists inspections with filter tabs, and a modal to schedule new inspections.
 */

import { getState } from '../state.js';
import {
  fetchCollection,
  fetchAccessibleProperties,
  createDoc,
  logActivity,
  where,
  orderBy,
  Timestamp,
} from '../api.js';
import { escapeHTML, showToast, setButtonLoading, applyPermissionVisibility } from '../ui.js';
import { formatDate } from '../utils/date.js';
import { navigateTo } from '../router.js';

let allInspections = [];
let currentFilter = 'all';

export async function init() {
  applyPermissionVisibility();
  await loadInspections();
  bindEvents();
}

// ─── Load Inspections ────────────────────────────────────

async function loadInspections() {
  const container = document.getElementById('inspections-list');
  const emptyState = document.getElementById('inspections-empty');

  try {
    const { role, assignedProperties } = getState();

    allInspections = await fetchCollection('inspections', [
      orderBy('scheduledDate', 'desc'),
    ]);

    // Scope to assigned properties for non-owners
    if (role !== 'owner' && assignedProperties.length > 0) {
      allInspections = allInspections.filter((i) => assignedProperties.includes(i.propertyId));
    }

    renderInspections();
  } catch (err) {
    console.error('Error loading inspections:', err);
    container.innerHTML = '<p class="text-sm text-muted">Could not load inspections.</p>';
  }
}

function renderInspections() {
  const container = document.getElementById('inspections-list');
  const emptyState = document.getElementById('inspections-empty');

  let filtered = allInspections;
  if (currentFilter !== 'all') {
    filtered = allInspections.filter((i) => i.status === currentFilter);
  }

  if (filtered.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = '';
    applyPermissionVisibility();
    return;
  }

  container.style.display = '';
  emptyState.style.display = 'none';

  container.innerHTML = filtered.map((insp) => `
    <a href="#/inspections/${insp.id}" class="issue-row" style="text-decoration:none;display:flex;">
      <span class="badge badge--${insp.status}">${escapeHTML(insp.status.replace(/_/g, ' '))}</span>
      <span class="issue-row__title">${escapeHTML(insp.title || insp.templateName || 'Inspection')}</span>
      <span class="issue-row__meta">${escapeHTML(insp.propertyName || '')} &middot; ${formatDate(insp.scheduledDate)}</span>
    </a>
  `).join('');
}

// ─── Filter Tabs ─────────────────────────────────────────

function handleFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll('#filter-tabs button').forEach((btn) => {
    btn.className = btn.dataset.filter === filter ? 'btn btn--sm btn--primary' : 'btn btn--sm btn--secondary';
  });

  renderInspections();
}

// ─── New Inspection Modal ────────────────────────────────

async function openModal() {
  document.getElementById('new-inspection-modal').style.display = '';

  // Load properties
  const propSelect = document.getElementById('insp-property');
  if (propSelect.options.length <= 1) {
    const properties = await fetchAccessibleProperties();
    properties.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      opt.dataset.name = p.name;
      propSelect.appendChild(opt);
    });
  }

  // Load inspectors
  const assigneeSelect = document.getElementById('insp-assignee');
  if (assigneeSelect.options.length <= 1) {
    try {
      const users = await fetchCollection('users', [where('status', '==', 'active')]);
      users.filter((u) => ['owner', 'property_manager', 'inspector'].includes(u.role)).forEach((u) => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.name} (${u.role.replace(/_/g, ' ')})`;
        assigneeSelect.appendChild(opt);
      });
    } catch (err) {
      console.error('Error loading inspectors:', err);
    }
  }
}

function closeModal() {
  document.getElementById('new-inspection-modal').style.display = 'none';
  document.getElementById('new-inspection-form').reset();
}

async function handleCreateInspection(e) {
  e.preventDefault();

  const propertyId = document.getElementById('insp-property').value;
  const title = document.getElementById('insp-title').value.trim();
  const dateVal = document.getElementById('insp-date').value;
  const assigneeId = document.getElementById('insp-assignee').value;
  const notes = document.getElementById('insp-notes').value.trim();

  if (!propertyId || !title || !dateVal) {
    showToast('Property, title, and date are required.', 'error');
    return;
  }

  const btn = document.getElementById('save-inspection-btn');
  setButtonLoading(btn, true);

  try {
    const propSelect = document.getElementById('insp-property');
    const propertyName = propSelect.options[propSelect.selectedIndex].dataset.name || '';

    const inspectionId = await createDoc('inspections', {
      propertyId,
      propertyName,
      title,
      scheduledDate: Timestamp.fromDate(new Date(dateVal)),
      assignedTo: assigneeId || null,
      notes,
      status: 'scheduled',
      checklist: [],
      completedItems: 0,
      totalItems: 0,
    });

    await logActivity({
      action: 'inspection_created',
      entityType: 'inspection',
      entityId: inspectionId,
      entityTitle: title,
      propertyId,
      propertyName,
    });

    showToast('Inspection scheduled.', 'success');
    closeModal();
    await loadInspections();
  } catch (err) {
    console.error('Error creating inspection:', err);
    showToast('Failed to schedule inspection.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── Events ──────────────────────────────────────────────

function bindEvents() {
  // Filter tabs
  document.querySelectorAll('#filter-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
  });

  // Modal open
  document.getElementById('new-inspection-btn')?.addEventListener('click', openModal);
  document.getElementById('new-inspection-empty-btn')?.addEventListener('click', openModal);

  // Modal close
  document.getElementById('close-inspection-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-inspection-btn')?.addEventListener('click', closeModal);
  document.getElementById('new-inspection-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'new-inspection-modal') closeModal();
  });

  // Form submit
  document.getElementById('new-inspection-form')?.addEventListener('submit', handleCreateInspection);
}
