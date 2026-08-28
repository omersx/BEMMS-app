# BEMMS Role-Based Device Profiles and QR Access

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md)
>
> **Related specifications:** [Department device inventory](BEMMS-Department-Device-Management-and-Inventory.md) · [Electronic signatures](BEMMS-Electronic-Signatures-and-Traceability.md) · [UI/UX design](BEMMS-UI-UX-Design.md) · [Administration](BEMMS-Administration-Settings-and-User-Management.md)

## 1. Purpose

This document defines how BEMMS should open and display a medical-device record after a QR scan or device-list selection.

The design uses **one secure QR code for each physical device**. It does not create different QR codes for doctors, department staff, engineers, technicians, managers, and administrators. Instead, BEMMS authenticates the user, checks their scope and role, then displays the appropriate device profile and actions.

The central principle is:

> **One device. One QR label. One trusted device record. Different authorized views and actions for different users.**

This document complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — core product, data, security, and QR requirements
* `QR-Helpdesk-Ticketing-Workflow.md` — scan-to-ticket and maintenance-helpdesk workflow
* `BEMMS-Application-Modules-and-Pages.md` — modules, pages, and navigation
* `BEMMS-UI-UX-Design.md` — page layouts and mobile experience
* `BEMMS-Electronic-Signatures-and-Traceability.md` — responsibility, approvals, and signed records

---

## 2. Product Decisions

1. Every active physical medical device has one stable BEMMS QR label.
2. The QR code contains only a non-sensitive opaque reference or secure URL, never device details, patient data, credentials, or technical records.
3. The QR URL resolves to one underlying device record.
4. The system requires authentication before protected information is shown.
5. The server determines the device data, documents, tickets, maintenance records, actions, and fields visible to the signed-in user.
6. Doctors and department staff receive a simple operational view focused on safety, reporting, and ticket tracking.
7. Biomedical engineers and authorized technicians receive the technical/work-management view necessary to perform maintenance.
8. Administrators manage users, departments, locations, device inventory, and QR labels; technical maintenance access is separately controlled.
9. The same role-based rules apply whether a device is opened by QR scan, device-list click, search result, or direct authorized link.

---

## 3. QR Resolution and Access Flow

```text
Physical device QR label
        ↓
Secure URL with opaque device reference
        ↓
User authentication, if not already signed in
        ↓
Server resolves QR reference to device
        ↓
Server checks organization, hospital, department, and role scope
        ↓
Role-appropriate scan result and device profile
```

Example QR URL:

```text
https://bemms.example.org/scan/dv_8Kp2mQ7x
```

The QR reference must not expose sequential database IDs, asset data, maintenance content, user information, or patient information.

### 3.1 Signed-Out User

When a signed-out user scans a QR code:

1. BEMMS stores the requested QR route temporarily and safely.
2. BEMMS displays the login page.
3. After successful login, BEMMS returns the user to the scanned device.
4. The server performs authorization before returning any protected device data.

### 3.2 Invalid or Unauthorized Scan

For unknown, revoked, decommissioned, or unauthorized QR references, BEMMS must show an appropriate safe message without revealing protected details:

* `This device QR label is not active. Search by asset number or contact Biomedical Engineering.`
* `You do not have access to this device.`
* `This device could not be found.`

The system should offer manual asset-number lookup only when the user's permissions permit it.

---

## 4. The Device Page Model

Each device has one complete underlying record, called the **Device Profile**. The profile collects all authorized information about that device:

```text
Device identity and location
Device availability/status
QR label
Tickets and helpdesk history
Preventive and corrective maintenance
PPM, calibration, tests, checklists, and signatures
Documents and attachments
Status/location history
Audit and accountability history
```

The profile is not a single long form. It uses a stable header, concise overview, and role-appropriate sections.

### 4.1 Common Header for Every Authorized User

Every permitted device profile must clearly show:

* Device name
* Asset number
* Hospital, department, room, and current location
* Current device availability/status
* Safety/availability instruction when the device is unavailable
* Device QR reference/label action when the user is authorized

Example:

```text
Infusion Pump
INF-PUMP-00482
ICU · Room 3

OUT OF SERVICE
Do not use until released by Biomedical Engineering.
```

### 4.2 Availability Is Always First

The status banner appears before technical details, ticket history, or documents. It must use plain text and iconography in addition to color.

Examples:

| Device status | User-facing treatment |
|---|---|
| Operational | `Operational — available status recorded` |
| Operational with limitations | `Operational with limitations — review note before use` |
| Reported problem | `Reported problem — Biomedical Engineering review pending` |
| Under investigation | `Under investigation — view current ticket progress` |
| Under maintenance | `Under maintenance — do not use until released` |
| Waiting for parts | `Unavailable — repair is waiting for approved parts` |
| Out of service | `Out of service — do not use` |
| Decommissioned/archived | `Decommissioned — not available for use` |

Device status is operational equipment information. BEMMS must not describe it as clinical clearance or replace hospital safety procedures.

---

## 5. Profile Levels by Role

### 5.1 Doctor and Department Staff Profile

This profile must be simple, mobile-first, and focused on safe action. It should answer:

1. Which device is this?
2. Where is it assigned?
3. Is it currently available/usable according to BEMMS operational status?
4. Is a known issue or maintenance task already in progress?
5. What can I do now?

#### Visible Information

* Device name and asset number
* Department, room, and authorized location
* Current availability/status and safety instruction
* Public open-ticket summary and latest public status update
* Last/next maintenance status and due state where hospital policy allows
* Public device documents approved for department access, such as user manuals
* Their own tickets and authorized department tickets

#### Available Actions

* Report a problem
* Request maintenance
* View active ticket/public updates
* Add observation, comment, or authorized photo to a ticket
* View permitted device history
* Open a public/department-approved manual

#### Hidden/Restricted Information

* Internal biomedical notes
* Root-cause analysis, detailed engineering findings, and restricted test results
* Parts usage and maintenance costs
* Calibration raw data/certificates unless specifically shared
* Full service manuals or restricted attachments
* Electronic-signature technical detail and audit-log data beyond authorized public progress
* Status-change/edit, maintenance completion, or release actions

### 5.2 Department Manager Profile

The department-manager profile includes the staff view plus authorized department oversight:

* Department ticket list and current progress
* Department device availability summary
* Maintenance due/overdue status for the department
* Department-level operational reports
* Resolution confirmation, where the ticket policy requires it

The manager does not automatically receive technical maintenance editing, electronic-signature, or device-release authority.

### 5.3 Biomedical Technician Profile

The technician profile focuses on assigned work. It includes:

* Device identity, location, technical details needed for assigned work
* Assigned tickets and maintenance tasks
* Authorized internal biomedical notes
* Maintenance checklists, service documents, approved attachments, parts entries, and test forms
* Ability to accept assigned work, record findings, update assigned tasks, add internal/public updates, and sign permitted performed work
* Read-only visibility of required reviewer/release status

Technicians may see only assigned devices/tasks or broader access as explicitly configured. They do not automatically gain authority to release a device to Operational status or close technical work.

### 5.4 Biomedical Engineer Profile

The biomedical engineer sees the full technical profile within authorized scope:

* Full authorized identity, technical, location, warranty, supplier, and risk/criticality data
* All authorized ticket details, public updates, and internal notes
* Corrective/preventive maintenance, PPM, calibration, testing, checklist, parts, and approved cost data
* Electronic signatures, approvals, amendments, and device-release history
* Technical documents, service manuals, certificates, and test evidence
* Full authorized status/location history and audit-related accountability history

#### Biomedical Engineer Actions

* Update authorized device status/location with a reason
* Triage, assign, accept, investigate, resolve, or close tickets as allowed
* Create and complete maintenance records
* Review or approve technician work as allowed
* Sign and release a device according to signature policy
* Print/reprint QR labels where authorized
* View technical reports and device reliability information

### 5.5 Biomedical Manager Profile

The biomedical manager has an authorized hospital/organization-wide technical and oversight profile:

* All biomedical-engineer information within assigned scope
* Team workload and signature-compliance information
* Assignment/reassignment and approval authority
* Maintenance performance, cost, downtime, and repeat-failure reports
* Ability to configure selected workflow targets/checklists/policies where authorized

### 5.6 System Administrator Profile

The administrator profile focuses on system and inventory administration:

* Device identity, organization/hospital/department/location assignment, QR labels, archive status, and approved documents
* User, role, department, location, category, manufacturer, and system-configuration management
* Device-list search, device creation, editing, transfers, archive/decommission workflow, and QR label printing
* Authorized audit-log review and system reports

An administrator may have full read access to all device inventory records in their assigned organization if the organization chooses. However, the following must remain separately permission-controlled:

* Technical maintenance findings and internal engineering notes
* Calibration/testing evidence and restricted service documentation
* Performer, reviewer, approval, and device-release signature actions
* Technical status decisions that return a device to service

If an administrator is also a biomedical engineer or manager, BEMMS combines the permissions of both assigned roles. The system must never grant technical authority merely because the user is an administrator.

---

## 6. Information and Action Matrix

| Information/action | Doctor/staff | Department manager | Biomedical technician | Biomedical engineer | Biomedical manager | System administrator |
|---|---:|---:|---:|---:|---:|---:|
| Device name, asset number, location, availability | Authorized scope | Authorized scope | Assigned/authorized scope | Authorized scope | Authorized scope | Authorized scope |
| Report a problem/request maintenance | Yes | Yes | Yes | Yes | Yes | Policy-based |
| Public ticket progress | Own/department scope | Department scope | Assigned/authorized scope | Authorized scope | Authorized scope | Policy-based |
| Internal biomedical notes | No | No | Assigned/authorized scope | Yes | Yes | Only with biomedical role |
| Technical specifications/service documents | Limited approved view | Limited approved view | Assigned/authorized scope | Yes | Yes | Policy-based |
| Maintenance/PPM/calibration technical records | Status summary only | Department status summary | Assigned work | Yes | Yes | Only with biomedical role |
| Parts and maintenance cost | No | Optional department summary | Assigned work if policy allows | Yes | Yes | Authorized administrative/report scope |
| Electronic signature details | Public status only | Public status only | Assigned work | Yes | Yes | Audit/read scope; signing requires biomedical role |
| Update device status/location | No | No | Limited if assigned | Yes | Yes | Inventory/location edits only unless biomedical role |
| Perform/review/release/sign technical work | No | No | Performer actions if authorized | Yes | Yes | Only with biomedical role |
| Print/reprint QR label | No | No | If authorized | Yes | Yes | Yes within administrative scope |
| Archive/decommission inventory record | No | No | No | Recommend manager approval | Yes | Yes within administrative scope, subject to policy |

All matrix entries remain subject to organization, hospital, department, device category, device criticality, and specific assigned-work scope.

---

## 7. Device Profile Sections and Tabs

The visible sections change by role, but the underlying record remains the same.

### 7.1 Common Sections

| Section | Purpose |
|---|---|
| Overview | Current status, identity, location, availability, and next appropriate action. |
| Active tickets | Current device problems/requests and their authorized progress. |
| Maintenance summary | Last/next maintenance status and outstanding work visible at the user's permission level. |
| History | Chronological authorized history of device, ticket, maintenance, status, and location events. |
| Documents | Role-authorized manuals, certificates, photos, and attachments. |

### 7.2 Technical Sections

These sections appear only for permitted biomedical users:

| Section | Purpose |
|---|---|
| Technical details | Specifications, power requirements, accessories, consumables, risk, criticality, warranty, supplier, and technical notes. |
| Maintenance | Preventive/corrective records, PPM, checklists, parts, costs, tests, and results. |
| Calibration and testing | Calibration records, certificates, electrical safety, performance tests, and supporting evidence. |
| Signatures and approvals | Performer/reviewer/release signatures, missing approvals, amendments, and signature history. |
| Full audit/accountability history | Authorized change history and accountability events. |

### 7.3 Recommended Tab Order

#### Staff/Doctor Mobile Profile

```text
Overview | Tickets | History | Documents
```

#### Biomedical Engineer Desktop Profile

```text
Overview | Active Tickets | Maintenance | Calibration & Tests | History | Documents | Technical Details | Signatures
```

Use a compact overview on mobile and do not hide the availability banner, location, or primary report action inside tabs.

---

## 8. Page Layouts

### 8.1 Staff/Doctor Scan Result and Device Profile

Recommended mobile layout:

```text
Back to Scan

[ Availability/status banner ]

Device name
Asset number
Department · Room

Open ticket / maintenance status summary

[ Report a problem ]
[ Request maintenance ]

View active ticket · View history · Approved documents
```

If an active ticket exists, change the first primary action to **View active ticket** and offer **Add observation** rather than encouraging duplicate reporting.

### 8.2 Biomedical Technician Profile

```text
Device status and location
Assigned ticket/task context
Quick action: Accept work / Start task / Continue checklist
Technical details needed for work
Checklist, work notes, attachments, and tests
Signature status: performed / awaiting review / released
```

### 8.3 Biomedical Engineer Profile

```text
Device status and release state
Technical header and QR label action
Active tickets and assigned maintenance
Quick actions: Update status · Create/continue maintenance · Review · Release
Full technical tabs and signature/accountability history
```

### 8.4 Administrator Device Profile

```text
Device identity and archive status
Organization · Hospital · Department · Location assignment
QR label action
Inventory fields and approved documents
Actions: Edit inventory · Transfer location · Archive/Decommission
Authorized audit/history links
```

Technical tabs appear only when the administrator also has a biomedical technical role.

---

## 9. Actions and Workflow Rules

### 9.1 Staff Reporting

From a QR profile, staff can create a linked ticket without re-selecting the device:

```text
Scan QR
→ See availability and existing ticket state
→ Report a problem / Request maintenance
→ Enter short description and impact
→ Submit ticket
→ Track public progress
```

The ticket automatically records the device, location, reporter, source (`QR scan`), and date/time.

### 9.2 Department Device Selection

When scanning is inconvenient, the user can follow:

```text
Report Device Problem
→ Select authorized department
→ Search/select device
→ See same role-appropriate profile summary
→ Submit linked ticket
```

### 9.3 Biomedical Work

```text
Open device/ticket
→ Review technical context and internal notes
→ Accept/assign work
→ Perform maintenance or testing
→ Record findings and evidence
→ Sign/review/release as required
→ Update device status and ticket progress
```

### 9.4 Administration Work

```text
Open device inventory record
→ Edit inventory details or transfer department/location
→ Print/reprint QR label if needed
→ Archive/decommission according to policy
→ Preserve full history
```

For device transfers, BEMMS must create a location-history event with old and new organization/hospital/department/location, actor, reason, and timestamp.

---

## 10. Security and Data-Access Requirements

### 10.1 No QR-Based Access Bypass

Possession of a QR code must never bypass authentication, authorization, or field-level data visibility rules. The QR code identifies the device; it does not authorize the person holding it.

### 10.2 Server-Shaped Responses

The server must return only fields and related records the user is permitted to see. Do not send full technical/internals data to the browser and hide it with frontend controls.

### 10.3 Organization and Location Scope

Before opening a device, the server checks:

* User account is active
* Organization access
* Hospital access
* Department/location access where configured
* Role and assigned-work permission
* Device archive/decommission status

### 10.4 Attachment Protection

Documents/attachments must be individually protected through the same device, ticket, maintenance, and role rules. A user with access to a simple device overview does not automatically receive access to every technical file.

### 10.5 Audit Events

Record important access and changes according to policy, including:

* QR label generated, printed, reprinted, revoked, or replaced
* QR scan resolving to a device, when required by policy
* Unauthorized/invalid scan attempts where security policy requires logging
* Device profile access to restricted/signature information where required
* Device inventory edits, transfers, archives, and decommissioning
* Technical status, maintenance, calibration, signature, and release actions

---

## 11. Data and API Requirements

### 11.1 Core Data Relationships

```text
Device
├── Active QR label and QR-label history
├── Current and historical locations
├── Tickets and ticket timeline
├── Maintenance plans, tasks, records, PPM, and checklists
├── Calibration and test records
├── Documents/attachments
├── Electronic signatures and approvals
└── Audit/history events
```

### 11.2 Role-Aware Read Model

The application should create server-side role-aware device views instead of exposing database tables directly. The device profile response should include:

* `deviceSummary` — only fields visible to the current user
* `availabilityBanner` — status, allowed instruction, and visible reason
* `allowedActions` — actions the user is currently permitted to execute
* `visibleSections` — authorized tabs/sections
* `activeWorkSummary` — visible ticket and maintenance state
* `securityContext` — role/scope-derived permissions, not user-controlled values

The client uses these values for interface layout, while the server rechecks authorization whenever the user performs an action.

### 11.3 Performance

Scan result/profile loading must prioritize:

1. Device identity, location, and availability
2. Active ticket/maintenance summary
3. Role-appropriate quick actions

Load long histories, large attachment lists, and extensive technical documents on demand. This keeps the critical scan result fast on hospital mobile networks.

---

## 12. UI/UX Requirements

### 12.1 Staff/Doctor Experience

* Mobile-first single-column layout
* Large clear action buttons
* No engineering jargon in public progress updates
* Safety/availability banner always prominent
* No more than the essential actions on the first view
* Ticket tracking uses simple terms such as `Reported`, `Assigned`, `Being repaired`, `Waiting for parts`, and `Resolved`

### 12.2 Biomedical Experience

* Technical information available without navigating through staff-only views
* Work context visible when opening a device from ticket or maintenance task
* Clear distinction between public updates and internal notes
* Signature and release status visible before maintenance completion
* Tablet/desktop views support detailed checklists, tables, documents, and reporting

### 12.3 Administrator Experience

* Device inventory management separated from technical maintenance controls
* Clear forms for hospital/department/location assignment and transfer
* Archive/decommission used instead of destructive removal for real devices
* QR label print/reprint action is easy to find
* Warn before changes that affect current location, status, access, or history

---

## 13. Special Cases

### 13.1 Device Is Moved

If a scanned device's actual location differs from the current BEMMS location, authorized staff may report the discrepancy, but only authorized inventory/biomedical users can change the official location. The system records the reason and history of the location correction.

### 13.2 Device Has an Active Critical Ticket

Staff see a clear `Do not use` or policy-defined availability instruction and may add an observation. Biomedical users see the technical ticket and can perform permitted work. BEMMS should prefer adding information to the existing ticket over generating duplicate reports.

### 13.3 Device Is Decommissioned

All authorized users see `Decommissioned — not available for use`. Staff can report a label/location concern if permitted, but cannot create ordinary maintenance work for the device without an authorized reactivation workflow.

### 13.4 Shared Device Across Departments

The current assigned location must remain authoritative, with documented transfer history. A user may report a location discrepancy or create a ticket from an authorized department, but BEMMS must snapshot the location at ticket creation and allow authorized triage to correct it.

---

## 14. Acceptance Criteria

The role-based device-profile feature is complete for the MVP only when:

1. One active device has one stable QR reference/label that resolves to its underlying device record.
2. A signed-out user must authenticate before protected device data is shown.
3. The same QR shows a staff/doctor view, a biomedical technical view, or an authorized administrator inventory view based on server-enforced permissions.
4. Staff see identity, location, availability, public work progress, and report/request actions without technical internal information.
5. Biomedical engineers see the full authorized technical device profile, including linked tickets, maintenance, tests, documents, signatures, and history.
6. Technicians see only permitted/assigned technical work and cannot release devices unless explicitly authorized.
7. Administrators can manage authorized inventory, locations, departments, QR labels, and archive status without automatically gaining technical-signature or device-release authority.
8. Device profile visibility is identical whether opened from QR, list, search, ticket, or maintenance link.
9. Invalid, revoked, unknown, and unauthorized scans reveal no protected device details.
10. Devices with open tickets, maintenance, or decommissioned status show a clear availability banner and next appropriate action.
11. All technical/inventory actions, QR-label actions, status changes, and signature actions are audit logged according to policy.
12. The scan result/profile loads identity, location, availability, and active-work summary before long history/document data.

---

## 15. Recommended Delivery Sequence

### Phase 1 — Secure Base Profile

* Device list and complete underlying device record
* QR opaque references, authentication, and authorization
* Common device header, availability banner, and staff/doctor profile
* Report problem/request maintenance from scan

### Phase 2 — Biomedical Profile

* Technical detail sections, internal notes, maintenance, documents, and assigned-work actions
* Ticket/maintenance context links
* Technician versus engineer action restrictions

### Phase 3 — Administration Profile

* Inventory creation/edit, department/location transfer, archive/decommission, and QR label management
* Administrator access boundaries and audit views

### Phase 4 — Signatures and Advanced Technical History

* Signature/review/release panels
* Calibration/testing history
* Role-aware documents, cost data, complete audit/accountability history, and reliability reports

---

## 16. Final Recommendation

Use one QR code and one underlying device profile for each medical device. Make the profile adapt safely to the signed-in user's role, permissions, and scope.

> **Staff should see what they need to use or report the device safely. Biomedical users should see what they need to maintain it professionally. Administrators should manage inventory and access without automatically gaining clinical or technical authority.**
