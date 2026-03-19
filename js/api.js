/**
 * SiteLedgers — Firestore API Module
 * Provides org-scoped CRUD helpers for all collections.
 * Every function reads orgId from state so callers don't pass it manually.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';

import { db } from './firebase-init.js';
import { getOrgId, getState } from './state.js';

// ─── Collection Path Helpers ────────────────────────────

/**
 * Get a Firestore collection reference scoped to the current org.
 * Usage: orgCollection('properties') → organisations/{orgId}/properties
 */
function orgCollection(collectionName) {
  const orgId = getOrgId();
  if (!orgId) throw new Error('No organisation loaded');
  return collection(db, 'organisations', orgId, collectionName);
}

/**
 * Get a Firestore document reference scoped to the current org.
 * Usage: orgDoc('properties', 'abc123') → organisations/{orgId}/properties/abc123
 */
function orgDoc(collectionName, docId) {
  const orgId = getOrgId();
  if (!orgId) throw new Error('No organisation loaded');
  return doc(db, 'organisations', orgId, collectionName, docId);
}

/**
 * Get a subcollection reference.
 * Usage: orgSubcollection('issues', 'abc', 'updates')
 */
function orgSubcollection(parentCollection, parentId, subName) {
  const orgId = getOrgId();
  if (!orgId) throw new Error('No organisation loaded');
  return collection(db, 'organisations', orgId, parentCollection, parentId, subName);
}

// ─── Generic CRUD ───────────────────────────────────────

/**
 * Fetch a single document by collection name and ID.
 * Returns the document data with `id` field, or null if not found.
 */
async function fetchDoc(collectionName, docId) {
  const snap = await getDoc(orgDoc(collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Fetch all documents from a collection, with optional query constraints.
 * `constraints` is an array of Firestore query constraints (where, orderBy, limit).
 * Returns an array of documents with `id` field.
 */
async function fetchCollection(collectionName, constraints = []) {
  const ref = orgCollection(collectionName);
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create a new document. Automatically adds createdAt timestamp.
 * Returns the new document ID.
 */
async function createDoc(collectionName, data) {
  const ref = await addDoc(orgCollection(collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Update an existing document. Automatically updates the updatedAt timestamp.
 */
async function updateDocument(collectionName, docId, data) {
  await updateDoc(orgDoc(collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a document (owner-only actions like deleting issues).
 */
async function deleteDocument(collectionName, docId) {
  await deleteDoc(orgDoc(collectionName, docId));
}

// ─── Subcollection Helpers ──────────────────────────────

/**
 * Fetch documents from a subcollection.
 */
async function fetchSubcollection(parentCollection, parentId, subName, constraints = []) {
  const ref = orgSubcollection(parentCollection, parentId, subName);
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Add a document to a subcollection. Adds createdAt timestamp.
 * Returns the new document ID.
 */
async function createSubDoc(parentCollection, parentId, subName, data) {
  const ref = await addDoc(orgSubcollection(parentCollection, parentId, subName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Batch Writer ───────────────────────────────────────

/**
 * Create a Firestore batch for atomic writes.
 * Returns { batch, orgDoc, orgCollection } so callers can add operations.
 *
 * Usage:
 *   const { batch, orgDoc } = createBatch();
 *   batch.set(doc(orgCollection('issues'), newId), { ... });
 *   batch.update(orgDoc('properties', propId), { openIssueCount: ... });
 *   await batch.commit();
 */
function createBatch() {
  return {
    batch: writeBatch(db),
    orgDoc,
    orgCollection,
  };
}

// ─── Property-Scoped Queries ────────────────────────────

/**
 * Fetch properties the current user has access to.
 * Owners see all; other roles see only their assigned properties.
 */
async function fetchAccessibleProperties() {
  const { role, assignedProperties } = getState();
  const constraints = [
    where('status', '==', 'active'),
    orderBy('name'),
  ];

  const allProperties = await fetchCollection('properties', constraints);

  // Owners and users with no assignment filter see everything
  if (role === 'owner' || assignedProperties.length === 0) {
    return allProperties;
  }

  // Scoped users see only assigned properties
  return allProperties.filter((p) => assignedProperties.includes(p.id));
}

// ─── Activity Log ───────────────────────────────────────

/**
 * Write an entry to the immutable activity log.
 */
async function logActivity(data) {
  const { user } = getState();
  await addDoc(orgCollection('activityLog'), {
    ...data,
    performedBy: user.id,
    performedByName: user.name,
    performedByRole: user.role,
    createdAt: serverTimestamp(),
  });
}

// ─── Re-export Firestore utilities for page scripts ─────

export {
  // CRUD
  fetchDoc,
  fetchCollection,
  createDoc,
  updateDocument,
  deleteDocument,
  // Subcollections
  fetchSubcollection,
  createSubDoc,
  // Batch
  createBatch,
  // Scoped queries
  fetchAccessibleProperties,
  // Activity log
  logActivity,
  // Path helpers (for advanced use in page scripts)
  orgCollection,
  orgDoc,
  orgSubcollection,
  // Re-export Firestore primitives so pages don't import from CDN directly
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  query,
  doc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
};
