# BEMMS Administration, Settings, and User Management

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Application modules](BEMMS-Application-Modules-and-Pages.md) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md)
>
> **Related specifications:** [Department device inventory](BEMMS-Department-Device-Management-and-Inventory.md) · [PM scheduling](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md) · [Electronic signatures](BEMMS-Electronic-Signatures-and-Traceability.md) · [Role-based device profiles](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md)

## 1. Purpose

This document defines the BEMMS Administration and Settings area. It describes how authorized users configure the organization, hospital structure, user access, device reference data, helpdesk workflow, maintenance policies, electronic-signature rules, notifications, reports, and system operations.

The Administration area must give hospitals control without mixing administrative authority with biomedical technical authority.

The governing principle is:

> **Administrators manage access, structure, inventory configuration, and policies. Biomedical roles manage technical maintenance decisions, signatures, testing, and device release. Every important configuration or access change is traceable.**

This document complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — overall product, security, data, and deployment requirements
* `BEMMS-Application-Modules-and-Pages.md` — application modules, navigation, and roles
* `BEMMS-UI-UX-Design.md` — user interface and responsive design requirements
* `BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md` — PM plans, alerts, calibration expiry, and compliance
* `BEMMS-Electronic-Signatures-and-Traceability.md` — signature, review, approval, and release rules
* `BEMMS-Role-Based-Device-Profiles-and-QR-Access.md` — role-based device information/actions

---

## 2. Administration Model

The Administration module should be a controlled configuration center rather than a single long settings page.

```text
Administration
├── Administration Dashboard
├── Organization & Locations
├── Users & Access
├── Device Setup
├── Helpdesk Workflow
├── Maintenance & Compliance
├── Notifications & Documents
├── Reports Configuration
├── System Settings
└── Audit Logs
```

The menu must display only sections the user is authorized to administer. Every write operation must be checked by the server using the user's individual account, assigned roles, and organization/hospital scope.

---

## 3. Administration Roles and Boundaries

### 3.1 Recommended Administrative Roles

An organization may combine roles for a small pilot, but BEMMS should support separation as it grows.

| Role | Primary responsibility | Does not automatically receive |
|---|---|---|
| System administrator | User accounts, access, organization setup, departments, inventory administration, system configuration, and audit review. | Technical maintenance/signing/device-release authority. |
| Organization administrator | Organization-wide operational setup and selected policy administration. | Server secrets or biomedical technical authority. |
| Hospital administrator | Hospital/departments/location setup and local user scope management. | Cross-organization access or technical device release. |
| Biomedical manager | Biomedical teams, maintenance workflow, plans, checklists, operational targets, signature policies, and technical oversight. | Server infrastructure control unless separately granted. |
| Department manager | Department user/device visibility and limited department configuration. | Organization-wide roles, technical maintenance, or system settings. |
| Security/audit reviewer | Read-only audit, access, signature, and configuration review. | Ability to alter records or policies. |

### 3.2 Least Privilege

The system must grant only the permissions a user needs. A user can have multiple roles, but BEMMS must calculate their effective access from explicit assignments rather than assume that every manager is an administrator or every administrator is a biomedical engineer.

### 3.3 Technical Authority Is Separate

System administration cannot automatically grant authority to:

* Choose technical maintenance classifications
* Record or approve maintenance findings
* Sign performed work
* Review/approve calibration or testing
* Release a device to Operational status
* Alter signed maintenance/calibration/test records

Those actions require an appropriate biomedical role and the relevant device/hospital scope.

---

## 4. Configuration Scope and Precedence

Settings must have an explicit scope. A policy should not be silently applied across all hospitals when it was intended for one department.

### 4.1 Scope Levels

```text
System default
→ Organization policy
→ Hospital policy
→ Department/device-category policy, where supported
→ Device-specific exception, where authorized
```

Examples:

* Password/session security may be system or organization scoped.
* Ticket priorities may be organization scoped.
* PM alert windows may differ by hospital/device criticality.
* A critical device may have a device-specific signature/release policy.

### 4.2 Policy Precedence

The most specific active authorized policy applies. The application must show the source of the effective policy, for example:

```text
Reviewer required: Yes
Source: Hospital PM policy, version 3, effective 1 Aug 2026
```

### 4.3 Policy Versioning

Policy changes must create a new effective version. Existing signed records retain the policy/version applied at the time of work. Changing a current checklist, signature policy, or alert rule must not rewrite historical records.

---

## 5. Administration Dashboard

The administration dashboard should show actionable setup and compliance exceptions, not decorative metrics.

### 5.1 Required Widgets

* Users without an assigned role or access scope
* Pending user invitations/account activations
* Deactivated users who still own active ticket/maintenance assignments
* Departments without a manager, location, or required configuration
* Devices missing required PM/calibration plans
* PM/calibration plans with missing checklists, assignments, or signature policies
* Overdue work, expired calibration, or overdue approval/release
* Failed/undelivered critical notification jobs
* Recent changes to permissions, policies, QR labels, or system settings
* Backup/maintenance scheduler health summary, if safely available

Tapping an item opens the filtered administration list that explains and resolves it.

### 5.2 Do Not Expose Sensitive Infrastructure Data

The dashboard may show safe operational health, such as `Last backup completed` or `Scheduler healthy`. It must not expose database passwords, internal network secrets, private encryption material, access tokens, or full server diagnostics to ordinary application administrators.

---

## 6. Organization, Hospital, Department, and Location Management

### 6.1 Organization Page

#### Data

* Organization name and code
* Contact details
* Logo/branding, if enabled
* Default timezone, date format, language configuration
* Default data-retention and policy references
* Active/archive status

#### Actions

* Create/edit organization within authorized platform scope
* Configure organization policies allowed by role
* Archive organization only through controlled platform governance

### 6.2 Hospitals Page

#### Data

* Hospital name and code
* Organization relationship
* Address/contact details
* Hospital timezone where different from organization default
* Active/archive status
* Hospital-level policy overrides

#### Actions

* Create/edit hospital
* Activate/deactivate/archive hospital
* Assign authorized users/managers
* View departments, locations, device count, and compliance summary

Archiving a hospital must not delete its devices, tickets, maintenance records, or audit history.

### 6.3 Departments and Locations Page

Use a clear hierarchy:

```text
Hospital
→ Department
→ Building
→ Floor
→ Room
→ Exact device location, where needed
```

#### Department Data

* Department name, code, type, description
* Hospital assignment
* Department manager(s)
* Status — active, inactive, archived
* Approved department users and device visibility rules
* Location/room records

#### Department Actions

* Create/edit department
* Assign/reassign manager
* Create/edit/archive rooms and locations
* View department users, devices, tickets, PM status, and reports
* Deactivate/archive department through controlled workflow

### 6.4 Department Archive and Device Transfer

If a department has active devices or work records, BEMMS must not offer simple deletion. The administrator must choose an appropriate controlled action:

```text
Transfer active devices to another valid department/location
or
Deactivate/archive the department while retaining history
```

The system records old/new department and location, actor, reason, timestamp, and affected devices. Existing tickets/maintenance records retain their historical location snapshot.

---

## 7. User Management

### 7.1 User Management Goals

User management must support the complete account lifecycle while preserving accountability for previous work.

```text
Invite/create
→ Activate
→ Assign role and scope
→ Work in BEMMS
→ Update role/scope as job changes
→ Deactivate/archive when access ends
```

Every user must have an individual account. Shared accounts are prohibited.

### 7.2 Users List Page

The Users list must support search/filter by:

* Name, employee ID, email, phone, job title
* Role
* Organization, hospital, department, or team scope
* Status — invited, active, suspended, deactivated, archived
* Last login
* User type — department staff, technician, engineer, manager, administrator

Each row should display a concise role/scope summary and account status. High-impact actions belong in a controlled action menu, not beside every row.

### 7.3 Add User / Invite User

The preferred flow is an invitation, not an administrator choosing a password for another person.

Required fields:

* Full name
* Work email or approved unique identity
* Employee identifier, if used by hospital policy
* Job title
* Initial role(s)
* Organization/hospital/department/team scope
* Invitation expiry/activation policy

Optional fields:

* Phone/extension
* Profile image
* Preferred notification settings
* Language preference

The invitation must expire, be one-time use, and be safely resendable. The system should not reveal sensitive account details in an invite/resend response.

### 7.4 User Profile and Access Page

Use these tabs:

```text
Profile | Roles & Access | Assignments | Security & Sessions | Activity History
```

#### Profile

* Name, contact details, employee ID, job title
* Account status
* Organization affiliation

#### Roles & Access

* One or more assigned roles
* Organization scope
* Hospital/department/location scope
* Device-category/assigned-work restrictions where policy uses them
* Effective permissions summary

#### Assignments

* Active ticket ownership
* Active maintenance tasks
* Team/queue membership
* Reviewer/release authority, where applicable

#### Security & Sessions

* Account activation/deactivation state
* Last login and authorized session summary
* Password reset/invitation actions according to policy
* Passkey/SSO status where supported

Never display a password, signing PIN, recovery secret, passkey private key, or authentication token to an administrator.

#### Activity History

* Role/scope changes
* Account activation/deactivation
* Security-relevant actions
* Recent tickets, maintenance, signatures, and approvals where authorized
* Administrative audit events related to that user

### 7.5 Roles and Scope Assignment

Role assignment must use clear, reviewable controls rather than a vague `Administrator` checkbox.

Example:

```text
Role: Biomedical Engineer
Scope: Central Teaching Hospital
Departments: ICU, Emergency Department
Additional authority: Device release for high-criticality devices = No
```

When a role/scope change grants significant new access, BEMMS should show an effective-permission preview and require a reason/confirmation according to policy.

### 7.6 Deactivate, Archive, and Reactivate User

#### Deactivate

Deactivation immediately prevents new login/session access while preserving historical ownership, signatures, maintenance records, tickets, and audit events.

Before deactivation, BEMMS must warn about active assignments and guide the administrator to reassign or escalate them. It must never change the historical performer/reviewer/signer on completed records.

#### Archive

Archive is used for a departed/retired account whose historical identity must remain visible. An archived user cannot log in or be assigned new work.

#### Reactivate

Reactivation requires authorized review of roles, scope, and authentication status. Old access should not be assumed correct after a long absence.

### 7.7 Permanent Deletion

Permanent deletion is allowed only for a clearly erroneous, empty account with no linked ticket, maintenance, signature, device, attachment, notification, or audit history. It requires authorized confirmation and an audit event. For real hospital users, deactivate/archive instead.

---

## 8. Roles, Permissions, and Access Policies

### 8.1 Roles Page

The roles page should present a permission matrix grouped by business area:

```text
Devices
Helpdesk Tickets
Maintenance
PM/Calibration Scheduling
Electronic Signatures
Reports
Administration
Audit and Security
```

Each permission must state whether it allows `View`, `Create`, `Edit`, `Assign`, `Approve`, `Sign`, `Release`, `Archive`, `Export`, or `Manage policy` actions.

### 8.2 Recommended Approach

Start with protected built-in roles:

* System Administrator
* Biomedical Manager
* Biomedical Engineer
* Biomedical Technician
* Department Manager
* Doctor/Department Staff
* Auditor/Read-only Reviewer

Allow carefully controlled custom roles later. Avoid allowing ordinary administrators to assemble unsafe combinations of technical release and approval permissions without a clear policy review.

### 8.3 Separation of Duties

The access system must support policies such as:

* Technician may perform but not release a critical device.
* Engineer may review technician work but cannot review their own work when independent review is required.
* Administrator may manage users but cannot sign maintenance records.
* Department manager may view department reports but cannot read internal technical notes.

---

## 9. Device Setup and Inventory Configuration

Device inventory operations belong in the Devices module, while standardized configuration belongs in Administration.

### 9.1 Device Categories and Types

Administrators/authorized biomedical managers can manage:

* Device categories and types
* Category code and description
* Default criticality/risk classification
* Required device fields
* Required maintenance/PM/calibration plan types
* Default checklist/template mappings
* Default document requirements
* Default signature/release policies

### 9.2 Manufacturers, Models, and Suppliers

Manage approved reference data:

* Manufacturers
* Device models
* Suppliers/vendors/service providers
* Approved service/maintenance contract references

Existing device records retain historical manufacturer/model names even if reference data changes later.

### 9.3 Device Status and Location Policies

Configure allowed status values, availability instructions, status-transition rules, and which technical roles may make each decision. Do not let an administrator add a status that bypasses the signature/release workflow required for critical equipment.

### 9.4 QR Label Settings

Configure:

* Approved QR label template and visible fields
* Organization/hospital branding
* QR label print/reprint authorization
* Label status — active, replaced, revoked
* Damaged-label replacement policy

QR labels must contain opaque non-sensitive references only. They must never include technical data, patient data, passwords, or authorization secrets.

---

## 10. Helpdesk Workflow Configuration

The Helpdesk Workflow settings define how device problems and service requests are classified, routed, tracked, and closed.

### 10.1 Configurable Items

* Ticket types — device problem, urgent equipment concern, maintenance request, inspection, calibration request, etc.
* Reporter-facing observed-problem categories
* Ticket priorities and impact mapping
* Allowed status transitions
* Triage and assignment rules
* Public update/internal note visibility policy
* Response/resolution target rules
* Ticket closure, requester confirmation, reopening, and cancellation rules
* Duplicate/related-ticket handling

### 10.2 Safety Rule

Workflow configuration must not let a user bypass required technical assessment. For example, creating a ticket must not automatically release a device as operational, and closing a ticket must not erase linked maintenance/signature history.

### 10.3 Target Policies

Targets may vary by:

* Priority
* Device criticality
* Hospital/department
* Working hours/holiday calendar, where organization policy supports it
* Ticket type

Target changes must be versioned and recorded on affected tickets so historical performance reports remain understandable.

---

## 11. Maintenance, PM, Calibration, and Signature Configuration

### 11.1 Maintenance Types and Categories

Configure approved lists and descriptions for:

* Preventive maintenance / PPM
* Corrective maintenance
* Troubleshooting/diagnostic inspection
* Calibration
* Electrical safety testing
* Performance testing
* Inspection
* Installation/commissioning
* Software/configuration work
* Decommissioning

Also manage technical corrective categories such as electrical/power, display, alarm, sensor, mechanical, software, performance, accessory, physical damage, communication, no fault found, and other.

Existing signed records retain the historical type/category label and version used at the time of work.

### 11.2 PM Plan and Schedule Policies

Configure:

* Default intervals by device category/type
* Fixed-calendar versus completion-based calculation rules
* PM planning lead time
* Due/overdue definitions
* Deferral authority and approval rules
* Pause/archive/decommission behavior
* Required assignment and checklist policies
* Devices/categories that require PM/calibration plans

### 11.3 Calibration Policies

Configure:

* Calibration interval/validity period
* Certificate requirement and certificate fields
* Expiry alert windows
* Device availability rules when calibration expires
* External provider/vendor requirements
* Required approval/release policy

The organization must explicitly decide whether expired calibration automatically changes a device's operational status for each applicable category. BEMMS must not make this clinical/operational decision silently.

### 11.4 Checklist and Procedure Templates

Authorized biomedical users can manage reusable templates:

* Template name, maintenance type, and compatible device category/model
* Version and effective date
* Required/optional checklist items
* Allowed results — passed, failed, not applicable, requires follow-up
* Required notes/attachments for failures
* Required measurements/test forms
* Signature/review/release requirement mappings

Template changes must produce new versions. Existing tasks and signed records retain the template version they used.

### 11.5 Electronic-Signature Policies

Configure required signatures by action, device criticality, category, maintenance type, and result.

Example:

```text
Critical device + Corrective maintenance
→ Performer signature
→ Independent reviewer signature
→ Release signature before Operational status
```

Settings include:

* Allowed signer/reviewer/release roles
* Independent-review requirements
* Reauthentication method requirement
* Attestation text/version
* Amendment/void approval rule
* Effective date and policy version

No in-app configuration may permit a user to sign on behalf of another person.

---

## 12. Notification and Document Configuration

### 12.1 Notification Policies

Configure in-app notification routing for:

* New/critical tickets
* Assignment/reassignment
* Information requests and public updates
* PM/calibration due soon, due today, overdue, and expired
* Work awaiting review/release
* Target breach/escalation
* Device availability/status change

Settings include notification recipients by role/team, schedule/quiet-hour rules where policy supports them, escalation chain, and optional delivery channels.

In-app notifications are the MVP. Email, push, SMS, or external messaging requires separate secure configuration and policy approval.

### 12.2 Document and Attachment Policies

Configure:

* File types, size limits, and malware-scanning policy where available
* Document categories — user manual, service manual, calibration certificate, ticket photo, maintenance photo, report, warranty, etc.
* Visibility rules — public department, biomedical internal, restricted administrative
* Storage-retention policy
* Export/download permissions
* Certificate required/expiry metadata rules

Documents and files must remain protected by the parent device/ticket/maintenance record's authorization rules.

---

## 13. Reports and Export Configuration

### 13.1 Report Permissions

Configure who may view, export, generate, and download:

* Device inventory reports
* Helpdesk/ticket reports
* Maintenance/PM/calibration compliance reports
* Costs and vendor reports
* Engineer/team workload and performance reports
* Device reliability/downtime reports
* Signature/audit compliance reports

Report access must respect organization/hospital/department scope and internal-note/document restrictions.

### 13.2 Report Templates and History

Configure:

* Organization branding for official exports
* Approved PDF/Excel report templates
* Required footer/disclaimer/approval text
* Report retention period
* Official report-generation/approval workflow where required

Generated report history must store report type, filters, period, timezone, requester, generation time, file reference, and approval/shared status where policy requires it.

### 13.3 Performance Reporting Safeguard

Do not rank engineers solely by ticket count. The configuration and UI must support priority, device criticality, maintenance type, target compliance, reopened work, review/release status, and workload context.

---

## 14. System Settings

### 14.1 Safe In-App System Settings

The application may provide controlled configuration for:

* Organization branding and application name
* Default timezone/date/time format
* Supported languages, including future Arabic support
* Session timeout policy where allowed
* Audit-log/data-retention policy
* Attachment storage quota/retention visibility
* Scheduler status/maintenance windows
* Safe integration endpoints/settings, if implemented
* Feature enablement by organization, where supported

### 14.2 Protected Server Configuration Outside the Web App

These settings must remain in protected server/deployment configuration, not editable through ordinary BEMMS administration pages:

* PostgreSQL credentials and database connection strings
* Docker Compose configuration
* Encryption keys, application secrets, cookie secrets, signing integrity keys
* SMTP/API credentials, external-service tokens, and private certificates
* Reverse-proxy/TLS private keys
* Operating-system/network/firewall configuration
* Raw backup encryption keys

Self-hosted deployment administrators manage these values through secured infrastructure processes, separate from normal hospital application administration.

### 14.3 Integrations

If future integrations are added, the UI must show only safe configuration metadata, enable/disable state, last synchronization outcome, and an authorized test action. Secrets must be stored in protected server-side secret storage and never returned to the browser after entry.

---

## 15. Audit Logs and Configuration History

### 15.1 Required Audit Events

BEMMS must create append-only audit records for:

* Organization/hospital/department/location create/edit/transfer/archive actions
* User invitation, activation, deactivation, archive, role/scope changes, and password-reset/invite actions
* Device category/manufacturer/status/QR configuration changes
* Ticket workflow/priority/target policy changes
* Maintenance type/category/checklist/PM/calibration policy changes
* Signature policy and approval-rule changes
* Notification, document, report, and retention configuration changes
* Export/download of restricted reports where required by policy
* Permanent deletion of permitted erroneous empty records

### 15.2 Audit Log Page

The Audit Log page must allow authorized search/filter by:

* Date/time and timezone
* User/actor
* Organization/hospital/department
* Entity type/ID
* Action type
* Previous/new value
* Configuration policy/version
* Success/failure where applicable

Audit records must be read-only for ordinary users. Corrections are made through new controlled actions, not by editing the audit log.

### 15.3 Configuration Change Impact

Before applying a high-impact policy change, BEMMS should show a preview where practical:

```text
Changing PM alert window from 14 days to 7 days
Affected: 38 active PM plans at Central Teaching Hospital
Effective: immediately / selected future date
Reason: required
```

The resulting audit event records the selected effective date and reason.

---

## 16. Archive, Deactivation, and Deletion Policy

### 16.1 Default Rule

For real hospital operational data, normal removal actions are recoverable:

| Entity | Normal removal action |
|---|---|
| User | Deactivate or archive account. |
| Hospital/department/location | Deactivate/archive while preserving linked history. |
| Device | Archive/decommission; preserve device, ticket, maintenance, signature, and QR history. |
| PM/calibration plan | Pause/archive; preserve occurrences/tasks/records. |
| Checklist/policy/template | Retire/archive version; preserve historical versions. |
| Ticket/maintenance/signature/audit record | Never permanently delete as ordinary business action. |

### 16.2 Permanent Deletion

Permanent deletion is allowed only for an erroneous record with no linked operational history, attachments, notifications, signatures, audit entries, or related records. It must require:

* Authorized role
* Clear warning and confirmation
* Reason
* Audit record
* Optional second approval if hospital policy requires it

The UI must never label archive/deactivation as a harmless `Delete` action.

---

## 17. Administration UI/UX Requirements

### 17.1 Desktop

Use an Administration sidebar with section groups and a consistent page pattern:

```text
Page title and scope selector
Primary action, such as Add user
Search and filters
List/table
Detail page or side panel
History/audit link
```

Avoid mixing many unrelated configuration sections on one page.

### 17.2 Mobile and Tablet

Administration should remain usable for urgent access/assignment tasks but is primarily optimized for desktop/tablet.

On phones:

* Use one-column lists
* Move filters to a separate sheet/page
* Use detail pages instead of wide editable tables
* Keep primary actions large and visible
* Require explicit confirmation for high-impact changes
* Prefer archive/deactivate actions in an overflow menu

### 17.3 Forms

Administrative forms must:

* Clearly mark required fields
* Explain the effect of role/scope/policy choices
* Show validation near the field
* Preview effective permissions where relevant
* Require a reason for high-impact changes
* Preserve entered data after validation or network failure
* Show a durable success result and an audit/history link after saving

### 17.4 Search and Filtering

Each list must support relevant scoped searching. For example:

* Users: name, role, department, status, last login
* Departments: hospital, manager, active status, device count
* Plans: device, type, due status, assignee, criticality
* Policies: scope, type, version, effective date, status
* Audit: actor, entity, date, action, hospital/department

---

## 18. Security Requirements

### 18.1 Authentication and Account Security

* Individual authenticated accounts only
* Secure password reset/invitation process
* Password/PIN/passkey secrets never visible to admins
* Session timeout and revocation according to policy
* Rate limiting and monitoring for authentication/reset attempts
* Deactivation immediately blocks active use according to session policy

### 18.2 Authorization

* Server-side organization/hospital/department/role checks for every administration request
* No reliance on hidden menu items or frontend-only restrictions
* Explicit scope checks for exports, audit logs, documents, and internal notes
* Protected separation of administrator and biomedical technical permissions

### 18.3 Sensitive Changes

Require recent authentication and/or enhanced confirmation for actions such as:

* Granting system administrator or release-signature authority
* Changing signature/review policy for critical devices
* Disabling audit requirements or retention controls
* Archiving a hospital/department with active work
* Permanent deletion of eligible empty records
* Changing secure integration configuration

### 18.4 Monitoring

Surface/audit security-relevant events including repeated failed logins, excessive invitation/resend attempts, unusual role escalation, failed policy updates, unauthorized access attempts, and failed background notification/scheduler jobs.

---

## 19. Data Model Requirements

The implementation may use different physical names, but it must support the following logical records.

### 19.1 Identity and Access

* Users/profiles
* Roles
* Permissions
* User-role assignments
* User organization/hospital/department/team scope assignments
* Invitations/account activation records
* Session/security events, using protected/appropriate retention

### 19.2 Organization and Reference Data

* Organizations
* Hospitals
* Departments
* Buildings/floors/rooms/locations
* Device categories/types
* Manufacturers/models/suppliers
* Device statuses and status-transition policies
* QR label templates/history

### 19.3 Workflow and Policy Data

* Ticket types/priorities/categories/status policies/targets
* Maintenance types/technical categories/work stages
* PM/calibration intervals, alert policies, deferral rules
* Checklist/procedure templates and versions
* Signature/review/release policies and attestation versions
* Notification policies/escalation rules
* Document categories/visibility/retention policies
* Report templates/export policies

### 19.4 Governance Data

* Versioned policy/configuration records with effective date and scope
* Append-only audit log
* Configuration change events and impact references
* Archive/deletion/retention decisions

---

## 20. Acceptance Criteria

The Administration and Settings module is ready for hospital testing only when:

1. Authorized administrators can create, edit, activate/deactivate, archive, and manage users within their scope.
2. Each user can hold one or more explicit roles and scoped organization/hospital/department/team assignments.
3. User deactivation prevents future access while preserving ownership, signatures, tickets, maintenance records, and audit history.
4. Administrators can create/edit/archive hospitals, departments, rooms, and locations without losing operational history.
5. Active devices must be transferred or handled through a controlled workflow before a department is archived.
6. Authorized users can configure device reference data, ticket workflow, PM/calibration policies, checklists, notification policies, and report settings according to role boundaries.
7. Maintenance, signature, and technical workflow policies are versioned and do not rewrite historical records.
8. System administrators do not automatically receive maintenance-performance, reviewer, signature, or device-release authority.
9. The application does not expose passwords, database credentials, private keys, tokens, or infrastructure configuration in the web UI.
10. Archive/deactivate is the normal removal flow; permanent deletion is limited to authorized erroneous empty records and is audit logged.
11. Every important user, access, policy, workflow, reference-data, and archive/deletion change creates an append-only audit event.
12. Administration pages work on desktop/tablet and remain usable for urgent actions on a phone.
13. Role/scope/policy forms present clear validation, confirmation, and effective-permission/policy context before significant changes.
14. Authorized administrators can search/filter users, departments, policies, plans, and audit history within their scope.

---

## 21. Recommended Delivery Sequence

### Phase 1 — Structure and Users

* Organizations, hospitals, departments, locations
* Individual user accounts, invitation/activation, roles, and scope assignments
* User activation/deactivation/archive
* Core audit logging

### Phase 2 — Device and Helpdesk Reference Data

* Device categories/manufacturers/statuses/QR label controls
* Ticket types, reporter categories, priorities, workflow states, and basic targets
* Administration dashboard for unconfigured users/departments/devices

### Phase 3 — Maintenance and Compliance Policies

* Maintenance type/category configuration
* PM/calibration plans, checklist template versioning, alert/deferral policies
* Signature/review/release policy configuration

### Phase 4 — Operations, Reporting, and Advanced Security

* Notification/document/report configuration
* Configuration versioning, policy impact preview, compliance dashboard
* Audit search/exports, integration settings, enhanced confirmation, and security monitoring

---

## 22. Final Recommendation

Build Administration as a secure, role-scoped configuration center—not as an unrestricted control panel.

> **The right administrator can configure the right part of BEMMS, for the right hospital scope, with every important change traceable—and without bypassing biomedical engineering responsibility for technical medical-device work.**
