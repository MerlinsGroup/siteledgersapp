/**
 * SiteLedgers — User Roles & Permissions
 * Central definition of roles, permissions, and access rules.
 */

const ROLES = {
  OWNER: 'owner',
  PROPERTY_MANAGER: 'property_manager',
  CONTRACTOR: 'contractor',
  INSPECTOR: 'inspector',
  VIEWER: 'viewer',
};

const ISSUE_STATUS = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  VERIFIED: 'verified',
  CLOSED: 'closed',
};

/**
 * Which roles can transition an issue to each status.
 */
const STATUS_TRANSITIONS = {
  [ISSUE_STATUS.OPEN]:         [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR],
  [ISSUE_STATUS.ACKNOWLEDGED]: [ROLES.CONTRACTOR],
  [ISSUE_STATUS.IN_PROGRESS]:  [ROLES.CONTRACTOR],
  [ISSUE_STATUS.RESOLVED]:     [ROLES.CONTRACTOR],
  [ISSUE_STATUS.VERIFIED]:     [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR],
  [ISSUE_STATUS.CLOSED]:       [ROLES.OWNER, ROLES.PROPERTY_MANAGER],
};

/**
 * Page-level access by role.
 * true = full access, 'scoped' = limited to assigned properties/issues, false = no access.
 */
const PAGE_ACCESS = {
  '/dashboard':       { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: 'scoped', [ROLES.CONTRACTOR]: 'scoped', [ROLES.INSPECTOR]: 'scoped', [ROLES.VIEWER]: 'scoped' },
  '/properties':      { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: 'scoped', [ROLES.CONTRACTOR]: false,    [ROLES.INSPECTOR]: 'scoped', [ROLES.VIEWER]: 'scoped' },
  '/properties/:id':  { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: 'scoped', [ROLES.CONTRACTOR]: false,    [ROLES.INSPECTOR]: 'scoped', [ROLES.VIEWER]: 'scoped' },
  '/issues/new':      { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: true,     [ROLES.CONTRACTOR]: false,    [ROLES.INSPECTOR]: true,     [ROLES.VIEWER]: false },
  '/issues/:id':      { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: 'scoped', [ROLES.CONTRACTOR]: 'scoped', [ROLES.INSPECTOR]: 'scoped', [ROLES.VIEWER]: 'scoped' },
  '/inspections':     { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: 'scoped', [ROLES.CONTRACTOR]: false,    [ROLES.INSPECTOR]: 'scoped', [ROLES.VIEWER]: 'scoped' },
  '/inspections/:id': { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: 'scoped', [ROLES.CONTRACTOR]: false,    [ROLES.INSPECTOR]: 'scoped', [ROLES.VIEWER]: 'scoped' },
  '/reports':         { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: 'scoped', [ROLES.CONTRACTOR]: false,    [ROLES.INSPECTOR]: 'scoped', [ROLES.VIEWER]: 'scoped' },
  '/users':           { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: false,    [ROLES.CONTRACTOR]: false,    [ROLES.INSPECTOR]: false,    [ROLES.VIEWER]: false },
  '/profile':         { [ROLES.OWNER]: true, [ROLES.PROPERTY_MANAGER]: true,     [ROLES.CONTRACTOR]: true,     [ROLES.INSPECTOR]: true,     [ROLES.VIEWER]: true },
};

/**
 * Action-level permissions by role.
 */
const PERMISSIONS = {
  // Properties
  property_create:       [ROLES.OWNER],
  property_edit:         [ROLES.OWNER, ROLES.PROPERTY_MANAGER],
  property_archive:      [ROLES.OWNER],

  // Issues
  issue_create:          [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR],
  issue_assign:          [ROLES.OWNER, ROLES.PROPERTY_MANAGER],
  issue_reassign:        [ROLES.OWNER, ROLES.PROPERTY_MANAGER],
  issue_update_own:      [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.CONTRACTOR, ROLES.INSPECTOR],
  issue_verify:          [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR],
  issue_close:           [ROLES.OWNER, ROLES.PROPERTY_MANAGER],
  issue_delete:          [ROLES.OWNER],

  // Evidence
  evidence_upload:       [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.CONTRACTOR, ROLES.INSPECTOR],

  // Inspections
  inspection_create:     [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR],
  inspection_conduct:    [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR],
  inspection_signoff:    [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR],

  // Reports
  report_view:           [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR, ROLES.VIEWER],
  report_export:         [ROLES.OWNER, ROLES.PROPERTY_MANAGER, ROLES.INSPECTOR, ROLES.VIEWER],

  // Users
  user_invite:           [ROLES.OWNER],
  user_remove:           [ROLES.OWNER],
  user_set_role:         [ROLES.OWNER],
  user_assign_property:  [ROLES.OWNER],
  contact_manage:        [ROLES.OWNER, ROLES.PROPERTY_MANAGER],
};

/**
 * Check if a role has a specific permission.
 */
function hasPermission(role, permission) {
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

/**
 * Check if a role can access a page.
 */
function canAccessPage(role, page) {
  const access = PAGE_ACCESS[page];
  if (!access) return false;
  return access[role] !== false && access[role] !== undefined;
}

/**
 * Check if a role can transition an issue to a given status.
 */
function canTransitionTo(role, status) {
  return STATUS_TRANSITIONS[status]?.includes(role) ?? false;
}

export {
  ROLES,
  ISSUE_STATUS,
  STATUS_TRANSITIONS,
  PAGE_ACCESS,
  PERMISSIONS,
  hasPermission,
  canAccessPage,
  canTransitionTo,
};
