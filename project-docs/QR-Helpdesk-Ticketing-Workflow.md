# QR Scan-to-Action Helpdesk and Maintenance Ticketing

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Modules and pages](BEMMS-Application-Modules-and-Pages.md) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md)
>
> **Related specifications:** [Role-based QR/device access](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [Maintenance triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) · [Electronic signatures](BEMMS-Electronic-Signatures-and-Traceability.md) · [UI/UX design](BEMMS-UI-UX-Design.md)

## 1. Purpose

This document defines the BEMMS QR-based helpdesk workflow for reporting medical-device problems and requesting biomedical maintenance.

The intended experience is simple:

> Scan the device → immediately understand its current condition → report a problem or request service without searching for the device.

Each device has a QR label. When an authorized doctor, nurse, department staff member, biomedical technician, or biomedical engineer scans it, BEMMS opens the correct device and presents safe, role-appropriate actions. Doctors and department staff can also select a device from an authorized department's equipment list when scanning is not practical. A report created through either route becomes a trackable helpdesk ticket connected to the device for its entire lifecycle.

This is a core MVP feature, not an optional add-on.

---

## 2. Goals

The scan-to-action helpdesk feature must:

1. Identify the correct device without manual asset-number search.
2. Let doctors and department staff select a device from an authorized department when a QR scan is unavailable or inconvenient.
3. Show the device's current availability, status, open faults, and maintenance due information immediately after scanning or selection.
4. Let authorized users create a device problem report or maintenance request in a few taps.
5. Automatically link every ticket to the selected device, its hospital, department, room, and requester.
6. Give the reporter a clear, helpdesk-style ticket number, current status, activity timeline, and progress updates.
7. Give biomedical teams a queue to triage, prioritize, assign, investigate, repair, test, and close work.
8. Preserve a complete device, maintenance, ticket, and audit history.
9. Keep all technical, operational, and sensitive information protected by role and organizational scope.

---

## 3. Scope and Non-Goals

### 3.1 Included in the MVP

* QR labels and mobile camera scanning
* Manual asset-number/device-ID lookup when scanning is unavailable
* Department-based device selection for authorized doctors and department staff
* Mobile-friendly device scan result page
* Problem reports and service requests linked to a device
* Ticket numbers, ticket queues, assignment, comments, attachments, and progress tracking
* Ticket-to-corrective-maintenance conversion
* Device status updates, notifications, audit records, and ticket history
* Basic configurable priorities and response/resolution targets

### 3.2 Not Included in the MVP

* Patient medical records or patient information
* Direct control of a medical device
* Automatic device-protocol integration
* Full spare-parts warehouse management
* External vendor portal access
* Complex offline synchronization
* AI diagnosis or automated clinical decision-making

The displayed equipment status is operational information only. It must not be described as a clinical approval, a clinical clearance, or a substitute for hospital safety procedures.

---

## 4. Core Terminology

| Term | Meaning |
|---|---|
| Device | A registered medical device, identified by a BEMMS device ID and asset number. |
| QR label | A printed physical label fixed to a device, containing a non-sensitive BEMMS device reference. |
| Scan result page | The mobile-first page shown immediately after a valid QR scan. |
| Ticket | A helpdesk record for a device problem, service request, inspection request, or maintenance work. |
| Reporter | The authorized user who creates a ticket. |
| Requester | The department user or contact who can answer questions and confirm the outcome. |
| Assignee | The biomedical engineer or technician responsible for the ticket or maintenance task. |
| Public comment | A ticket update visible to the reporter and authorized department users. |
| Internal note | A technical update visible only to authorized biomedical users and administrators. |
| Corrective maintenance | Maintenance work performed to investigate and resolve a reported issue. |

---

## 5. QR Label Design and Security

### 5.1 Label Contents

Every active device must have a printable, durable QR label. The visible label should include:

* Hospital or organization name, where appropriate
* Device name
* Human-readable asset number
* Optional device category
* QR code
* A short instruction such as: `Scan to view status or report a device problem`

The QR payload must contain only a non-sensitive opaque identifier or a secure URL, for example:

```text
https://bemms.example.org/scan/dv_8Kp2mQ7x
```

The QR code must not contain patient information, user information, maintenance details, passwords, API keys, or database IDs that expose data directly.

### 5.2 Stable Identity and Label Lifecycle

* A device QR identifier remains stable while the device is active.
* Damaged or missing labels can be reprinted without changing the device or losing its history.
* A QR reference may be revoked and replaced only by an authorized user.
* QR label creation, printing, replacement, revocation, and scan failures are audit events where required by policy.
* Decommissioned or removed devices must show an unambiguous unavailable/decommissioned state when scanned.

### 5.3 Authentication and Authorization

* A user must authenticate before BEMMS displays protected device details or creates a ticket.
* After login, BEMMS returns the user to the originally scanned device.
* The server must enforce organization, hospital, department, and role permissions for every device and ticket request.
* A QR URL alone must never grant access.
* Invalid, revoked, unknown, or unauthorized QR codes must show a safe error message without disclosing protected information.

---

## 6. Scan Result Page

### 6.1 Required Information

After an authorized scan, BEMMS must show a mobile-first page that requires no additional navigation to understand the device's condition. It must display:

* Device name and asset number
* Manufacturer and model where authorized
* Current hospital, department, room, and exact location
* Current operational status, prominently displayed
* A clear availability/safety alert if the device is reported faulty, under maintenance, out of service, or otherwise unavailable
* The number of open tickets and highest current priority
* Last maintenance date and next preventive-maintenance due date
* Whether maintenance is due, overdue, scheduled, or in progress
* The primary recommended action for the signed-in user

### 6.2 Required Quick Actions

The main actions must be large, touch-friendly buttons:

* **Report a problem**
* **Request maintenance**
* **View open tickets**
* **View device history**

Biomedical users may also see:

* **Start assigned maintenance**
* **Update device status**
* **Open corrective maintenance**
* **View technical details**

The displayed actions depend on the user's role and scope. The page must never rely on hiding a button as the only authorization control; all actions must be checked on the server.

### 6.3 State-Based Guidance

The primary action should respond to the device state:

| Device situation | Prominent scan-page guidance |
|---|---|
| Operational, no open ticket | Report a problem or view history. |
| Open ticket already exists | View open ticket; allow an additional observation/comment instead of creating duplicates. |
| Under investigation or maintenance | Show ticket owner and latest public update; allow an authorized reporter to add information. |
| Maintenance due/overdue | Biomedical staff see the assigned task or start maintenance; department staff see maintenance status. |
| Out of service/decommissioned | Show a strong availability warning and the relevant ticket or status reason. |

Creating a ticket must not automatically change a device to **Out of service**. A qualified biomedical user must assess and set that status when appropriate. The reporter may, however, indicate that the device appears unsafe or unavailable; this must be highly visible during triage.

---

## 7. Ticket Types

Every ticket has a type. Ticket type controls the initial form, queue, default priority, and workflow.

| Ticket type | Use case | Typical reporter |
|---|---|---|
| Device problem | Fault, abnormal behavior, alarm, damage, or performance concern. | Doctor, nurse, department staff, biomedical staff. |
| Urgent equipment concern | A device may be unsafe, unavailable, or blocking patient care. | Doctor, nurse, department staff. |
| Maintenance request | Request inspection, service, calibration, relocation, or non-urgent support. | Department staff, department manager. |
| Preventive-maintenance follow-up | A planned maintenance task needs attention or access to the device. | Biomedical staff. |
| Inspection request | Request a safety, performance, electrical, or acceptance inspection. | Authorized staff. |

The reporter should normally choose only **Report a problem** or **Request maintenance** from the scan page. The system can choose a more specific type during triage.

---

## 8. Fast Ticket Creation

### 8.1 Design Principle

The QR scan already identifies the device. The ticket form must not ask the user to select or search for the device again.

“Single click” should mean a near-zero-friction route from scan to report—not an unsafe silent ticket with no information. The recommended flow is one tap to open a prefilled form, followed by a short submit action.

### 8.2 Prefilled Data

When a ticket is opened from a QR scan, BEMMS automatically records:

* Device ID and asset number
* Organization, hospital, department, room, and known location
* Reporter identity and role
* Current date/time
* Ticket source: `QR scan`
* Current device status and current open-ticket count at time of creation

### 8.3 Minimum Reporter Form

The mobile reporter form should require only:

1. **What is the problem or request?** — short description
2. **Impact** — `Device usable`, `Device not usable`, or `May affect patient care / urgent`

It should optionally allow:

* Problem category
* Photo or video attachment
* Contact phone/extension or preferred contact method
* Longer description
* Reported device location correction

The system assigns the ticket number immediately after submission and shows a confirmation page with the status `New`.

### 8.4 Duplicate-Ticket Prevention

Before the reporter submits, BEMMS should show active tickets for the same device. The reporter can:

* Open an existing ticket
* Add an observation or photo to an existing ticket
* Confirm that this is a separate problem and create a new ticket

This helps prevent duplicate reports while preserving the ability to report a genuinely different fault.

### 8.5 Department Device Selection: Doctor and Staff Entry Point

Doctors and department staff must not depend on QR scanning. From the dashboard, department equipment list, or a dedicated **Report Device Problem** page, they must be able to create a ticket by selecting a device from a specific department.

The flow is:

```text
Open Report Device Problem
→ Select authorized hospital, if the user has access to more than one
→ Select authorized department
→ Search or select a device currently assigned to that department
→ Review device status and open-ticket summary
→ Report a problem or request maintenance
→ Submit trackable ticket
```

Rules for this entry point:

* The department selector defaults to the user's assigned department.
* A doctor or staff member can select only hospitals and departments within their authorized scope.
* The device selector must show only active devices currently assigned to the selected department, with name, asset number, room, manufacturer/model where useful, and current status.
* The selector must support search by device name, asset number, inventory number, serial number, manufacturer, and model.
* Before ticket creation, BEMMS must show the selected device's current status and active-ticket summary to prevent reporting the wrong device or duplicating an existing report.
* The ticket creation form, priority/impact questions, visibility rules, and workflow are identical to QR-created tickets.
* BEMMS records the source as `Department device selection`, along with the selected department and device location snapshot.
* If a device has been moved since the department list was opened, BEMMS must refresh the location/status and require the user to confirm the correct device before submission.
* If the device cannot be found, the user may create a department-level **Device not identified** request. Biomedical triage must link it to a device or mark it invalid before resolution.

The department device selection page should be available on desktop and mobile. On mobile, it should prioritize a searchable list with large tap targets; on desktop, it may be reached from the department device table.

---

## 9. Ticket Priority, Triage, and Targets

### 9.1 Priority Model

The reporter supplies impact information; the biomedical triage team confirms or changes the priority. The system must preserve the original reported impact and the reason for any priority change.

| Priority | Example | Expected action |
|---|---|---|
| P1 — Critical | Potential safety concern, essential device unavailable, or immediate patient-care impact. | Immediate alert and urgent biomedical triage. |
| P2 — High | Important department device unavailable or major loss of function. | Prompt assignment and response. |
| P3 — Normal | Device issue with a workaround or routine service request. | Standard queue and target. |
| P4 — Low | Cosmetic issue, information request, or minor non-urgent work. | Scheduled work. |

Actual response and resolution targets must be configurable by hospital, device criticality, department, and working hours. BEMMS must not hard-code clinical service-level agreements.

### 9.2 Triage Responsibilities

The biomedical manager, biomedical engineer, or another authorized triage role must be able to:

* Validate the ticket type and priority
* Assign an engineer or technician
* Update the device availability/status when qualified to do so
* Link related or duplicate tickets
* Request additional information from the reporter
* Convert the ticket to corrective maintenance
* Set or adjust response/resolution targets with a recorded reason

---

## 10. Helpdesk Ticket Workflow

### 10.1 Main Statuses

```text
New
→ Triaged
→ Assigned
→ Accepted
→ Investigating
→ Waiting for requester / Waiting for parts / Waiting for vendor
→ Repairing or Performing maintenance
→ Testing
→ Resolved
→ Closed
```

### 10.2 Status Definitions

| Status | Meaning | Who normally updates it |
|---|---|---|
| New | Created by a reporter and awaiting biomedical review. | System/reporter. |
| Triaged | Priority, type, and initial disposition have been reviewed. | Triage role. |
| Assigned | Work has an identified biomedical owner. | Triage role/manager. |
| Accepted | The assignee has acknowledged responsibility. | Assignee. |
| Investigating | Diagnosis or inspection is in progress. | Assignee. |
| Waiting for requester | Biomedical team needs information, access, or confirmation from the department. | Assignee. |
| Waiting for parts | Repair cannot proceed until approved parts are available. | Assignee/manager. |
| Waiting for vendor | Work depends on an external vendor or service provider. | Assignee/manager. |
| Repairing / Performing maintenance | Corrective or requested maintenance is being performed. | Assignee. |
| Testing | Repair is complete and functional/safety/performance testing is underway. | Assignee. |
| Resolved | Biomedical work is complete; requester confirmation or final closure may remain. | Assignee/manager. |
| Closed | The ticket is finalized and read-only except for authorized reopening. | Manager/system. |
| Cancelled | The request was invalid, duplicate, or no longer needed, with a required reason. | Authorized triage role. |

### 10.3 Resolution and Closure

* Resolving a ticket requires a resolution summary and resulting device status.
* Tickets linked to corrective maintenance must reference the completed maintenance record before closure.
* The reporter or department manager may confirm the resolution when that approval rule is enabled.
* A manager may close the ticket after the configured confirmation period if no response is received.
* Reopening a resolved or closed ticket requires a reason and creates a timeline event.

---

## 11. Ticket Timeline, Comments, and Attachments

Every ticket must have a chronological timeline including:

* Ticket creation and scan source
* Reporter description and impact
* Priority and status changes
* Assignment and reassignment
* Public comments
* Internal biomedical notes
* Attachments
* Maintenance links and completion details
* Device status changes related to the ticket
* Notifications and escalation events where required
* Resolution, confirmation, closure, cancellation, and reopening

### 11.1 Comment Visibility

| Comment type | Visible to |
|---|---|
| Public update | Reporter, authorized department users, biomedical team, managers. |
| Internal biomedical note | Assigned biomedical users, biomedical managers, and authorized administrators only. |
| Restricted administrative note | Only explicitly authorized administrative/security roles. |

The interface must clearly mark an internal note before it is submitted. Public updates should use plain, understandable language whenever they describe progress to department staff.

### 11.2 Attachments

Reporters can attach authorized photos or short videos of symptoms, damage, error messages, or device displays. Biomedical users can attach technical photos, service documents, test results, and vendor documents. All attachments must use protected storage and inherit ticket/device access controls.

---

## 12. Integration with Maintenance and Device History

### 12.1 Corrective Maintenance

An authorized biomedical user can create corrective maintenance from a ticket. BEMMS must carry forward:

* Device identity and location
* Original fault description and reported impact
* Related attachments and permitted public comments
* Ticket priority and assigned engineer/technician
* Ticket identifier in the maintenance record

The maintenance record adds technical findings, root cause, work performed, parts used, testing, result, recommendations, and final device status. A ticket may have one or more linked maintenance records when additional work is needed.

### 12.2 Device History

The device history page must show all tickets and maintenance records in chronological order. A device scan page should show active tickets first, then offer access to full history.

---

## 13. Roles and Permissions

| Role | Scan and view | Create ticket | Track public progress | Add public comment | Add internal note | Assign/triage | Change device status | Close ticket |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Doctor / department staff | Authorized department devices | Yes | Own/authorized department tickets | Yes | No | No | No | No |
| Department manager | Authorized department devices | Yes | Department tickets | Yes | No | No | No, unless specifically assigned | May confirm resolution if enabled |
| Biomedical technician | Assigned/authorized devices | Yes | Assigned/authorized tickets | Yes | Yes, within scope | No, unless assigned | Limited, if explicitly allowed | No |
| Biomedical engineer | Authorized devices | Yes | Authorized tickets | Yes | Yes | Yes, if assigned | Yes | May resolve; closure depends on policy |
| Biomedical manager | Authorized hospitals/devices | Yes | Authorized tickets | Yes | Yes | Yes | Yes | Yes |
| System administrator | Only explicitly assigned operational scope | Policy-dependent | Policy-dependent | Policy-dependent | Policy-dependent | User/system management | No automatic technical permission | No automatic technical permission |

All checks must be enforced in server-side logic. Frontend visibility is for usability, not security.

---

## 14. Notifications and Escalation

### 14.1 In-App Notifications

BEMMS should notify the relevant users when:

* A new ticket is created
* A P1/Critical ticket is created
* A ticket is assigned or reassigned
* A ticket is accepted
* A ticket status changes
* A reporter is asked for information
* A public comment is added
* A response or resolution target is at risk or overdue
* A ticket is resolved, closed, cancelled, or reopened

### 14.2 Escalation

For P1 or breached targets, BEMMS should escalate to configured biomedical managers. Email, push, SMS, or other channels may be added only after hospital policy, contact data, and delivery reliability are agreed.

---

## 15. Data Model

The following logical tables extend the main BEMMS database design. Actual column names may vary, but relationships and auditability must be retained.

### 15.1 `device_qr_labels`

* QR label ID
* Device ID
* Opaque QR reference — unique
* Label status — active, revoked, replaced
* Printed date and printed by
* Revoked/replaced date, reason, and user
* Created and updated audit fields

### 15.2 `service_tickets`

* Ticket ID — internal UUID
* Human-readable ticket number — unique
* Device ID
* Organization, hospital, department, and location snapshot
* Ticket type
* Source — QR scan, department device selection, device page, manual entry, import
* Reporter ID and requester contact snapshot
* Title and description
* Reporter impact and triaged priority
* Current status
* Assignee, triage owner, and team
* Response and resolution target timestamps
* Related corrective maintenance record(s)
* Resolution summary, closure reason, cancellation reason, and final device status
* Created, updated, resolved, closed, and reopened timestamps

### 15.3 `service_ticket_events`

Append-only event records for every status, priority, assignment, target, or visibility-relevant change:

* Event ID
* Ticket ID
* Event type
* Previous value and new value where applicable
* Actor ID
* Timestamp
* Public/internal visibility
* Reason or comment where required

### 15.4 `service_ticket_comments`

* Comment ID
* Ticket ID
* Author ID
* Visibility — public, internal, restricted
* Comment body
* Created/edited timestamps
* Edit and deletion audit information

### 15.5 `service_ticket_attachments`

* Attachment ID
* Ticket ID
* File record ID
* Visibility
* Uploaded by and uploaded date

### 15.6 Key Constraints and Indexes

* Ticket device, organization, hospital, and department relationships must be valid.
* Ticket numbers and active QR references must be unique.
* Only allowed ticket-status transitions may occur.
* Closing/resolving must require the configured resolution fields.
* A user may access only tickets and attachments within authorized scope.
* Index active tickets by device, organization, hospital, department, status, priority, assignee, and created date.
* Index QR reference lookup for fast scan results.

---

## 16. User Interface Requirements

### 16.1 Reporter Experience

The reporter needs a fast, understandable mobile experience:

1. Scan QR.
2. See the status/availability banner.
3. Tap **Report a problem** or **Request maintenance**.
4. Enter short description and impact.
5. Submit and receive ticket number.
6. Follow ticket status and add information if requested.

### 16.2 Biomedical Helpdesk Queue

The biomedical queue must support:

* New, untriaged tickets
* Filters for hospital, department, device category, status, priority, assignee, and overdue target
* Sorting by priority, age, target breach risk, and device criticality
* Bulk assignment only for roles with explicit authority
* Clear distinction between public updates and internal technical notes
* A one-click route from ticket to linked device and corrective-maintenance record

### 16.3 Ticket Detail Page

The ticket detail page must show:

* Ticket number, status, priority, and targets
* Device identity and current status
* Original reporter information and description
* Assignee and current work state
* Timeline, comments, and attachments
* Open related tickets and linked maintenance records
* Role-appropriate actions

---

## 17. Technical Implementation Guidance

The self-hosted BEMMS architecture remains the foundation:

```text
PWA / browser camera
        ↓
Next.js scan and ticket APIs
        ↓
PostgreSQL (system of record)
        ↓
Protected file storage / optional MinIO
        ↓
Optional Redis + BullMQ for notifications, escalations, and scheduled jobs
```

Implementation rules:

* Resolve every QR reference on the server, then authorize the user before returning protected data.
* Use PostgreSQL transactions when creating a ticket, its initial timeline event, audit record, and notification request.
* Keep ticket-event/audit records append-only for ordinary users.
* Use PostgreSQL as the permanent source of truth; Redis is optional and must not be the only store for tickets or maintenance data.
* Use server-side validation for form input, attachment metadata, status transitions, and permission checks.
* Generate labels server-side and apply an approved printable format.
* Use HTTPS for hospital-network and public web access.

---

## 18. MVP Acceptance Criteria

The scan-to-action helpdesk feature is complete for the MVP only when all of the following work:

1. An authorized user can scan an active device QR code on a mobile device.
2. The scan result page shows the correct device, location, operational status, availability alert, active-ticket summary, and maintenance due state.
3. A department user can create a device problem ticket without manually choosing the device.
4. A doctor or department user can select a device from an authorized department and create the same type of ticket without using a QR code.
5. The department device selector does not expose devices outside the user's authorized hospital or department scope.
6. The new ticket receives a unique human-readable number and is visible in the reporter's tracking view and authorized biomedical queue.
7. The ticket's timeline records creation, source, reporter impact, status changes, assignment, and comments.
8. An authorized biomedical user can triage, assign, investigate, and convert the ticket into corrective maintenance.
9. Public comments are visible to appropriate department users; internal notes are not.
10. A ticket can be resolved only with a resolution summary and resulting device status, and it can be closed according to the configured policy.
11. Invalid, revoked, signed-out, and unauthorized scans reveal no protected device details.
12. The device history shows linked tickets, maintenance records, and status changes.
13. All important QR, ticket, maintenance, and device-status changes create audit records.
14. The experience is usable on a phone with large touch targets and a manual lookup fallback.

---

## 19. Recommended Delivery Order

1. Add stable device QR references and printable labels.
2. Build authenticated QR resolution and the scan result page.
3. Build the department device selector, scoped device search, and ticket source tracking.
4. Build the short reporter form and ticket creation transaction.
5. Build the reporter ticket-tracking view and public timeline.
6. Build the biomedical triage queue, assignment, and internal notes.
7. Add corrective-maintenance conversion and device-history links.
8. Add priority targets, notifications, and optional Redis/BullMQ background processing.
9. Test permissions, invalid scans, status transitions, department device selection, file access, mobile usability, and hospital workflows with real biomedical users.

---

## 20. Product Principle

The feature should feel simple to the person standing beside the device, while preserving the traceability and discipline required by a biomedical engineering service desk:

> **One scan or authorized device selection identifies the device. One short report opens a ticket. Every update is visible to the right people until the work is complete.**
