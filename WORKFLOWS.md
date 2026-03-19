# SiteLedgers — MVP Workflows & User Journeys

---

## Workflow 1: User Logs In and Lands on Dashboard

**Primary user:** Any authenticated user (experience varies by role)
**Trigger:** User navigates to the app or opens a bookmarked URL

### Step-by-step flow

1. User opens the app → sees the landing page (`/`)
2. Clicks "Sign In" → navigates to `/login`
3. Enters email and password → submits the form
4. System authenticates via Firebase Auth
5. System looks up the user record → retrieves `role` and `assignedProperties`
6. Redirects to `/dashboard`
7. Dashboard renders based on role:

| Role | Dashboard shows |
|------|----------------|
| **Owner** | Portfolio-wide summary: all properties, total open/overdue issues, upcoming inspections, recent activity across everything |
| **Property Manager** | Same layout but scoped to assigned properties only |
| **Inspector** | Focused on: inspections due, inspections in progress, issues pending verification |
| **Contractor** | Minimal: list of issues assigned to them, due dates, items needing acknowledgement |
| **Viewer** | Read-only version of the Owner/PM dashboard (scoped if applicable) |

### Data affected
- `user.lastLoginAt` updated
- Activity log: `user_logged_in` (optional — may skip for MVP to reduce noise)

### Result
User sees a personalised overview of what needs their attention. Every role lands on actionable information, not a blank page.

---

## Workflow 2: Client-Side User Creates a New Issue / Defect

**Primary user:** Owner, Property Manager, or Inspector
**Trigger:** User spots a defect, receives a complaint, or identifies a problem during a property visit
**Why:** To formally log the issue with evidence so it enters the accountability system

### Step-by-step flow

1. User clicks "Log Issue" from the dashboard quick actions or navigates to `/issues/new`
2. **Selects property** from dropdown (pre-filtered to their assigned properties)
3. **Selects unit/area** within the property (optional — can be property-level)
4. **Enters title** — short summary (e.g. "Damp patch on ceiling — Unit 3A bedroom")
5. **Enters description** — detailed explanation of the issue
6. **Selects category** — defect / snag / maintenance / compliance / other
7. **Selects priority** — critical / high / medium / low
8. **Uploads photos/evidence** — one or more images from camera or file picker. Each photo is timestamped and geotagged if available
9. **Enters location description** (optional free text, e.g. "Above the window on the north wall")
10. **Captures geolocation** — auto-detected or manually placed on map (optional)
11. **Assigns to responsible party** (optional at this stage — can assign later)
    - Dropdown shows contractors and maintenance contacts linked to this property
    - If assigned now, sets a due date
12. **Submits the issue**

### Data created
- New **Issue** document: status = `open`, `reportedBy` = current user, all form fields saved
- New **Attachment** documents: one per uploaded photo/file, linked to the issue
- New **Issue Update** (type: `status_change`): records initial creation
- New **Activity Log** entry: `issue_created`
- If assigned: additional **Activity Log** entry: `issue_assigned`
- **Property** `openIssueCount` incremented

### Status changes
- Issue created with status: **open**

### Result
The issue is now in the system with evidence and timestamps. It appears on the dashboard, in the property's issue list, and (if assigned) in the contractor's assignment queue. The audit trail begins.

---

## Workflow 3: Issue Is Assigned to a Contractor or Responsible Party

**Primary user:** Owner or Property Manager
**Trigger:** An unassigned issue needs a responsible party, or an existing assignment needs to change
**Why:** To create clear accountability — someone specific is now responsible for resolving this issue by a deadline

### Step-by-step flow

1. User navigates to the issue detail page (`/issues/:id`) — either from dashboard, property page, or issues list
2. Views the issue details, evidence, and current status
3. Clicks "Assign" (or "Reassign" if already assigned)
4. **Selects responsible party** from dropdown:
   - Shows contractors, maintenance contacts, and internal team members
   - Filtered to contacts linked to this property (with option to search all)
5. **Sets due date** — resolution deadline
6. **Adds assignment note** (optional) — instructions or context for the assignee (e.g. "Access via the service entrance, contact building manager first")
7. **Confirms assignment**

### Data updated
- **Issue** document: `assignedTo`, `assignedToName`, `dueDate` updated
- New **Issue Update** (type: `reassignment`): records who was assigned and by whom
- New **Activity Log** entry: `issue_assigned` or `issue_reassigned`
- If contractor has app access: they see the issue in their dashboard on next login

### Status changes
- Issue remains **open** (status changes to **acknowledged** only when the contractor accepts)

### Result
A specific person or team is now accountable for this issue with a clear deadline. The assignment is recorded in the audit trail. The contractor can see their new assignment.

### Future enhancement
- Email/push notification sent to the assigned party
- Escalation rules if not acknowledged within X hours

---

## Workflow 4: Assigned User Updates Progress and Uploads Proof

**Primary user:** Contractor / Maintenance User
**Trigger:** Contractor logs in and sees assigned issues, or receives a notification about a new assignment
**Why:** To acknowledge the work, show progress, and upload evidence of work being done

### Step-by-step flow

1. Contractor logs in → lands on their dashboard showing assigned issues
2. Sees a new issue with status **open** → clicks into it (`/issues/:id`)
3. Reviews the issue: description, photos, location, priority, due date, assignment notes

**Step A: Acknowledge**
4. Clicks "Acknowledge" → confirms they have seen the issue and accept responsibility
5. Issue status changes to **acknowledged**

**Step B: Start work**
6. When work begins, clicks "Mark In Progress"
7. Issue status changes to **in_progress**
8. Optionally adds a comment: "Attending site tomorrow morning" or "Ordered replacement parts"

**Step C: Upload progress evidence**
9. During or after the work, uploads photos showing progress or the fix
10. Each upload is timestamped and attributed to the contractor
11. Adds a comment explaining what was done

**Step D: Mark resolved**
12. When work is complete, clicks "Mark Resolved"
13. Uploads final evidence photos (e.g. the completed fix)
14. Adds a resolution note: "Damp patch treated and repainted. Source was a leaking pipe joint — now sealed."
15. Issue status changes to **resolved**

### Data updated
- **Issue** document: `status` updated at each transition, `resolvedAt` set when resolved
- New **Issue Updates** at each step (status changes + comments)
- New **Attachment** documents for each photo uploaded
- New **Activity Log** entries: `issue_status_changed`, `evidence_uploaded`, `issue_commented`
- **Property** counts remain unchanged (issue is still "open" in the broad sense until verified)

### Status changes
- **open** → **acknowledged** → **in_progress** → **resolved**

### Result
The client can see exactly when the contractor acknowledged the issue, when work started, what evidence was uploaded, and when it was marked as done. Every step is timestamped. The issue is now waiting for client-side verification.

### What the contractor CANNOT do
- Cannot verify or close the issue (that's the client's job)
- Cannot reassign to someone else
- Cannot delete the issue or remove evidence
- Cannot see other contractors' issues

---

## Workflow 5: Issue Is Marked Complete (Resolved by Contractor)

**Primary user:** Contractor
**Trigger:** Physical work is finished, contractor is ready to hand back to the client
**Why:** To formally signal that the work is done and present proof for the client to verify

This is the final step of Workflow 4. Broken out here to emphasise the handover moment.

### Step-by-step flow

1. Contractor is on the issue detail page with status **in_progress**
2. Clicks "Mark Resolved"
3. System requires:
   - At least one piece of evidence (photo/document) uploaded after work began — **proof of fix is mandatory**
   - A resolution note explaining what was done
4. Contractor uploads final photos and writes the note
5. Confirms resolution
6. Issue status → **resolved**
7. Issue now appears in the "Awaiting Verification" queue on the Property Manager's / Owner's dashboard

### Data updated
- **Issue**: `status` = `resolved`, `resolvedAt` = now
- New **Issue Update** (type: `status_change`): resolved, with resolution note
- New **Attachments**: final evidence photos
- New **Activity Log**: `issue_status_changed` (to resolved)

### Validation rule (enforced in UI and data layer)
- Cannot mark resolved without at least one attachment uploaded after the issue was acknowledged
- Cannot mark resolved without a resolution note
- This ensures every "resolved" issue has proof attached

### Result
The ball is now in the client's court. The contractor has done their part and provided evidence. The client must now verify the fix is satisfactory.

---

## Workflow 6: Client-Side Manager or Inspector Verifies and Closes the Issue

**Primary user:** Property Manager, Inspector, or Owner
**Trigger:** An issue has been marked as **resolved** by the contractor and needs client-side sign-off
**Why:** To confirm the fix is satisfactory, or reject it and send it back. This is the accountability guarantee — the person who did the work cannot sign off their own work.

### Step-by-step flow

**Path A: Fix is satisfactory**

1. PM/Inspector sees "Awaiting Verification" items on their dashboard or in the property's issue list
2. Clicks into the issue (`/issues/:id`)
3. Reviews the full history:
   - Original report and evidence
   - Contractor's progress updates and comments
   - Resolution evidence (photos of the completed fix)
   - Timestamps showing when each step happened
4. Optionally visits the property to physically inspect the fix
5. Uploads **verification evidence** (optional — photo confirming the fix looks good)
6. Clicks "Verify" → adds a verification note (e.g. "Inspected on site — fix is satisfactory")
7. Issue status → **verified**, `verifiedAt` = now, `verifiedBy` = current user
8. Clicks "Close" → issue status → **closed**, `closedAt` = now, `closedBy` = current user
   (Verify and close can be done in one step or two separate steps)

**Path B: Fix is not satisfactory**

1. Steps 1–3 same as above
2. Reviews the evidence and finds the fix is inadequate
3. Clicks "Reject / Reopen"
4. Adds a comment explaining why: "Paint is peeling already — needs a second coat and proper prep"
5. Optionally uploads evidence of the remaining problem
6. Issue status → **in_progress** (sent back to the contractor)
7. Contractor sees the issue back in their queue with the rejection comment

### Data updated (Path A)
- **Issue**: `status` = `verified` then `closed`, `verifiedAt`, `verifiedBy`, `closedAt`, `closedBy` set
- New **Issue Updates**: verification note, closure note
- New **Attachments**: verification evidence (if uploaded)
- New **Activity Log**: `issue_status_changed` (verified), `issue_closed`
- **Property**: `openIssueCount` decremented

### Data updated (Path B)
- **Issue**: `status` = `in_progress`, `resolvedAt` cleared
- New **Issue Update**: rejection comment
- New **Activity Log**: `issue_status_changed` (back to in_progress)

### Status changes
- Path A: **resolved** → **verified** → **closed**
- Path B: **resolved** → **in_progress** (rejection loop)

### Result
**Path A:** The issue has a complete, auditable lifecycle from creation to verified closure. Every step has timestamps, evidence, and named users. This record is permanent.

**Path B:** The contractor is held accountable — the fix was not good enough and they must try again. The rejection is recorded in the audit trail.

---

## Workflow 7: User Runs or Completes an Inspection

**Primary user:** Inspector, Property Manager, or Owner
**Trigger:** A scheduled inspection is due, or user initiates an ad-hoc inspection
**Why:** To formally check the condition of a property against a structured checklist, capture evidence, and auto-create issues for anything that fails

### Step-by-step flow

**Step A: Schedule the inspection**

1. User navigates to `/inspections` and clicks "New Inspection"
2. Selects the **property** to inspect
3. Selects a **checklist template** (e.g. "Quarterly Routine Check", "Fire Safety Compliance")
4. Sets the **scheduled date**
5. Assigns an **inspector** (can be themselves or another user with inspector role)
6. Selects the **inspection type** (routine / snagging / compliance / handover / ad hoc)
7. Saves → inspection created with status **scheduled**

**Step B: Conduct the inspection**

8. On the scheduled date, inspector navigates to the inspection (`/inspections/:id`)
9. Clicks "Start Inspection" → status changes to **in_progress**, `startedAt` recorded
10. For each checklist item:
    a. Reads the item description (e.g. "Fire extinguisher present and in date")
    b. Marks the result: **pass**, **fail**, or **N/A**
    c. If fail: adds a note explaining the failure
    d. If the template item has `requiresPhoto`: uploads a photo
    e. Optionally uploads photos for any item (evidence of condition)
    f. If the template item has `autoCreateIssue` and the result is **fail**: system flags this item for auto-issue creation
11. Repeats for all items in the checklist
12. Adds general inspection notes (optional)
13. Clicks "Complete Inspection" → status changes to **completed**

**Step C: Auto-create issues from failures**

14. For each failed item flagged for auto-issue creation, the system creates a new Issue:
    - Title: auto-generated from the checklist item description
    - Property: same as the inspection
    - Category: inferred from inspection type (or `defect` by default)
    - Priority: `medium` by default (inspector can adjust)
    - Description: includes the inspector's failure note
    - Attachments: linked from the inspection item evidence
    - `inspectionId`: linked back to this inspection
    - Status: `open`
15. Inspector reviews the auto-created issues and can adjust titles, priorities, or descriptions
16. Issues appear in the property's issue queue ready for assignment

**Step D: Sign off**

17. Inspector (or PM/Owner) reviews the completed inspection summary:
    - Total items, passed, failed, N/A
    - Pass rate percentage
    - List of issues created
18. Clicks "Sign Off" → status changes to **signed_off**, `signedOffAt` and `signedOffBy` recorded
19. Inspection is now a permanent record

### Data created
- **Inspection** document with all metadata
- **Checklist Response** documents (one per item) in subcollection
- **Attachment** documents for any photos taken during the inspection
- **Issue** documents for failed items with auto-create enabled
- **Activity Log** entries: `inspection_created`, `inspection_started`, `inspection_completed`, `inspection_signed_off`, plus `issue_created` for each auto-generated issue

### Status changes
- Inspection: **scheduled** → **in_progress** → **completed** → **signed_off**
- Auto-created issues: start at **open**

### Result
A complete, signed inspection record with per-item results, evidence, and auto-generated issues for anything that failed. The inspection report can be exported as PDF. Failed items automatically feed into the issue tracking workflow (Workflows 2–6).

---

## Workflow 8: User Views History, Evidence, and Audit Trail

**Primary user:** Owner, Property Manager, Viewer, or Inspector
**Trigger:** User needs to review what happened — for oversight, compliance, dispute resolution, or reporting
**Why:** To prove what was done, when, and by whom. This is the core accountability feature.

### Step-by-step flow

**Path A: Issue-level history**

1. User navigates to an issue (`/issues/:id`)
2. Scrolls to the **Progress Timeline** section
3. Sees a chronological list of every action:
   - Issue created by [name] on [date]
   - Assigned to [contractor] by [PM] on [date]
   - Acknowledged by [contractor] on [date]
   - Comment: "Attending site tomorrow" by [contractor] on [date]
   - Evidence uploaded: [photo thumbnail] by [contractor] on [date]
   - Status changed to In Progress by [contractor] on [date]
   - Evidence uploaded: [photo thumbnail] by [contractor] on [date]
   - Status changed to Resolved by [contractor] on [date] — note: "Fixed and repainted"
   - Status changed to Verified by [inspector] on [date] — note: "Inspected, satisfactory"
   - Closed by [PM] on [date]
4. Each entry shows: who, what, when, and any attached evidence
5. Can click on any photo to view full-size with metadata (timestamp, uploader, geolocation)

**Path B: Property-level history**

1. User navigates to a property (`/properties/:id`)
2. Opens the "Evidence & History" tab
3. Sees all activity for this property: issues created, inspections conducted, evidence uploaded, assignments, closures
4. Can filter by date range, action type, or user

**Path C: Portfolio-level audit trail**

1. User navigates to `/reports`
2. Selects "Audit Trail" report type
3. Filters by: date range, property, user, action type
4. Sees a table/feed of all actions across the portfolio
5. Can export as CSV or PDF

### Data read
- **Activity Log** entries (filtered by scope)
- **Issue Updates** (for issue-level detail)
- **Attachments** (for evidence display)

### Result
The user has a clear, provable record of everything that happened. No action can be hidden, deleted, or backdated. This is the data a client would use in a dispute, compliance audit, or board report.

---

## Workflow 9: Admin Manages Users and Property Access

**Primary user:** Owner / Client Admin
**Trigger:** New team member needs access, a contractor needs to be added, or permissions need updating
**Why:** To control who can see and do what across the portfolio

### Step-by-step flow

**Path A: Invite an internal team member**

1. Owner navigates to `/users`
2. Clicks "Invite User"
3. Enters: email, name, role (property_manager / inspector / viewer)
4. Assigns properties (selects which properties this user can access)
5. Clicks "Send Invite"
6. System creates a user record with `status: invited`, `hasAppAccess: true`
7. Sends an invite email with a signup/login link (Firebase Auth invite)
8. When the invitee signs up, their `status` updates to `active`

**Path B: Add an external contact (contractor/supplier)**

1. Owner or Property Manager navigates to `/users`
2. Clicks "Add Contact"
3. Enters: name, email, phone, company, role = `contractor`
4. Assigns to specific properties
5. Chooses whether to grant app access:
   - **With app access:** they can log in, see assigned issues, update progress, upload evidence
   - **Without app access:** they exist as a contact for assignment purposes only (issues tracked by the PM on their behalf) — useful for contractors who won't use the app
6. If granting app access: system sends an invite email
7. Contact appears in the users list and is available in assignment dropdowns

**Path C: Update permissions**

1. Owner navigates to `/users` and clicks on a user
2. Can change: role, assigned properties, active/deactivated status
3. Changes take effect immediately
4. Activity log records: `user_role_changed` or related action

**Path D: Deactivate a user**

1. Owner navigates to the user's record
2. Clicks "Deactivate"
3. User's `status` → `deactivated`
4. They can no longer log in
5. Their historical actions (issues reported, comments, evidence) remain in the system permanently
6. Issues currently assigned to them are flagged for reassignment on the PM's dashboard

### Data created/updated
- **User** documents: created, updated, or deactivated
- **Activity Log** entries: `user_invited`, `user_role_changed`, `user_deactivated`

### Result
The Owner has full control over who can access the platform and what they can see. External contractors can be added with minimal friction. All access changes are logged.

---

## Issue Lifecycle (MVP)

The complete journey of an issue from discovery to closure:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐      │
│  │ OPEN │───>│ ACKNOWLEDGED │───>│ IN PROGRESS │───>│ RESOLVED │      │
│  └──────┘    └──────────────┘    └─────────────┘    └──────────┘      │
│     │                                    ^               │             │
│     │                                    │               │             │
│  Created by:                        Rejection:      Contractor        │
│  Owner, PM,                         "Fix not        uploads proof     │
│  or Inspector                       satisfactory"   and marks done    │
│                                          │               │             │
│                                          │               v             │
│                                          │         ┌──────────┐       │
│                                          └─────────│ VERIFIED │       │
│                                                    └──────────┘       │
│                                                         │              │
│                                                    Client confirms     │
│                                                    fix is good         │
│                                                         │              │
│                                                         v              │
│                                                    ┌────────┐         │
│                                                    │ CLOSED │         │
│                                                    └────────┘         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

| Status | Set by | What happens | Evidence required |
|--------|--------|-------------|-------------------|
| **Open** | Owner / PM / Inspector | Issue is logged with description, photos, location | At least a description; photos recommended |
| **Acknowledged** | Contractor | Contractor accepts the assignment | None — just confirmation |
| **In Progress** | Contractor | Work has begun | Optional progress photos |
| **Resolved** | Contractor | Work is claimed complete | **Mandatory**: at least one photo + resolution note |
| **Verified** | PM / Inspector / Owner | Client confirms the fix is satisfactory | Optional verification photo |
| **Closed** | PM / Owner | Issue formally closed, enters permanent record | None |

**Rejection loop:** If verification fails, status returns to **In Progress** with a rejection comment. The contractor must address the feedback and re-resolve.

---

## Inspection Lifecycle (MVP)

```
┌───────────┐    ┌─────────────┐    ┌───────────┐    ┌────────────┐
│ SCHEDULED │───>│ IN PROGRESS │───>│ COMPLETED │───>│ SIGNED OFF │
└───────────┘    └─────────────┘    └───────────┘    └────────────┘
      │                │                  │                 │
  Created with    Inspector starts    All items         Formal sign-off
  property,       the checklist       checked,          with name and
  template,       on-site             summary           date. Permanent
  date, and                           calculated        record.
  inspector
```

| Status | Set by | What happens |
|--------|--------|-------------|
| **Scheduled** | PM / Inspector / Owner | Inspection planned with property, template, date, inspector |
| **In Progress** | Inspector | Inspector begins the checklist on-site |
| **Completed** | Inspector | All items checked, pass/fail tallied, issues auto-created from failures |
| **Signed Off** | Inspector / PM / Owner | Formal sign-off — inspection becomes a permanent, immutable record |

---

## MVP Build Order

Recommended development sequence — each phase builds on the previous:

### Phase 1: Foundation
| Priority | What | Why |
|----------|------|-----|
| 1 | Authentication (login/signup) | Nothing works without it |
| 2 | Organisation + User setup | Data container and role assignment |
| 3 | Dashboard (basic) | Landing experience after login |

### Phase 2: Core Issue Tracking
| Priority | What | Why |
|----------|------|-----|
| 4 | Properties list + detail | Issues need a property to belong to |
| 5 | Units/areas (basic) | Issues optionally reference a unit |
| 6 | Create issue form | The primary action — logging a defect |
| 7 | Issue detail page | View issue, evidence, description |
| 8 | Photo/evidence upload | Core to the value proposition |
| 9 | Issue assignment | Accountability starts here |
| 10 | Issue status workflow | Open → Acknowledged → In Progress → Resolved |
| 11 | Issue updates/comments | Communication between client and contractor |
| 12 | Verification and closure | Client-side sign-off — completes the loop |

### Phase 3: Accountability Layer
| Priority | What | Why |
|----------|------|-----|
| 13 | Activity log / audit trail | Proof of everything — core differentiator |
| 14 | Progress timeline on issue detail | Visual history per issue |
| 15 | Dashboard enhancements | Overdue items, property health, filters |

### Phase 4: Inspections
| Priority | What | Why |
|----------|------|-----|
| 16 | Checklist templates (basic — a few defaults) | Inspections need templates |
| 17 | Create/schedule inspection | Plan the inspection |
| 18 | Conduct inspection (checklist UI) | Fill in pass/fail per item |
| 19 | Auto-create issues from failures | Bridge inspections → issue tracking |
| 20 | Inspection sign-off and summary | Complete the inspection record |

### Phase 5: Reporting & Polish
| Priority | What | Why |
|----------|------|-----|
| 21 | Reports page (basic — issues summary, inspection summary) | Client oversight |
| 22 | PDF/CSV export | Compliance and record-keeping |
| 23 | User management (invite, roles, property assignment) | Admin controls |
| 24 | Notification preferences | User settings |
