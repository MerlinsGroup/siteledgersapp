/**
 * SiteLedgers — Properties List Page Script
 * Lists properties the user has access to with search, and Add Property modal.
 */

import { getState } from '../state.js';
import {
  fetchAccessibleProperties,
  createDoc,
  logActivity,
} from '../api.js';
import {
  showToast,
  setButtonLoading,
  escapeHTML,
  applyPermissionVisibility,
} from '../ui.js';
import { navigateTo } from '../router.js';

let allProperties = [];

export async function init() {
  applyPermissionVisibility();
  bindEvents();
  await loadProperties();
}

// ─── Load Properties ────────────────────────────────────

async function loadProperties() {
  const listContainer = document.getElementById('properties-list');
  const emptyState = document.getElementById('properties-empty');

  try {
    allProperties = await fetchAccessibleProperties();
    renderProperties(allProperties);
  } catch (err) {
    console.error('Error loading properties:', err);
    listContainer.innerHTML = '<p class="text-sm text-muted">Could not load properties.</p>';
  }
}

function renderProperties(properties) {
  const listContainer = document.getElementById('properties-list');
  const emptyState = document.getElementById('properties-empty');

  if (properties.length === 0) {
    listContainer.style.display = 'none';
    emptyState.style.display = '';
    applyPermissionVisibility();
    return;
  }

  listContainer.style.display = '';
  emptyState.style.display = 'none';

  listContainer.innerHTML = properties.map((prop) => `
    <div class="card card--clickable" data-property-id="${prop.id}" role="button" tabindex="0">
      <div class="property-card">
        <div class="property-card__info">
          <div class="property-card__name">${escapeHTML(prop.name)}</div>
          <div class="property-card__address">${escapeHTML(prop.address || 'No address')}</div>
          <div class="property-card__stats">
            <span class="badge badge--${prop.type || 'other'}">${escapeHTML(prop.type || 'Other')}</span>
            <span>${prop.openIssueCount || 0} open issues</span>
            ${prop.overdueIssueCount ? `<span class="text-danger">${prop.overdueIssueCount} overdue</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Click to navigate to property detail
  listContainer.querySelectorAll('[data-property-id]').forEach((card) => {
    card.addEventListener('click', () => {
      navigateTo('/properties/' + card.dataset.propertyId);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') navigateTo('/properties/' + card.dataset.propertyId);
    });
  });
}

// ─── Search ─────────────────────────────────────────────

function handleSearch() {
  const query = document.getElementById('property-search')?.value.toLowerCase().trim() || '';
  if (!query) {
    renderProperties(allProperties);
    return;
  }
  const filtered = allProperties.filter((p) =>
    p.name.toLowerCase().includes(query) ||
    (p.address || '').toLowerCase().includes(query)
  );
  renderProperties(filtered);
}

// ─── Add Property Modal ─────────────────────────────────

function openModal() {
  document.getElementById('add-property-modal').style.display = '';
  document.getElementById('prop-name').focus();
}

function closeModal() {
  document.getElementById('add-property-modal').style.display = 'none';
  document.getElementById('add-property-form').reset();
}

async function handleAddProperty(e) {
  e.preventDefault();

  const name = document.getElementById('prop-name').value.trim();
  const address = document.getElementById('prop-address').value.trim();
  const type = document.getElementById('prop-type').value;
  const description = document.getElementById('prop-description').value.trim();

  // Basic validation
  if (!name) {
    showToast('Property name is required.', 'error');
    return;
  }
  if (!address) {
    showToast('Address is required.', 'error');
    return;
  }

  const btn = document.getElementById('save-property-btn');
  setButtonLoading(btn, true);

  try {
    const { user } = getState();

    const propertyId = await createDoc('properties', {
      name,
      address,
      type,
      description,
      status: 'active',
      imageUrl: null,
      openIssueCount: 0,
      overdueIssueCount: 0,
      lastInspectionDate: null,
      createdBy: user.id,
    });

    // Log activity
    await logActivity({
      action: 'property_created',
      entityType: 'property',
      entityId: propertyId,
      entityTitle: name,
      propertyId: propertyId,
      propertyName: name,
      details: { type, address },
    });

    showToast('Property added.', 'success');
    closeModal();
    await loadProperties();
  } catch (err) {
    console.error('Error adding property:', err);
    showToast('Failed to add property. Please try again.', 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ─── Event Binding ──────────────────────────────────────

function bindEvents() {
  // Search
  document.getElementById('property-search')?.addEventListener('input', handleSearch);

  // Add property buttons (header + empty state)
  document.getElementById('add-property-btn')?.addEventListener('click', openModal);
  document.getElementById('add-property-empty-btn')?.addEventListener('click', openModal);

  // Modal close
  document.getElementById('close-property-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-property-btn')?.addEventListener('click', closeModal);

  // Close modal on backdrop click
  document.getElementById('add-property-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'add-property-modal') closeModal();
  });

  // Form submit
  document.getElementById('add-property-form')?.addEventListener('submit', handleAddProperty);
}
