/**
 * SiteLedgers — Photo Utilities
 * Helpers for handling image capture and file selection on mobile/desktop.
 */

/**
 * Create a file input configured for photo capture.
 * On mobile, opens the camera. On desktop, opens a file picker.
 * Returns a Promise that resolves with the selected File, or null if cancelled.
 */
export function pickPhoto({ multiple = false } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Rear camera on mobile
    if (multiple) input.multiple = true;

    input.addEventListener('change', () => {
      if (multiple) {
        resolve(input.files.length > 0 ? Array.from(input.files) : []);
      } else {
        resolve(input.files[0] || null);
      }
    });

    // Handle cancel (file picker closed without selection)
    input.addEventListener('cancel', () => resolve(multiple ? [] : null));

    input.click();
  });
}

/**
 * Pick one or more files (photos or documents).
 */
export function pickFiles({ accept = 'image/*,.pdf,.doc,.docx', multiple = true } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (multiple) input.multiple = true;

    input.addEventListener('change', () => {
      resolve(input.files.length > 0 ? Array.from(input.files) : []);
    });

    input.addEventListener('cancel', () => resolve([]));

    input.click();
  });
}

/**
 * Create a thumbnail preview URL from a File object.
 * Returns an object URL — call URL.revokeObjectURL() when done.
 */
export function createPreviewURL(file) {
  return URL.createObjectURL(file);
}

/**
 * Read image dimensions from a File object.
 * Returns { width, height }.
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}
