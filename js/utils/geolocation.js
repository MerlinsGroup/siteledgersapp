/**
 * SiteLedgers — Geolocation Utilities
 * Helpers for capturing GPS coordinates when logging issues or taking photos.
 */

/**
 * Get the user's current position.
 * Returns { latitude, longitude } or null if unavailable/denied.
 */
export function getCurrentPosition(options = {}) {
  if (!navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve(null), // Denied or error — return null, don't block
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      },
    );
  });
}

/**
 * Convert lat/lng to a Firestore GeoPoint-compatible object.
 * Firestore GeoPoint is created via `new GeoPoint(lat, lng)` —
 * this just returns the raw values for use with the Firestore SDK.
 */
export function toGeoPointData(coords) {
  if (!coords) return null;
  return { latitude: coords.latitude, longitude: coords.longitude };
}
