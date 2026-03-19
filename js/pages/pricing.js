/**
 * SiteLedgers — Pricing Page Script
 * Renders subscription tiers with billing toggle.
 */

import STRIPE_PLANS from '../stripe-config.js';

let billing = 'monthly'; // 'monthly' or 'annual'

export function init() {
  renderCards();
  bindToggle();
}

function bindToggle() {
  const monthlyBtn = document.getElementById('billing-monthly');
  const annualBtn = document.getElementById('billing-annual');

  monthlyBtn?.addEventListener('click', () => {
    billing = 'monthly';
    monthlyBtn.classList.add('billing-toggle__btn--active');
    annualBtn.classList.remove('billing-toggle__btn--active');
    renderCards();
  });

  annualBtn?.addEventListener('click', () => {
    billing = 'annual';
    annualBtn.classList.add('billing-toggle__btn--active');
    monthlyBtn.classList.remove('billing-toggle__btn--active');
    renderCards();
  });
}

function renderCards() {
  const grid = document.getElementById('pricing-grid');
  if (!grid) return;

  grid.innerHTML = STRIPE_PLANS.map((plan) => {
    const price = billing === 'monthly' ? plan.monthlyPerUser : plan.annualPerUser;
    const link = billing === 'monthly' ? plan.monthlyLink : plan.annualLink;
    const billingLabel = billing === 'monthly' ? '/user/mo' : '/user/mo';
    const billingNote = billing === 'annual' ? 'billed annually' : 'billed monthly';
    const minTotal = billing === 'monthly' ? (price * 3) : (plan.annualPerUser * 12 * 3);
    const minLabel = billing === 'monthly' ? '/mo for 3 users' : '/yr for 3 users';

    const isPopular = plan.badge;
    const trialText = plan.trialDays ? `<div class="pricing-card__trial">${plan.trialDays}-day free trial</div>` : '';
    const badgeHTML = isPopular ? `<div class="pricing-card__badge">${plan.badge}</div>` : '';

    return `
      <div class="pricing-card${isPopular ? ' pricing-card--popular' : ''}">
        ${badgeHTML}
        <h3 class="pricing-card__name">${plan.name}</h3>
        <div class="pricing-card__price">
          <span class="pricing-card__amount">£${price % 1 === 0 ? price : price.toFixed(2)}</span>
          <span class="pricing-card__period">${billingLabel}</span>
        </div>
        <p class="pricing-card__billing">${billingNote} · from £${minTotal % 1 === 0 ? minTotal : minTotal.toFixed(2)}${minLabel}</p>
        ${trialText}
        <a href="${link}" target="_blank" rel="noopener" class="btn ${isPopular ? 'btn--primary' : 'btn--secondary'} btn--full btn--lg pricing-card__cta">
          ${plan.trialDays ? 'Start Free Trial' : 'Get Started'}
        </a>
        <ul class="pricing-card__features">
          ${plan.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }).join('');
}
