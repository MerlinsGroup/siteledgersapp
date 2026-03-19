# SiteLedgers — Architecture & Route Structure

A client-first property oversight and accountability platform for post-build property management. SiteLedgers gives property owners, landlords, developers, and operators full visibility across their portfolio — tracking defects, snagging, inspections, compliance, maintenance accountability, and audit trails with timestamped evidence.

---

## Product Positioning

**What SiteLedgers is:**
A visibility and accountability platform for people who own, manage, or oversee operational properties. It provides a clear audit trail of issues, inspections, and responsible parties — with evidence, timestamps, and proof of resolution.

**What SiteLedgers is NOT:**
A construction-phase project management tool for workers during the build.

**Primary users:** Property owners, landlords, developers, operators, client-side asset/property management teams.

**Secondary users:** Contractors, maintenance teams, site teams, suppliers, or any responsible party who receives assigned actions.

**Main value proposition:** One platform to log defects, assign accountability, track resolution, run inspections, and maintain a complete evidence trail across your entire property portfolio — so nothing falls through the cracks and every action is provable.

---

## Route Structure

### Public Pages

#### `/` — Landing Page
**Purpose:** Introduce SiteLedgers as a property oversight and accountability platform for owners, landlords, and operators.
**Sections:**
- Hero banner: "Full visibility across your property portfolio" with CTA (Sign Up / Request Demo)
- Value propositions: defect tracking, snagging, inspections, compliance, audit trails
- Who it's for: property owners, landlords, developers, operators, asset managers
- How it works (3-step overview: log issues → assign accountability → track to resolution)
- Trust signals / testimonials from property management clients
- Footer with links to contact, login, terms
**User Actions:**
- Navigate to sign up or login
- Request a demo via contact page

#### `/login` — Sign In Page
**Purpose:** Authenticate existing users or allow new users to register.
**Sections:**
- Login form (email + password)
- "Forgot password" link
- Sign-up link / toggle to registration form
- OAuth buttons (Google, Microsoft) — future
**User Actions:**
- Sign in with credentials
- Reset password
- Navigate to registration

#### `/contact` — Contact / Demo Page
**Purpose:** Let prospective clients request a demo, ask questions, or get in touch.
**Sections:**
- Contact form (name, email, company/portfolio, message)
- Company contact info
- Optional: embedded calendar for scheduling demos
**User Actions:**
- Submit contact/demo request form

---

### Authenticated App Pages

#### `/dashboard` — Portfolio Dashboard
**Purpose:** Portfolio-level overview giving the client instant visibility across all their properties — open issues, overdue items, upcoming inspections, and accountability status.
**Sections:**
- Portfolio summary cards (total properties, open issues, overdue issues, inspections due, unresolved defects)
- Overdue & critical items panel (issues past due date, unacknowledged assignments)
- Recent activity feed (new issues logged, status changes, inspections completed, evidence uploaded)
- Property health overview (table or cards showing each property with its issue/inspection status at a glance)
- Quick actions (Log Issue, Start Inspection, View Properties)
**User Actions:**
- Drill into any property, issue, or inspection from the dashboard
- Filter by property, date range, assigned party, or status
- Identify overdue items and accountability gaps at a glance
- Create a new issue or inspection quickly

#### `/properties` — Properties List
**Purpose:** View and manage all properties in the portfolio — buildings, blocks, developments, or individual units.
**Sections:**
- Search and filter bar (by name, location, type, status, issue count)
- Properties list/grid showing: name, address, type (residential/commercial/mixed), open issue count, last inspection date, overall status
- "Add New Property" button
**User Actions:**
- Search/filter properties
- Click into a property for full detail
- Add a new property to the portfolio
- Sort by issue count, last inspected, or status

#### `/properties/:id` — Property Overview
**Purpose:** Complete view of a single property — its current issues, inspection history, assigned teams, and evidence log.
**Sections:**
- Property header (name, address, type, map/location, status indicator)
- Tab or section: **Open Issues** — defects, snags, and maintenance items logged against this property
- Tab or section: **Inspections** — inspection history and upcoming scheduled inspections
- Tab or section: **Assigned Parties** — contractors, maintenance teams, and responsible contacts linked to this property
- Tab or section: **Property Details** — edit property info, add notes, upload documents
- Tab or section: **Evidence & History** — full audit log of all actions, uploads, and status changes for this property
**User Actions:**
- View and filter issues for this property
- Log a new issue against this property
- Schedule or start an inspection
- Assign or remove responsible parties
- Upload property documents or photos
- Review the full activity/evidence trail

#### `/issues/new` — Log New Issue
**Purpose:** Log a new defect, snag, maintenance issue, or compliance concern against a property with full evidence.
**Sections:**
- Form fields: title, description, property (dropdown), category (defect/snag/maintenance/compliance/other), priority, location within property (e.g. "Unit 4B, kitchen")
- Photo/evidence upload (camera capture or file upload — multiple files)
- Geolocation capture (auto-detect or manual pin)
- Assign to responsible party (contractor, maintenance team, or individual)
- Due date / resolution deadline
- Notes or instructions for the assigned party
**User Actions:**
- Fill out and submit the issue form
- Upload photo evidence (multiple images)
- Capture or confirm geolocation
- Assign accountability to a responsible party with a deadline
- Set priority and category

#### `/issues/:id` — Issue Detail
**Purpose:** Full view of a single issue with its complete evidence trail, assignment history, progress updates, and verification status. This is the core accountability record.
**Sections:**
- Issue header (title, status badge, priority, category, property name)
- **Evidence gallery** — all photos and documents uploaded as proof (timestamped, with uploader name)
- **Details panel** — description, location within property, geolocation/map, date logged
- **Assignment & accountability** — who raised it, who it's assigned to, due date, current responsible party
- **Progress timeline** — chronological history of every action: status changes, reassignments, comments, evidence uploads, each with timestamp and user
- **Status controls** — update status (open → acknowledged → in progress → resolved → verified → closed)
- **Verification section** — mark as verified with sign-off, add verification evidence (e.g. photo of completed fix)
- **Comments/notes thread** — communication between client and responsible party
**User Actions:**
- Update issue status through the workflow
- Upload additional evidence at any stage
- Reassign to a different responsible party
- Add comments or notes
- Mark as verified (client confirms fix is satisfactory)
- View the complete audit trail with timestamps
- Export issue record as PDF (for compliance/records)

#### `/inspections` — Inspections List
**Purpose:** View all inspections across the portfolio — scheduled, in progress, and completed.
**Sections:**
- Search and filter bar (by property, date, status, inspector, type)
- Inspections list showing: property name, inspection type (routine/compliance/handover/snagging), date, inspector, completion %, pass rate
- "New Inspection" button
- Upcoming/overdue inspections highlighted
**User Actions:**
- Search/filter inspections
- Click into an inspection for detail
- Schedule a new inspection
- Identify overdue inspections

#### `/inspections/:id` — Inspection Detail / Checklist
**Purpose:** Conduct or review an inspection using a structured checklist — with evidence capture per item and a formal sign-off.
**Sections:**
- Inspection header (property, type, date, inspector, status)
- **Checklist items** — each item has: pass/fail/NA status, notes field, photo evidence upload, flag to auto-create issue if failed
- **Summary panel** — completion %, pass rate, items flagged, issues auto-generated
- **Sign-off section** — inspector signature/name, date, client sign-off (optional)
- **Comments/notes** — general inspection notes
- Linked issues (issues created from failed checklist items)
**User Actions:**
- Mark items as pass/fail/NA
- Add notes and photo evidence per checklist item
- Auto-create an issue from a failed item (pre-filled with inspection context)
- Complete and sign off the inspection
- Export inspection report as PDF
- Review linked issues

#### `/reports` — Reports, Audit Trail & Export
**Purpose:** Generate oversight reports, review audit trails, and export records for compliance, board reporting, or legal purposes.
**Sections:**
- Report type selector:
  - **Issues summary** — open/closed/overdue by property, category, or responsible party
  - **Inspection summary** — pass rates, completion rates, compliance status by property
  - **Accountability report** — response times, resolution times, overdue items by assigned party
  - **Property health** — overall status across the portfolio
  - **Audit trail** — full chronological log of all actions across the portfolio
- Date range and filter controls
- Report preview (tables, charts)
- Export options: PDF, CSV, Excel
**User Actions:**
- Select report type and apply filters
- Generate and preview the report
- Export/download for records, compliance, or sharing
- Schedule recurring reports (future)

#### `/users` — Team & Contacts Management
**Purpose:** Manage internal team members and external responsible parties (contractors, maintenance teams, suppliers) who can be assigned accountability.
**Sections:**
- **Internal team** — users with app access, roles (admin, manager, inspector, viewer), assigned properties
- **External contacts** — contractors, maintenance companies, suppliers — people who receive assigned issues but may or may not have app access
- "Invite User" / "Add Contact" buttons
- Search/filter by name, role, or assigned property
**User Actions:**
- Invite a new internal team member (by email)
- Add an external contact/contractor
- Set roles and permissions
- Assign contacts to specific properties
- Deactivate/remove users
- View assignment history for any user/contact

#### `/profile` — User Profile / Settings
**Purpose:** View and edit the logged-in user's own profile and notification preferences.
**Sections:**
- Profile info (name, email, phone, company/organization, avatar)
- Password change form
- Notification preferences (email alerts for: new assignments, overdue items, inspection reminders, status changes)
- App preferences (default property view, theme)
**User Actions:**
- Edit profile information
- Change password
- Configure notification preferences
- Update display preferences

---

## Project Structure

```
siteledgersapp/
├── index.html                  # Entry point — app shell
├── app.py                      # (Reserved for future backend/API)
├── ARCHITECTURE.md             # This file
│
├── pages/                      # One HTML partial per route
│   ├── public/
│   │   ├── landing.html
│   │   ├── login.html
│   │   └── contact.html
│   └── app/
│       ├── dashboard.html
│       ├── properties.html
│       ├── property-detail.html
│       ├── issue-new.html
│       ├── issue-detail.html
│       ├── inspections.html
│       ├── inspection-detail.html
│       ├── reports.html
│       ├── users.html
│       └── profile.html
│
├── components/                 # Reusable UI components (HTML snippets + JS)
│   ├── navbar.html             # Top navigation bar
│   ├── sidebar.html            # Sidebar navigation (authenticated)
│   ├── footer.html             # Footer
│   ├── issue-card.html         # Issue summary card (used in lists/dashboard)
│   ├── property-card.html      # Property summary card
│   ├── inspection-card.html    # Inspection summary card
│   ├── photo-upload.html       # Photo/evidence upload widget
│   ├── map-widget.html         # Geolocation/map display widget
│   ├── checklist-item.html     # Single checklist row for inspections
│   ├── comment-thread.html     # Comment/activity thread
│   ├── status-badge.html       # Status badge (open, in progress, verified, etc.)
│   ├── progress-timeline.html  # Chronological action/evidence timeline
│   ├── filter-bar.html         # Search + filter controls
│   └── modal.html              # Generic modal dialog
│
├── css/                        # Stylesheets
│   ├── main.css                # Global styles, variables, reset
│   ├── layout.css              # Grid, flexbox, responsive layout
│   ├── components.css          # Styles for reusable components
│   ├── pages.css               # Page-specific styles
│   └── utilities.css           # Utility classes (spacing, text, etc.)
│
├── js/                         # JavaScript
│   ├── app.js                  # App initialization, router setup
│   ├── router.js               # Client-side router
│   ├── auth.js                 # Authentication logic (Firebase Auth later)
│   ├── api.js                  # Data access layer (Firestore later)
│   ├── state.js                # Simple app state management
│   │
│   ├── pages/                  # Page-specific logic
│   │   ├── dashboard.js
│   │   ├── properties.js
│   │   ├── property-detail.js
│   │   ├── issue-new.js
│   │   ├── issue-detail.js
│   │   ├── inspections.js
│   │   ├── inspection-detail.js
│   │   ├── reports.js
│   │   ├── users.js
│   │   └── profile.js
│   │
│   └── utils/                  # Utility functions
│       ├── geolocation.js      # Geolocation helpers
│       ├── photo.js            # Photo capture/upload helpers
│       ├── date.js             # Date formatting helpers
│       └── validation.js       # Form validation helpers
│
└── assets/                     # Static assets
    ├── images/                 # App images, illustrations
    │   └── logo.svg
    ├── icons/                  # Icon set or SVG icons
    └── fonts/                  # Custom fonts (if any)
```

---

## Key Architectural Decisions

1. **Vanilla HTML/CSS/JS** — No framework. Keeps things simple, fast, and easy to understand. Firebase will handle the backend.
2. **Client-side routing** — `router.js` handles hash-based routing to load page partials into the app shell.
3. **Component-based partials** — Reusable HTML snippets loaded dynamically. Not a full component system, but enough to avoid duplication.
4. **Separation of concerns** — Pages define layout, components define reusable pieces, JS handles logic, CSS handles presentation.
5. **Mobile-first responsive** — CSS uses mobile-first breakpoints. Works on phone, tablet, and desktop browsers.
6. **Firebase-ready** — `auth.js` and `api.js` are stubbed as the data layer. Firebase Auth and Firestore will plug in later.
7. **Evidence-first design** — Every issue and inspection is built around timestamped evidence, accountability, and audit trails. This is the core differentiator.
8. **Portfolio-level visibility** — The dashboard and reports are designed for clients overseeing multiple properties, not individual site workers.
