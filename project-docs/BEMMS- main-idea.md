# Biomedical Equipment Management and Maintenance System (BEMMS)

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Application modules and pages](BEMMS-Application-Modules-and-Pages.md) · [Role-based UX and workflows](BEMMS-Role-Based-User-Experience-and-Workflows.md)
>
> **Detailed specifications:** [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Device profiles and QR access](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [Maintenance triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) · [PM scheduling](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md) · [Electronic signatures](BEMMS-Electronic-Signatures-and-Traceability.md) · [Administration](BEMMS-Administration-Settings-and-User-Management.md) · [Department inventory](BEMMS-Department-Device-Management-and-Inventory.md)

## 1. Project Overview

### 1.1 Project Name

**Biomedical Equipment Management and Maintenance System (BEMMS)**

Alternative product names may be selected later. The working name for this document is **BEMMS**.

### 1.2 Project Type

A multi-user, self-hostable, installable **Progressive Web Application (PWA)** for managing medical devices, biomedical equipment, maintenance activities, helpdesk tickets, service reports, and device information across hospital departments. It can run on a hospital's local network or on an organization-controlled web server.

The system must work on:

* Android phones
* iPhones
* Tablets
* Desktop computers
* Hospital workstations

The application must be installable from a web browser and provide an app-like experience without initially requiring separate Android or iOS applications.

### 1.3 Main Purpose

The system will help biomedical engineers and hospital staff organize and manage medical equipment across one or more hospitals and departments.

The system will provide a centralized digital platform for:

* Registering medical devices
* Organizing devices by hospital and department
* Tracking device locations
* Reporting equipment faults and problems
* Managing corrective maintenance
* Scheduling preventive maintenance
* Recording maintenance activities
* Tracking device status
* Maintaining complete device histories
* Uploading equipment documents and photos
* Monitoring maintenance due dates
* Generating operational and maintenance reports
* Tracking equipment downtime
* Providing dashboards and statistics
* Maintaining an audit trail of important changes

### 1.4 Problem Being Solved

Hospitals may manage medical equipment using paper records, spreadsheets, phone calls, messaging applications, or disconnected systems.

These methods can create problems such as:

* Medical equipment information is difficult to find.
* Equipment records may be duplicated or outdated.
* Maintenance schedules may be missed.
* Equipment problems may not be reported consistently.
* Biomedical engineers may not have a clear view of open helpdesk tickets.
* Maintenance history may be incomplete.
* Device downtime may be difficult to calculate.
* Hospital management may not have accurate equipment statistics.
* It may be difficult to identify devices with repeated failures.
* Important changes may not be traceable to a specific user.

BEMMS will centralize this information in one controlled system.

### 1.5 Canonical Terms

For implementation and database naming, BEMMS uses the following terms consistently:

* **Problem/issue:** the symptom, observation, or request reported by a doctor, nurse, department staff member, or biomedical user.
* **Helpdesk ticket:** the trackable service record created for that report or request. This is the canonical workflow record.
* **Maintenance task:** the assigned technical work created from a helpdesk ticket or a planned PM/calibration occurrence.
* **Maintenance record:** the permanent completed and signed technical record.

The canonical database names are `service_tickets`, `service_ticket_comments`, and `service_ticket_attachments`. Older references to an "issue" in this high-level document refer to the reported problem; new implementation must use the Helpdesk Tickets model defined in [QR-Helpdesk-Ticketing-Workflow.md](QR-Helpdesk-Ticketing-Workflow.md).

---

# 2. Project Goals

## 2.1 Primary Goals

The application must:

1. Maintain a centralized inventory of medical devices.
2. Organize devices by organization, hospital, department, and location.
3. Allow authorized users to create, view, update, and manage equipment records.
4. Allow hospital staff to report equipment problems.
5. Allow biomedical engineers to investigate and resolve reported helpdesk tickets.
6. Support preventive and corrective maintenance.
7. Track maintenance schedules and overdue activities.
8. Maintain complete maintenance and helpdesk-ticket histories for every device.
9. Provide role-based access control.
10. Support real-time or near-real-time updates between users.
11. Work well on mobile phones and desktop computers.
12. Be installable as a PWA.
13. Provide searchable dashboards and reports.
14. Keep an audit history for important actions.
15. Let authorized staff scan a device QR code and immediately understand its current condition and the appropriate next action.

## 2.2 Secondary Goals

The system should later support:

* Barcode scanning
* Push notifications
* Email notifications
* PDF report generation
* Excel export
* Spare-parts tracking
* Calibration records
* Equipment inspection checklists
* Device performance analytics
* Offline data access
* Integration with helpdesk(reporting)
* Integration with hospital systems
* Integration with ai agents(copilot)
## 2.3 Non-Goals for the First Version

The first version will not initially include:

* Direct control of medical devices
* Automatic device data collection through medical-device protocols
* Integration with electronic health records
* Patient information management
* Medical diagnosis functionality
* Advanced artificial intelligence prediction
* Full enterprise asset accounting
* Complex spare-parts warehouse management

These features may be evaluated in future versions.

---

# 3. Target Users

## 3.1 Biomedical Engineer

Primary system user.

Responsibilities may include:

* Registering medical devices
* Updating device information
* Reviewing reported problems
* Assigning maintenance work
* Performing maintenance
* Recording maintenance activities
* Updating equipment status
* Scheduling preventive maintenance
* Reviewing equipment history
* Generating reports

## 3.2 Biomedical Technician and biomadical engineer

Responsibilities may include:

* Viewing assigned maintenance tasks
* Updating maintenance progress
* Recording work performed
* Adding maintenance notes
* Uploading maintenance photos
* Recording spare parts used
* Marking assigned work as completed

Technicians may have restricted access compared with biomedical engineers.

## 3.3 Department Staff

Examples include:

* Nurses
* Laboratory staff
* Radiology staff
* Operating-room staff
* Department equipment coordinators

Responsibilities may include:

* Viewing equipment assigned to their department
* Reporting equipment problems
* Adding problem descriptions
* Uploading photos
* Viewing the status of submitted reports

Department staff should not be able to edit technical equipment information or close maintenance activities unless specifically authorized.

## 3.4 Department Manager

Responsibilities may include:

* Viewing equipment assigned to the department
* Viewing open equipment helpdesk tickets
* Viewing maintenance status
* Reviewing department equipment reports
* Monitoring equipment availability

## 3.5 Biomedical Engineering Manager

Responsibilities may include:

* Viewing all hospitals and departments within the organization
* Viewing equipment statistics
* Reviewing maintenance performance
* Reviewing overdue maintenance
* Monitoring equipment downtime
* Managing biomedical engineers and technicians
* Reviewing reports and analytics

## 3.6 System Administrator

Responsibilities may include:

* Creating organizations
* Creating hospitals
* Creating departments
* Managing users
* Assigning roles
* Managing system configuration
* Managing device categories
* Managing manufacturers
* Managing permissions

The system administrator should not automatically receive permission to modify clinical or technical maintenance records unless explicitly assigned.

---

# 4. System Scope

## 4.1 Organizational Structure

The application must support the following hierarchy:

Organization
→ Hospital
→ Department
→ Location or Room
→ Medical Device

Example:

Organization: National Hospital Group

Hospital: Central Teaching Hospital

Department: Intensive Care Unit

Location: ICU Room 3

Device: Ventilator

Asset Number: ICU-VENT-001


# 5. Core Functional Modules

## 5.1 Authentication and User Management

The system must support:

* User registration
* Secure login
* Logout
* Password reset
* Email verification if enabled
* User profile management
* User activation and deactivation
* Role assignment
* Department assignment

User profile fields may include:

* Full name
* Email address
* Phone number
* Job title
* Employee identifier
* Organization
* Assigned hospital
* Assigned department
* Role
* Account status
* Profile image

The system must not store passwords directly. Authentication must be managed through the selected authentication provider.

---

## 5.2 Organization and Hospital Management

Administrators must be able to:

* Create an organization
* Edit organization information
* Create hospitals
* Edit hospital information
* Activate or deactivate hospitals
* Assign users to hospitals

Hospital fields:

* Hospital ID
* Organization ID
* Hospital name
* Hospital code
* Address
* City
* Country
* Contact telephone
* Contact email
* Status
* Created date

---

## 5.3 Department Management

Administrators must be able to:

* Create departments
* Edit departments
* Activate or deactivate departments
* Assign department managers
* Associate departments with hospitals

Department fields:

* Department ID
* Hospital ID
* Department name
* Department code
* Department type
* Description
* Department manager
* Status

Examples:

* Intensive Care Unit
* Emergency Department
* Operating Room
* Radiology Department
* Laboratory
* Dialysis Unit
* Neonatal Intensive Care Unit
* Cardiology Department
* General Ward
* Outpatient Department

---

## 5.4 Medical Device Inventory

The system must allow authorized users to create, view, edit, search, filter, and manage medical devices.

Each device must have a unique internal identifier.

Recommended device fields:

### Identification

* Device ID
* Asset number
* Equipment inventory number
* Device name
* Device category
* Manufacturer
* Model
* Serial number
* Manufacturer reference number
* Barcode value
* QR code value

### Location

* Organization
* Hospital
* Department
* Building
* Floor
* Room
* Exact location description

### Procurement and Installation

* Purchase date
* Installation date
* Commissioning date
* Supplier
* Purchase cost
* Warranty start date
* Warranty expiration date

### Technical Information

* Device category
* Device type
* Risk classification
* Criticality level
* Power requirements
* Technical specifications
* Required accessories
* Required consumables

### Operational Information

* Current device status
* Operational status
* Service status
* Last maintenance date
* Next maintenance due date
* Maintenance frequency
* Assigned biomedical engineer
* Notes

### Administrative Information

* Created by
* Created date
* Last updated by
* Last updated date
* Active or archived status

---

## 5.5 Device Status Management

The system must support standard device statuses.

Recommended statuses:

* Operational
* Operational with limitations
* Requires inspection
* Reported problem
* Under investigation
* Under maintenance
* Waiting for spare parts
* Out of service
* Temporarily unavailable
* Decommissioned
* Removed from hospital
* Archived

Status changes must be recorded in a device status history.

Each status change should include:

* Device
* Previous status
* New status
* Reason
* User who made the change
* Date and time
* Related helpdesk ticket or maintenance record

Example:

Device: ICU-VENT-001

Previous status: Operational

New status: Under maintenance

Reason: Power supply failure

Changed by: Biomedical Engineer

Date: 31 July 2026

---

## 5.6 Helpdesk Tickets and Equipment Problem Reporting

Department users and authorized biomedical users must be able to report equipment problems or request service. Each report/request becomes a trackable Helpdesk Ticket linked to the device.

Helpdesk ticket fields:

* Ticket ID
* Device
* Hospital
* Department
* Reported by
* Reported date and time
* Ticket title
* Detailed description
* Problem category
* Priority
* Current status
* Assigned engineer
* Related maintenance record(s)
* Attachments
* Resolution information
* Closure date

Problem categories may include:

* Device will not power on
* Device will not start
* Display problem
* Alarm problem
* Sensor problem
* Electrical problem
* Mechanical problem
* Software problem
* Calibration problem
* Performance problem
* Physical damage
* Accessory problem
* Communication problem
* Other

Priority levels:

* Low
* Medium
* High
* Critical

Ticket workflow:

Reported
→ Reviewed
→ Assigned
→ Under investigation
→ Waiting for department
→ Waiting for spare parts
→ Under repair
→ Repaired
→ Tested
→ Closed

The system must allow public comments and authorized internal biomedical notes during the ticket lifecycle. Detailed ticket behavior, visibility, assignment, and maintenance handoff are defined in [QR-Helpdesk-Ticketing-Workflow.md](QR-Helpdesk-Ticketing-Workflow.md).

---

## 5.7 Preventive Maintenance

The system must support scheduled preventive maintenance.

Each maintenance plan may include:

* Maintenance plan ID
* Device
* Maintenance frequency
* Maintenance interval
* Maintenance checklist
* Last completed date
* Next due date
* Assigned engineer
* Maintenance priority
* Maintenance status

Maintenance frequencies may include:

* Monthly
* Every three months
* Every six months
* Annually
* Custom interval

The system should automatically identify:

* Maintenance due soon
* Maintenance due today
* Overdue maintenance
* Completed maintenance

Recommended statuses:

* Scheduled
* Due soon
* Due
* Overdue
* Assigned
* In progress
* Waiting for parts
* Completed
* Cancelled

---

## 5.8 Corrective Maintenance

Corrective maintenance must be linked to a helpdesk ticket where applicable.

Corrective maintenance fields:

* Maintenance ID
* Device
* Related helpdesk ticket
* Maintenance type
* Assigned engineer
* Start date
* Completion date
* Fault description
* Root cause
* Work performed
* Parts used
* Internal labor time, where recorded by policy
* Internal labor cost, where cost accounting is enabled
* External vendor or service cost, where applicable
* Total maintenance cost, calculated from recorded cost items
* Repair result
* Test result
* Final device status
* Recommendations
* Next maintenance date
* Attachments

Maintenance types:

* Preventive maintenance
* Corrective maintenance
* Emergency maintenance
* Inspection
* Calibration
* Electrical safety testing
* Performance testing
* Installation
* Commissioning
* Decommissioning

---

## 5.9 Maintenance Records

Every completed maintenance activity must create a permanent maintenance record.

Maintenance record fields:

* Maintenance record ID
* Device ID
* Maintenance type
* Related helpdesk ticket
* Engineer
* Technician
* Start date and time
* Completion date and time
* Work performed
* Findings
* Root cause
* Corrective action
* Parts used
* Test results
* Final result
* Final device status
* Recommendations
* Next maintenance date
* Attachments
* Approval status

Maintenance results:

* Passed
* Passed with recommendations
* Temporarily restored
* Failed
* Requires additional work
* Out of service

---

## 5.10 Maintenance Checklists

The system should support reusable maintenance checklists.

Example ventilator checklist:

* Inspect physical condition
* Check power cable
* Check battery
* Check display
* Test alarms
* Check oxygen sensor
* Check air filters
* Check breathing circuit
* Verify pressure measurements
* Perform operational test
* Record test results

Checklist item results:

* Passed
* Failed
* Not applicable
* Requires follow-up

Each checklist item may include notes and an attachment.

---

## 5.11 Device History

Every device must have a complete history page.

The history must include:

* Device creation
* Location changes
* Status changes
* Helpdesk tickets
* Maintenance activities
* Inspections
* Calibration records
* Parts replaced
* Uploaded documents
* User comments
* Important audit events

The history should be displayed chronologically.

---

## 5.12 Device Search and Filtering

Users must be able to search by:

* Device name
* Asset number
* Inventory number
* Serial number
* Manufacturer
* Model
* Department
* Hospital
* Device status

Users must be able to filter by:

* Hospital
* Department
* Device category
* Manufacturer
* Status
* Maintenance status
* Maintenance due date
* Risk level
* Criticality
* Assigned engineer

---

## 5.13 QR Code and Barcode Support

### 5.13.1 Purpose: Scan Device, Take Action

QR scanning is a core BEMMS workflow. A label fixed to each medical device must let an authorized user identify the exact device and act on its current operational information without manually searching for an asset number.

Example:

Biomedical engineer arrives in the ICU and scans the label on an infusion pump.

QR scan → INF-PUMP-00482 → Device scan result page

The scan result page must make the device's current condition and the next appropriate action clear immediately.

### 5.13.2 QR Code and Label Requirements

Each active device must have a generated QR code and printable label. The label should also display a human-readable asset number for cases where a camera cannot scan the code.

The QR code may contain:

* A non-sensitive unique device identifier
* A non-sensitive asset number
* A secure device URL containing an opaque device reference

Example:

https://app.example.com/scan/dv_8Kp2mQ7x

The QR code must not contain patient information, user credentials, maintenance details, or any other sensitive information. A scanned URL must require authentication and authorization before protected information is displayed. If the user is not signed in, the system must sign them in and then return them to the scanned device, subject to their permissions.

The system must support reprinting a damaged label. Regenerating a label must not break the existing device history; the QR identifier should remain stable unless it is intentionally revoked and replaced. Label generation, replacement, and revocation must be recorded in the audit log.

### 5.13.3 Mobile Scan Result Page

When an authorized user scans the QR code, BEMMS must open a mobile-friendly scan result page before the full device details page. The page must show, without requiring further navigation:

* Device name, asset number, manufacturer, model, and serial number where authorized
* Current hospital, department, room, and exact location
* Current device status, displayed prominently
* A clear safety or availability alert when the device is reported faulty, under maintenance, out of service, or otherwise unavailable
* Open helpdesk-ticket count, highest open ticket priority, and assigned engineer where authorized
* Last maintenance date and next preventive maintenance due date
* Whether preventive maintenance is due, overdue, or scheduled
* The most relevant recommended action for the signed-in user

The scan result must clearly distinguish administrative equipment status from a clinical decision or clinical clearance.

### 5.13.4 Role-Specific Scan Actions

After scanning, the system must show only actions the user is authorized to perform:

* Department staff: view permitted device information, report a new problem, add a ticket comment, and view the status of their submitted reports
* Biomedical technician: view assigned tasks, start or update assigned maintenance, record notes, and request review
* Biomedical engineer: view the full authorized device profile, update status, investigate helpdesk tickets, start maintenance, and review history
* Biomedical manager or department manager: view authorized device availability, open helpdesk tickets, maintenance status, and history, without receiving technical edit permissions unless separately assigned

The primary action should respond to device status. For example, a device with a critical open helpdesk ticket should emphasize viewing the ticket or reporting additional observations; a device with maintenance due should emphasize the assigned maintenance task; an operational device should offer quick problem reporting and device history.

### 5.13.5 Scan Failure and Manual Fallback

The PWA must support camera scanning on compatible mobile devices and provide a manual asset-number or device-ID search fallback. If a QR code is invalid, revoked, unknown, or belongs to an unauthorized hospital or department, the system must show a safe error message without exposing protected device details. These events should be logged where required by policy.

### 5.13.6 Device Page Access

The user should be able to:

* View device information
* View current status
* View open helpdesk tickets
* Report a new problem
* View maintenance history
* Start a maintenance task if authorized



---

## 5.14 File and Document Management

Users must be able to upload authorized files.

Supported files may include:

* Equipment photos
* Maintenance photos
* PDF manuals
* Service manuals
* Calibration certificates
* Inspection reports
* Purchase documents
* Warranty documents
* Maintenance documents

Each file must include:

* File ID
* Related entity
* File name
* File type
* File size
* Storage location
* Uploaded by
* Upload date

Files must be protected by authorization rules.

---

## 5.15 Dashboard

The dashboard must provide a summary of equipment and maintenance status.

Dashboard statistics may include:

* Total devices
* Operational devices
* Devices under maintenance
* Devices out of service
* Devices with reported problems
* Open helpdesk tickets
* Critical helpdesk tickets
* Maintenance due soon
* Maintenance overdue
* Maintenance completed this month
* Devices by department
* Devices by category
* Devices by status

Example:

Total devices: 850

Operational: 720

Under maintenance: 45

Out of service: 20

Open helpdesk tickets: 30

Critical helpdesk tickets: 3

Maintenance due: 35

Overdue maintenance: 8

The dashboard must display information according to user permissions.

A department user should only see authorized department information.

A biomedical manager may see all authorized hospitals.

---

## 5.16 Reports

The system must support reports for:

* Device inventory
* Devices by hospital
* Devices by department
* Devices by category
* Operational devices
* Devices under maintenance
* Out-of-service devices
* Open helpdesk tickets
* Critical helpdesk tickets
* Ticket resolution time
* Preventive maintenance due
* Preventive maintenance overdue
* Completed maintenance
* Maintenance history
* Device maintenance history
* Device downtime
* Repeated equipment failures
* Maintenance activity by engineer
* Maintenance activity by department
* Most frequently broken devices
* Breakdown trends by month
* Maintenance costs by device, department, hospital, category, maintenance type, and period
* Engineer and technician workload and performance indicators

### 5.16.1 Reports and Statistics Design

The Reports module must provide both live statistics and report history:

* **Live statistics:** current dashboards, charts, tables, and filtered lists calculated from the latest authorized data.
* **Generated report history:** a record of generated PDF/Excel reports, their filters and period, the requesting user, generation date/time, and the exported file where a fixed official snapshot is required.

The initial statistical reports must include:

| Report | Required calculation and presentation |
|---|---|
| Most frequently broken devices | Count device-problem or corrective-maintenance tickets by device for the selected period. Show count, failure categories, device criticality, downtime where available, and the trend compared with the preceding period. |
| Maintenance costs | Sum recorded parts cost, approved external vendor/service cost, and optional recorded internal labor cost. Show totals by device, department, hospital, category, maintenance type, and period. Display the currency and distinguish missing cost data from a recorded zero cost. |
| Breakdowns per month | Count device-problem tickets created each month. Show a separate series for resolved/closed tickets so new demand is not confused with completed work. Allow filtering by hospital, department, device category, priority, and device. |
| Engineer and technician performance | Show assigned/completed work, response-target compliance, resolution-target compliance, average resolution time, preventive-maintenance completion, reopened tickets, and current workload. Present work priority, device criticality, and maintenance type alongside totals so performance is not judged only by the number of tickets closed. |

All calculations must respect organization, hospital, department, and role permissions. Reports must identify the selected date range, filters, calculation basis, and timezone.

Reports should support:

* Date filtering
* Hospital filtering
* Department filtering
* Device filtering
* Status filtering
* Export to PDF
* Export to Excel
* Saved report filters where authorized
* Generated report history and download of authorized exports

---

## 5.17 Notifications

The system should support in-app notifications.

Notification events may include:

* New helpdesk ticket reported
* Critical helpdesk ticket reported
* Helpdesk ticket assigned
* Helpdesk ticket status changed
* Maintenance assigned
* Maintenance due soon
* Maintenance overdue
* Maintenance completed
* Device status changed
* User mentioned in a comment

Future versions may support:

* Email notifications
* Web push notifications
* Mobile notifications

---

## 5.18 Audit Log

The system must record important actions.

Audited actions should include:

* Device created
* Device updated
* Device status changed
* Device location changed
* Device QR label generated, reprinted, revoked, or replaced
* Helpdesk ticket created
* Helpdesk ticket updated
* Helpdesk ticket assigned
* Helpdesk ticket closed
* Maintenance created
* Maintenance completed
* Maintenance record updated
* User role changed
* User account activated or deactivated
* Important files uploaded or deleted

Audit fields:

* Audit ID
* User ID
* Action
* Entity type
* Entity ID
* Previous value
* New value
* Date and time
* User IP address if required by policy

The audit log should be append-only for ordinary users.

---

# 6. User Roles and Permissions

## 6.1 System Administrator

Permissions:

* Manage organizations
* Manage hospitals
* Create, view, edit, activate, deactivate, archive, and manage departments and their locations
* Create, view, edit, activate, deactivate, archive, and manage user accounts
* Assign roles
* Assign users to authorized organizations, hospitals, and departments
* Create, view, edit, transfer between departments, archive, and manage medical-device inventory records
* Manage system settings
* View system-level reports

Administrator device management is administrative inventory control. It must not automatically grant permission to alter completed maintenance findings, test results, audit records, or technical device status decisions unless the administrator also holds the appropriate biomedical role.

For users, departments, and devices with related history, "remove" must normally be implemented as deactivation or archiving so historical tickets, maintenance records, and audit logs remain intact. Permanent deletion is permitted only for an authorized administrator when the record was created in error and has no linked operational, maintenance, ticket, attachment, or audit history.

## 6.2 Biomedical Manager

Permissions:

* View all authorized hospitals
* View all devices
* Manage biomedical users
* View all authorized helpdesk tickets
* View all maintenance
* View dashboards
* Generate reports
* Review maintenance performance

## 6.3 Biomedical Engineer

Permissions:

* Create devices
* Edit authorized devices
* Update device status
* Create and manage helpdesk tickets
* Assign maintenance
* Perform maintenance
* Complete maintenance records
* View reports
* Upload documents

## 6.4 Biomedical Technician and biomadical engineer

Permissions:

* View assigned devices
* View assigned helpdesk tickets
* Update assigned maintenance
* Add maintenance notes
* Upload attachments
* Request review

## 6.5 Department Staff

Permissions:

* View authorized department devices
* Report device problems
* View submitted helpdesk-ticket status
* Add ticket comments

Restrictions:

* Cannot edit technical device information
* Cannot close maintenance records
* Cannot change device status without permission

## 6.6 Department Manager

Permissions:

* View department devices
* View department helpdesk tickets
* View department maintenance status
* View department reports

---

# 7. Main User Workflows

## 7.1 Add a Medical Device

1. Biomedical engineer opens the Devices page.
2. Selects Add Device.
3. Selects hospital.
4. Selects department.
5. Enters device information.
6. Enters asset number.
7. Enters manufacturer, model, and serial number.
8. Selects current status.
9. Sets maintenance frequency.
10. Saves the device.
11. The system validates required fields.
12. The system creates the device.
13. The system records an audit event.
14. The system generates a stable QR code and printable device label.

## 7.2 Report a Device Problem

1. Department staff opens the device page.
2. Selects Report a Problem.
3. Selects problem category.
4. Enters a description.
5. Selects priority.
6. Uploads a photo if necessary.
7. Submits the report.
8. The system creates a helpdesk ticket.
9. The system notifies authorized biomedical users.
10. The helpdesk ticket appears in the biomedical dashboard.

## 7.3 Resolve a Helpdesk Ticket and Related Equipment Problem

1. Biomedical engineer opens the helpdesk ticket.
2. Reviews the report.
3. Assigns the helpdesk ticket.
4. Changes status to Under Investigation.
5. Performs inspection.
6. Creates a corrective maintenance record.
7. Records work performed.
8. Records parts used.
9. Performs functional testing.
10. Updates device status.
11. Changes the linked helpdesk-ticket status to Repaired or Tested.
12. Closes the helpdesk ticket after verification.
13. The system records all important actions in the audit log.

## 7.4 Perform Preventive Maintenance

1. The system identifies maintenance due.
2. The biomedical manager or engineer assigns the task.
3. The technician opens the task.
4. The technician follows the maintenance checklist.
5. The technician records each checklist result.
6. The technician records work performed.
7. The technician records test results.
8. The maintenance task is submitted.
9. An engineer reviews the result if required.
10. The maintenance record is completed.
11. The system calculates the next maintenance date.

## 7.5 Scan a Device and Take Action

1. An authorized user opens the installed PWA or web application and scans the QR label with the device camera.
2. BEMMS identifies the scanned device reference.
3. If the user is not authenticated, BEMMS completes login and returns to the scanned device.
4. BEMMS checks the user's organization, hospital, department, and role permissions.
5. The mobile scan result page displays the device identity, location, current status, safety or availability alert, open helpdesk-ticket summary, and maintenance due information.
6. BEMMS presents role-appropriate actions based on the device state.
7. The user selects an action, such as Report Problem, View Open Ticket, Start Assigned Maintenance, Update Maintenance, or View History.
8. BEMMS records the resulting business action in the appropriate helpdesk-ticket, maintenance, status-history, and audit records.
9. If the code is invalid, revoked, unknown, or unauthorized, BEMMS presents a safe error state and offers manual search where permitted.

---

# 8. Recommended Technology Stack

## 8.1 Frontend

Next.js

Language:

TypeScript

User interface:

Tailwind CSS

Component system:

shadcn/ui or an equivalent accessible component library

Reasons:

* Responsive web application
* Mobile support
* Desktop support
* Server-side capabilities
* Strong TypeScript ecosystem
* PWA support
* Good deployment options

## 8.2 Mobile Application Format

Progressive Web Application (PWA)

Required PWA features:

* Web application manifest
* Application icons
* Install prompt
* Standalone display mode
* Service worker
* Offline application shell
* Responsive design
* HTTPS

The application should be installable on supported Android and iOS devices.

## 8.3 Backend

Self-hosted Next.js application services

Backend services:

* Next.js Server Actions and API routes for the application API and business rules
* PostgreSQL database
* Self-hosted authentication and session management (Auth.js initially; Keycloak may be used when enterprise single sign-on is required)
* Role- and scope-based authorization enforced by the server application
* Real-time updates using WebSockets, Server-Sent Events, or Socket.IO where useful
* File storage using a protected local volume initially, with MinIO available when S3-compatible object storage is needed
* Optional self-hosted Redis for job queues, caching, rate limiting, and scaled real-time messaging; it is not required for the MVP
* Background jobs for reminders, notifications, and report generation, using Redis and BullMQ when the optional queue service is enabled

## 8.4 Database

PostgreSQL

Reasons:

* Strong relational data model
* Safe and reliable concurrent access for many hospital users
* Suitable for hospitals, departments, devices, helpdesk tickets, and maintenance records
* Strong reporting capabilities
* Reliable transactions
* Flexible querying
* Good support for data integrity
* Mature backup, recovery, and monitoring tools

SQLite may be used only for an individual developer's local prototype or automated tests. It must not be used as the production database because BEMMS is a multi-user system with concurrent maintenance, helpdesk-ticket, and audit updates.

## 8.5 Hosting

The application must be self-hostable through Docker Compose. The same deployment package must support either:

* On-premise hosting on a hospital server, accessed through the hospital network
* Hosting on an organization-controlled VPS or cloud server, accessed through a public domain

Recommended infrastructure:

* Docker Compose for the application, PostgreSQL, and supporting services; Redis is added only when its queue, cache, or rate-limiting features are needed
* Nginx or Caddy as the reverse proxy and HTTPS terminator
* A domain name and TLS certificate for web-hosted access
* VPN or equivalent protected network access when the on-premise instance is reached from outside the hospital

Automatic deployment from a Git repository may be configured after testing and backup procedures are in place.

## 8.6 Source Control

GitHub

Recommended workflow:

Development branch
→ Pull request
→ Review
→ Main branch
→ Automatic production deployment

## 8.7 File Storage

Protected local file storage, with optional self-hosted MinIO object storage

Storage categories:

* Device images
* Helpdesk ticket attachments
* Maintenance attachments
* Equipment documents
* Calibration certificates
* Manuals

## 8.8 Real-Time Updates

WebSockets, Server-Sent Events, or Socket.IO

Potential real-time events:

* New helpdesk ticket created
* Helpdesk ticket updated
* Maintenance task assigned
* Device status changed
* New comment added

Real-time updates should be used where useful but should not replace normal database validation.

---

# 9. High-Level Architecture

User Device

↓

Next.js PWA

↓

Authentication and Authorization

↓

Next.js application services

↓

PostgreSQL Database

The application architecture should be:

Frontend:

* Pages
* Components
* Forms
* Data tables
* Dashboards
* Charts
* PWA features

Application Layer:

* Server actions
* API routes
* Validation
* Business rules
* Report generation
* Notification processing

Database Layer:

* PostgreSQL tables
* Relationships
* Constraints
* Indexes
* Server-enforced authorization checks with organization, hospital, and department scope
* PostgreSQL database roles with limited application credentials
* Audit records

Storage Layer:

* Images
* PDFs
* Documents
* Certificates

---

# 10. Initial Database Design

## 10.1 Main Tables

organizations

hospitals

departments

profiles

roles

user_roles

departments

device_categories

manufacturers

devices

device_locations

device_status_history

device_qr_labels

service_tickets

service_ticket_comments

service_ticket_attachments

maintenance_plans

maintenance_tasks

maintenance_records

maintenance_checklists

maintenance_checklist_items

maintenance_parts

maintenance_costs

attachments

notifications

report_exports

audit_logs

## 10.2 Important Relationships

Organization

has many Hospitals

Hospital

has many Departments

Department

has many Devices

Device

has many Helpdesk Tickets

Device

has many Maintenance Records

Device

has many Status History Records

Device

has one active QR code and one or more QR label history records

Helpdesk Ticket

may have one or more Maintenance Records

Maintenance Record

may use one or more Spare Parts

User

may have one or more Roles


---

# 11. Database Rules

The database must enforce:

* Unique device asset numbers within the selected scope.
* Valid hospital and department relationships.
* Valid device status values.
* Valid helpdesk-ticket priority values.
* Valid maintenance status values.
* Unique active QR code references.
* Required fields for critical records.
* Valid user permissions.
* Valid organization access.
* Referential integrity.

Recommended constraints:

* A department must belong to a hospital.
* A device must belong to a hospital.
* A device department must belong to the selected hospital.
* A helpdesk ticket must belong to an existing device when the reported device is known.
* A maintenance record must belong to an existing device.
* A user cannot access another organization’s data unless explicitly authorized.

---

# 12. Security Requirements

The application may contain sensitive hospital operational information. Security must be included from the beginning.

Required security controls:

* HTTPS for all environments
* Secure authentication
* Strong password requirements
* Password reset support
* Role-based authorization
* Server-enforced organization, hospital, department, and role scope checks on every protected operation
* Organization-level data separation
* Hospital-level access restrictions
* Department-level access restrictions
* Server-side validation
* Input validation
* File upload restrictions
* QR codes contain no sensitive data and scanned device URLs require authentication and authorization
* Audit logging
* Secure environment variables
* No database credentials or privileged service keys in the browser
* Secure API access
* Regular backups
* Error monitoring

The application should not store patient medical information unless that requirement is formally added and reviewed.

---

# 13. Data Privacy

The initial system should avoid collecting patient information.

The system should primarily contain:

* Equipment information
* Maintenance information
* Hospital department information
* Authorized staff account information

If patient information is later required, the system must undergo a separate privacy and security review.

---

# 14. Performance Requirements

The system should:

* Load common pages quickly on standard hospital internet connections.
* Support mobile devices with limited processing power.
* Support search and filtering without excessive delay.
* Use pagination for large device lists.
* Use database indexes for common search fields.
* Optimize uploaded images.
* Avoid loading complete maintenance histories until requested.

Suggested targets:

* Common page load: less than 3 seconds under normal conditions
* Device search response: less than 2 seconds for normal data volumes
* Dashboard response: less than 5 seconds
* Normal create or update action: less than 2 seconds when network conditions are adequate

---

# 15. Responsive Design Requirements

The system must support:

Mobile:

* Single-column layouts
* Large touch targets
* Bottom navigation or mobile navigation
* Camera access for QR scanning
* Mobile-friendly forms

Tablet:

* Two-column layouts where appropriate
* Maintenance checklists
* Device details

Desktop:

* Full navigation sidebar
* Advanced tables
* Detailed dashboards
* Report management

---

# 16. Suggested Application Pages

Public pages:

* Login
* Password reset
* Account activation

Authenticated pages:

* Dashboard
* Hospitals
* Departments (add,edit,remove)
* Devices
* Device Details
* Add Device
* Edit Device
* Device History
* Helpdesk Tickets
* Helpdesk Ticket Details
* Report a Problem / Request Maintenance
* Maintenance
* Maintenance Task Details
* Maintenance Calendar
* Maintenance Plans
* Reports
* Notifications
* User Profile

Administration pages:

* Users
* Roles
* Permissions
* Organizations
* Hospitals
* Departments
* Device Categories
* Manufacturers
* System Settings
* Audit Logs

---

# 17. MVP Requirements

The first working version must include:

1. User authentication
2. User roles
3. Hospital management
4. Department management
5. Device registration
6. Device editing
7. Device status management
8. Device search
9. Device filtering
10. Helpdesk ticket reporting
11. Helpdesk ticket assignment
12. Helpdesk ticket status workflow
13. Preventive maintenance scheduling
14. Maintenance records
15. Device history
16. Dashboard statistics
17. Basic reports
18. File attachments
19. Audit logging
20. Responsive PWA installation
21. QR code generation, printable labels, camera scanning, scan result page, and manual lookup fallback

The MVP should not initially include:

* Complex spare-parts inventory
* Advanced analytics
* AI prediction
* Hospital system integration
* Advanced offline synchronization

---

# 18. Development Phases

## Phase 1: Foundation

* Create repository
* Configure Next.js
* Configure TypeScript
* Configure Tailwind CSS
* Configure Docker Compose and local development environment
* Configure PostgreSQL
* Configure self-hosted authentication
* Define when the optional Redis service is required for queues, caching, rate limiting, or scaled real-time messaging
* Create database schema
* Implement server-side authorization and organization/hospital/department access checks
* Create user roles

## Phase 2: Organization Structure

* Organizations
* Hospitals
* Departments
* User assignments

## Phase 3: Device Management

* Device categories
* Manufacturers
* Device creation
* Device editing
* Device list
* Device details
* Device search
* Device filtering
* Device status history
* QR code generation and printable device labels
* Mobile scan-to-action result page and manual lookup fallback

## Phase 4: Helpdesk Ticket Management

* Helpdesk ticket reporting
* Helpdesk ticket list
* Helpdesk ticket details
* Assignment
* Comments
* Attachments
* Status workflow

## Phase 5: Maintenance

* Maintenance plans
* Preventive maintenance schedules
* Maintenance tasks
* Maintenance checklists
* Maintenance records
* Corrective maintenance

## Phase 6: Dashboard and Reports

* Equipment statistics
* Helpdesk ticket statistics
* Maintenance statistics
* Department reports
* PDF export
* Excel export

## Phase 7: PWA and Notifications

* Application manifest
* Application icons
* Service worker
* Install prompt
* Offline application shell
* In-app notifications

## Phase 8: Testing and Production

* Unit tests
* Integration tests
* Permission tests
* Security testing
* Performance testing
* User acceptance testing
* Production deployment
* Monitoring
* Backup configuration

---

# 19. Testing Requirements

Testing must include:

## Functional Testing

Verify:

* Users can log in.
* Users can only access authorized data.
* Devices can be created.
* Devices can be edited.
* Helpdesk tickets can be reported.
* An authorized user can scan a device QR label and see the correct scan result page and permitted actions.
* Helpdesk tickets can be assigned.
* Maintenance can be created.
* Maintenance can be completed.
* Device history is updated.
* Reports show correct data.

## Permission Testing

Verify:

* Department users cannot access unauthorized hospitals.
* Department users cannot edit technical device information.
* Technicians cannot perform restricted administrative actions.
* Users cannot access another organization’s records.
* Unauthorized users cannot access protected files.

## Data Validation Testing

Verify:

* Required fields cannot be empty.
* Duplicate asset numbers are prevented.
* Invalid dates are rejected.
* Invalid status values are rejected.
* Invalid hospital and department relationships are rejected.

## Security Testing

Verify:

* Authorization checks correctly enforce organization, hospital, department, and role scope.
* Protected data cannot be accessed through direct database requests.
* Scanning a QR code while signed out, unauthorized, or outside the permitted organization does not reveal protected device details.
* Database credentials and privileged service keys are not exposed in the frontend.
* File access is restricted.
* Authentication is required for protected pages.

---

# 20. Future Features

Potential future features:

* Barcode support
* Push notifications
* Email notifications
* SMS notifications
* Spare-parts inventory
* Supplier management
* Purchase and warranty tracking
* Calibration management
* Electrical safety testing
* Device performance testing
* Device utilization tracking
* Device downtime analytics
* Failure trend analysis
* Predictive maintenance
* Artificial intelligence maintenance recommendations
* Integration with hospital information systems
* Integration with procurement systems
* Integration with inventory systems
* Offline-first maintenance workflows
* Digital signatures
* Maintenance approval workflows
* Multi-language support
* Arabic language support
* Custom report templates

---

# 21. Deployment Environments

The project should use separate environments.

Development:

Used by developers.

Testing or Staging:

Used for testing before release.

Production:

Used by real hospital users.

Each environment should have:

* Separate database configuration
* Separate authentication configuration
* Separate environment variables
* Separate storage configuration where appropriate

Production data must not be used in development without authorization and data protection controls.

---

# 22. Production Deployment Recommendation

Frontend:

Next.js application packaged in Docker and hosted on either a hospital server or an organization-controlled VPS/cloud server.

Backend:

Next.js Server Actions and API routes, with a background-job service where needed.

Optional supporting service:

Self-hosted Redis with BullMQ for reliable scheduled reminders, notification delivery, report-generation queues, caching, rate limiting, and scaled real-time messaging. PostgreSQL remains the system of record.

Database:

Self-hosted PostgreSQL in a separate Docker service or managed PostgreSQL under the organization's control.

File storage:

Protected server volume initially; self-hosted MinIO object storage when scalable S3-compatible storage is required.

Authentication:

Auth.js for the initial implementation; Keycloak is an approved option for enterprise SSO and central identity management.

Reverse proxy and HTTPS:

Nginx or Caddy, with TLS certificates and secure HTTP headers.

Backups:

Scheduled, encrypted PostgreSQL backups and attachment backups. Backup restoration must be tested regularly.

Source code:

GitHub.

Deployment flow:

Developer creates branch

↓

Developer submits pull request

↓

Code review and automated tests

↓

Merge to main branch

↓

Automatic deployment

↓

Production verification

---

# 23. Important Development Principles

The development team must:

* Build security from the beginning.
* Use TypeScript.
* Use database migrations.
* Use version control.
* Validate all input.
* Enforce authorization in server-side business logic and restrict database access with least-privilege PostgreSQL credentials.
* Avoid trusting frontend permissions alone.
* Keep device history.
* Keep maintenance history.
* Keep audit records.
* Use modular application architecture.
* Avoid unnecessary microservices.
* Avoid exposing sensitive keys.
* Design for mobile and desktop.
* Use accessible user-interface components.
* Design for slow or unstable internet connections.
* Use clear medical equipment terminology.
* Test workflows with biomedical engineers.

---

# 24. Final Recommended Stack

Frontend:

Next.js

Programming language:

TypeScript

Mobile application:

Progressive Web Application

Styling:

Tailwind CSS

UI components:

shadcn/ui

Backend:

Next.js Server Actions and API routes

Database:

PostgreSQL

Authentication:

Auth.js (with Keycloak available for enterprise SSO)

Authorization:

Server-enforced application roles and organization, hospital, and department scope checks; PostgreSQL roles with least-privilege database credentials

Real-time updates:

WebSockets, Server-Sent Events, or Socket.IO

File storage:

Protected local storage, with optional self-hosted MinIO

Server-side business logic:

Next.js Server Actions, API routes, and background jobs where appropriate

Optional queue and cache:

Redis with BullMQ for scheduled/background work, caching, rate limiting, and scaled real-time messaging. Redis is not required for the MVP, and PostgreSQL remains the system of record.

Hosting:

Docker Compose on an on-premise hospital server or organization-controlled VPS/cloud server, behind Nginx or Caddy

Source control:

GitHub

Reports:

PDF and Excel export

Monitoring:

Application error monitoring and database monitoring

---

# 25. Final Product Vision

BEMMS will become a centralized digital platform that allows hospitals and biomedical engineering teams to manage medical equipment efficiently.

The system will provide:

A complete medical-device inventory

*

Hospital and department organization

*

Helpdesk ticket reporting

*

Preventive maintenance scheduling

*

Corrective maintenance records

*

Device history

*

Real-time multi-user collaboration

*

Role-based access

*

Reports and analytics

*

An installable mobile web application

The system should be designed as a scalable foundation that can begin as a small hospital pilot and later expand to support multiple hospitals, larger biomedical engineering teams, advanced maintenance workflows, and enterprise-level reporting.
