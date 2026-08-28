# BEMMS Documentation Index

> **Developer start here.** This index connects the BEMMS specifications and provides the recommended reading order for implementing the application.

## 1. How to Read These Specifications

Start with the core product vision, then the application map, then the role/UI behavior. Open the detailed specification for the module or workflow you are implementing.

```text
1. Core product vision
→ 2. Modules, pages, and roles
→ 3. User experience and UI behavior
→ 4. Detailed workflow/domain specification
→ 5. Data, security, signatures, reports, and acceptance criteria for that domain
```

Recommended first-reading path:

1. [Core product vision and requirements](<BEMMS- main-idea.md>)
2. [Application modules, pages, navigation, and workflows](BEMMS-Application-Modules-and-Pages.md)
3. [Role-based user experience and workflows](BEMMS-Role-Based-User-Experience-and-Workflows.md)
4. [UI/UX design guide](BEMMS-UI-UX-Design.md)
5. [Database schema and ERD](BEMMS-Database-Schema-and-ERD.md)
6. [Permissions and state machines](BEMMS-Permissions-and-State-Machines.md)
7. The detailed domain document for the feature being implemented

## 2. Documentation Map

| Document | Purpose | Use it when implementing |
|---|---|---|
| [BEMMS core product vision](<BEMMS- main-idea.md>) | High-level scope, requirements, data, security, technology, and MVP. | Any feature; start here for product intent. |
| [Database schema and ERD](BEMMS-Database-Schema-and-ERD.md) | Canonical PostgreSQL entities, relationships, constraints, integrity rules, indexes, audit design, transactions, and migration order. | Schema migrations, ORM models, APIs, data integrity, reporting queries, or database review. |
| [Permissions and state machines](BEMMS-Permissions-and-State-Machines.md) | Role/scope authorization, controlled state transitions, signature gates, exception handling, and acceptance tests. | API authorization, workflow actions, role UI, state changes, signature/release gates, or security review. |
| [Application modules and pages](BEMMS-Application-Modules-and-Pages.md) | Top-level modules, page map, navigation, role access, and phased delivery. | Routes, navigation, information architecture, or page scope. |
| [Role-based UX and workflows](BEMMS-Role-Based-User-Experience-and-Workflows.md) | Dashboard, daily work, handoffs, notifications, and behavior for each user type. | Role-aware screens, permissions, handoffs, and user journeys. |
| [UI/UX design guide](BEMMS-UI-UX-Design.md) | Mobile/desktop layouts, visual/interaction rules, forms, lists, task pages, and accessibility. | Components, screen layouts, responsive behavior, and interaction design. |
| [QR helpdesk ticketing workflow](QR-Helpdesk-Ticketing-Workflow.md) | QR scan-to-action, fast reporting, tickets, queues, priorities, comments, and maintenance handoff. | Scan, report problem, ticket creation, tracking, triage, or ticket UI. |
| [Role-based device profiles and QR access](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) | One QR/device profile with different authorized views/actions by role. | QR routes, device API responses, profile tabs, field-level data visibility. |
| [Maintenance types and engineer triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) | Engineer-selected maintenance types, diagnosis, categories, work stages, and linked tasks. | Biomedical triage, corrective maintenance, testing, classification, or task state. |
| [PM scheduling, calibration expiry, and alerts](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md) | Recurring plans, due dates, notifications, PM/calibration tasks, and automatic device updates. | PM plans, scheduler/background jobs, calendar, due/overdue views, or calibration. |
| [Electronic signatures and traceability](BEMMS-Electronic-Signatures-and-Traceability.md) | Performer/reviewer/release signatures, immutable versions, approval, amendments, and accountability. | Signing, review, release, audit integrity, or technical record completion. |
| [Administration, settings, and user management](BEMMS-Administration-Settings-and-User-Management.md) | Users, roles, departments, policies, settings, audit governance, and secure configuration. | Admin pages, access control setup, policy/configuration, or audit logs. |
| [Department device management and inventory](BEMMS-Department-Device-Management-and-Inventory.md) | Department Devices tab, global inventory, add/edit/transfer/archive device flows. | Department pages, device inventory, device transfer, QR labels, or device lifecycle. |

## 3. Feature Reading Paths

### 3.1 QR Scan and Helpdesk Reporting

```text
Core product vision
→ Role-based device profiles and QR access
→ QR helpdesk ticketing workflow
→ Role-based UX and workflows
→ UI/UX design guide
→ Maintenance types and engineer triage
→ Database schema and ERD
→ Permissions and state machines
```

### 3.2 Ticket to Repair and Device Release

```text
QR helpdesk ticketing workflow
→ Maintenance types and engineer triage
→ Electronic signatures and traceability
→ Role-based device profiles and QR access
→ PM scheduling, where planned work is involved
→ Database schema and ERD
→ Permissions and state machines
```

### 3.3 Preventive Maintenance, Calibration, and Alerts

```text
PM scheduling, calibration expiry, and alerts
→ Maintenance types and engineer triage
→ Electronic signatures and traceability
→ Role-based UX and workflows
→ Core product reporting requirements
→ Database schema and ERD
→ Permissions and state machines
```

### 3.4 Device Inventory and Department Management

```text
Department device management and inventory
→ Administration, settings, and user management
→ Role-based device profiles and QR access
→ Application modules and pages
→ UI/UX design guide
→ Database schema and ERD
→ Permissions and state machines
```

### 3.5 Users, Roles, and Administration

```text
Administration, settings, and user management
→ Role-based user experience and workflows
→ Role-based device profiles and QR access
→ Electronic signatures and traceability
→ Core security requirements
→ Database schema and ERD
→ Permissions and state machines
```

## 4. Source-of-Truth Convention

The documents are intentionally layered:

* The **core product vision** defines broad scope and product direction.
* The **Application Modules** and **Role-Based UX** documents define how the application is organized and experienced.
* The detailed domain documents define the implementation behavior for their specific area.
* The **Database Schema and ERD** document defines the canonical relational data model and integrity rules that implement those requirements.
* The **Permissions and State Machines** document defines who may perform a protected action and the valid workflow transitions for each record.

If a high-level statement is less specific than a detailed domain rule, use the detailed domain rule for that area. For example:

* Use the PM Scheduling document for due-date calculation and automatic device updates.
* Use the Electronic Signatures document for signing, review, release, amendments, and immutable records.
* Use the QR Helpdesk document for ticket lifecycle and public/internal communication.
* Use the Administration document for policy scope, user lifecycle, and protected system configuration.
* Use the Database Schema and ERD document for table ownership, relationships, keys, historical evidence, database constraints, and migration order.
* Use the Permissions and State Machines document for server-side authorization, state transitions, signature/release gates, and exception behavior.

When a new product decision changes more than one domain, update the core product document and each affected detailed document, then add/update links in this index.

## 5. Shared Core Concepts

All implementation work should preserve these rules:

```text
One physical device
→ One underlying device profile and QR reference
→ Many tickets, maintenance tasks, plans, records, documents, signatures, and history events

One helpdesk ticket
→ One or more linked maintenance tasks when technical work is required

One maintenance plan
→ Recurring task occurrences
→ Signed qualifying record
→ Device summary and next-due update

One individual user account
→ Explicit role(s) + organization/hospital/department scope
→ Traceable responsibility for every important action
```

## 6. Implementation Checklist by Layer

| Implementation layer | Primary documents |
|---|---|
| Routes, modules, navigation | Application Modules; Role-Based UX; UI/UX Design |
| Authentication, roles, scopes, admin policies | Core Product Vision; Administration; Role-Based Device Profiles; Database Schema and ERD; Permissions and State Machines |
| Devices, departments, locations, QR | Core Product Vision; Department Device Management; Role-Based Device Profiles; Database Schema and ERD; Permissions and State Machines |
| Helpdesk tickets and public/internal communication | QR Helpdesk; Role-Based UX; UI/UX Design; Database Schema and ERD; Permissions and State Machines |
| Triage, corrective work, testing | Maintenance Types and Engineer Triage; Electronic Signatures; Database Schema and ERD; Permissions and State Machines |
| PM, calibration, alerts, background scheduling | PM Scheduling; Electronic Signatures; Core Product Vision; Database Schema and ERD; Permissions and State Machines |
| Device release, signatures, audit trail | Electronic Signatures; Role-Based Device Profiles; Core Product Vision; Database Schema and ERD; Permissions and State Machines |
| Reports, costs, performance, compliance | Core Product Vision; PM Scheduling; Administration; Application Modules; Database Schema and ERD; Permissions and State Machines |

## 7. Documentation Maintenance Rules

When creating or changing a feature:

1. Identify its owning detailed document from the map above.
2. Check its related workflows, roles, UI requirements, security, audit, and data implications.
3. Preserve links to related device, ticket, maintenance, PM, signature, and admin rules.
4. Update acceptance criteria if the change affects testable behavior.
5. Update this index if a new major specification is added.

> **BEMMS is designed as one connected system: device identity leads to ticket/work, work leads to signed history, and configuration/access rules govern every step.**
