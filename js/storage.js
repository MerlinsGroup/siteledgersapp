/**
 * SiteLedgers — Firebase Storage Module
 * Handles file uploads, download URL retrieval, and path construction.
 * All paths are scoped under organisations/{orgId}/.
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js';

import { storage } from './firebase-init.js';
import { getOrgId, getState } from './state.js';
import { createDoc } from './api.js';

// ─── File size limits (bytes) ───────────────────────────

const FILE_LIMITS = {
  photo: 10 * 1024 * 1024,    // 10 MB
  document: 25 * 1024 * 1024, // 25 MB
  avatar: 2 * 1024 * 1024,    // 2 MB
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// ─── Path Builders ──────────────────────────────────────

/**
 * Build a Storage path for an attachment.
 * Pattern: organisations/{orgId}/{parentType}/{parentId}/{attachmentId}.{ext}
 */
function buildAttachmentPath(parentType, parentId, attachmentId, fileName) {
  const orgId = getOrgId();
  const ext = fileName.split('.').pop() || 'jpg';
  return `organisations/${orgId}/${parentType}/${parentId}/${attachmentId}.${ext}`;
}

/**
 * Build a Storage path for a user avatar.
 * Pattern: organisations/{orgId}/users/{userId}/avatar.{ext}
 */
function buildAvatarPath(userId, fileName) {
  const orgId = getOrgId();
  const ext = fileName.split('.').pop() || 'jpg';
  return `organisations/${orgId}/users/${userId}/avatar.${ext}`;
}

// ─── Upload ─────────────────────────────────────────────

/**
 * Upload a file to Firebase Storage and create an Attachment document in Firestore.
 *
 * @param {File} file — the File object from an <input type="file">
 * @param {string} parentType — 'issue' | 'inspection' | 'property'
 * @param {string} parentId — ID of the parent entity
 * @param {object} options — optional: { caption, location, inspectionItemId }
 * @returns {{ attachmentId, storageUrl, storagePath }} or throws on error
 */
async function uploadAttachment(file, parentType, parentId, options = {}) {
  // Validate file size
  const maxSize = ALLOWED_IMAGE_TYPES.includes(file.type) ? FILE_LIMITS.photo : FILE_LIMITS.document;
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)} MB.`);
  }

  const { user } = getState();

  // Generate a temporary ID for the file name (Firestore will assign the real doc ID)
  const tempId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
  const storagePath = buildAttachmentPath(parentType, parentId, tempId, file.name);

  // Upload to Storage
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const storageUrl = await getDownloadURL(storageRef);

  // Create Firestore attachment document
  const attachmentId = await createDoc('attachments', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    storageUrl,
    storagePath,
    thumbnailUrl: null,
    parentType,
    parentId,
    inspectionItemId: options.inspectionItemId || null,
    caption: options.caption || '',
    location: options.location || null,
    uploadedBy: user.id,
    uploadedByName: user.name,
  });

  return { attachmentId, storageUrl, storagePath };
}

/**
 * Upload a user avatar. Overwrites previous avatar at the same path.
 * Returns the download URL.
 */
async function uploadAvatar(file, userId) {
  if (file.size > FILE_LIMITS.avatar) {
    throw new Error('Avatar too large. Maximum size is 2 MB.');
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Avatar must be a JPEG, PNG, or WebP image.');
  }

  const storagePath = buildAvatarPath(userId, file.name);
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ─── Validation Helpers ─────────────────────────────────

/**
 * Check if a file is a valid image type.
 */
function isValidImage(file) {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Check if a file is within size limits.
 */
function isWithinSizeLimit(file, type = 'photo') {
  return file.size <= (FILE_LIMITS[type] || FILE_LIMITS.photo);
}

export {
  uploadAttachment,
  uploadAvatar,
  isValidImage,
  isWithinSizeLimit,
  FILE_LIMITS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
};
