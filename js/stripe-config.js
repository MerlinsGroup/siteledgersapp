/**
 * SiteLedgers — Stripe Subscription Configuration
 * Product IDs, price IDs, and payment links for all tiers.
 * No secrets here — these are all public/client-safe IDs.
 */

const STRIPE_PLANS = [
  {
    tier: 'starter',
    name: 'Starter',
    productId: 'prod_UB66V3tvrUUZLC',
    monthlyPriceId: 'price_1TCjucHOythCFMktztKN0Ylw',
    annualPriceId: 'price_1TCjucHOythCFMktvJqjUGYD',
    monthlyLink: 'https://buy.stripe.com/6oU28r5ckc6u7i7bARfMA15',
    annualLink: 'https://buy.stripe.com/3cI8wPgV2fiG9qf20hfMA16',
    monthlyPerUser: 14,
    annualPerUser: 11.50,
    trialDays: 0,
    maxProperties: 10,
    features: [
      'Up to 10 properties',
      'Issue tracking & reporting',
      'Basic inspections',
      'Photo evidence',
      'Email notifications',
      '3 team members included',
    ],
  },
  {
    tier: 'professional',
    name: 'Professional',
    badge: 'Most Popular',
    productId: 'prod_UB66MaOT4b7x52',
    monthlyPriceId: 'price_1TCjudHOythCFMktH8KXO3OB',
    annualPriceId: 'price_1TCjueHOythCFMktgQsplI1z',
    monthlyLink: 'https://buy.stripe.com/3cI6oHgV2c6u59Z34lfMA17',
    annualLink: 'https://buy.stripe.com/bJe8wP9sAday0TJdIZfMA18',
    monthlyPerUser: 24,
    annualPerUser: 20,
    trialDays: 14,
    maxProperties: 50,
    features: [
      'Up to 50 properties',
      'Full inspections with templates',
      'Activity audit log',
      'Reports & analytics',
      'Priority badges & status workflows',
      '14-day free trial',
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    productId: 'prod_UB66ReJyudk395',
    monthlyPriceId: 'price_1TCjufHOythCFMkt84y5ZO76',
    annualPriceId: 'price_1TCjufHOythCFMktqO8wRgCL',
    monthlyLink: 'https://buy.stripe.com/eVq14n208day1XNdIZfMA19',
    annualLink: 'https://buy.stripe.com/fZu8wPawE7QegSHgVbfMA1a',
    monthlyPerUser: 42,
    annualPerUser: 34,
    trialDays: 0,
    maxProperties: null, // unlimited
    features: [
      'Unlimited properties',
      'Advanced reports & exports',
      'Custom branding',
      'Priority support',
      'API access',
      'Everything in Professional',
    ],
  },
];

export default STRIPE_PLANS;
