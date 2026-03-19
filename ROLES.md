# SiteLedgers — User Roles & Permissions

---

## Role Overview

| Role | Who They Are | Scope |
|------|-------------|-------|
| **Owner / Client Admin** | Property owner, landlord, developer, or head of the client organisation | All properties, all users, full control |
| **Property Manager** | Operations manager or property manager responsible for day-to-day oversight | Assigned properties only, full operational control within scope |
| **Contractor / Maintenance** | External party (contractor, supplier, maintenance team) assigned actions | Assigned issues only, limited to updating their own work |
| **Inspector / Compliance** | Internal or external inspector conducting inspections and compliance checks | Assigned properties, focused on inspections and verification |
| **Viewer** | Board member, investor, client stakeholder, or auditor who needs visibility | Assigned properties, read-only across everything |

---

## Detailed Role Definitions

### 1. Owner / Client Admin

**Who they are:** The property owner, landlord, developer principal, or senior client-side manager. This is the person (or small team) who owns the account and needs full visibility and control across the entire portfolio.

**Page access:** All pages — no restrictions.

**Actions & permissions:**

| Capability | Permission |
|-----------|-----------|
| View dashboard (all properties) | Yes |
| View all properties | Yes |
| Add / edit / archive properties | Yes |
| View all issues (all properties) | Yes |
| Create issues | Yes |
| Assign issues to any party | Yes |
| Reassign issues | Yes |
| Change issue status (any transition) | Yes |
| Verify and close issues | Yes |
| Delete issues | Yes |
| View all inspections | Yes |
| Create / schedule inspections | Yes |
| Conduct inspections | Yes |
| Sign off inspections | Yes |
| View and export all reports | Yes |
| View audit trail | Yes |
| Invite / remove users | Yes |
| Set user roles | Yes |
| Assign users to properties | Yes |
| Manage external contacts | Yes |
| Edit own profile | Yes |
| Edit organisation settings | Yes |

**Data they can edit:** Everything.
**Data they can only view:** Nothing is restricted.

**Summary:** Full unrestricted access. This is the account owner role.

---

### 2. Property Manager / Operations Manager

**Who they are:** A member of the client-side team who manages day-to-day operations across one or more assigned properties. They handle issue triage, contractor coordination, and inspection scheduling. They do not manage the account itself.

**Page access:** All pages — but data is scoped to their assigned properties.

**Actions & permissions:**

| Capability | Permission |
|-----------|-----------|
| View dashboard (assigned properties) | Yes |
| View assigned properties | Yes |
| Add new properties | No |
| Edit assigned property details | Yes |
| Archive properties | No |
| View issues (assigned properties) | Yes |
| Create issues | Yes |
| Assign issues to any party | Yes |
| Reassign issues | Yes |
| Change issue status (any transition) | Yes |
| Verify and close issues | Yes |
| Delete issues | No |
| View inspections (assigned properties) | Yes |
| Create / schedule inspections | Yes |
| Conduct inspections | Yes |
| Sign off inspections | Yes |
| View and export reports (assigned properties) | Yes |
| View audit trail (assigned properties) | Yes |
| Invite / remove users | No |
| Set user roles | No |
| Assign users to properties | No (can request via Admin) |
| Manage external contacts | Yes (add/edit contacts for their properties) |
| Edit own profile | Yes |

**Data they can edit:** Issues, inspections, property details, and contacts — within assigned properties.
**Data they can only view:** Properties they are not assigned to (hidden entirely). User management. Organisation settings.

**Summary:** Full operational control within their assigned properties. Cannot manage the account, add properties, or access data outside their scope.

---

### 3. Contractor / Maintenance User

**Who they are:** An external party — a contractor, maintenance company, supplier, or tradesperson — who has been assigned specific issues to resolve. They may or may not have full app access; at minimum they receive assignments and can update their work.

**Page access:** Limited. Dashboard (filtered to their assignments), issue detail pages (assigned only), profile.

| Page | Access |
|------|--------|
| `/dashboard` | Yes — shows only their assigned issues and due dates |
| `/properties` | No |
| `/properties/:id` | No |
| `/issues/new` | No |
| `/issues/:id` | Yes — only issues assigned to them |
| `/inspections` | No |
| `/inspections/:id` | No |
| `/reports` | No |
| `/users` | No |
| `/profile` | Yes |

**Actions & permissions:**

| Capability | Permission |
|-----------|-----------|
| View dashboard (own assignments only) | Yes |
| View assigned issues | Yes |
| Create issues | No |
| Assign / reassign issues | No |
| Update status on assigned issues (acknowledged → in progress → resolved) | Yes |
| Verify or close issues | No |
| Upload evidence / photos on assigned issues | Yes |
| Add comments on assigned issues | Yes |
| View inspections | No |
| Conduct inspections | No |
| View reports | No |
| Manage users | No |
| Edit own profile | Yes |

**Data they can edit:** Status, evidence uploads, and comments on issues assigned to them — nothing else.
**Data they can only view:** Issue details for their assignments (title, description, property, priority, due date). They cannot see other issues, other properties, or other users' data.

**Key restriction:** Contractors **cannot** mark an issue as verified or closed. They can only mark it as "resolved" — the client-side user (Owner, Property Manager, or Inspector) must verify and close it. This protects the accountability chain.

**Summary:** Minimal access. Receive assignments, acknowledge them, upload proof of work, mark as resolved. The client verifies.

---

### 4. Inspector / Compliance User

**Who they are:** An internal team member or external inspection professional responsible for conducting inspections, compliance checks, snagging walks, and verifying issue resolution. They focus on evidence and standards.

**Page access:** Dashboard, assigned properties, issues (assigned properties), inspections (full access for assigned properties), reports (inspection-related), profile.

| Page | Access |
|------|--------|
| `/dashboard` | Yes — focused on inspections and verification tasks |
| `/properties` | Yes — assigned properties only |
| `/properties/:id` | Yes — assigned properties only |
| `/issues/new` | Yes — can log issues found during inspections |
| `/issues/:id` | Yes — assigned properties only |
| `/inspections` | Yes — assigned properties |
| `/inspections/:id` | Yes — full access |
| `/reports` | Yes — inspection and compliance reports only |
| `/users` | No |
| `/profile` | Yes |

**Actions & permissions:**

| Capability | Permission |
|-----------|-----------|
| View dashboard (assigned properties) | Yes |
| View assigned properties | Yes |
| Add / edit properties | No |
| View issues (assigned properties) | Yes |
| Create issues (from inspections or independently) | Yes |
| Assign issues | No (flags for Property Manager to assign) |
| Change issue status | Limited — can verify resolved issues (resolved → verified) |
| Verify and close issues | Yes — verification is their core function |
| Delete issues | No |
| View inspections (assigned properties) | Yes |
| Create / schedule inspections | Yes |
| Conduct inspections (fill checklists, upload evidence) | Yes |
| Sign off inspections | Yes |
| View and export inspection/compliance reports | Yes |
| View full audit trail | No (inspection-related trail only) |
| Manage users | No |
| Edit own profile | Yes |

**Data they can edit:** Inspection checklists and results. Issue verification status. Evidence uploads. New issues found during inspection.
**Data they can only view:** Issue assignments and general issue details. Property details. Other users.

**Key role in the accountability chain:** Inspectors are the verification layer. When a contractor marks an issue as "resolved," the Inspector (or Property Manager / Owner) is the one who verifies the fix is satisfactory and marks it "verified."

**Summary:** Inspection-focused role with the authority to verify issue resolution. Can log new issues found during inspections. Cannot assign issues or manage users.

---

### 5. Viewer / Read-Only Client User

**Who they are:** A board member, investor, client stakeholder, compliance auditor, or anyone who needs visibility into property status and accountability without making changes.

**Page access:** Dashboard, properties, issues, inspections, reports — all read-only, scoped to assigned properties (or all properties if granted by Admin).

| Page | Access |
|------|--------|
| `/dashboard` | Yes — read-only |
| `/properties` | Yes — read-only (assigned or all) |
| `/properties/:id` | Yes — read-only |
| `/issues/new` | No |
| `/issues/:id` | Yes — read-only |
| `/inspections` | Yes — read-only |
| `/inspections/:id` | Yes — read-only |
| `/reports` | Yes — can view and export |
| `/users` | No |
| `/profile` | Yes |

**Actions & permissions:**

| Capability | Permission |
|-----------|-----------|
| View dashboard | Yes |
| View properties | Yes |
| View issues | Yes |
| Create / edit / assign issues | No |
| View inspections | Yes |
| Conduct / edit inspections | No |
| View and export reports | Yes |
| View audit trail | Yes |
| Manage users | No |
| Edit own profile | Yes |

**Data they can edit:** Own profile only.
**Data they can only view:** Everything within their scope.

**Summary:** Full visibility, zero edit capability. Ideal for stakeholders who need oversight without operational involvement.

---

## Issue Lifecycle & Role Responsibilities

This is the core accountability workflow:

```
[OPEN] → [ACKNOWLEDGED] → [IN PROGRESS] → [RESOLVED] → [VERIFIED] → [CLOSED]
  │            │                │               │              │           │
  │            │                │               │              │           │
 Created by:  Contractor       Contractor      Contractor    Inspector/   Owner/
 Owner,       acknowledges     updates         marks work    PM verifies  PM closes
 PM, or       the assignment   progress &      as done &     the fix is   the record
 Inspector                     uploads         uploads       satisfactory
                               evidence        proof
```

| Status | Who Can Set It |
|--------|---------------|
| **Open** | Owner, Property Manager, Inspector (on creation) |
| **Acknowledged** | Contractor (accepting the assignment) |
| **In Progress** | Contractor |
| **Resolved** | Contractor (claiming work is done) |
| **Verified** | Inspector, Property Manager, Owner (confirming fix is satisfactory) |
| **Closed** | Property Manager, Owner (final closure) |

**Key rule:** The person who does the work (Contractor) **cannot** verify or close their own work. Verification must come from the client side. This is the accountability guarantee.

---

## MVP Recommendations

### Keep roles simple for MVP

For MVP, implement a **simple role-based system** with these 5 fixed roles. Do not build granular per-permission toggles yet.

**Reasoning:** Granular permissions add complexity to the UI (role editor, permission matrix) and to every data query (checking dozens of flags). Fixed roles are easier to implement, easier to understand for users, and cover 90% of real-world needs. Granular permissions can be added later as a premium/enterprise feature.

### MVP permission implementation

Store the role as a single field on the user record:

```
user.role = "owner" | "property_manager" | "contractor" | "inspector" | "viewer"
```

Property scoping is handled by a separate field:

```
user.assignedProperties = ["propertyId1", "propertyId2"]  // empty = all (for owner)
```

Issue scoping for contractors:

```
user.assignedIssues = ["issueId1", "issueId2"]  // only relevant for contractor role
```

### MVP priority order

1. **Owner / Client Admin** — must have from day one (account creator)
2. **Property Manager** — core operational role, needed immediately
3. **Contractor / Maintenance** — needed as soon as issue assignment is live
4. **Viewer** — easy to implement (just hide edit controls), include in MVP
5. **Inspector / Compliance** — can be added shortly after MVP if needed, since Property Managers can handle inspections initially

### Data protection rules for MVP

1. **Contractors cannot see other contractors' issues** — each contractor sees only their assignments
2. **Contractors cannot verify or close their own work** — accountability chain must be enforced
3. **Property Managers cannot see properties they aren't assigned to** — data isolation between management scopes
4. **Viewers cannot edit anything** — enforced at both UI and data layer
5. **Only Owners can delete issues** — prevents accidental or malicious loss of evidence
6. **Audit trail entries are immutable** — no role can edit or delete timeline/history entries
7. **All evidence uploads are permanent** — photos and documents cannot be deleted once uploaded (evidence preservation)

---

## Role-Permission Matrix (Quick Reference)

| Action | Owner | PM | Contractor | Inspector | Viewer |
|--------|:-----:|:--:|:----------:|:---------:|:------:|
| View all properties | ✓ | Assigned | — | Assigned | Assigned/All |
| Add properties | ✓ | — | — | — | — |
| Edit properties | ✓ | Assigned | — | — | — |
| Create issues | ✓ | ✓ | — | ✓ | — |
| Assign issues | ✓ | ✓ | — | — | — |
| Update own assigned issues | ✓ | ✓ | ✓ | ✓ | — |
| Verify issues | ✓ | ✓ | — | ✓ | — |
| Close issues | ✓ | ✓ | — | — | — |
| Delete issues | ✓ | — | — | — | — |
| Create inspections | ✓ | ✓ | — | ✓ | — |
| Conduct inspections | ✓ | ✓ | — | ✓ | — |
| View reports | ✓ | ✓ | — | Inspection | ✓ |
| Export reports | ✓ | ✓ | — | Inspection | ✓ |
| Manage users | ✓ | — | — | — | — |
| Manage contacts | ✓ | ✓ | — | — | — |
| Upload evidence | ✓ | ✓ | ✓ | ✓ | — |
| View audit trail | ✓ | ✓ | — | Partial | ✓ |
