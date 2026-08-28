# BEMMS Role-Based User Experience, Flows, and Workflows

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Application modules](BEMMS-Application-Modules-and-Pages.md) · [UI/UX design](BEMMS-UI-UX-Design.md)
>
> **Related specifications:** [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Role-based device profiles](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [Maintenance triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) · [Administration](BEMMS-Administration-Settings-and-User-Management.md)

## 1. Purpose

This document defines how different BEMMS users experience the application, what they see, how they move through it, which actions they can take, and how their work connects to other users.

BEMMS serves people with very different needs. A doctor beside an infusion pump needs a fast way to identify the device and report a problem. A biomedical technician needs a clear assigned-work checklist. An engineer needs complete technical context and controlled decision tools. A manager needs exceptions and compliance. An administrator needs secure setup and access management.

The primary UX principle is:

> **Simple for the person beside the device; complete for the person responsible for maintaining it; controlled for the person configuring the system.**

This document complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — overall product, roles, security, and system requirements
* `BEMMS-Application-Modules-and-Pages.md` — modules, pages, and navigation
* `BEMMS-UI-UX-Design.md` — visual design, page layouts, mobile requirements, and interaction patterns
* `QR-Helpdesk-Ticketing-Workflow.md` — reporting, tickets, and helpdesk workflow
* `BEMMS-Role-Based-Device-Profiles-and-QR-Access.md` — QR access and role-specific device profiles
* `BEMMS-Maintenance-Types-and-Engineer-Triage.md` — technical classification and maintenance workflow
* `BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md` — PM/calibration planning and alerts
* `BEMMS-Administration-Settings-and-User-Management.md` — administration, setup, and user/access management

---

## 2. Experience Model

All users work with the same underlying devices, tickets, maintenance records, and history. The system changes the visible information and actions according to the signed-in user's role and authorized scope.

```text
Same device record
        ↓
Authentication + organization/hospital/department/role check
        ↓
Role-appropriate dashboard, device profile, ticket view, and actions
```

### 2.1 The Main User Journey

```text
Physical device
→ QR scan or department device selection
→ Device availability/status
→ Helpdesk ticket or maintenance request
→ Biomedical triage and assignment
→ Technical maintenance work, testing, and signatures
→ Device status/release decision
→ Ticket resolution and complete device history
```

### 2.2 User Groups

| User group | Primary purpose in BEMMS |
|---|---|
| Doctor / department staff | Identify device, understand availability, report a problem/request, and follow public progress. |
| Department manager | Monitor devices/tickets in the department and coordinate access or confirmation. |
| Biomedical technician | Perform assigned technical work and accurately document it. |
| Biomedical engineer | Triage, classify, assign, investigate, review, sign, release, and resolve technical work. |
| Biomedical manager | Manage biomedical workload, safety/compliance exceptions, approvals, and performance. |
| System administrator | Manage users, roles, departments, locations, device inventory configuration, policies, and audit access. |
| Auditor/read-only reviewer | Review authorized records, traceability, signatures, and reports without altering operational data. |

---

## 3. Shared Navigation and Behavior

### 3.1 Shared Modules

```text
Dashboard
Scan QR
Devices
Helpdesk Tickets
Maintenance
Reports
Notifications
Administration
```

The menu shows only modules the user is permitted to use. Hidden navigation is only a usability feature; the server must enforce permission checks on every page and action.

### 3.2 Mobile Navigation

Use this role-aware mobile navigation:

```text
Home | Scan | Report | My Work | More
```

| Mobile destination | Behavior |
|---|---|
| Home | Opens the role-specific dashboard. |
| Scan | Opens QR camera scanning and manual asset/device lookup. |
| Report | Opens the last scanned device if appropriate; otherwise opens authorized department device selection. |
| My Work | Staff see their/department tickets; biomedical users see assigned tickets and maintenance tasks. |
| More | Opens permitted Devices, Reports, Notifications, Profile, and Administration pages. |

### 3.3 Desktop Navigation

Use a persistent sidebar. Desktop supports data tables, triage queues, report filters, administration pages, and detailed maintenance records. Mobile supports the same critical work but uses single-column lists, focused forms, and large touch targets.

### 3.4 Shared Interaction Rules

All users should experience these consistent behaviors:

* Device name, asset number, current location, and availability/status are always visible at the top of a Device Profile.
* A page has one clear primary action based on the record's current state.
* Public progress updates use clear non-technical language.
* Internal biomedical notes are visibly marked and never shown to unauthorized users.
* Actions that affect safety, accountability, or history require controlled confirmation/signature where policy requires it.
* Every screen clearly distinguishes draft, in-progress, awaiting review, completed, and archived states.
* Archive/deactivate is used for real hospital records; permanent deletion is tightly restricted.
* Users are never asked to re-enter device identity/location after QR scan or device selection.

---

## 4. Role Overview Matrix

| Role | Main dashboard focus | Primary daily actions | Main restrictions |
|---|---|---|---|
| Doctor/staff | My reports, department availability alerts, tickets needing response | Scan, report problem, request maintenance, track public updates | Cannot edit technical details, internal notes, maintenance, or device release. |
| Department manager | Department availability, open/critical tickets, PM status | Review department work, add information, confirm resolution, view reports | No automatic engineering/signature/release authority. |
| Biomedical technician | Assigned tickets/tasks, due work, waiting work | Accept task, perform work/checklist, document findings, sign performed work | Limited to assigned/scope-authorized work; no automatic release authority. |
| Biomedical engineer | Triage, critical work, assigned work, review/release tasks | Classify, assign, investigate, repair, review, release, resolve | Restricted to authorized hospital/department/device scope. |
| Biomedical manager | Critical/overdue exceptions, workload, compliance, costs/performance | Assign/escalate, approve, manage team work, review reports | Does not replace performer/reviewer identity on records. |
| System administrator | Setup exceptions, users, departments, inventory/policy administration | Manage access, departments, inventory configuration, QR, policies, audit logs | No automatic technical maintenance/signing/release authority. |
| Auditor | Authorized audit/compliance records | Search/view/export authorized history and reports | Read-only; cannot alter operational records. |

---

## 5. Doctor and Department Staff Experience

### 5.1 Primary Goal

The staff experience must be fast, safe, and understandable without biomedical-engineering training.

The user should always know:

1. Which device is this?
2. Is it available according to BEMMS operational status?
3. Is work already in progress?
4. How can I report a new observation or request support?
5. What is the current progress of my request?

### 5.2 Dashboard

Order the staff dashboard as:

```text
Department context
Scan device
Report a problem
Tickets needing my response
Department availability alerts
My recent tickets
```

The dashboard must not expose technical queues, maintenance costs, root cause, private test results, or internal engineering notes.

### 5.3 QR Scan Flow

```text
Open Scan
→ Scan device QR label
→ Authenticate if needed
→ See device status and location
→ View open-ticket/maintenance summary
→ Report problem, request maintenance, or view active ticket
```

When an active ticket exists, the primary action should be **View active ticket**. The user may choose **Add observation** rather than unknowingly create a duplicate report.

### 5.4 Report a Problem Flow

```text
Scan/select device
→ Device and location are prefilled
→ Describe observed issue
→ Select impact: usable / not usable / urgent
→ Add optional photo/contact note
→ Submit ticket
→ Receive ticket number and tracking page
```

The reporter does not select technical maintenance type, root cause, engineer, test procedure, or final device status.

### 5.5 Department Device Selection Flow

When a QR code is missing or scanning is inconvenient:

```text
Report Device Problem
→ Select authorized department
→ Search/select device
→ Confirm location/status/open-ticket summary
→ Submit report
```

The user can only see devices in authorized departments.

### 5.6 Ticket Tracking Experience

Staff ticket pages should display plain-language public statuses:

```text
Reported
→ Reviewed
→ Assigned to Biomedical Engineering
→ Being investigated
→ Waiting for information / parts
→ Being repaired
→ Testing
→ Resolved
→ Closed
```

Public updates answer what is happening without exposing restricted technical content.

### 5.7 Staff Permissions and Restrictions

Staff may:

* View authorized device identity, location, availability, public ticket progress, and approved documents
* Report/reply/add authorized photos
* View their own and permitted department tickets

Staff may not:

* Edit technical device fields/status
* Assign tickets or select technical maintenance type
* See internal notes, root cause, restricted test data, costs, or private documents
* Complete maintenance, sign/release work, or change signed records

---

## 6. Department Manager Experience

### 6.1 Primary Goal

The department manager needs to manage department impact, not perform biomedical technical work.

### 6.2 Dashboard

```text
Department availability alerts
Critical/open department tickets
Tickets waiting for department response
PM/calibration due or overdue summary
Recent resolutions
Department report shortcuts
```

### 6.3 Typical Workflow

```text
See unavailable device/ticket alert
→ Open department ticket/device profile
→ Provide access or additional information
→ Coordinate device availability with biomedical team
→ Confirm resolution if ticket policy requires it
→ Review department availability/compliance report
```

### 6.4 Department Management Actions

Where explicitly authorized, a department manager may:

* View department device list and public maintenance summary
* View/report/track department tickets
* Add public comments or access-window information
* Confirm resolution
* View department reports
* Request device transfer or report a location discrepancy

They do not automatically manage users, edit device inventory, perform technical maintenance, approve test results, or release a device to service.

---

## 7. Biomedical Technician Experience

### 7.1 Primary Goal

The technician experience is a focused digital workbench for completing assigned work accurately in the field.

### 7.2 Dashboard and My Work

The technician dashboard prioritizes:

```text
My urgent assigned tickets
My maintenance tasks due today/overdue
Tasks waiting for parts/requester/vendor
Work awaiting my completion
Recently submitted work awaiting review
```

### 7.3 Ticket-to-Task Flow

```text
Assigned ticket/task notification
→ Open My Work
→ Review device, room, fault, reporter impact, and work plan
→ Accept responsibility
→ Start troubleshooting/maintenance
→ Document work and update stage
→ Perform checklist/tests
→ Sign and submit for review
```

### 7.4 Maintenance Task Experience

The task page must display at the top:

```text
Device name · Asset number
Hospital · Department · Room
Linked ticket and reporter impact
Maintenance type and current work stage
Due/overdue state
Required checklist/test/signature policy
```

The technician can:

* Accept assigned work
* Start/continue work
* Record troubleshooting/finding/work notes
* Complete checklist items
* Add parts, photos, permitted costs, and attachments
* Record test results as allowed
* Add public progress updates or internal notes
* Set permitted work stages, including waiting-for-parts/requester/vendor
* Sign performed work when policy grants that authority
* Request engineer review

### 7.5 Technician Restrictions

The technician cannot automatically:

* Reclassify a ticket's final technical maintenance type without authorized engineer approval
* Change critical device availability/release state
* Review their own work when independent review is required
* Close a ticket requiring engineer/manager approval
* Edit signed/completed records without amendment workflow

### 7.6 Technician Mobile Behavior

The mobile task interface must support work beside the device:

* Large `Accept`, `Start work`, `Continue`, and `Sign and submit for review` actions
* One-tap checklist result choices
* Notes/photos per checklist item
* Draft saving and retry after network failure
* Clear state: `Awaiting reviewer`, `Waiting for parts`, `Overdue by 2 days`
* Device status/location always visible without losing task context

---

## 8. Biomedical Engineer Experience

### 8.1 Primary Goal

The engineer is the technical decision maker and controlled workflow owner for authorized devices. Their experience must support fast triage plus deep technical records.

### 8.2 Dashboard

```text
Critical tickets
New/untriaged tickets
My assigned tickets and maintenance tasks
Work awaiting my review/release
PM/calibration due or overdue
Devices out of service
Target breach risk
```

### 8.3 Triage Flow

```text
Open new ticket
→ Review original staff observation/impact and device history
→ Check active tickets, maintenance, status, and criticality
→ Confirm/change priority
→ Select maintenance type and technical category
→ Decide initial device availability/status where authorized
→ Assign technician/engineer or perform work
→ Create linked maintenance task(s)
→ Add internal triage note and public update where appropriate
```

The original reporter statement stays intact and visible. The engineer adds technical classification rather than replacing the staff report.

### 8.4 Technical Work Flow

```text
Open device/ticket/task
→ Review technical documents, internal notes, maintenance and signature history
→ Troubleshoot / repair / calibrate / test
→ Record technical findings, root cause, parts, costs, and results
→ Complete required test/checklist
→ Sign performer work or review technician work
→ Release/update device status when policy allows
→ Resolve/close ticket according to workflow
```

### 8.5 Review and Release Flow

```text
Task submitted for review
→ Review findings/checklist/tests/attachments
→ Approve or reject for correction
→ Confirm final device status
→ Sign release to Operational when required
→ BEMMS updates official device summary/next due date
→ Resolve linked ticket when appropriate
```

The engineer must not release a device without required prior work, tests, independent review, or signatures. These rules are server-enforced by the configured policy.

### 8.6 Engineer Device Profile

The technical profile contains authorized sections:

```text
Overview | Active Tickets | Maintenance | Calibration & Tests
History | Documents | Technical Details | Signatures
```

The engineer sees relevant technical details, internal notes, attachments, costs, test evidence, signatures, amendments, and audit/accountability context within authorized scope.

---

## 9. Biomedical Manager Experience

### 9.1 Primary Goal

The biomedical manager focuses on exceptions, capacity, compliance, approvals, and service quality across authorized hospitals/departments.

### 9.2 Dashboard

```text
Critical and overdue tickets
Devices out of service
Unassigned / overloaded work
PM/calibration compliance exceptions
Work awaiting review/release
Ticket target breach risk
Maintenance cost and repeat-failure signals
```

### 9.3 Management Workflow

```text
Open exception/workload alert
→ Review scope, priority, device criticality, and current owner
→ Assign/reassign or escalate work
→ Review technical/approval status where authorized
→ Approve exceptions/deferrals/release as policy permits
→ Monitor report outcome and recurring problems
```

### 9.4 Manager Actions

The biomedical manager may:

* View all authorized device/ticket/maintenance data
* Assign/reassign biomedical work
* Set/manage PM and signature policies where authorized
* Approve deferrals/exceptions
* Review/approve/release technical work according to role/policy
* Monitor workload, performance, costs, compliance, and reliability reports
* Manage biomedical team membership/access within delegated authority

Performance reporting must consider complexity, priority, device criticality, review/release status, workload, and preventive work—not only closed ticket totals.

---

## 10. System Administrator Experience

### 10.1 Primary Goal

The system administrator configures and governs BEMMS. Their interface is a controlled administration center, not a technical biomedical workbench.

### 10.2 Dashboard

```text
Users without roles/scope
Pending invitations
Departments without manager/location setup
Devices missing required inventory/PM configuration
Policy/scheduler/notification exceptions
Recent access and configuration changes
```

### 10.3 Administration Workflow

```text
Open Administration
→ Choose Users, Departments, Devices, Policies, Notifications, Reports, or Audit
→ Search/select authorized record
→ Create/edit/activate/archive through controlled form
→ Review impact/permissions
→ Confirm high-impact change with reason
→ View durable success state and audit history
```

### 10.4 User Management Flow

```text
Users
→ Invite/Add user
→ Assign role(s)
→ Assign organization/hospital/department/team scope
→ Send activation
→ Review effective access
→ Deactivate/archive when access ends
```

Before deactivating a user, the system warns about active tickets/maintenance tasks and guides assignment transfer. Historical work/signatures remain attributed to the original individual.

### 10.5 Department and Device Administration Flow

```text
Administration
→ Hospital
→ Department
→ Devices tab
→ Add device with department prefilled
→ Edit inventory / transfer location / print QR / archive
```

The administrator may manage inventory fields but does not automatically receive permission to alter signed maintenance, technical findings, testing, or device-release decisions.

### 10.6 Administrator Restrictions

The administration interface must never display or allow editing of:

* User passwords, signing PINs, recovery secrets, private keys, or tokens
* PostgreSQL/Docker/server credentials or encryption keys
* Technical maintenance/signature/release actions unless the user also has biomedical authority
* Append-only audit events

---

## 11. Auditor / Read-Only Reviewer Experience

### 11.1 Primary Goal

An auditor needs evidence and traceability without the ability to alter the evidence.

### 11.2 Workflow

```text
Open Audit/Reports
→ Filter by device, user, date, ticket, maintenance, signature, or policy
→ Review immutable history and qualifying record versions
→ Export authorized report/snapshot if allowed
```

### 11.3 Read-Only Views

Authorized auditors may view:

* Device history
* Ticket timeline
* Maintenance/calibration records
* Electronic-signature chain
* Amendments, rejections, voids, and release decisions
* Access/policy/audit changes
* Compliance reports

They cannot create, edit, sign, approve, release, assign, archive, or delete operational records.

---

## 12. Cross-Role Handoffs

### 12.1 Device Problem Handoff

```text
Doctor/staff reports
→ Engineer triages
→ Technician/engineer performs work
→ Engineer reviews/releases
→ Staff sees public resolution
→ Manager sees compliance/performance outcome
→ Device history preserves complete chain
```

### 12.2 Required Ownership Chain

Every important ticket/maintenance flow should make accountability clear:

```text
Reported by
→ Triaged by
→ Assigned to
→ Accepted by
→ Performed by
→ Reviewed by
→ Released by
→ Resolved/closed by
```

Some steps may be omitted by policy for simple work, but BEMMS must show which role/action is still required.

### 12.3 Public Versus Internal Communication

| Communication | Visible to | Example |
|---|---|---|
| Public ticket update | Reporter, authorized department users, biomedical team, authorized managers | `Replacement part ordered; we will update you when testing is complete.` |
| Internal biomedical note | Authorized biomedical users/managers | Detailed diagnostic observation, troubleshooting result, vendor analysis. |
| Restricted audit/administrative note | Explicitly authorized administrators/auditors | Access/policy/security investigation information. |

The author must deliberately choose visibility before posting. BEMMS must clearly mark internal notes and never expose them through staff/department views.

---

## 13. Role-Based Device Profile Behavior

Every authorized profile begins with the same trusted device identity and availability context:

```text
Device name
Asset number
Hospital · Department · Room
Availability/status instruction
```

Then role-specific information/actions are shown.

| Device profile element | Doctor/staff | Technician | Engineer | Manager | Administrator |
|---|---:|---:|---:|---:|---:|
| Identity/location/status | Authorized scope | Assigned/authorized | Authorized | Authorized | Authorized inventory scope |
| Public ticket progress | Yes | Authorized | Yes | Yes | Policy-based |
| Internal notes | No | Assigned/authorized | Yes | Yes | Only with biomedical role |
| PM/maintenance technical detail | Summary only | Assigned work | Yes | Yes | Only with biomedical role |
| Calibration/testing evidence | No/approved summary | Assigned work | Yes | Yes | Only with biomedical role |
| Signatures/release data | Public status only | Assigned work | Yes | Yes | Audit view only unless biomedical role |
| Inventory edit/location transfer | No | Limited if assigned | Authorized | Authorized | Authorized inventory scope |
| Technical status/release | No | Performer only if allowed | Authorized | Authorized | Only with biomedical role |

The same rules apply whether the profile was opened from QR scan, device list, department page, ticket, maintenance task, or direct authorized link.

---

## 14. State-Based UX Behavior

The primary action should change based on current device/ticket/task state.

| State | Staff primary action | Technician primary action | Engineer primary action |
|---|---|---|---|
| Operational, no open ticket | Report a problem | View assigned work / report if observed | Review device or create work as authorized |
| Active ticket | View active ticket / add observation | Accept/continue assigned task | Triage/assign/update work |
| Under investigation | View public progress | Continue troubleshooting | Review findings/decide repair |
| Under maintenance | View public progress | Continue maintenance/checklist | Review/update/release when ready |
| Waiting for parts | View public progress | Update parts/work state | Approve/escalate/review vendor plan |
| Testing | View public progress | Record test results | Review/approve/release |
| Awaiting review/release | View public progress | Wait/respond to correction request | Review/sign/release |
| Out of service | View reason/active ticket | Perform authorized work | Assess/repair/release or keep unavailable |
| PM/calibration due | View maintenance summary | Start assigned task | Assign/perform/review task |

No state change is authorized only because its button appears. Server-side workflow and signature rules determine whether the action can complete.

---

## 15. Notifications and My Work Behavior

### 15.1 Staff Notifications

Staff receive only relevant public notifications:

* Ticket created
* Ticket status/public update
* Information requested
* Ticket resolved/closed/reopened
* Device/department availability alert where policy permits

### 15.2 Technician Notifications

Technicians receive:

* Ticket/task assignment and reassignment
* PM/calibration due/overdue tasks
* Requester response or new attachment
* Reviewer rejection/correction request
* Work awaiting their action

### 15.3 Engineer Notifications

Engineers receive:

* New/untriaged tickets in scope
* Critical tickets
* Review/release requests
* Unassigned/overdue work
* PM/calibration exceptions
* Target breach risk and escalations

### 15.4 Manager/Administrator Notifications

Managers receive escalation/compliance exceptions. Administrators receive access, configuration, policy, scheduler, and notification-delivery exceptions according to scope.

### 15.5 Notification Rule

An alert opens the relevant authorized record. Reading it does not complete, defer, approve, or close the underlying work.

---

## 16. Errors, Interruptions, and Offline Behavior

### 16.1 Network Interruption

When network connection fails during reporting or maintenance work:

* Preserve entered data in the active page where possible.
* Clearly state whether the server received the action.
* Offer safe retry without forcing re-entry.
* Do not show a successful ticket/signature/completion state until server confirmation.

Full offline synchronization is a future feature. The MVP must clearly communicate connection status.

### 16.2 Permission Change During Work

If access changes while a user is working:

* New protected requests are denied by the server.
* The UI explains that access changed without revealing protected data.
* Draft data is preserved locally where safe but cannot be submitted without authorization.
* The user is directed to contact the appropriate administrator/manager.

### 16.3 Concurrency and Record Changes

If another user changes a ticket, task, or device state while it is open:

* BEMMS refreshes/flags the changed state before important submission.
* The user sees what changed and who changed it where authorized.
* The system prevents overwriting newer signed/technical work.
* Amendments/version workflows are used for signed records.

---

## 17. Accessibility, Mobile, and Usability Rules

### 17.1 All Roles

* High contrast and text/icon labels for status; never color alone.
* Keyboard-accessible desktop controls with visible focus.
* Touch targets suitable for mobile use.
* Clear field labels and inline validation.
* Essential actions available without hover.
* Readable text on a 320-pixel-wide mobile screen.
* No wide tables as the only way to access essential mobile data.

### 17.2 Staff-Specific Usability

* Short forms and plain language.
* QR-first reporting with device prefilled.
* Visible ticket number after submission.
* Minimal technical terminology.

### 17.3 Biomedical-Specific Usability

* Keep device/task/ticket context connected.
* Support camera attachments, checklist completion, notes, and draft saving in the field.
* Clearly show required signatures, reviews, and release state.
* Preserve queue filters when returning from a ticket/task detail page.

### 17.4 Administration-Specific Usability

* Desktop/tablet optimized tables and policy forms.
* Clear scope/permission preview.
* High-impact actions use explanations, reason fields, and confirmation.
* Archive/deactivate wording instead of casual destructive deletion.

---

## 18. Role-Based UX Acceptance Criteria

The role-based experience is ready for hospital testing only when:

1. Each role opens a dashboard containing relevant work, alerts, and a clear primary action.
2. Doctors/staff can scan/select an authorized device, report a problem, receive a ticket number, and follow public progress without technical maintenance choices.
3. Department managers can see department availability/tickets/maintenance summary without receiving automatic technical authority.
4. Technicians can see and complete only assigned/authorized maintenance work, with device context, checklists, documentation, and permitted performer signature.
5. Engineers can triage tickets, choose maintenance type, assign work, review/sign/release as allowed, and resolve work without losing original reporter context.
6. Biomedical managers can monitor workload, compliance, exceptions, costs, and approvals within authorized scope.
7. Administrators can manage users, departments, devices, policies, and audit records without automatically accessing technical signing/release functions.
8. Auditors can view authorized immutable history without changing records.
9. The same QR/device route displays only the information and actions permitted to the signed-in user.
10. Public and internal communication are clearly separated and enforced by the server.
11. Device/ticket/maintenance responsibility chain is visible in authorized history.
12. Mobile workflows support scan, reporting, assigned work, checklist completion, and ticket tracking without desktop-only controls.
13. Errors, lost connection, permission change, and concurrent edits show safe understandable states without false success.
14. All critical role, workflow, signature, status, assignment, and configuration actions are audit logged.

---

## 19. Final Recommendation

Design each role around its real daily job rather than showing every user the same complex interface.

> **Staff identify and report. Technicians perform. Engineers decide and release. Managers oversee. Administrators configure. Every handoff is visible, authorized, and traceable.**
