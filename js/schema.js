/**
 * SiteLedgers — Data Schema Definitions
 * Defines the structure of all Firestore collections and enums.
 * Used as the single source of truth for data shapes across the app.
 */

// ─── Enums ───────────────────────────────────────────────

export const ISSUE_STATUS = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  VERIFIED: 'verified',
  CLOSED: 'closed',
};

export const ISSUE_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const ISSUE_CATEGORY = {
  DEFECT: 'defect',
  SNAG: 'snag',
  MAINTENANCE: 'maintenance',
  COMPLIANCE: 'compliance',
  OTHER: 'other',
};

export const INSPECTION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SIGNED_OFF: 'signed_off',
};

export const INSPECTION_TYPE = {
  ROUTINE: 'routine',
  SNAGGING: 'snagging',
  COMPLIANCE: 'compliance',
  HANDOVER: 'handover',
  AD_HOC: 'ad_hoc',
};

export const USER_ROLE = {
  OWNER: 'owner',
  PROPERTY_MANAGER: 'property_manager',
  CONTRACTOR: 'contractor',
  INSPECTOR: 'inspector',
  VIEWER: 'viewer',
};

export const PROPERTY_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

export const PROPERTY_TYPE = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  MIXED: 'mixed',
  INDUSTRIAL: 'industrial',
  OTHER: 'other',
};

export const UNIT_TYPE = {
  UNIT: 'unit',
  FLOOR: 'floor',
  WING: 'wing',
  COMMON_AREA: 'common_area',
  EXTERNAL: 'external',
  OTHER: 'other',
};

export const CHECKLIST_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  NA: 'na',
  PENDING: 'pending',
};

export const UPDATE_TYPE = {
  COMMENT: 'comment',
  STATUS_CHANGE: 'status_change',
  REASSIGNMENT: 'reassignment',
  EVIDENCE_ADDED: 'evidence_added',
};

export const ATTACHMENT_PARENT_TYPE = {
  ISSUE: 'issue',
  INSPECTION: 'inspection',
  PROPERTY: 'property',
};

export const ACTIVITY_ACTION = {
  ISSUE_CREATED: 'issue_created',
  ISSUE_STATUS_CHANGED: 'issue_status_changed',
  ISSUE_ASSIGNED: 'issue_assigned',
  ISSUE_REASSIGNED: 'issue_reassigned',
  ISSUE_COMMENTED: 'issue_commented',
  ISSUE_CLOSED: 'issue_closed',
  ISSUE_DELETED: 'issue_deleted',
  EVIDENCE_UPLOADED: 'evidence_uploaded',
  INSPECTION_CREATED: 'inspection_created',
  INSPECTION_STARTED: 'inspection_started',
  INSPECTION_COMPLETED: 'inspection_completed',
  INSPECTION_SIGNED_OFF: 'inspection_signed_off',
  PROPERTY_CREATED: 'property_created',
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_ARCHIVED: 'property_archived',
  USER_INVITED: 'user_invited',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_DEACTIVATED: 'user_deactivated',
};

// ─── Allowed Status Transitions ──────────────────────────

export const ISSUE_STATUS_FLOW = {
  [ISSUE_STATUS.OPEN]:         [ISSUE_STATUS.ACKNOWLEDGED],
  [ISSUE_STATUS.ACKNOWLEDGED]: [ISSUE_STATUS.IN_PROGRESS],
  [ISSUE_STATUS.IN_PROGRESS]:  [ISSUE_STATUS.RESOLVED],
  [ISSUE_STATUS.RESOLVED]:     [ISSUE_STATUS.VERIFIED, ISSUE_STATUS.IN_PROGRESS], // can reopen if fix rejected
  [ISSUE_STATUS.VERIFIED]:     [ISSUE_STATUS.CLOSED],
  [ISSUE_STATUS.CLOSED]:       [], // terminal
};

export const INSPECTION_STATUS_FLOW = {
  [INSPECTION_STATUS.SCHEDULED]:   [INSPECTION_STATUS.IN_PROGRESS],
  [INSPECTION_STATUS.IN_PROGRESS]: [INSPECTION_STATUS.COMPLETED],
  [INSPECTION_STATUS.COMPLETED]:   [INSPECTION_STATUS.SIGNED_OFF],
  [INSPECTION_STATUS.SIGNED_OFF]:  [], // terminal
};

// ─── Firestore Collection Paths ──────────────────────────

export const COLLECTIONS = {
  ORGANISATIONS:      'organisations',
  USERS:              'organisations/{orgId}/users',
  PROPERTIES:         'organisations/{orgId}/properties',
  UNITS:              'organisations/{orgId}/properties/{propertyId}/units',
  ISSUES:             'organisations/{orgId}/issues',
  ISSUE_UPDATES:      'organisations/{orgId}/issues/{issueId}/updates',
  ATTACHMENTS:        'organisations/{orgId}/attachments',
  INSPECTIONS:        'organisations/{orgId}/inspections',
  CHECKLIST_TEMPLATES:'organisations/{orgId}/checklistTemplates',
  TEMPLATE_ITEMS:     'organisations/{orgId}/checklistTemplates/{templateId}/items',
  CHECKLIST_RESPONSES:'organisations/{orgId}/inspections/{inspectionId}/responses',
  ACTIVITY_LOG:       'organisations/{orgId}/activityLog',
};

/**
 * Resolve a collection path by replacing placeholders with actual IDs.
 * Example: getCollectionPath('ISSUES', { orgId: 'abc' }) => 'organisations/abc/issues'
 */
export function getCollectionPath(collectionKey, ids = {}) {
  let path = COLLECTIONS[collectionKey];
  if (!path) throw new Error(`Unknown collection: ${collectionKey}`);
  for (const [key, value] of Object.entries(ids)) {
    path = path.replace(`{${key}}`, value);
  }
  return path;
}

// ─── Priority Display ────────────────────────────────────

export const PRIORITY_LABELS = {
  [ISSUE_PRIORITY.CRITICAL]: 'Critical',
  [ISSUE_PRIORITY.HIGH]: 'High',
  [ISSUE_PRIORITY.MEDIUM]: 'Medium',
  [ISSUE_PRIORITY.LOW]: 'Low',
};

export const PRIORITY_COLORS = {
  [ISSUE_PRIORITY.CRITICAL]: '#dc2626',
  [ISSUE_PRIORITY.HIGH]: '#ea580c',
  [ISSUE_PRIORITY.MEDIUM]: '#ca8a04',
  [ISSUE_PRIORITY.LOW]: '#16a34a',
};

export const STATUS_LABELS = {
  [ISSUE_STATUS.OPEN]: 'Open',
  [ISSUE_STATUS.ACKNOWLEDGED]: 'Acknowledged',
  [ISSUE_STATUS.IN_PROGRESS]: 'In Progress',
  [ISSUE_STATUS.RESOLVED]: 'Resolved',
  [ISSUE_STATUS.VERIFIED]: 'Verified',
  [ISSUE_STATUS.CLOSED]: 'Closed',
};
