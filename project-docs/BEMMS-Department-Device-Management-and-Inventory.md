# BEMMS Department Device Management and Inventory Navigation

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Application modules](BEMMS-Application-Modules-and-Pages.md) · [Administration](BEMMS-Administration-Settings-and-User-Management.md)
>
> **Related specifications:** [Role-based device profiles](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [PM scheduling](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md) · [UI/UX design](BEMMS-UI-UX-Design.md)

## 1. Purpose

This document defines how BEMMS manages medical devices in relation to departments, hospitals, rooms, and the global device inventory.

The recommended design uses two complementary entry points:

```text
Department page
→ Manage devices belonging to one department

Devices module
→ Manage/search all authorized devices across departments and hospitals
```

Both entry points open the same underlying Device Profile. They do not create duplicate device records or separate device-management systems.

The central principle is:

> **A device belongs to one authoritative current hospital, department, and location at a time; users can manage it from the department context or from the global inventory, while BEMMS keeps one complete device history.**

This document complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — device inventory, organization structure, security, and audit requirements
* `BEMMS-Administration-Settings-and-User-Management.md` — department/location administration, user access, and archive rules
* `BEMMS-Application-Modules-and-Pages.md` — Devices and Administration modules
* `BEMMS-Role-Based-Device-Profiles-and-QR-Access.md` — device profile and role-based access
* `BEMMS-UI-UX-Design.md` — mobile/desktop page and form design

---

## 2. Design Decision: Use Both Views

### 2.1 Department Page: Department-Focused Management

The Department page is the best place to answer:

* What devices are currently assigned to this department?
* Which rooms/locations contain them?
* Which department devices are unavailable, under maintenance, or overdue for PM?
* Which tickets affect this department?
* How can an authorized user add a device directly to this department?

### 2.2 Global Devices Module: Inventory-Focused Management

The Devices module is the best place to answer:

* Where is a device with this asset/serial number?
* Which devices are unassigned, moved, archived, or missing data?
* Which devices are due/overdue across all departments?
* How can a biomedical user find a device from QR, search, ticket, or maintenance task?
* How can an authorized user transfer a device between departments/hospitals?

### 2.3 Why One View Alone Is Not Enough

| Only department devices page | Only global device list | Recommended hybrid design |
|---|---|---|
| Easy for department-focused work, but poor for inventory-wide search and transfers. | Good for inventory control, but lacks department context and quick department setup. | Department pages support local work; global inventory supports cross-department management. |

---

## 3. Information Architecture

### 3.1 Top-Level Navigation

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

### 3.2 Department Navigation

```text
Administration
→ Organization & Locations
→ Hospitals
→ Select Hospital
→ Departments
→ Select Department
```

The Department Details page provides tabs:

```text
Overview | Devices | Users | Locations | Tickets | Maintenance Summary | Activity
```

### 3.3 Device Navigation

```text
Devices
→ Device Inventory List
→ Search/filter/select device
→ Device Profile
```

The Device Profile is shared by all routes:

```text
Department Devices tab → Device Profile
Global Device Inventory → Device Profile
QR scan → Device Profile / role-based scan result
Ticket link → Device Profile
Maintenance task link → Device Profile
```

---

## 4. Department Details Page

### 4.1 Purpose

The Department Details page is an administrative and operational hub for one department. It should show only data within the current administrator/manager's authorized hospital and organization scope.

### 4.2 Department Header

The header should display:

```text
Intensive Care Unit (ICU)
Central Teaching Hospital
Department manager: Dr. Lina Hassan
Status: Active

[ Edit Department ] [ Add Device ] [ View Department Report ]
```

The `Add Device` action appears only for users with device-create authority. It opens the shared Add Device form with the hospital and department automatically preselected.

### 4.3 Department Overview Tab

Show concise operational information:

* Department name, code, type, description, manager, and status
* Hospital relationship
* Rooms/locations count
* Total active devices
* Operational/limited/unavailable device count
* Active tickets and critical tickets
* PM/calibration due and overdue counts
* Recent device transfers and changes

Each count must link to its filtered list rather than being a non-actionable decoration.

### 4.4 Devices Tab

The Devices tab is the department-specific device list. It shows all devices whose **current authoritative department** is the selected department.

#### Required List Information

Each device row should show:

```text
Device name
Asset number / inventory number
Current room or exact location
Manufacturer and model, where useful
Current availability/status
Open ticket count/priority, when relevant
Next PM/calibration due state, when relevant
```

#### Required Actions

Authorized users can:

* Open Device Profile
* Add Device to this Department
* Search/filter department devices
* Edit permitted inventory fields
* Transfer device to another department/location
* Print/reprint QR label where authorized
* Archive/decommission through controlled workflow

Department staff or doctors normally receive a view-only device list plus allowed report/request actions; they do not see inventory edit/transfer/archive actions.

### 4.5 Users Tab

The Users tab shows department-related users, subject to permission:

* Department manager(s)
* Department staff with device/ticket visibility
* Biomedical team members assigned to the department
* Active/inactive user status
* Role/scope summary

This tab does not expose passwords, credentials, private session data, or access scopes beyond what the viewer is authorized to manage.

### 4.6 Locations Tab

The Locations tab manages the department's building/floor/room/area structure. It supports:

* Add/edit/archive room or location
* View device count at each location
* Open a filtered list of devices in that room
* Identify devices without a room/exact location

A room/location with device history must be archived/deactivated rather than casually deleted. Active devices must be transferred to another valid location before archive is completed.

### 4.7 Tickets Tab

The Tickets tab shows department-scoped helpdesk tickets:

* New/open/critical tickets
* Tickets waiting for department information
* Tickets under repair or waiting for parts
* Resolved/closed tickets
* Ticket counts by device/location

Department users see public progress only. Internal biomedical notes, technical findings, costs, and restricted attachments remain protected.

### 4.8 Maintenance Summary Tab

Show department maintenance status without overwhelming users with technical records:

* PM/calibration due soon, due today, and overdue
* Devices currently under maintenance/out of service
* Completed maintenance count for selected period
* Assigned biomedical team, when authorized
* Link to full authorized Maintenance module

### 4.9 Activity Tab

Show an authorized timeline of department-level activity:

* Department edits/archive state
* Device additions/transfers/archives
* QR label actions, where appropriate
* High-level ticket/maintenance events
* User/manager assignment changes

Full audit detail remains in the Audit Logs module for authorized administrators/auditors.

---

## 5. Global Devices Module

### 5.1 Purpose

The Devices module is BEMMS's authoritative inventory entry point. It provides cross-department and cross-hospital management within user scope.

### 5.2 Device Inventory List

The list must support search by:

* Device name
* Asset number and inventory number
* Serial number
* Manufacturer and model
* QR/manual device reference

Required filters:

* Organization/hospital
* Department, room/location
* Device category/type
* Manufacturer/model
* Current status/availability
* PM/calibration due state
* Assigned engineer/team
* Criticality/risk level
* Active/archived/decommissioned state

### 5.3 Required Columns or Mobile List Fields

Desktop table:

```text
Asset number | Device | Hospital | Department/Room | Status | Open tickets | Next PM | Next calibration | Assigned engineer
```

Mobile list row:

```text
Infusion Pump                         [Out of service]
INF-PUMP-00482 · ICU · Room 3
Open ticket: P1 Critical · PM due 18 Sep
```

### 5.4 Global Inventory Actions

Based on permissions, users can:

* Add Device
* Import approved device inventory in a future controlled import feature
* Open/edit Device Profile
* Transfer device between locations/departments/hospitals
* Print/reprint QR labels
* Archive/decommission device
* View unresolved device-data exceptions, such as missing department or serial number

The global list must never show devices outside the user's authorized organization/hospital scope.

---

## 6. Add Device Workflow

### 6.1 Add from Department Page

This is the best route when an administrator is working inside a specific department:

```text
Administration
→ Hospitals
→ Department
→ Devices tab
→ Add Device to ICU
```

The Add Device form automatically preselects and locks/requires confirmation of:

```text
Organization: National Hospital Group
Hospital: Central Teaching Hospital
Department: Intensive Care Unit
```

The user selects the room/location and completes remaining device fields.

### 6.2 Add from Global Device Inventory

This route is needed for biomedical/admin inventory users who manage devices across departments:

```text
Devices
→ Add Device
→ Select authorized hospital
→ Select authorized department
→ Select room/location
→ Complete device details
→ Save
```

### 6.3 Required Device Fields at Creation

At minimum, require:

* Device name/category
* Unique asset number in configured scope
* Hospital
* Department, unless policy permits a temporary unassigned inventory state
* Location/room, if known
* Manufacturer, model, and serial number where available
* Current device status
* Criticality/risk level where required
* Maintenance/PM baseline or plan decision

Optional/conditional fields include purchase/warranty, supplier, specifications, accessories, documents, and assigned biomedical engineer.

### 6.4 On Successful Creation

When the form is successfully saved, BEMMS must:

1. Create one new device record with a unique internal ID.
2. Validate hospital/department/location relationships.
3. Record the initial location and status history.
4. Create audit event(s).
5. Create/generate the stable QR reference and offer printable label generation.
6. Present the Device Profile with next recommended action, such as `Create PM plan` when required by policy.

Device creation must not silently create a completed maintenance record. New-device commissioning is separate technical work when required.

---

## 7. Edit Device Workflow

### 7.1 Shared Device Profile

The edit route must always update the same Device Profile regardless of whether it was opened from a Department page or Global Devices list.

```text
Department Devices tab → Select device → Edit device
Global Devices list → Select device → Edit device
```

### 7.2 Edit Sections

Split editing into understandable sections:

```text
Identity & Inventory
Location & Assignment
Technical Details
Procurement & Warranty
Documents
Maintenance Plan Summary
Archive/Decommission
```

Only show fields/actions that the current role may change.

### 7.3 Inventory Versus Technical Records

Administrators may edit approved inventory information such as asset number, department/location assignment, manufacturer/model reference, purchase/warranty data, and QR label state.

They must not silently edit:

* Completed maintenance findings
* Calibration measurements/certificates
* Signed checklist/test results
* Electronic signatures
* Technical root cause
* Device release decision
* Append-only audit history

Technical records are corrected through a biomedical amendment/signature workflow.

---

## 8. Device Transfer Workflow

### 8.1 Purpose

Transfer changes a device's current hospital, department, room, or exact location while preserving the history of where it was previously assigned.

### 8.2 Transfer Route

```text
Device Profile
→ Transfer Location
→ Select authorized destination hospital/department/room
→ Enter reason
→ Review impact
→ Confirm transfer
```

The transfer action may be reached from the Department Devices tab, but it must open the same controlled shared transfer form.

### 8.3 Required Transfer Information

* Current and destination organization/hospital/department/location
* Effective transfer date/time
* Transfer reason — relocation, temporary loan, department change, correction, replacement, other
* Responsible user
* Current device status and active ticket/maintenance task summary
* Required receiving/approval confirmation where policy requires it

### 8.4 Validation and Warnings

Before confirmation, BEMMS must:

* Validate that destination department belongs to destination hospital.
* Validate that destination room belongs to destination department, where modeled.
* Warn about active critical tickets, in-progress maintenance, or pending PM/calibration work.
* Preserve or update task location correctly while retaining historical location snapshot.
* Require required authorization/review for cross-hospital moves or critical-device moves.

### 8.5 Transfer Result

On successful transfer, BEMMS must:

* Update current device location
* Add a device-location-history event
* Add audit event(s)
* Update future task/notification destination context
* Keep older tickets/maintenance records linked to their historical location snapshot
* Notify authorized affected users where policy requires it

QR reference remains stable unless the label itself must be replaced; scanning it resolves to the device's new authorized location.

---

## 9. Department Lifecycle and Device Safety

### 9.1 Deactivate/Archive a Department

Before a department with active devices can be archived, BEMMS must guide an authorized user through:

```text
Review active devices
→ Transfer each active device to a valid department/location
or
Archive/decommission eligible devices through their own workflow
→ Resolve/reassign active department work as required
→ Archive department with reason
```

Historical tickets, maintenance records, device histories, signatures, and audit events remain associated with the prior department snapshot.

### 9.2 Devices Temporarily Unassigned

Some hospitals may need an authorized temporary inventory state, for example a device awaiting installation, storage, or repair workshop. When allowed, BEMMS must use a clearly labeled valid location such as:

```text
Biomedical Workshop
Central Store
Awaiting Department Assignment
```

Do not use a blank/unknown department silently. The global inventory must show an exception for devices without a required operational department/location.

### 9.3 Delete Versus Archive

For a real device, the normal action is `Archive`, `Decommission`, or `Removed from hospital`, not permanent deletion. This preserves all QR, ticket, maintenance, calibration, cost, signature, and audit history.

Permanent device deletion is allowed only for an erroneous empty record with no linked history and must require authorized confirmation and an audit event.

---

## 10. Permissions and Role Behavior

| Action | Doctor/staff | Department manager | Biomedical technician | Biomedical engineer | Biomedical manager | System administrator |
|---|---:|---:|---:|---:|---:|---:|
| View department device list | Authorized department | Authorized department | Assigned/authorized | Authorized | Authorized | Authorized inventory scope |
| Report problem/request work | Yes | Yes | Yes | Yes | Yes | Policy-based |
| Add device | No | No, unless assigned inventory authority | No, unless explicitly assigned | Yes, if assigned | Yes | Yes, if inventory authority |
| Edit inventory device fields | No | No, unless assigned | Limited assigned fields | Yes, if assigned | Yes | Yes, if inventory authority |
| Transfer location | No | Request/report only | Limited if assigned | Yes | Yes | Yes, if inventory authority |
| Print QR label | No | No, unless assigned | If assigned | Yes | Yes | Yes, if inventory authority |
| Archive/decommission | No | No, unless assigned | No | Recommend/submit request | Yes | Yes, inventory archive only; technical decommission policy applies |
| Edit signed technical work/release device | No | No | No | Only through authorized biomedical workflow | Yes, according to policy | Only with biomedical role |

Every action is enforced by server-side organization/hospital/department/role checks. Hiding buttons in the interface is only a usability feature, not access control.

---

## 11. UI/UX Requirements

### 11.1 Desktop Department Device List

Use a filterable table with:

```text
Asset number | Device | Room | Status | Open tickets | Next PM | Calibration | Actions
```

Place `Add Device to [Department]` as the primary action. Use an overflow menu for edit/transfer/QR/archive actions to keep the table uncluttered.

### 11.2 Mobile Department Device List

Use a single-column device list. Every row shows:

```text
Device name                         [Status]
Asset number · Room
Open ticket / PM due indicator
```

Provide visible search, compact filters, and a large `Add Device` action for authorized users. Do not use a wide table on a phone.

### 11.3 Device Selection for Staff Reporting

Department staff reporting a problem use the same Devices tab or a dedicated department device selector:

```text
Select authorized department
→ Search/select device
→ Review device status and active-ticket summary
→ Report problem/request maintenance
```

They do not see inventory edit/transfer/archive actions.

### 11.4 Edit/Transfer Forms

* Prefill current organization/hospital/department/location.
* Use dependent selectors: hospital → department → room.
* Clearly distinguish ordinary inventory edits from controlled transfer/status actions.
* Require reason for transfer, archive/decommission, or high-impact location changes.
* Show validation near the affected field.
* Preserve entered data after network/validation failure.
* Show a durable completion result with link to device history.

### 11.5 Archive and Decommission Confirmation

The confirmation screen must explain the impact:

```text
Archive device INF-PUMP-00482?
Its tickets, maintenance, QR history, documents, and signatures will remain available as historical records.
New work cannot be assigned until authorized reactivation.

Reason: [required]
[ Archive device ]
```

Use `Archive`, `Decommission`, or `Remove from hospital` language rather than an ambiguous `Delete` button for real devices.

---

## 12. Data Model Requirements

### 12.1 Current Device Assignment

Each device record must store its authoritative current relationship:

* Organization ID
* Hospital ID
* Department ID
* Building/floor/room/location ID or free-text exact location as policy allows
* Assignment effective time
* Active/archive/decommission status

### 12.2 Device Location History

Every transfer/location change creates a location-history record with:

* History ID and device ID
* Previous and new organization/hospital/department/location values
* Transfer type/reason
* Effective time
* Actor user ID
* Required approval/signature reference, where applicable
* Related ticket/maintenance reference, where relevant

### 12.3 Department Relationship Rules

The database/server must enforce:

* A department belongs to one hospital.
* A room/location belongs to a valid department/hospital where modeled.
* A device department belongs to its selected hospital.
* A device cannot be assigned to an archived/inactive department unless policy explicitly supports historical import/recovery handling.
* A transfer cannot create an invalid cross-organization relationship.
* Asset-number uniqueness is enforced within the configured scope.

### 12.4 Derived Department Data

Department device count, status count, ticket count, PM/calibration due state, and reports must be calculated from device/current assignment plus historical snapshots as appropriate. They must not become independent editable counters.

---

## 13. Audit and Traceability Requirements

Record audit/history events for:

* Device created from a Department page or global inventory, including entry source
* Device inventory edits
* Department/location transfers
* Department manager and user-scope changes
* QR label generated/reprinted/revoked/replaced
* Device archive/decommission/reactivation
* Department/room archive/deactivation
* Permanent deletion of permitted erroneous empty records

Device Profile history must show meaningful operational events, while full before/after administrative detail remains available in authorized Audit Logs.

---

## 14. Reports and Administration Checks

Administration and reports should surface:

* Devices by hospital, department, room, category, and status
* Devices with missing or invalid location/department assignment
* Devices in archived/inactive departments needing remediation
* Devices transferred between departments during a selected period
* Department availability and out-of-service counts
* Department PM/calibration compliance
* Devices without required PM plans or QR labels
* Devices with repeated failure or high maintenance cost by department
* Device inventory created/archived/decommissioned during a period

All lists/reports must respect the user's authorized scope and distinguish current location from historical ticket/maintenance location.

---

## 15. Acceptance Criteria

The department-device management feature is ready for hospital testing only when:

1. Authorized users can navigate from Administration to Hospital to Department to the Department Devices tab.
2. The Department Devices tab shows the same underlying devices as the global Device Inventory when filtered by that department.
3. An authorized user can add a device from a Department page with organization/hospital/department prefilled.
4. An authorized inventory user can add a device from the global Devices module by selecting a valid hospital/department/location.
5. Every new device receives a unique ID, valid initial assignment/history, audit event, and stable QR reference/label option.
6. Opening a device from Department, Global Devices, QR, Ticket, or Maintenance always opens the same Device Profile.
7. Authorized inventory users can edit permitted device fields without being able to silently edit signed technical/maintenance records.
8. Device transfer validates destination relationships, requires a reason, preserves location history, and updates current device assignment.
9. Department staff can report a problem from an authorized department device list but cannot edit/transfer/archive inventory data.
10. A department with active devices cannot be permanently deleted; the system guides device transfer/archive before department archive.
11. A device with history is archived/decommissioned rather than permanently deleted.
12. Global device search supports cross-department inventory management without exposing unauthorized devices.
13. Department/device lists are usable on phone screens and provide desktop table views where appropriate.
14. Important department/device/QR/archive/transfer actions are audit logged and visible in authorized history.

---

## 16. Recommended Delivery Sequence

### Phase 1 — Structure and Read Views

* Hospital, department, room/location schema
* Global Device Inventory list
* Department Details page with Devices tab
* Common Device Profile route from both lists
* Organization/hospital/department scope enforcement

### Phase 2 — Device Creation and Editing

* Add Device from Department with prefilled scope
* Add Device from global inventory with dependent location selectors
* Inventory edit sections, validation, audit events, QR label generation
* Department device reporting entry point for staff

### Phase 3 — Transfer and Lifecycle Controls

* Controlled transfer workflow/location history
* Department archive with active-device resolution path
* Device archive/decommission/reactivation workflow
* Location/device exception reports

### Phase 4 — Advanced Inventory Operations

* Controlled inventory import
* Cross-hospital transfer approvals
* Barcode support, reconciliation/audit tools, and advanced inventory reporting

---

## 17. Final Recommendation

Use the Department Devices tab for focused local management and the global Devices module for full inventory control. Keep one underlying device record and one Device Profile for every physical device.

> **Departments answer “what devices are here?” The Devices module answers “where is this device and what is its complete history?” BEMMS must answer both without duplicating data.**
