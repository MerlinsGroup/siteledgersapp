# SiteLedgers — Firebase Architecture

How Firebase powers the SiteLedgers MVP. This document maps every product feature to a specific Firebase service and defines the exact structure for implementation.

---

## 1. Authentication

### Sign-in method

**MVP: Email + Password** via Firebase Authentication.

This is the simplest method that works for all user types — internal team members, external contractors, and clients. No dependency on third-party OAuth providers.

**Later:** Add Google and Microsoft sign-in as convenience options for corporate users.

### How it works

1. **There is no public signup.** Users do not register themselves.
2. The **Owner / Client Admin** creates the organisation account during initial onboarding (this is the only self-registration flow).
3. All other users are **invited by an admin** (Owner) or **added as contacts** (by Owner or Property Manager).
4. When a user is invited:
   - A user document is created in Firestore with `status: 'invited'`
   - Firebase Auth `createUser` generates an account (via Admin SDK or Cloud Function)
   - An invite email is sent with a password-set link (Firebase Auth password reset flow)
5. The invited user clicks the link, sets their password, and can now log in.
6. On first login, their Firestore `status` updates from `invited` to `active`.

### Auth → Role connection

Firebase Auth only stores: email, UID, and basic profile.
**Roles and permissions live in Firestore**, not in Auth custom claims (for MVP simplicity).

On login:
1. Firebase Auth authenticates the user → returns a UID
2. App queries Firestore: `organisations/{orgId}/users/{uid}` → retrieves `role`, `assignedProperties`, `status`
3. App stores this in client-side state (`js/state.js`)
4. Every page load and data query checks the role from state
5. Firestore Security Rules also enforce role-based access server-side

**Later enhancement:** Mirror the role into a Firebase Auth custom claim (via Cloud Function) for use in Security Rules without an extra Firestore read. Not needed for MVP.

### After login

1. Auth state is persisted in the browser (Firebase default: `LOCAL` persistence — survives tab close)
2. On app load, `firebase.auth().onAuthStateChanged()` checks if user is already signed in
3. If signed in → fetch user record → load dashboard
4. If not signed in → redirect to `/login`

### On logout

1. Call `firebase.auth().signOut()`
2. Clear client-side state
3. Redirect to `/login` (or landing page)
4. Auth token is invalidated — Firestore queries will fail until next sign-in

### Auth for external contacts without app access

Some contractors may be added as contacts for assignment purposes but never log in. These users:
- Have a Firestore user document with `hasAppAccess: false`
- Do **not** have a Firebase Auth account
- Cannot sign in
- Their `id` field is a Firestore auto-generated ID (not a Firebase Auth UID)
- They appear in assignment dropdowns but cannot interact with the system directly

---

## 2. Firestore Structure

### Collection hierarchy

```
organisations/
  {orgId}/
    ├── users/
    │     {userId}
    │
    ├── properties/
    │     {propertyId}/
    │       └── units/
    │             {unitId}
    │
    ├── issues/
    │     {issueId}/
    │       └── updates/
    │             {updateId}
    │
    ├── inspections/
    │     {inspectionId}/
    │       └── responses/
    │             {responseId}
    │
    ├── checklistTemplates/
    │     {templateId}/
    │       └── items/
    │             {itemId}
    │
    ├── attachments/
    │     {attachmentId}
    │
    └── activityLog/
          {logId}
```

Everything lives under `organisations/{orgId}`. For MVP, each user belongs to one organisation. The `orgId` is stored in the user's Auth profile or in a top-level lookup collection.

### Organisation lookup

To map a Firebase Auth UID to an organisation on login:

```
userOrgs/
  {uid}
    ├── orgId: "abc123"
    └── role: "owner"        // cached for quick lookup
```

This top-level collection allows the app to find the user's organisation without knowing the orgId first. One document per user. Kept in sync with the user document under the organisation.

---

### Collection: `organisations/{orgId}/users/{userId}`

**What it stores:** Every person in the system — team members with login access and external contacts without.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | = Firebase Auth UID (if `hasAppAccess: true`) or auto-generated |
| `email` | string | |
| `name` | string | |
| `phone` | string | optional |
| `role` | string | `owner` / `property_manager` / `contractor` / `inspector` / `viewer` |
| `company` | string | Contractor's company name |
| `avatarUrl` | string | optional |
| `assignedProperties` | array\<string\> | Property IDs. Empty array = all properties (owner). |
| `hasAppAccess` | boolean | false = contact-only, no Auth account |
| `status` | string | `active` / `invited` / `deactivated` |
| `notificationPrefs` | map | `{ emailOnAssignment, emailOnOverdue, emailOnStatusChange }` |
| `createdAt` | timestamp | |
| `createdBy` | string | userId of who invited them |
| `lastLoginAt` | timestamp | null if never logged in or contact-only |

**Links to:** Referenced by issues (`reportedBy`, `assignedTo`), inspections (`inspectorId`), updates, and activity log.

---

### Collection: `organisations/{orgId}/properties/{propertyId}`

**What it stores:** Each managed property — building, block, development.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `name` | string | |
| `address` | string | |
| `type` | string | `residential` / `commercial` / `mixed` / `industrial` / `other` |
| `status` | string | `active` / `archived` |
| `description` | string | optional |
| `location` | geopoint | optional |
| `imageUrl` | string | optional — primary photo |
| `openIssueCount` | number | denormalised |
| `overdueIssueCount` | number | denormalised |
| `lastInspectionDate` | timestamp | denormalised |
| `createdAt` | timestamp | |
| `createdBy` | string | userId |
| `updatedAt` | timestamp | |

**Links to:** Parent of units. Referenced by issues and inspections via `propertyId`.

**Denormalised counts:** Updated by the app when issues change status. Later, move to Cloud Functions for reliability.

---

### Subcollection: `organisations/{orgId}/properties/{propertyId}/units/{unitId}`

**What it stores:** Subdivisions within a property.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `name` | string | e.g. "Unit 4B", "Roof terrace" |
| `type` | string | `unit` / `floor` / `wing` / `common_area` / `external` / `other` |
| `floor` | string | optional |
| `description` | string | optional |
| `status` | string | `active` / `archived` |
| `createdAt` | timestamp | |
| `createdBy` | string | userId |

**Links to:** Referenced by issues via `unitId`. Child of a property.

---

### Collection: `organisations/{orgId}/issues/{issueId}`

**What it stores:** Every defect, snag, maintenance item, or compliance concern.

Stored as a **top-level collection under org** (not nested under property) so that cross-property queries work efficiently (e.g. dashboard showing all issues across all properties).

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `title` | string | |
| `description` | string | |
| `propertyId` | string | |
| `propertyName` | string | denormalised |
| `unitId` | string | optional |
| `unitName` | string | denormalised, optional |
| `category` | string | `defect` / `snag` / `maintenance` / `compliance` / `other` |
| `priority` | string | `critical` / `high` / `medium` / `low` |
| `status` | string | `open` / `acknowledged` / `in_progress` / `resolved` / `verified` / `closed` |
| `locationDescription` | string | optional free text |
| `location` | geopoint | optional |
| `reportedBy` | string | userId |
| `reportedByName` | string | denormalised |
| `assignedTo` | string | userId, nullable |
| `assignedToName` | string | denormalised, nullable |
| `dueDate` | timestamp | nullable |
| `resolvedAt` | timestamp | nullable |
| `verifiedAt` | timestamp | nullable |
| `verifiedBy` | string | nullable |
| `closedAt` | timestamp | nullable |
| `closedBy` | string | nullable |
| `inspectionId` | string | nullable — if auto-created from inspection |
| `attachmentCount` | number | denormalised |
| `commentCount` | number | denormalised |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Links to:** Property (via `propertyId`), Unit (via `unitId`), Users (via `reportedBy`, `assignedTo`, etc.), Inspection (via `inspectionId`). Has subcollection `updates`.

**Key Firestore queries needed:**
- All issues for a property: `where('propertyId', '==', id)`
- All open issues across org: `where('status', 'in', ['open', 'acknowledged', 'in_progress', 'resolved'])`
- Overdue issues: `where('dueDate', '<', now).where('status', 'in', ['open', 'acknowledged', 'in_progress'])`
- Issues assigned to a user: `where('assignedTo', '==', userId)`
- Issues by priority: `orderBy('priority')`

**Composite indexes needed:**
- `propertyId` + `status`
- `assignedTo` + `status`
- `status` + `dueDate`
- `propertyId` + `createdAt`

---

### Subcollection: `organisations/{orgId}/issues/{issueId}/updates/{updateId}`

**What it stores:** Comments, status changes, reassignments — the conversation and history trail for an issue.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `type` | string | `comment` / `status_change` / `reassignment` / `evidence_added` |
| `message` | string | |
| `authorId` | string | userId |
| `authorName` | string | denormalised |
| `authorRole` | string | role at time of posting |
| `previousStatus` | string | for status_change type |
| `newStatus` | string | for status_change type |
| `previousAssignee` | string | for reassignment type |
| `newAssignee` | string | for reassignment type |
| `attachmentIds` | array\<string\> | optional |
| `createdAt` | timestamp | immutable |

**Links to:** Parent issue. References users and attachments.

**Rule:** Documents in this subcollection are **append-only**. No updates, no deletes.

---

### Collection: `organisations/{orgId}/attachments/{attachmentId}`

**What it stores:** Metadata for every uploaded file. The actual file lives in Firebase Storage.

Stored as a **top-level collection under org** (not nested) so attachments can be queried across issues and inspections.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `fileName` | string | |
| `fileType` | string | MIME type |
| `fileSize` | number | bytes |
| `storageUrl` | string | Firebase Storage download URL |
| `storagePath` | string | Firebase Storage path |
| `thumbnailUrl` | string | optional — for images |
| `parentType` | string | `issue` / `inspection` / `property` |
| `parentId` | string | ID of the parent entity |
| `inspectionItemId` | string | optional — for inspection checklist photos |
| `caption` | string | optional |
| `location` | geopoint | optional — where the photo was taken |
| `uploadedBy` | string | userId |
| `uploadedByName` | string | denormalised |
| `createdAt` | timestamp | immutable |

**Links to:** Parent entity via `parentType` + `parentId`. Referenced by issue updates.

**Key query:** `where('parentType', '==', 'issue').where('parentId', '==', issueId)`

**Rule:** Documents are **permanent**. No deletes allowed.

---

### Collection: `organisations/{orgId}/inspections/{inspectionId}`

**What it stores:** Inspection records.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `propertyId` | string | |
| `propertyName` | string | denormalised |
| `templateId` | string | |
| `templateName` | string | denormalised |
| `type` | string | `routine` / `snagging` / `compliance` / `handover` / `ad_hoc` |
| `status` | string | `scheduled` / `in_progress` / `completed` / `signed_off` |
| `inspectorId` | string | userId |
| `inspectorName` | string | denormalised |
| `scheduledDate` | timestamp | |
| `startedAt` | timestamp | nullable |
| `completedAt` | timestamp | nullable |
| `signedOffAt` | timestamp | nullable |
| `signedOffBy` | string | nullable |
| `totalItems` | number | |
| `passedItems` | number | |
| `failedItems` | number | |
| `naItems` | number | |
| `passRate` | number | percentage |
| `notes` | string | optional |
| `issuesCreated` | array\<string\> | issue IDs auto-created from failures |
| `createdAt` | timestamp | |
| `createdBy` | string | |
| `updatedAt` | timestamp | |

**Links to:** Property, checklist template, user. Has subcollection `responses`.

---

### Subcollection: `organisations/{orgId}/inspections/{inspectionId}/responses/{responseId}`

**What it stores:** The result for each checklist item during an inspection.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `templateItemId` | string | |
| `order` | number | sort order |
| `section` | string | section heading |
| `description` | string | item text |
| `result` | string | `pass` / `fail` / `na` / `pending` |
| `note` | string | optional |
| `attachmentIds` | array\<string\> | optional |
| `issueId` | string | nullable — if failure generated an issue |
| `checkedAt` | timestamp | nullable |
| `checkedBy` | string | userId |

**Links to:** Parent inspection. References template item, attachments, and generated issue.

---

### Collection: `organisations/{orgId}/checklistTemplates/{templateId}`

**What it stores:** Reusable inspection checklists.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `name` | string | |
| `description` | string | |
| `type` | string | `routine` / `snagging` / `compliance` / `handover` / `general` |
| `isDefault` | boolean | system-provided template |
| `itemCount` | number | |
| `createdAt` | timestamp | |
| `createdBy` | string | |
| `updatedAt` | timestamp | |

### Subcollection: `.../checklistTemplates/{templateId}/items/{itemId}`

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `order` | number | sort order |
| `section` | string | group heading |
| `description` | string | what to check |
| `requiresPhoto` | boolean | |
| `requiresNote` | boolean | if fail |
| `autoCreateIssue` | boolean | auto-create issue on fail |

---

### Collection: `organisations/{orgId}/activityLog/{logId}`

**What it stores:** Immutable audit trail of every significant action.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | auto-generated |
| `action` | string | e.g. `issue_created`, `status_changed` |
| `entityType` | string | `issue` / `inspection` / `property` / `user` / `attachment` |
| `entityId` | string | |
| `entityTitle` | string | denormalised |
| `propertyId` | string | for scoping/filtering |
| `propertyName` | string | denormalised |
| `performedBy` | string | userId |
| `performedByName` | string | denormalised |
| `performedByRole` | string | |
| `details` | map | action-specific data |
| `createdAt` | timestamp | immutable |

**Key queries:**
- By property: `where('propertyId', '==', id).orderBy('createdAt', 'desc')`
- By entity: `where('entityType', '==', 'issue').where('entityId', '==', id)`
- By user: `where('performedBy', '==', userId)`

**Rule:** **No updates, no deletes.** Append-only. This is the legal record.

---

## 3. Firebase Storage

### What gets stored

| Content | Source | Typical format |
|---------|--------|---------------|
| Issue photos | Camera or file upload when creating/updating issues | JPEG, PNG |
| Inspection photos | Camera capture during checklist walk-through | JPEG, PNG |
| Completion proof | Contractor uploads showing finished work | JPEG, PNG |
| Verification evidence | Client photos confirming fix quality | JPEG, PNG |
| Documents | Supporting files (PDFs, reports, specs) | PDF, DOCX |
| Property images | Primary photo of a property | JPEG, PNG |
| User avatars | Profile photos | JPEG, PNG |

### Folder structure

```
organisations/
  {orgId}/
    ├── issues/
    │     {issueId}/
    │       {attachmentId}.{ext}
    │
    ├── inspections/
    │     {inspectionId}/
    │       {attachmentId}.{ext}
    │
    ├── properties/
    │     {propertyId}/
    │       {attachmentId}.{ext}
    │
    └── users/
          {userId}/
            avatar.{ext}
```

**Path convention:** `organisations/{orgId}/{parentType}/{parentId}/{attachmentId}.{ext}`

This mirrors the Firestore structure and makes Security Rules straightforward — a user who can access an issue in Firestore can access its files in Storage.

### Upload flow (MVP)

1. User selects a file or takes a photo (via `<input type="file" accept="image/*" capture="environment">`)
2. Client generates a unique `attachmentId` (Firestore auto-ID)
3. File is uploaded to Storage at the path above
4. On upload complete, get the download URL
5. Create an **Attachment** document in Firestore with the `storageUrl` and metadata
6. Update the parent entity's `attachmentCount` (for issues)
7. If part of an issue update, include the `attachmentId` in the update document

### Storage Security Rules (simplified)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /organisations/{orgId}/{allPaths=**} {
      // Only authenticated users in this org can read/write
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      // Tighter rules per role added later
    }
  }
}
```

### File size limits (enforced in client)

| Type | Max size |
|------|----------|
| Photos | 10 MB |
| Documents | 25 MB |
| Avatars | 2 MB |

### Thumbnails

For MVP, use the original image resized in CSS. Later, add a Cloud Function (`generateThumbnail`) that triggers on Storage upload and creates a smaller version, writing the `thumbnailUrl` back to the Attachment document.

---

## 4. Page-to-Firebase Mapping

### `/login` — Sign In

| Service | Operation |
|---------|-----------|
| **Auth** | `signInWithEmailAndPassword(email, password)` |
| **Firestore** | Read: `userOrgs/{uid}` → get `orgId`, then `organisations/{orgId}/users/{uid}` → get role, assignedProperties |
| **Storage** | — |

**Writes:** Updates `user.lastLoginAt`

---

### `/dashboard` — Portfolio Dashboard

| Service | Operation |
|---------|-----------|
| **Auth** | Check `onAuthStateChanged` — redirect to `/login` if not signed in |
| **Firestore** | Read: properties (scoped by role), issues (open/overdue counts, recent), inspections (upcoming/overdue), activity log (recent entries) |
| **Storage** | — |

**Reads by role:**

| Role | What's queried |
|------|---------------|
| Owner | All properties, all open issues, all inspections, recent activity |
| Property Manager | Properties in `assignedProperties`, issues for those properties, inspections for those properties |
| Contractor | Issues where `assignedTo == uid` |
| Inspector | Inspections where `inspectorId == uid`, issues pending verification for assigned properties |
| Viewer | Same as PM scope but no write operations |

**Writes:** None (dashboard is read-only)

**Key queries:**
```
// Open issues count (Owner)
issues.where('status', 'in', ['open', 'acknowledged', 'in_progress', 'resolved'])

// Overdue issues
issues.where('dueDate', '<', now).where('status', 'in', ['open', 'acknowledged', 'in_progress'])

// Recent activity
activityLog.orderBy('createdAt', 'desc').limit(20)

// Properties with status
properties.where('status', '==', 'active').orderBy('name')
```

---

### `/properties` — Properties List

| Service | Operation |
|---------|-----------|
| **Auth** | Required |
| **Firestore** | Read: `properties` collection (filtered by `assignedProperties` for non-owners) |
| **Storage** | Read: property images (via `imageUrl` on property docs) |

**Writes:** Property Manager+ can add/edit properties (based on role).

---

### `/properties/:id` — Property Detail

| Service | Operation |
|---------|-----------|
| **Auth** | Required |
| **Firestore** | Read: property doc, `units` subcollection, issues `where('propertyId', '==', id)`, inspections `where('propertyId', '==', id)`, users where property is in `assignedProperties`, activity log `where('propertyId', '==', id)` |
| **Storage** | Read: property images, issue thumbnails |

**Writes:** Edit property details, add units, create issues (navigates to `/issues/new` pre-filled)

---

### `/issues/new` — Log New Issue

| Service | Operation |
|---------|-----------|
| **Auth** | Required — must have `issue_create` permission |
| **Firestore** | Read: properties (for dropdown), units for selected property, users (for assignment dropdown). Write: new issue doc, attachment docs, issue update (initial), activity log entry. Update: property `openIssueCount` |
| **Storage** | Write: upload photos to `organisations/{orgId}/issues/{issueId}/` |

**Write sequence:**
1. Create issue document → get `issueId`
2. Upload photos to Storage → get download URLs
3. Create attachment documents in Firestore
4. Create initial issue update (type: `status_change`, open)
5. Create activity log entry (`issue_created`)
6. If assigned: create second activity log entry (`issue_assigned`)
7. Increment property `openIssueCount`

All writes should use a **Firestore batch** where possible to ensure atomicity.

---

### `/issues/:id` — Issue Detail

| Service | Operation |
|---------|-----------|
| **Auth** | Required — contractors see only assigned issues |
| **Firestore** | Read: issue doc, `updates` subcollection (ordered by `createdAt`), attachments `where('parentType', '==', 'issue').where('parentId', '==', id)`. Write: status changes, comments, reassignments (all as new update docs), issue doc status field, activity log entries |
| **Storage** | Read: photo URLs from attachment docs. Write: new evidence uploads |

**Write operations by action:**

| Action | Firestore writes |
|--------|-----------------|
| Add comment | New update doc (type: `comment`), increment `commentCount`, activity log |
| Change status | New update doc (type: `status_change`), update issue `status` + timestamp fields, activity log |
| Upload evidence | Upload to Storage, new attachment doc, new update doc (type: `evidence_added`), increment `attachmentCount`, activity log |
| Reassign | New update doc (type: `reassignment`), update issue `assignedTo`/`assignedToName`, activity log |
| Verify | Update issue `status`, `verifiedAt`, `verifiedBy`, new update doc, activity log |
| Close | Update issue `status`, `closedAt`, `closedBy`, new update doc, activity log, decrement property `openIssueCount` |

---

### `/inspections` — Inspections List

| Service | Operation |
|---------|-----------|
| **Auth** | Required |
| **Firestore** | Read: inspections collection (scoped by `propertyId` in `assignedProperties` for non-owners) |
| **Storage** | — |

**Writes:** Create new inspection (navigates to creation flow)

---

### `/inspections/:id` — Inspection Detail / Checklist

| Service | Operation |
|---------|-----------|
| **Auth** | Required — must have inspection permissions |
| **Firestore** | Read: inspection doc, `responses` subcollection, template items (to populate checklist), attachments for this inspection. Write: response docs (pass/fail/note per item), inspection status and summary fields, auto-created issue docs, activity log |
| **Storage** | Write: checklist item photos |

**Write sequence for conducting an inspection:**
1. Update inspection `status` to `in_progress`, set `startedAt`
2. For each checklist item: create/update response doc with result, note, attachment IDs
3. Upload photos per item to Storage, create attachment docs
4. On complete: update inspection `status` to `completed`, calculate `passedItems`/`failedItems`/`passRate`
5. For failed items with `autoCreateIssue`: create issue docs (batch), add issue IDs to `issuesCreated`
6. On sign-off: update `status` to `signed_off`, set `signedOffAt`/`signedOffBy`
7. Activity log entries at each stage

---

### `/reports` — Reports & Audit Trail

| Service | Operation |
|---------|-----------|
| **Auth** | Required |
| **Firestore** | Read: issues (aggregated by status, property, assignee), inspections (aggregated by pass rate, property), activity log (filtered and paginated), properties |
| **Storage** | — (reports are generated client-side from Firestore data) |

**Writes:** None (read-only page). Export generates a file client-side (PDF/CSV) — no Storage write needed for MVP.

**Key queries:**
```
// Issues summary by property
issues.where('propertyId', '==', id).orderBy('status')

// Overdue accountability
issues.where('status', 'in', ['open', 'acknowledged', 'in_progress'])
      .where('dueDate', '<', now)
      .orderBy('dueDate')

// Inspection pass rates
inspections.where('propertyId', '==', id)
           .where('status', '==', 'signed_off')
           .orderBy('completedAt', 'desc')

// Audit trail
activityLog.where('propertyId', '==', id)
           .orderBy('createdAt', 'desc')
           .limit(50)
```

---

### `/users` — Team & Contacts

| Service | Operation |
|---------|-----------|
| **Auth** | Required — Owner only |
| **Firestore** | Read: users collection. Write: new user docs, role updates, property assignments, status changes |
| **Storage** | — |

**Write sequence for inviting a user:**
1. Create user document in Firestore with `status: 'invited'`
2. Create `userOrgs/{newUid}` lookup document
3. Trigger invite email (via Cloud Function or client-side Firebase Auth `sendPasswordResetEmail` to the new account)
4. Activity log entry: `user_invited`

**For contact-only (no app access):**
1. Create user document with `hasAppAccess: false`, auto-generated ID
2. No Auth account created
3. Activity log entry: `user_invited`

---

### `/profile` — User Profile

| Service | Operation |
|---------|-----------|
| **Auth** | Required |
| **Firestore** | Read: own user doc. Write: update name, phone, notification prefs |
| **Storage** | Write: avatar upload to `organisations/{orgId}/users/{userId}/avatar.jpg` |

**For password change:** Use Firebase Auth `updatePassword()` (requires recent sign-in or re-authentication).

---

## 5. MVP Backend Priorities

### Phase 1: Implement first (absolute minimum)

| Feature | Firebase Service | Why first |
|---------|-----------------|-----------|
| **Email/password auth** | Auth | Nothing works without login |
| **User lookup on login** | Firestore | Need role + org to load the app |
| **Properties CRUD** | Firestore | Issues need properties to exist |
| **Issues CRUD** | Firestore | Core feature |
| **Photo upload** | Storage + Firestore | Core to value prop — evidence |
| **Issue status workflow** | Firestore | The accountability lifecycle |
| **Issue updates/comments** | Firestore | Communication + history |
| **Basic Firestore Security Rules** | Firestore | Protect data from the start |
| **Basic Storage Security Rules** | Storage | Prevent unauthorised uploads |

### Phase 2: Implement next

| Feature | Firebase Service | Why next |
|---------|-----------------|----------|
| **Activity log writes** | Firestore | Audit trail — core differentiator |
| **Role-based page access** | Auth + Firestore | Enforce permissions |
| **Property-scoped data filtering** | Firestore | PMs and contractors see only their data |
| **Denormalised count updates** | Firestore | Dashboard accuracy |
| **Units/areas** | Firestore | Refine issue location |
| **User invite flow** | Auth + Firestore | Admin can add team members |

### Phase 3: Implement after core is working

| Feature | Firebase Service | Why later |
|---------|-----------------|-----------|
| **Inspections + checklists** | Firestore + Storage | Important but issues come first |
| **Auto-issue from inspection failures** | Firestore | Depends on inspections |
| **Reports / export** | Firestore (read) | Client-side generation, no new infra |
| **Tighter Security Rules** | Firestore + Storage | Refine after patterns are established |

### Phase 4: Post-MVP enhancements (Cloud Functions)

| Feature | Firebase Service | Why later |
|---------|-----------------|-----------|
| **Email notifications** | Cloud Functions + SendGrid/Mailgun | Nice-to-have, not blocking |
| **Thumbnail generation** | Cloud Functions + Storage | Performance optimisation |
| **Denormalised count maintenance** | Cloud Functions | Reliability — move counts to server-side |
| **Custom claims for roles** | Cloud Functions + Auth | Performance — avoid extra Firestore read on every rule check |
| **Scheduled overdue checks** | Cloud Functions (scheduled) | Automated alerts |
| **Data export / backup** | Cloud Functions | Compliance |

### Simplest viable backend

For the MVP to work, you need exactly:

1. **Firebase project** with Auth, Firestore, Storage, and Hosting enabled
2. **Auth:** email/password provider turned on
3. **Firestore:** collections created on first write (no setup needed)
4. **Storage:** default bucket, basic rules
5. **Hosting:** deploy the static web app
6. **No Cloud Functions needed for MVP** — all logic runs client-side

The entire MVP backend is serverless with zero infrastructure to manage.

---

## Firestore Security Rules (MVP Starter)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper: get user document
    function getUserData(orgId) {
      return get(/databases/$(database)/documents/organisations/$(orgId)/users/$(request.auth.uid)).data;
    }

    // Helper: check user role
    function hasRole(orgId, role) {
      return getUserData(orgId).role == role;
    }

    // Helper: check if user is owner
    function isOwner(orgId) {
      return hasRole(orgId, 'owner');
    }

    // User-org lookup (needed for login)
    match /userOrgs/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow write: if false; // Only admin/Cloud Functions
    }

    // Organisation data
    match /organisations/{orgId} {
      allow read: if isSignedIn();

      // Users
      match /users/{userId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn() && isOwner(orgId);
      }

      // Properties
      match /properties/{propertyId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn() && isOwner(orgId);
        allow update: if isSignedIn();

        match /units/{unitId} {
          allow read: if isSignedIn();
          allow write: if isSignedIn();
        }
      }

      // Issues
      match /issues/{issueId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
        allow update: if isSignedIn();
        allow delete: if isSignedIn() && isOwner(orgId);

        // Issue updates — append-only
        match /updates/{updateId} {
          allow read: if isSignedIn();
          allow create: if isSignedIn();
          allow update, delete: if false; // Immutable
        }
      }

      // Attachments — permanent
      match /attachments/{attachmentId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
        allow update, delete: if false; // Evidence is permanent
      }

      // Inspections
      match /inspections/{inspectionId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
        allow update: if isSignedIn();

        match /responses/{responseId} {
          allow read: if isSignedIn();
          allow create, update: if isSignedIn();
          allow delete: if false;
        }
      }

      // Checklist templates
      match /checklistTemplates/{templateId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn();

        match /items/{itemId} {
          allow read: if isSignedIn();
          allow write: if isSignedIn();
        }
      }

      // Activity log — append-only
      match /activityLog/{logId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn();
        allow update, delete: if false; // Immutable audit trail
      }
    }
  }
}
```

**Note:** These MVP rules are permissive within an org — any signed-in user can read most data. Tighten per-role and per-property scoping in Phase 2 after the core is working. The critical rules (immutable updates, permanent attachments, immutable audit log) are enforced from day one.

---

## Firestore Indexes (MVP)

Create these composite indexes in the Firebase console or `firestore.indexes.json`:

| Collection | Fields | Query purpose |
|-----------|--------|---------------|
| `issues` | `propertyId` ASC, `status` ASC | Issues by property filtered by status |
| `issues` | `propertyId` ASC, `createdAt` DESC | Recent issues for a property |
| `issues` | `assignedTo` ASC, `status` ASC | Contractor's assigned issues |
| `issues` | `status` ASC, `dueDate` ASC | Overdue issue detection |
| `issues` | `status` ASC, `createdAt` DESC | Dashboard: recent open issues |
| `inspections` | `propertyId` ASC, `status` ASC | Inspections by property |
| `inspections` | `propertyId` ASC, `scheduledDate` DESC | Upcoming inspections |
| `inspections` | `inspectorId` ASC, `status` ASC | Inspector's assignments |
| `activityLog` | `propertyId` ASC, `createdAt` DESC | Property history |
| `activityLog` | `entityType` ASC, `entityId` ASC, `createdAt` DESC | Entity history |
| `activityLog` | `performedBy` ASC, `createdAt` DESC | User activity |
