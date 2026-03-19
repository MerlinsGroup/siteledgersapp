/**
 * SiteLedgers — Date Utilities
 * Formatting and comparison helpers for Firestore Timestamps and JS Dates.
 */

/**
 * Convert a Firestore Timestamp or JS Date to a readable date string.
 * Returns '' if the input is null/undefined.
 */
export function formatDate(timestamp) {
  const date = toDate(timestamp);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a timestamp as date + time (e.g. "14 Mar 2026, 09:30").
 */
export function formatDateTime(timestamp) {
  const date = toDate(timestamp);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Return a relative time string (e.g. "2 hours ago", "3 days ago").
 */
export function timeAgo(timestamp) {
  const date = toDate(timestamp);
  if (!date) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(timestamp);
}

/**
 * Check if a date is in the past (overdue check).
 */
export function isPast(timestamp) {
  const date = toDate(timestamp);
  if (!date) return false;
  return date.getTime() < Date.now();
}

/**
 * Format a date for an HTML <input type="date"> value (YYYY-MM-DD).
 */
export function toInputDate(timestamp) {
  const date = toDate(timestamp);
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Convert a Firestore Timestamp, JS Date, or date string to a JS Date.
 * Returns null if input is falsy.
 */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return null;
}
