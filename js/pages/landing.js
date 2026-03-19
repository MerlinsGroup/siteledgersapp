/**
 * SiteLedgers — Landing Page Script
 * Scroll animations, nav behaviour, pricing toggle, and stat counters.
 */

import STRIPE_PLANS from '../stripe-config.js';

let billing = 'monthly';

export function init() {
  setupNav();
  setupHamburger();
  setupScrollAnimations();
  setupStatCounters();
  renderPricing();
  setupBillingToggle();
  setupSmoothScroll();
}

// ─── Nav Scroll Effect ──────────────────────────────────

function setupNav() {
  const nav = document.getElementById('landing-nav');
  if (!nav) return;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ─── Mobile Hamburger ────────────────────────────────────

function setupHamburger() {
  const hamburger = document.getElementById('l-hamburger');
  const navLinks = document.getElementById('l-nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
}

// ─── Scroll Animations ──────────────────────────────────

function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const siblings = entry.target.parentElement.querySelectorAll(
            '.l-problem-card, .l-step, .l-stat'
          );
          const index = Array.from(siblings).indexOf(entry.target);
          entry.target.style.transitionDelay = `${index * 0.12}s`;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.l-problem-card, .l-feature-row, .l-step, .l-stat').forEach((el) => {
    observer.observe(el);
  });
}

// ─── Stat Counter Animation ─────────────────────────────

function setupStatCounters() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const numEl = entry.target.querySelector('.l-stat-number');
          if (!numEl) return;

          const target = parseFloat(numEl.dataset.target || '0');
          const suffix = numEl.dataset.suffix || '';
          const duration = 1500;
          const start = performance.now();

          function animate(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            numEl.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          }

          requestAnimationFrame(animate);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.l-stat').forEach((el) => observer.observe(el));
}

// ─── Pricing ────────────────────────────────────────────

function renderPricing() {
  const grid = document.getElementById('l-pricing-grid');
  if (!grid) return;

  grid.innerHTML = STRIPE_PLANS.map((plan) => {
    const price = billing === 'monthly' ? plan.monthlyPerUser : plan.annualPerUser;
    const link = billing === 'monthly' ? plan.monthlyLink : plan.annualLink;
    const billingNote = billing === 'annual' ? 'billed annually' : 'billed monthly';
    const minTotal = billing === 'monthly' ? price * 3 : plan.annualPerUser * 12 * 3;
    const minLabel = billing === 'monthly' ? '/mo for 3 users' : '/yr for 3 users';
    const isPopular = !!plan.badge;
    const trialHTML = plan.trialDays
      ? `<div class="l-price-trial">${plan.trialDays}-day free trial</div>`
      : '';
    const badgeHTML = isPopular
      ? `<div class="l-price-badge">${plan.badge}</div>`
      : '';

    return `
      <div class="l-price-card${isPopular ? ' popular' : ''}">
        ${badgeHTML}
        <h3>${plan.name}</h3>
        <div class="l-price-amount">
          <span class="num">&pound;${price % 1 === 0 ? price : price.toFixed(2)}</span>
          <span class="period">/user/mo</span>
        </div>
        <div class="l-price-billing-note">${billingNote} · from &pound;${minTotal % 1 === 0 ? minTotal : minTotal.toFixed(2)}${minLabel}</div>
        ${trialHTML}
        <a href="${link}" target="_blank" rel="noopener" class="l-price-cta ${isPopular ? 'primary' : 'secondary'}">
          ${plan.trialDays ? 'Start Free Trial' : 'Get Started'}
        </a>
        <ul class="l-price-features">
          ${plan.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }).join('');
}

function setupBillingToggle() {
  document.querySelectorAll('.l-billing-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      billing = btn.dataset.billing;
      document.querySelectorAll('.l-billing-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderPricing();
    });
  });
}

// ─── Smooth Scroll for Anchor Links ─────────────────────

function setupSmoothScroll() {
  document.querySelectorAll('.landing a[href^="#l-"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
