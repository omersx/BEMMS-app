# BEMMS Application Modules, Pages, Navigation, and Workflows

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md) · [UI/UX design](BEMMS-UI-UX-Design.md)
>
> **Related detailed specifications:** [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Maintenance triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) · [PM scheduling](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md) · [Administration](BEMMS-Administration-Settings-and-User-Management.md)

## 1. Purpose

This document defines the recommended BEMMS application structure: the modules to build, the pages within each module, how users move through the system, and how the main hospital workflows connect.

It complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — overall product, technical, security, and deployment requirements
* `QR-Helpdesk-Ticketing-Workflow.md` — detailed QR scan, ticketing, and maintenance-helpdesk requirements

The central product idea is:

> **Every device has one trusted record. Staff can scan or select it, open a ticket quickly, and track work until biomedical maintenance is complete.**

---

## 2. Recommended Product Model

BEMMS should be organized around five connected concepts:

```text
Device
  ↓
Helpdesk ticket
  ↓
Triage and assignment
  ↓
Maintenance work and testing
  ↓
Device history, availability, and reports
```

### 2.1 One Unified Ticket System

Do not create separate, disconnected modules for "fault reports," "helpdesk tickets," and "maintenance requests." They should be one **Helpdesk Tickets** module with different ticket types:

* Device problem
* Urgent equipment concern
* Maintenance request
* Inspection request
* Calibration request
* Preventive-maintenance follow-up

Every ticket is linked to a device whenever the device is known. A ticket may later create one or more corrective-maintenance records. This prevents duplicated data and gives staff one place to follow progress.

### 2.2 Devices Are the Source of Truth

The device page is the permanent operational record. It brings together:

* Identity, asset number, manufacturer, model, and serial number
* Hospital, department, room, and current location
* Current availability and operational status
* QR label
* Active and historical tickets
* Preventive and corrective maintenance
* Checklists, inspections, calibrations, and test results
* Documents and attachments
* Status/location history and audit events

### 2.3 Separate the Simple Staff Experience from the Technical Experience

Doctors, nurses, and department staff should not need to understand engineering workflows. Their main tasks are:

* Scan or find a device
* See whether it is available
* Report a problem or request service
* Add information when asked
* Follow progress

Biomedical engineers and technicians need a deeper work-management experience:

* Triage the queue
* Assign and accept work
* Investigate and record technical findings
* Perform maintenance/checklists/tests
* Update equipment status
* Resolve and close work

---

## 3. Primary Modules

The recommended top-level application modules are:

| Module | Primary purpose | Main users |
|---|---|---|
| Dashboard | Role-specific overview, alerts, and work priorities. | All authenticated users. |
| Scan QR | Fast physical-device lookup and action. | All authorized users. |
| Devices | Inventory, device details, status, history, labels, and documents. | Department users, biomedical users, managers. |
| Helpdesk Tickets | Problem reports, service requests, tracking, triage, assignment, and progress updates. | All authorized users; biomedical team operates the queue. |
| Maintenance | Preventive plans, assigned tasks, corrective work, checklists, testing, and records. | Biomedical team and managers. |
| Reports | Operational, ticket, maintenance, compliance, and downtime reporting. | Managers and authorized biomedical users. |
| Notifications | Alerts and updates that need user attention. | All authenticated users. |
| Administration | Organization setup, access control, reference data, policies, and audit review. | Authorized administrators/managers. |

This is the complete long-term structure. The first version should prioritize Dashboard, Scan QR, Devices, Helpdesk Tickets, Maintenance, and a limited Administration area.

---

## 4. Navigation Design

### 4.1 Primary Navigation

Use a small, consistent navigation menu. The user sees only the modules they are permitted to use.

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

On desktop, use a sidebar. On mobile, use a compact bottom navigation for the most common actions plus an overflow menu.

Recommended mobile bottom navigation:

```text
Home | Scan | Report | My Work | More
```

* **Home** opens the user dashboard.
* **Scan** opens the QR camera and manual device lookup.
* **Report** starts a ticket, either from a recent scan or department device selection.
* **My Work** opens assigned tickets/tasks for biomedical users or submitted/department tickets for staff.
* **More** contains devices, reports, notifications, profile, and authorized admin pages.

### 4.2 Keep Administration Separate

Hospitals, departments, users, roles, categories, manufacturers, configuration, and audit logs should appear only inside **Administration**. They should not clutter everyday work navigation.

### 4.3 Contextual Navigation

The user should always be able to move between connected records:

```text
Device ↔ Ticket ↔ Maintenance record ↔ Device history
```

For example, a ticket page must link to the device and linked maintenance records; a device page must show its active tickets and maintenance history.

---

## 5. Dashboard Module

### 5.1 Purpose

The dashboard is not one generic screen. It must adapt to the user's role and authorized organization/hospital/department scope.

### 5.2 Department Staff and Doctor Dashboard

Primary actions:

* Scan device
* Report a problem
* Request maintenance
* View my tickets
* View department tickets

Useful information:

* Tickets they created and their current progress
* Tickets waiting for their response
* Devices in their department that are out of service or under maintenance
* Recently resolved tickets

### 5.3 Biomedical Technician Dashboard

Primary actions:

* Scan device
* Open my assigned tickets
* Open my maintenance tasks
* Start/continue assigned work

Useful information:

* Assigned tickets by urgency
* Tasks due today or overdue
* Work waiting for parts/requester/vendor
* Recently completed work requiring review

### 5.4 Biomedical Engineer Dashboard

Primary actions:

* Open triage queue
* Scan device
* Open assigned work
* Create device or maintenance record when authorized

Useful information:

* New/untriaged tickets
* Critical/high-priority tickets
* Overdue maintenance and unresolved work
* Tickets near response/resolution target breach
* Devices currently out of service

### 5.5 Manager Dashboard

Useful information:

* Equipment availability by hospital/department
* Critical and overdue tickets
* Preventive-maintenance compliance
* Downtime trends
* Workload by engineer/technician
* Repeated device failures

Managers should not receive technical editing rights automatically.

### 5.6 Dashboard Pages

| Page | Purpose |
|---|---|
| Dashboard home | Role-specific summary and priority actions. |
| My work | Tickets/tasks assigned to or created by the user. |
| Team work view | Authorized manager view of team workload and queue health. |
| Alerts view | Critical, overdue, and target-breach-risk items. |

---

## 6. Scan QR Module

### 6.1 Purpose

QR scanning is the fastest way to connect the physical device in front of a user to its BEMMS record.

### 6.2 Pages

| Page | Purpose |
|---|---|
| QR scanner | Opens the camera, scans a valid device label, and supports manual entry fallback. |
| Scan result | Shows identity, location, status, availability alert, open-ticket summary, maintenance state, and allowed quick actions. |
| QR label print/reprint | Generates printable label sheets for authorized biomedical/admin users. |
| Scan error | Safely handles invalid, revoked, unknown, or unauthorized scans. |

### 6.3 Scan Result Actions

All authorized users may see appropriate actions such as:

* Report a problem
* Request maintenance
* View open tickets
* View device history

Biomedical users may additionally see:

* Start assigned maintenance
* Update device status
* Create corrective maintenance
* Open technical details

QR codes must contain an opaque non-sensitive reference only. A scan URL never grants access by itself.

---

## 7. Devices Module

### 7.1 Purpose

The Devices module manages the inventory and provides the long-term record for every medical device.

### 7.2 Pages

| Page | Purpose | Main users |
|---|---|---|
| Device list | Search, filter, and browse authorized devices. | All authorized users. |
| Department equipment list | Shows devices in one selected/authorized department; supports staff ticket creation. | Doctors, staff, managers, biomedical users. |
| Add device | Registers a new device and generates its initial QR label. | Biomedical engineer/admin with permission. |
| Edit device | Updates approved administrative/technical information. | Authorized biomedical users. |
| Device details | Current device record and operational summary. | All authorized users. |
| Device history | Chronological history of tickets, maintenance, status, location, documents, and audit events. | Authorized users. |
| Device documents | Manuals, certificates, photos, and protected attachments. | Authorized users. |
| Device status/location update | Controlled update form that records reason and history. | Authorized biomedical users. |

### 7.3 Device List Requirements

The device list should support search by:

* Device name
* Asset/inventory number
* Serial number
* Manufacturer and model
* Hospital, department, room, category, status, and assigned engineer

Use filters, pagination, and clear status badges. Do not load an entire maintenance history into the device list.

### 7.4 Device Details Layout

The recommended device detail page has these sections or tabs:

```text
Overview | Active Tickets | Maintenance | History | Documents | Technical Details
```

The overview must show the current status and availability alert first. The most important buttons are **Report problem**, **Request maintenance**, and—where authorized—**Update status** or **Start maintenance**.

---

## 8. Helpdesk Tickets Module

### 8.1 Purpose

This is the unified module for all device reports and work requests. It gives department users a simple tracking experience and biomedical teams a controlled service-desk workflow.

### 8.2 Ticket Types

* Device problem
* Urgent equipment concern
* Maintenance request
* Inspection request
* Calibration request
* Preventive-maintenance follow-up

### 8.3 Pages

| Page | Purpose | Main users |
|---|---|---|
| Report device problem | Short prefilled form after QR scan or department device selection. | Doctors, staff, biomedical users. |
| Request maintenance | Short service request form for a selected device. | Doctors, staff, department managers. |
| My tickets | Tickets created by the user and tickets waiting for their response. | Doctors, staff, all reporters. |
| Department tickets | Tickets for authorized departments. | Department managers and authorized staff. |
| Biomedical triage queue | New/untriaged and unassigned tickets, sorted by priority and target. | Biomedical engineers/managers. |
| My assigned tickets | Tickets owned by the logged-in technician/engineer. | Biomedical users. |
| All tickets | Authorized search/filter view for managers. | Biomedical managers/admins. |
| Ticket detail | Full ticket, timeline, comments, attachments, assignment, and links to device/maintenance. | Users according to permissions. |

### 8.4 Two Safe Ticket Entry Routes

1. **QR route**

```text
Scan QR → Scan result → Report a problem / Request maintenance → Submit ticket
```

2. **Department device selection route**

```text
Report Device Problem → Choose authorized department → Search/select device → Review status → Submit ticket
```

Both routes use the same ticket form, validation, tracking page, and workflow. The ticket records its source so the hospital can measure how reports enter the system.

### 8.5 Ticket Detail Layout

Recommended sections:

```text
Summary | Timeline | Public Updates | Internal Notes | Attachments | Linked Maintenance
```

The header always shows:

* Ticket number
* Device and location
* Current ticket status
* Priority
* Assignee
* Response/resolution targets where enabled

Public comments are visible to the reporter and authorized department users. Internal technical notes must be visibly marked and restricted to authorized biomedical users.

### 8.6 Standard Ticket Workflow

```text
New
→ Triaged
→ Assigned
→ Accepted
→ Investigating
→ Waiting for requester / parts / vendor
→ Repairing or Performing maintenance
→ Testing
→ Resolved
→ Closed
```

Cancellation and reopening require a reason. The system must restrict transitions to valid actions by authorized roles.

### 8.7 Duplicate Prevention

Before submission, show active tickets for the selected device. The user can open an existing ticket or add an observation, while retaining the option to report a distinct new issue.

---

## 9. Maintenance Module

### 9.1 Purpose

The Maintenance module is for controlled technical work. It turns approved/assigned tickets or preventive schedules into maintainable work records without losing the connection to the original device and reporter.

### 9.2 Pages

| Page | Purpose | Main users |
|---|---|---|
| Maintenance overview | Summary of due, overdue, in-progress, and completed work. | Biomedical users/managers. |
| My maintenance tasks | Assigned preventive/corrective work. | Biomedical technicians/engineers. |
| Maintenance task detail | Work state, device context, checklist, time, notes, parts, and attachments. | Assigned biomedical users. |
| Start corrective maintenance | Converts a ticket into technical work and carries relevant data forward. | Biomedical engineers/authorized technicians. |
| Preventive maintenance plans | Frequency, next due date, assigned role/engineer, and checklist template. | Biomedical engineers/managers. |
| Maintenance calendar | Calendar/list view of upcoming, due, and overdue work. | Biomedical users/managers. |
| Checklists | Reusable templates by device category/type. | Biomedical managers/engineers. |
| Maintenance record | Permanent completed work record with findings, testing, result, and final status. | Biomedical users/managers. |

### 9.3 Maintenance Work Flow

```text
Ticket or maintenance plan
→ Assigned maintenance task
→ Work started
→ Checklist/findings/parts/test results recorded
→ Engineer review when required
→ Maintenance record completed
→ Ticket resolved/closed and device history updated
```

The maintenance module must not overwrite ticket history. It creates linked records.

---

## 10. Reports Module

### 10.1 Purpose

Reports help authorized managers and biomedical teams identify workload, risk, service quality, and equipment availability.

### 10.2 Pages

| Page | Purpose |
|---|---|
| Report library | Choose a report type and apply filters. |
| Inventory report | Devices by hospital, department, category, manufacturer, and status. |
| Ticket performance report | Open/closed tickets, priorities, response time, resolution time, backlog, and repeat incidents. |
| Maintenance compliance report | Due/overdue/completed preventive maintenance. |
| Device history report | Tickets and maintenance for a selected device or group. |
| Downtime and availability report | Out-of-service periods and availability trends. |
| Device reliability report | Most frequently broken devices, repeated failure categories, ticket volume, downtime, and period-over-period trend. |
| Breakdown trend report | Device-problem tickets created and resolved by month, priority, department, category, or device. |
| Maintenance cost report | Recorded parts, external vendor/service, and optional labor costs by device, department, hospital, category, maintenance type, and period. |
| Workload and performance report | Assigned/completed work, response/resolution target compliance, average resolution time, preventive-maintenance completion, reopened work, and current workload by engineer or technician. |
| Export view | Generates approved PDF/Excel exports. |
| Generated report history | Authorized history of official generated exports, including report type, filters, period, requester, generation time, and downloadable file. |

All reports must respect the user's organization/hospital/department permissions. Every report must show the date range, filters, calculation basis, and timezone. A performance report must show ticket priority, device criticality, and maintenance type beside completed-work totals so users are not ranked solely by ticket count. Begin with basic exports; add advanced reporting after core workflows are stable.

---

## 11. Notifications Module

### 11.1 Pages

| Page | Purpose |
|---|---|
| Notification center | In-app list of unread and recent alerts. |
| Notification preferences | Per-user settings for permitted notification types/channels. |

### 11.2 Important Events

* New and critical ticket created
* Ticket assigned, accepted, updated, resolved, closed, or reopened
* Requester information required
* Maintenance assigned, due, overdue, or completed
* Device status changed
* Target nearing breach or breached

In-app notifications are the MVP. Email, push, and SMS require policy and delivery configuration before activation.

---

## 12. Administration Module

### 12.1 Pages

| Page | Purpose |
|---|---|
| Organizations | Organization identity and policies. |
| Hospitals | Hospital records, activation state, address, and assignments. |
| Departments and locations | Departments, rooms, department managers, and active/inactive state. |
| Users | Accounts, activation, role/scope assignment, and staff profile. |
| Roles and permissions | Permission definitions and scope rules. |
| Device categories | Standardized categories, types, criticality, and related templates. |
| Manufacturers | Approved manufacturer reference data. |
| Checklist templates | Reusable preventive/inspection checklist administration. |
| Ticket and target policies | Ticket types, priorities, service targets, escalation rules, and closure policy. |
| System settings | Security, retention, storage, integration, and application configuration. |
| Audit logs | Searchable append-only record of important actions. |

### 12.2 Administrator Management Responsibilities

Authorized administrators must be able to manage the following records within their assigned organization scope:

| Area | Administrator actions | Important rules |
|---|---|---|
| Users | Create user, invite/activate user, edit profile/job details, assign role, assign hospital/department scope, reset access according to policy, deactivate, reactivate, and archive. | Deactivation must immediately prevent login while retaining history. Do not permanently delete accounts with related tickets, maintenance, or audit records. |
| Departments | Create department, edit name/code/type/manager, assign hospital, create/manage rooms or locations, activate, deactivate, and archive. | A department with devices or history must be archived/deactivated, not deleted. Devices must be transferred to a valid department/location before the change is completed. |
| Medical devices | Create/register device, edit approved inventory details, assign or transfer hospital/department/location, print/reprint QR label, activate, archive, and manage permitted documents. | Device transfer must create location history. Devices with tickets, maintenance, or audit history must be archived rather than permanently deleted. |

The Administration area should expose this through these pages:

```text
Administration
├── Users
│   ├── User list
│   ├── Add user / Invite user
│   ├── User details and role/scope assignment
│   └── Deactivate / Archive user
├── Departments and Locations
│   ├── Department list
│   ├── Add / Edit department
│   ├── Department details and manager assignment
│   └── Rooms and locations
└── Device Management
    ├── Device inventory list
    ├── Add / Edit device
    ├── Department/location transfer
    ├── QR label printing
    └── Archive device
```

### 12.3 Archive Instead of Destructive Removal

For operational hospital data, the normal "remove" action must be a recoverable archive or deactivation action:

* **User:** deactivate the account; preserve the person's previous actions and tickets.
* **Department:** deactivate/archive it; preserve historical device, ticket, and maintenance relationships.
* **Device:** archive it as decommissioned, removed, or inactive; preserve its full service history.

Permanent deletion is allowed only for clearly erroneous records with no linked tickets, maintenance records, attachments, history, or audit events. It must require an authorized administrator, a confirmation step, and an audit record explaining the deletion.

### 12.4 Important Permission Rule

A system administrator can manage users, departments, locations, and administrative device inventory data. They do not automatically receive permission to edit technical maintenance findings, completed test results, audit records, or clinical/operational device-status decisions. Those permissions must be explicitly assigned through an appropriate biomedical role.

---

## 13. Role-Based Page Access

| Page/module | Doctor / staff | Department manager | Biomedical technician | Biomedical engineer | Biomedical manager | System administrator |
|---|---:|---:|---:|---:|---:|---:|
| Dashboard | Yes | Yes | Yes | Yes | Yes | Yes, system scope |
| Scan QR | Authorized devices | Authorized devices | Authorized/assigned devices | Authorized devices | Authorized devices | Only explicit operational scope |
| Device list/details | Department scope | Department scope | Assigned/authorized scope | Authorized scope | Authorized scope | Only explicit operational scope |
| Report/request ticket | Yes | Yes | Yes | Yes | Yes | Policy-based |
| My/department tickets | Own/department scope | Department scope | Assigned/authorized scope | Authorized scope | Authorized scope | Policy-based |
| Triage/assignment | No | No | Limited if assigned | Yes if assigned | Yes | No automatic permission |
| Maintenance tasks/records | View permitted status | View department status | Assigned work | Authorized work | All authorized work | No automatic technical permission |
| Reports | Limited department reports | Department reports | Assigned/work reports | Authorized reports | Broad authorized reports | System reports |
| Administration | No | No | No | Limited reference data if assigned | Limited if assigned | Yes |

All access decisions must be enforced by the server, not only by hidden menu items.

---

## 14. Essential Cross-Module Rules

### 14.1 Organization and Department Scope

Every device, ticket, maintenance task, attachment, and report must belong to an organization. Devices and work records must be scoped to hospital and department/location as applicable. Users must not see data outside their authorized scope.

### 14.2 Status and Availability

Device status and ticket status are related but different:

* A ticket tracks work progress.
* A device status tracks equipment availability/operational condition.

Opening a ticket does **not** automatically make a device out of service. Authorized biomedical staff must assess the situation and update device status with a reason.

### 14.3 History and Auditability

Every important action must appear in the appropriate record history and audit log:

* Device creation, edit, status/location update, and QR label actions
* Ticket creation, source, priority, assignment, status, comments, resolution, closure, and reopening
* Maintenance work, findings, tests, result, and final status
* Permission, user, and configuration changes

### 14.4 Attachments

Attachments belong to a device, ticket, maintenance record, or checklist item. They inherit access controls from their parent record and must use protected file storage.

### 14.5 Search

Use global search carefully. Users can search only records they may access. The device/ticket search must prioritize exact asset number, ticket number, QR lookup, and department-specific device discovery.

---

## 15. Key User Journeys

### 15.1 Doctor Reports a Fault by QR Code

```text
Scan device QR
→ See device status and open tickets
→ Tap Report a problem
→ Enter short description and impact
→ Submit ticket
→ Receive ticket number and track public progress
```

### 15.2 Doctor Reports a Fault from a Department List

```text
Open Report Device Problem
→ Select authorized department
→ Search/select device
→ Review status and active tickets
→ Enter short description and impact
→ Submit ticket
→ Receive ticket number and track progress
```

### 15.3 Biomedical Engineer Resolves a Ticket

```text
Open triage queue
→ Validate type/priority and assign work
→ Investigate ticket
→ Create corrective maintenance if required
→ Record findings, work, tests, and device status
→ Add public progress update
→ Resolve and close under configured policy
```

### 15.4 Technician Completes Preventive Maintenance

```text
Open My Maintenance Tasks
→ Open assigned device/task
→ Complete checklist and record readings/findings
→ Add work/parts/test results
→ Submit for review or completion
→ System calculates next due date and updates history
```

---

## 16. MVP Page Set

Build these pages first. They deliver a complete operational loop without excessive complexity.

### 16.1 Foundation

* Login, password reset, profile
* Dashboard home
* Organization/hospital/department setup
* Users, roles, and authorized scope assignment

### 16.2 Device and QR

* Device list
* Add/edit device
* Device details and history
* QR label print/reprint
* QR scanner and scan result
* Department equipment list and device selector

### 16.3 Helpdesk Tickets

* Report a problem / request maintenance form
* My tickets
* Department tickets
* Biomedical triage queue
* My assigned tickets
* Ticket detail/timeline/comments/attachments

### 16.4 Maintenance

* Preventive plan list and basic scheduling
* My maintenance tasks
* Maintenance task detail and checklist
* Corrective maintenance creation from ticket
* Completed maintenance record

### 16.5 Oversight

* Notification center
* Basic operational dashboard statistics
* Basic inventory, ticket, and overdue-maintenance reports
* Audit-log search

---

## 17. Later Pages and Features

These are valuable but should wait until the MVP workflows are stable:

* Advanced report builder and custom report templates
* Spare-parts inventory and supplier management
* Calibration certificate lifecycle management
* Electrical safety/performance test modules
* Vendor work portal
* SMS/email/push notification channel management
* Advanced target escalation rules
* Barcode support
* Offline-first synchronization
* Multi-language/Arabic user interface
* Hospital system/procurement integrations
* Predictive analytics and AI maintenance recommendations

---

## 18. Recommended Delivery Sequence

### Phase 1 — Secure foundation

Authentication, users/roles, organization structure, PostgreSQL schema, server-side authorization, audit foundation, responsive shell, and Docker deployment.

### Phase 2 — Device foundation

Device inventory, locations/statuses, device detail/history, document storage, QR labels, camera scan, and manual lookup.

### Phase 3 — Helpdesk MVP

QR and department-selection ticket creation, reporter ticket tracking, public comments, biomedical triage queue, assignment, and ticket timelines.

### Phase 4 — Maintenance MVP

Preventive scheduling, assigned tasks, checklists, corrective maintenance from ticket, testing, maintenance records, and linked device/ticket history.

### Phase 5 — Oversight and automation

Dashboards, basic reports, in-app notifications, target alerts, and optional Redis/BullMQ background job processing.

### Phase 6 — Expansion

Parts, calibration, integrations, advanced reports, external notification channels, and offline support.

---

## 19. Product Decisions to Preserve

1. **One device record per physical device.**
2. **One unified ticket system for faults and service requests.**
3. **Tickets may create maintenance work but never disappear into it.**
4. **QR scanning is a fast entrance, not an access-control mechanism.**
5. **Doctors and staff can also select devices from their authorized department.**
6. **Simple reporting for department users; technical depth for biomedical users.**
7. **Ticket work progress and device availability are separate, linked states.**
8. **All key actions are visible in history and audit records.**
9. **Authorization is enforced by the server at organization, hospital, department, and role levels.**
10. **The app must work well on phones beside devices and on desktops for management work.**

---

## 20. Final Design Principle

The application should be easy for a clinician standing beside a device and powerful for a biomedical team responsible for thousands of devices:

> **Find the device quickly. Report work simply. Manage it professionally. Keep the complete history.**
