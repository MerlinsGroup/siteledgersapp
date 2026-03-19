# SiteLedgers — Core Data Model

Data architecture for Firebase Firestore. Each top-level entity maps to a Firestore collection. Subcollections are noted where applicable.

---

## Entity Relationship Overview

```
Organisation (account)
 ├── Users (team members + external contacts)
 ├── Properties
 │    ├── Units / Areas
 │    └── Issues / Defects
 │         ├── Issue Updates / Comments
 │         ├── Attachments / Evidence
 │         └── Assignments
 ├── Inspections
 │    ├── Checklist Responses (per item)
 │    └── Attachments / Evidence
 ├── Checklist Templates
 │    └── Template Items
 └── Activity Log / Audit Trail
```

---

## Enums & Status Fields

### Issue Status
```
open → acknowledged → in_progress → resolved → verified → closed
```

| Value | Meaning |
|-------|---------|
| `open` | Logged, not yet acknowledged by assigned party |
| `acknowledged` | Assigned party has accepted the issue |
| `in_progress` | Work is underway |
| `resolved` | Assigned party claims work is complete |
| `verified` | Client-side user confirms fix is satisfactory |
| `closed` | Issue formally closed — part of the permanent record |

### Issue Priority
| Value | Meaning |
|-------|---------|
| `critical` | Safety risk or legal/compliance blocker — immediate action |
| `high` | Significant defect affecting use — resolve within days |
| `medium` | Notable issue but not blocking — resolve within weeks |
| `low` | Minor cosmetic or non-urgent item |

### Issue Category
| Value | Meaning |
|-------|---------|
| `defect` | Construction defect or build quality issue |
| `snag` | Snagging item (cosmetic or finishing) |
| `maintenance` | Ongoing maintenance or wear-and-tear |
| `compliance` | Regulatory, safety, or compliance concern |
| `other` | Anything that doesn't fit above |

### Inspection Status
| Value | Meaning |
|-------|---------|
| `scheduled` | Planned but not started |
| `in_progress` | Inspector has begun the checklist |
| `completed` | All items checked, pending sign-off |
| `signed_off` | Formally signed off by inspector |

### Inspection Type
| Value | Meaning |
|-------|---------|
| `routine` | Regular periodic inspection |
| `snagging` | Snagging / defect walk |
| `compliance` | Regulatory or safety compliance check |
| `handover` | Pre-handover or post-handover inspection |
| `ad_hoc` | One-off or unscheduled inspection |

### User Role
| Value | Meaning |
|-------|---------|
| `owner` | Full account access — Owner / Client Admin |
| `property_manager` | Operational control over assigned properties |
| `contractor` | External party — updates assigned issues only |
| `inspector` | Conducts inspections and verifies resolutions |
| `viewer` | Read-only visibility |

### Property Status
| Value | Meaning |
|-------|---------|
| `active` | In use, being managed |
| `archived` | No longer actively managed but records preserved |

### Checklist Item Result
| Value | Meaning |
|-------|---------|
| `pass` | Item meets standards |
| `fail` | Item does not meet standards |
| `na` | Not applicable for this inspection |
| `pending` | Not yet checked |

---

## Entity Definitions

### 1. Organisation

**What it represents:** The top-level account — a property company, landlord, developer, or management firm. All data belongs to an organisation.

**Phase:** MVP

**Firestore path:** `organisations/{orgId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `name` | string | Organisation / company name |
| `contactEmail` | string | Primary contact email |
| `contactPhone` | string | Primary phone (optional) |
| `address` | string | Registered address (optional) |
| `logoUrl` | string | Organisation logo (optional) |
| `plan` | string | Subscription tier — future use |
| `createdAt` | timestamp | When the account was created |
| `createdBy` | string (userId) | Who created the account |

**Relationships:** Parent of all other entities. Every user, property, issue, and inspection belongs to one organisation.

**Created by:** Owner (on initial signup).

---

### 2. Users

**What it represents:** Anyone with access to the platform — internal team members and external contacts (contractors, suppliers). External contacts who don't have app logins are stored here too, so they can be referenced in assignments.

**Phase:** MVP

**Firestore path:** `organisations/{orgId}/users/{userId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID (matches Firebase Auth UID for login users) |
| `email` | string | Email address |
| `name` | string | Full name |
| `phone` | string | Phone number (optional) |
| `role` | string (enum) | `owner` / `property_manager` / `contractor` / `inspector` / `viewer` |
| `company` | string | Company name (useful for contractors) |
| `avatarUrl` | string | Profile photo URL (optional) |
| `assignedProperties` | array of strings | Property IDs this user is scoped to (empty = all, for owner) |
| `hasAppAccess` | boolean | Whether this person can log in (false = external contact only) |
| `status` | string | `active` / `invited` / `deactivated` |
| `notificationPrefs` | object | `{ emailOnAssignment: bool, emailOnOverdue: bool, emailOnStatusChange: bool }` |
| `createdAt` | timestamp | When the user record was created |
| `createdBy` | string (userId) | Who invited/added this user |
| `lastLoginAt` | timestamp | Last login time (null if external contact) |

**Relationships:**
- Belongs to one organisation
- Referenced by issues (as reporter, assignee), inspections (as inspector), assignments, and activity log entries

**Created by:** Owner (invites team). Property Manager (adds external contacts).

---

### 3. Properties

**What it represents:** A physical property, building, block, development, or managed location. The primary entity that issues, inspections, and teams are grouped around.

**Phase:** MVP

**Firestore path:** `organisations/{orgId}/properties/{propertyId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `name` | string | Property name (e.g. "Riverside Court") |
| `address` | string | Full address |
| `type` | string | `residential` / `commercial` / `mixed` / `industrial` / `other` |
| `status` | string (enum) | `active` / `archived` |
| `description` | string | Notes or description (optional) |
| `location` | geopoint | Lat/lng coordinates (optional) |
| `imageUrl` | string | Primary property photo (optional) |
| `openIssueCount` | number | Denormalised count of open issues (for fast dashboard display) |
| `overdueIssueCount` | number | Denormalised count of overdue issues |
| `lastInspectionDate` | timestamp | Date of most recent inspection (denormalised) |
| `createdAt` | timestamp | When the property was added |
| `createdBy` | string (userId) | Who added the property |
| `updatedAt` | timestamp | Last modification |

**Relationships:**
- Belongs to one organisation
- Has many units/areas
- Has many issues
- Has many inspections
- Has many assigned users (via `user.assignedProperties`)

**Created by:** Owner only.

**Note on denormalised counts:** `openIssueCount`, `overdueIssueCount`, and `lastInspectionDate` are duplicated here for dashboard performance. They must be updated whenever an issue or inspection changes. This avoids querying all issues to render the properties list.

---

### 4. Units / Areas

**What it represents:** A subdivision within a property — a flat, unit, floor, wing, room, external area, common area, or any named zone. Allows issues and inspections to be pinpointed to a specific location within a property.

**Phase:** MVP (basic), expand later

**Firestore path:** `organisations/{orgId}/properties/{propertyId}/units/{unitId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `name` | string | Unit/area name (e.g. "Unit 4B", "Roof terrace", "Main stairwell") |
| `type` | string | `unit` / `floor` / `wing` / `common_area` / `external` / `other` |
| `floor` | string | Floor number or level (optional) |
| `description` | string | Additional notes (optional) |
| `status` | string | `active` / `archived` |
| `createdAt` | timestamp | When added |
| `createdBy` | string (userId) | Who added it |

**Relationships:**
- Belongs to one property
- Referenced by issues (optional — an issue can be property-level or unit-level)
- Referenced by inspection checklist items

**Created by:** Owner, Property Manager.

---

### 5. Issues / Defects

**What it represents:** A logged defect, snag, maintenance item, or compliance concern against a property. The central entity of the platform — everything flows from issues being logged, assigned, tracked, and resolved with evidence.

**Phase:** MVP — this is the core entity

**Firestore path:** `organisations/{orgId}/issues/{issueId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `title` | string | Short summary of the issue |
| `description` | string | Detailed description |
| `propertyId` | string | Which property this issue belongs to |
| `propertyName` | string | Denormalised property name (for list display) |
| `unitId` | string | Which unit/area within the property (optional) |
| `unitName` | string | Denormalised unit name (optional) |
| `category` | string (enum) | `defect` / `snag` / `maintenance` / `compliance` / `other` |
| `priority` | string (enum) | `critical` / `high` / `medium` / `low` |
| `status` | string (enum) | `open` / `acknowledged` / `in_progress` / `resolved` / `verified` / `closed` |
| `locationDescription` | string | Free text location detail (e.g. "behind the boiler in the utility room") |
| `location` | geopoint | Lat/lng coordinates (optional) |
| `reportedBy` | string (userId) | Who logged the issue |
| `reportedByName` | string | Denormalised reporter name |
| `assignedTo` | string (userId) | Currently assigned responsible party |
| `assignedToName` | string | Denormalised assignee name |
| `dueDate` | timestamp | Resolution deadline |
| `resolvedAt` | timestamp | When the assignee marked it resolved (null until resolved) |
| `verifiedAt` | timestamp | When a client-side user verified the fix (null until verified) |
| `verifiedBy` | string (userId) | Who verified it |
| `closedAt` | timestamp | When formally closed |
| `closedBy` | string (userId) | Who closed it |
| `inspectionId` | string | If this issue was generated from a failed inspection item (optional) |
| `attachmentCount` | number | Denormalised count of attached photos/files |
| `commentCount` | number | Denormalised count of comments/updates |
| `createdAt` | timestamp | When logged |
| `updatedAt` | timestamp | Last modification |

**Relationships:**
- Belongs to one organisation
- Belongs to one property
- Optionally linked to one unit/area
- Has many issue updates/comments (subcollection)
- Has many attachments/evidence (subcollection)
- Has one current assignment (and assignment history via activity log)
- Optionally linked to an inspection (if auto-created from a failed item)

**Created by:** Owner, Property Manager, Inspector.

---

### 6. Issue Updates / Comments

**What it represents:** A comment, note, or status change on an issue. Forms the communication thread between the client and the responsible party, and records every status transition with a timestamp.

**Phase:** MVP

**Firestore path:** `organisations/{orgId}/issues/{issueId}/updates/{updateId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `type` | string | `comment` / `status_change` / `reassignment` / `evidence_added` |
| `message` | string | Comment text or description of the change |
| `authorId` | string (userId) | Who posted it |
| `authorName` | string | Denormalised author name |
| `authorRole` | string | Role at time of posting |
| `previousStatus` | string | Status before change (for `status_change` type) |
| `newStatus` | string | Status after change (for `status_change` type) |
| `previousAssignee` | string | Previous assignee ID (for `reassignment` type) |
| `newAssignee` | string | New assignee ID (for `reassignment` type) |
| `attachmentIds` | array of strings | Any attachments added with this update |
| `createdAt` | timestamp | When posted — immutable |

**Relationships:**
- Belongs to one issue (subcollection)
- References user (author)
- May reference attachments

**Created by:** Any user with access to the issue.

**Key rule:** Updates are append-only. They cannot be edited or deleted — this protects the audit trail.

---

### 7. Attachments / Evidence

**What it represents:** A photo, document, or file uploaded as evidence — attached to an issue or an inspection checklist item. Timestamped and attributed to the uploader. Cannot be deleted once uploaded (evidence preservation).

**Phase:** MVP

**Firestore path:** `organisations/{orgId}/attachments/{attachmentId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `fileName` | string | Original file name |
| `fileType` | string | MIME type (e.g. `image/jpeg`, `application/pdf`) |
| `fileSize` | number | Size in bytes |
| `storageUrl` | string | Firebase Storage download URL |
| `storagePath` | string | Firebase Storage path (for internal reference) |
| `thumbnailUrl` | string | Thumbnail URL for images (optional, generated) |
| `parentType` | string | `issue` / `inspection` / `property` |
| `parentId` | string | ID of the issue, inspection, or property this belongs to |
| `inspectionItemId` | string | If attached to a specific checklist item (optional) |
| `caption` | string | Description or note about the file (optional) |
| `location` | geopoint | Where the photo was taken (optional) |
| `uploadedBy` | string (userId) | Who uploaded it |
| `uploadedByName` | string | Denormalised uploader name |
| `createdAt` | timestamp | Upload timestamp — immutable |

**Relationships:**
- Belongs to one issue, inspection, or property (via `parentType` + `parentId`)
- Optionally linked to a specific inspection checklist item
- References user (uploader)
- Actual file stored in Firebase Storage; this document holds the metadata

**Created by:** Owner, Property Manager, Contractor, Inspector.

**Key rule:** Attachments are permanent. No role can delete uploaded evidence. This is fundamental to the accountability guarantee.

---

### 8. Inspections

**What it represents:** A formal inspection of a property — a structured walk-through using a checklist, with evidence capture and sign-off. Covers routine checks, snagging, compliance, and handovers.

**Phase:** MVP

**Firestore path:** `organisations/{orgId}/inspections/{inspectionId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `propertyId` | string | Which property is being inspected |
| `propertyName` | string | Denormalised property name |
| `templateId` | string | Which checklist template was used |
| `templateName` | string | Denormalised template name |
| `type` | string (enum) | `routine` / `snagging` / `compliance` / `handover` / `ad_hoc` |
| `status` | string (enum) | `scheduled` / `in_progress` / `completed` / `signed_off` |
| `inspectorId` | string (userId) | Who is conducting the inspection |
| `inspectorName` | string | Denormalised inspector name |
| `scheduledDate` | timestamp | When the inspection is planned for |
| `startedAt` | timestamp | When the inspector started |
| `completedAt` | timestamp | When all items were checked |
| `signedOffAt` | timestamp | When formally signed off |
| `signedOffBy` | string (userId) | Who signed off |
| `totalItems` | number | Total checklist items |
| `passedItems` | number | Items marked pass |
| `failedItems` | number | Items marked fail |
| `naItems` | number | Items marked N/A |
| `passRate` | number | Percentage passed (of applicable items) |
| `notes` | string | General inspection notes |
| `issuesCreated` | array of strings | Issue IDs auto-created from failed items |
| `createdAt` | timestamp | When the inspection was created/scheduled |
| `createdBy` | string (userId) | Who created it |
| `updatedAt` | timestamp | Last modification |

**Relationships:**
- Belongs to one organisation
- Belongs to one property
- Uses one checklist template
- Has many checklist responses (subcollection)
- Has many attachments (via attachments collection with `parentType: 'inspection'`)
- May generate issues (from failed items)

**Created by:** Owner, Property Manager, Inspector.

---

### 9. Checklist Templates

**What it represents:** A reusable template defining what items should be checked during an inspection. Different templates for different inspection types (e.g. "Fire Safety Compliance", "Snagging Walk", "Quarterly Routine Check").

**Phase:** MVP (basic), expand later with template library

**Firestore path:** `organisations/{orgId}/checklistTemplates/{templateId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `name` | string | Template name (e.g. "Fire Safety Compliance Check") |
| `description` | string | What this template covers |
| `type` | string | `routine` / `snagging` / `compliance` / `handover` / `general` |
| `isDefault` | boolean | Whether this is a system default template |
| `itemCount` | number | Number of checklist items |
| `createdAt` | timestamp | When created |
| `createdBy` | string (userId) | Who created it |
| `updatedAt` | timestamp | Last modification |

**Firestore path (items subcollection):** `organisations/{orgId}/checklistTemplates/{templateId}/items/{itemId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `order` | number | Sort order within the checklist |
| `section` | string | Section/group heading (e.g. "Fire Exits", "Electrical") |
| `description` | string | What to check (e.g. "Fire extinguisher present and in date") |
| `requiresPhoto` | boolean | Whether photo evidence is mandatory for this item |
| `requiresNote` | boolean | Whether a note is mandatory if fail |
| `autoCreateIssue` | boolean | Automatically create an issue if this item fails |

**Relationships:**
- Belongs to one organisation
- Used by many inspections
- Has many template items (subcollection)

**Created by:** Owner, Property Manager, Inspector.

---

### 10. Checklist Responses

**What it represents:** The actual response/result for each checklist item during a specific inspection. One response per template item per inspection.

**Phase:** MVP

**Firestore path:** `organisations/{orgId}/inspections/{inspectionId}/responses/{responseId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `templateItemId` | string | Which template item this responds to |
| `order` | number | Sort order (copied from template item) |
| `section` | string | Section heading (copied from template item) |
| `description` | string | Item description (copied from template item) |
| `result` | string (enum) | `pass` / `fail` / `na` / `pending` |
| `note` | string | Inspector's note for this item |
| `attachmentIds` | array of strings | Photos/evidence attached to this specific item |
| `issueId` | string | If a failed item generated an issue, its ID |
| `checkedAt` | timestamp | When this item was checked |
| `checkedBy` | string (userId) | Who checked it |

**Relationships:**
- Belongs to one inspection (subcollection)
- References a template item
- May reference attachments
- May reference a generated issue

**Created by:** Inspector, Property Manager, Owner (whoever conducts the inspection).

---

### 11. Activity Log / Audit Trail

**What it represents:** An immutable, chronological record of every significant action in the system. This is the accountability backbone — used for compliance, dispute resolution, and oversight. Separate from issue updates because it covers all entities, not just issues.

**Phase:** MVP (basic — log key actions), expand later (full audit)

**Firestore path:** `organisations/{orgId}/activityLog/{logId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `action` | string | What happened (e.g. `issue_created`, `status_changed`, `inspection_signed_off`, `user_invited`, `evidence_uploaded`, `assignment_changed`) |
| `entityType` | string | `issue` / `inspection` / `property` / `user` / `attachment` |
| `entityId` | string | ID of the affected entity |
| `entityTitle` | string | Denormalised title/name for display |
| `propertyId` | string | Related property ID (for scoping/filtering) |
| `propertyName` | string | Denormalised property name |
| `performedBy` | string (userId) | Who performed the action |
| `performedByName` | string | Denormalised user name |
| `performedByRole` | string | Role at time of action |
| `details` | object | Action-specific data (flexible). Examples below. |
| `createdAt` | timestamp | When the action occurred — immutable |

**Example `details` objects:**
```
// status_changed
{ previousStatus: "open", newStatus: "acknowledged" }

// assignment_changed
{ previousAssignee: "userId1", newAssignee: "userId2", newAssigneeName: "John Smith" }

// evidence_uploaded
{ fileName: "crack_photo.jpg", attachmentId: "abc123" }

// inspection_signed_off
{ passRate: 92, failedItems: 3 }
```

**Relationships:**
- Belongs to one organisation
- References the affected entity (issue, inspection, property, user)
- References the performing user
- Scoped to a property (for property-level filtering)

**Key rules:**
- Activity log entries are **immutable** — no role can edit or delete them
- Every state change, assignment, upload, and sign-off generates a log entry
- This is the system of record for "who did what, when"

**Created by:** System (automatically generated on every significant action).

---

## Entity Relationship Diagram (Text)

```
Organisation
 │
 ├─── Users ──────────────────────────────────────┐
 │     (role, assignedProperties)                  │
 │                                                 │ references
 ├─── Properties                                   │
 │     │                                           │
 │     ├─── Units / Areas                          │
 │     │                                           │
 │     └──< Issues ────────────────────────────────┤
 │           │  (propertyId, unitId,               │
 │           │   reportedBy, assignedTo)            │
 │           │                                     │
 │           ├─── Issue Updates / Comments          │
 │           │     (authorId)                      │
 │           │                                     │
 │           └──> Attachments / Evidence            │
 │                 (parentType: 'issue',            │
 │                  uploadedBy)                     │
 │                                                 │
 ├─── Checklist Templates                          │
 │     └─── Template Items                         │
 │                                                 │
 ├─── Inspections ─────────────────────────────────┤
 │     │  (propertyId, templateId, inspectorId)    │
 │     │                                           │
 │     ├─── Checklist Responses                    │
 │     │     (templateItemId, issueId?)            │
 │     │                                           │
 │     └──> Attachments / Evidence                 │
 │           (parentType: 'inspection')            │
 │                                                 │
 └─── Activity Log ────────────────────────────────┘
       (entityType, entityId, performedBy)
```

**Key:** `──<` = has many, `──>` = references, `───` = contains

---

## MVP Priority

### Must have (MVP)

| Entity | Reason |
|--------|--------|
| **Organisation** | Top-level container — needed from day one |
| **Users** | Authentication, roles, and assignment targets |
| **Properties** | Core entity everything groups around |
| **Units / Areas** | Basic version — just name and type |
| **Issues** | The core of the platform |
| **Issue Updates** | Communication and status tracking |
| **Attachments** | Evidence is central to the value prop |
| **Activity Log** | Accountability guarantee — must exist from the start |

### Should have (shortly after MVP)

| Entity | Reason |
|--------|--------|
| **Inspections** | Key feature but can launch without if issues are working |
| **Checklist Templates** | Required for inspections to work |
| **Checklist Responses** | Required for inspections to work |

### Later phase

| Feature | Reason |
|---------|--------|
| Report/export entities | Reports can be generated on-the-fly from existing data initially — no need to persist them |
| Template library | Start with a few hardcoded templates, add a template builder later |
| Notification queue | Can use Firebase Cloud Functions to trigger emails — no persistent entity needed initially |

---

## Denormalisation Strategy

Firestore does not support joins. To avoid excessive reads, the following fields are intentionally denormalised (duplicated):

| Denormalised Field | On Entity | Source |
|-------------------|-----------|--------|
| `propertyName` | Issue, Inspection, Activity Log | Property.name |
| `unitName` | Issue | Unit.name |
| `reportedByName` | Issue | User.name |
| `assignedToName` | Issue | User.name |
| `inspectorName` | Inspection | User.name |
| `authorName` | Issue Update | User.name |
| `uploadedByName` | Attachment | User.name |
| `performedByName` | Activity Log | User.name |
| `templateName` | Inspection | Checklist Template.name |
| `openIssueCount` | Property | Count of issues with status != closed/verified |
| `overdueIssueCount` | Property | Count of issues past dueDate and not closed |
| `lastInspectionDate` | Property | Most recent inspection completedAt |
| `attachmentCount` | Issue | Count of attachments |
| `commentCount` | Issue | Count of issue updates |

**Trade-off:** If a user's name changes, denormalised name fields become stale. For MVP this is acceptable — names rarely change. A Cloud Function can batch-update if needed later.
