# BEMMS UI/UX Design Guide

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Modules and pages](BEMMS-Application-Modules-and-Pages.md) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md)
>
> **Related detailed specifications:** [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Device profiles and QR access](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [Department inventory](BEMMS-Department-Device-Management-and-Inventory.md) · [Administration](BEMMS-Administration-Settings-and-User-Management.md)

## 1. Purpose

This document defines the recommended user-interface and user-experience design for BEMMS. It describes how pages should look and behave on phones, tablets, and desktops, with priority given to fast, safe work beside medical equipment.

It complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — product, security, and technical requirements
* `QR-Helpdesk-Ticketing-Workflow.md` — QR scan and helpdesk requirements
* `BEMMS-Application-Modules-and-Pages.md` — page map, modules, navigation, and workflows

The guiding user experience is:

> **A clinician can identify or report a device problem in seconds. A biomedical team can see, prioritize, complete, and document work without losing context.**

---

## 2. UX Principles

### 2.1 Fast beside the device

The most common mobile tasks must be short:

```text
Scan device → understand status → report/request work → receive ticket number
```

The user must not be asked to search for the same device after scanning it, or fill in information BEMMS already knows.

### 2.2 Safety and availability first

If a device is unavailable, under maintenance, has a critical ticket, or is decommissioned, that message must be the first thing shown on the device and scan-result pages. Use clear text and an icon in addition to color.

Examples:

* `Operational — available for use`
* `Under maintenance — do not use until released`
* `Out of service — linked to ticket BEM-2026-00482`
* `Maintenance overdue — biomedical review required`

BEMMS must present operational information, not a clinical clearance or a substitute for hospital procedures.

### 2.3 One primary action per screen

Every page should have one obvious next step. Other actions should be secondary.

| Screen | Primary action |
|---|---|
| Staff dashboard | Report a problem |
| QR scan result | Report a problem or view active ticket, based on state |
| Ticket form | Submit ticket |
| Biomedical triage queue | Open next priority ticket |
| Ticket detail | Update work status |
| Maintenance task | Start/continue maintenance |
| Admin device list | Add device |

### 2.4 Progressive disclosure

Show essential information first, then reveal details through tabs, accordions, or secondary pages. A doctor should not see technical fields such as root cause, parts usage, or internal engineering notes unless authorized.

### 2.5 Mobile first, not mobile reduced

Mobile pages should support complete, safe workflows—not merely view information. Controls need large tap targets, forms must avoid dense layouts, and camera scanning must be a first-class function.

### 2.6 Calm clinical visual language

Use a clean, high-contrast interface with quiet neutral surfaces and one calm primary brand color. Use color sparingly for meaningful status/priority signals, always paired with words and icons. Avoid decorative dashboards, excessive cards, and dense data on mobile.

---

## 3. Information Architecture and Role-Based Navigation

### 3.1 Core Modules

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

The menu should show only pages the user may use. Hidden navigation is not security; server-side permission checks remain mandatory.

### 3.2 Mobile Navigation

Use five simple mobile destinations:

```text
Home | Scan | Report | My Work | More
```

| Destination | Behavior |
|---|---|
| Home | Opens the user's role-specific dashboard. |
| Scan | Opens camera scanning, with asset-number/device-ID manual lookup fallback. |
| Report | Starts a ticket. It uses the most recent scanned device when confirmed; otherwise it opens department device selection. |
| My Work | Staff see their reported/department tickets; biomedical users see assigned tickets and maintenance tasks. |
| More | Opens Devices, Reports, Notifications, Profile, and authorized Administration pages. |

Use a visible floating primary action only when it does not duplicate the bottom navigation. For example, on a department device list, a compact `Report a problem` action is appropriate; on the Home screen, the bottom `Report` destination is sufficient.

### 3.3 Desktop Navigation

Use a persistent left sidebar with module labels and icons. Keep the main content width comfortable for reading and forms. Desktop-specific features such as tables, saved filters, bulk assignment, and report configuration should remain available without making mobile pages cramped.

### 3.4 Role Navigation

| Role | Main mobile actions | Main desktop sections |
|---|---|---|
| Doctor / department staff | Scan, Report, My tickets | Dashboard, Devices, My/Department Tickets, Notifications |
| Department manager | Scan, Report, Department tickets | Dashboard, Devices, Department Tickets, Reports |
| Biomedical technician | Scan, My Work | Dashboard, Devices, Assigned Tickets, Maintenance |
| Biomedical engineer | Scan, Triage, My Work | Dashboard, Devices, Tickets, Maintenance, Reports |
| Biomedical manager | Alerts, Queue, Reports | Dashboard, Devices, Tickets, Maintenance, Reports |
| System administrator | Administration shortcuts | Administration, Inventory, Reports, Audit Logs |

---

## 4. Visual System

### 4.1 Typography

Use a readable sans-serif font and a limited type scale:

* Page title — clear and concise
* Section title — used to separate related information
* Standard body text — default for labels, descriptions, and updates
* Small text — timestamps, secondary metadata, and captions only

Do not shrink essential text below a comfortable mobile reading size. Forms should preserve mobile browser zoom behavior by using a sufficiently large input font.

### 4.2 Color Semantics

Use a restrained palette with meaning that remains understandable without color.

| Meaning | Visual treatment | Required accompanying text |
|---|---|---|
| Primary action | One consistent primary color | Action label, such as `Submit ticket` |
| Operational/available | Positive status treatment | `Operational` or `Available` |
| Attention/due soon | Warning treatment | `Due soon` or `Needs review` |
| Urgent/critical/out of service | High-visibility danger treatment | `Critical`, `Out of service`, or `Do not use` |
| Informational/in progress | Neutral/information treatment | `Assigned`, `Investigating`, or `Testing` |
| Archived/decommissioned | Muted treatment | `Archived` or `Decommissioned` |

Do not use green/red alone to communicate a safety decision. Include an icon, text, and where useful a concise instruction.

### 4.3 Status Badges

Use compact textual badges only for stable, short status values. Larger availability banners should be used for information that changes the user's next action.

Examples:

```text
[Operational]            Small device list badge
[P1 Critical]            Ticket priority badge
[Waiting for parts]      Ticket workflow badge

OUT OF SERVICE           Full-width availability banner on device/scan page
Do not use until released by Biomedical Engineering.
```

### 4.4 Icons

Use familiar icons only when paired with labels in core actions:

* Camera/QR — Scan
* Warning triangle — Attention or unsafe/unavailable state
* Wrench — Maintenance
* Clipboard/list — Ticket
* Bell — Notification
* Building — Department/hospital

Never make an important function icon-only on mobile.

### 4.5 Layout and Spacing

* Use one-column mobile pages.
* Keep primary action buttons full width when completing a form or selecting the next workflow step.
* Maintain comfortable spacing between form controls and touch targets.
* Avoid side-by-side form fields on narrow screens except for very short related values.
* Use section dividers and headings rather than many nested cards.
* Avoid horizontal scrolling except for large desktop tables; offer a mobile card/list representation instead.

---

## 5. Common Interaction Patterns

### 5.1 Search and Select a Device

Use a two-step selection pattern when QR scanning is unavailable:

```text
Select department → Search/select device → Confirm current status → Continue
```

The search results must show enough information to prevent mistakes:

* Device name
* Asset number
* Room/location
* Manufacturer/model where useful
* Current status

Show only devices within the user's authorized department/hospital scope. If the selected device recently moved, refresh the location and request confirmation before ticket submission.

### 5.2 Forms

Forms should:

* Place the most important fields first
* Clearly mark required fields
* Prefill known data and make it read-only where it should not change
* Validate individual fields as the user proceeds, without showing errors before interaction
* Keep destructive/irreversible actions separate from normal save actions
* Preserve user-entered data if an upload or network action fails
* Confirm success using a clear result, such as a ticket number

### 5.3 Status Updates

When a user changes a ticket or device status, the UI should require:

* New status
* Visible reason/summary when required
* Public update or internal note choice for authorized biomedical users
* Confirmation only when the action is important or hard to undo

Do not use confirmation dialogs for routine saves. Use them for archiving, decommissioning, cancellation, reassignment with impact, and permanent deletion.

### 5.4 Timeline

Use a chronological timeline for ticket and device history. Every event should show:

* What changed
* Who performed it
* When it happened
* Whether the update is public or internal, where authorized
* A direct link to connected ticket, device, or maintenance record when helpful

### 5.5 Attachments

On mobile, the attachment action should offer camera capture or file selection. Show upload progress and allow a user to remove an attachment before submission. Use thumbnails for photos but never require users to identify technical files from thumbnails alone.

---

## 6. Page-by-Page UI Requirements

### 6.1 Login and Account Pages

### Pages

* Login
* Password reset
* Account activation/invitation acceptance
* Profile and security settings

### Design

Keep these pages minimal: logo, single clear heading, one narrow form, clear error messages, and help contact information. Do not expose whether an email address belongs to a valid account during password-reset requests.

---

### 6.2 Dashboard

### Staff Dashboard

Order the screen as:

```text
Greeting / department context
Primary actions: Scan device | Report a problem
Tickets needing my response
Department device availability alerts
My recent tickets
```

### Biomedical Dashboard

Order the screen as:

```text
Critical alerts
New/untriaged tickets
My assigned tickets
Maintenance due today/overdue
Devices out of service
```

### Manager Dashboard

Start with exceptions, not large decorative metrics:

```text
Critical and overdue work
Maintenance compliance
Out-of-service devices
Ticket workload and target risk
Trend/report shortcuts
```

Use metric cards only for actionable numbers. Tapping a metric should open the filtered list that explains it.

---

### 6.3 QR Scanner and Scan Result

### QR Scanner

The scanner page should contain:

* A clear camera preview area
* `Point the camera at the device QR label`
* Flashlight control when supported
* `Enter asset number instead` fallback
* Help link for a damaged or missing label

After success, give brief feedback and immediately open the scan result page. Do not make the user confirm a clearly valid scan.

### Scan Result

Recommended mobile order:

```text
Back
Availability/status banner
Device name and asset number
Location
Open-ticket and maintenance summary
Primary action
Secondary actions
```

Example screen states:

| Device state | Primary action | Secondary actions |
|---|---|---|
| Operational, no open ticket | Report a problem | Request maintenance, View history |
| Open ticket | View active ticket | Add observation, View history |
| Under maintenance | View active work | Add observation, View history |
| Out of service | View related ticket/status reason | Report additional information |
| Maintenance due | Biomedical: Start/view task | Staff: View maintenance status |

The scan result should never show internal notes to department users.

---

### 6.4 Device List and Department Equipment List

### Mobile List

Use a single-column list of device rows. Each row displays:

```text
Device name                         [Status]
Asset number · Room/location
Manufacturer/model
Open ticket / maintenance due indicator when relevant
```

Tap a row to open Device Details. Provide visible search at the top and compact filters for department, status, category, and maintenance state.

### Desktop Table

Use a sortable/filterable table with columns such as asset number, device, department/location, status, open tickets, maintenance due, and assigned engineer. Row actions should be in an overflow menu to prevent visual clutter.

### Device Selection for Reporting

The `Report Device Problem` flow must show a department selector first, then a searchable device list. After selection, display a compact device confirmation panel with status and active-ticket count before continuing.

---

### 6.5 Device Details

### Mobile Layout

```text
Device name / asset number
Availability status banner
Location and key identity details
Quick actions
Active tickets
Maintenance summary
History link
Documents and technical details
```

Use accordions or segmented tabs only after the overview. Do not hide availability, current location, or report action inside a tab.

### Desktop Layout

Use a stable header with key device details and actions, followed by sections/tabs:

```text
Overview | Active Tickets | Maintenance | History | Documents | Technical Details
```

Always keep the current status and primary action visible near the header.

---

### 6.6 Report a Problem / Request Maintenance

### Reporter Form

The first screen must be short and mobile friendly:

```text
Selected device and location (read-only)
What is wrong or requested? *
Impact *
Optional: category, photo/video, contact preference, longer note
Submit ticket
```

Impact choices must use clear plain language:

* `Device is usable`
* `Device is not usable`
* `May affect patient care — urgent`

Before submit, show any active tickets for the device. Let the reporter open an existing ticket or confirm that this is a separate issue.

### Success Screen

After submission, show:

```text
Ticket created
BEM-2026-00482
Status: New
We will update you here when the Biomedical Engineering team reviews it.

View ticket | Back to device
```

Do not leave the user on a blank form or rely only on a brief toast message.

---

### 6.7 Ticket Lists and Ticket Detail

### Ticket Lists

Mobile ticket rows should show:

```text
Ticket number · Priority
Short title
Device name / asset number
Current status · Last updated time
```

Desktop queues can add filters for hospital, department, status, priority, assignee, target risk, device category, and date. Save common views for biomedical managers only after the core queue is stable.

### Ticket Detail

Recommended hierarchy:

```text
Ticket number, status, and priority
Device and location
Reporter description and reported impact
Current assignee / work state
Primary next action
Timeline
Public updates
Internal notes, only for biomedical roles
Attachments
Linked maintenance
```

The ticket status must never be an unexplained color. Display the label and short explanation when helpful, for example `Waiting for parts — repair cannot continue until approved parts arrive`.

### Public and Internal Notes

Biomedical users must choose visibility intentionally when posting an update:

```text
( ) Public update — visible to reporter and department
( ) Internal biomedical note — visible only to authorized biomedical users
```

The selection must be obvious before sending. Use plain language for public updates.

---

### 6.8 Biomedical Triage Queue

### Desktop

This is a work-management page, not a dashboard. Use a dense but readable table/list with:

* Priority
* Ticket number and age
* Device and department
* Current status
* Assignee
* Response/resolution target state

Place priority and target-risk controls at the top. Opening a ticket should preserve queue filters so the engineer can return to the same place.

### Mobile

Use an ordered list grouped by `Critical`, `New`, `Assigned to me`, and `Waiting`. Default to the most urgent work. Keep filters inside a bottom sheet or dedicated filter page rather than permanently occupying screen space.

### Triage Panel

On ticket detail, triage actions should be grouped in a controlled panel:

```text
Confirm ticket type
Confirm/change priority
Assign technician/engineer
Set status to Triaged or Assigned
Set/update target if permitted
Add internal triage note
Save triage
```

---

### 6.9 Maintenance Task and Checklist

### Task Detail

Show the device context at the top of every maintenance task:

```text
Device / asset number
Location
Linked ticket, if any
Task type and due state
Start/continue action
```

### Checklist UX

Checklist items must be easy to complete with a gloved or busy hand:

* One item per row
* Clear results: `Passed`, `Failed`, `Not applicable`, `Requires follow-up`
* Result selection that is easy to tap
* Notes/attachment option per item
* Progress indicator, such as `7 of 12 completed`
* Prevent submission if required failed items lack a note or follow-up action

Do not force technicians through a long multi-page wizard when a well-structured single task page is clearer.

### Completion

The completion screen must ask for required findings, work performed, test results, result, final device status, recommendations, and next due date where applicable. Use a review screen before marking critical work complete.

---

### 6.10 Administration UI

Administration pages are desktop-friendly management pages that must remain usable on tablets and phones.

### Users

```text
User list → Open user → Profile | Access scope | Roles | Activity
```

Use a clear `Add user` or `Invite user` primary action. Deactivate/archive actions belong in an overflow menu and require confirmation with a short explanation of the effect.

### Departments and Locations

```text
Department list → Department details → Users | Devices | Locations | Activity
```

When archiving a department that contains active devices, guide the administrator to transfer devices or deactivate the department according to policy. Never present destructive delete as the default option.

### Device Management

```text
Inventory list → Add/Edit device → Assign department/location → Print QR label → Archive
```

In device edits, separate general inventory data from protected technical/maintenance data. A transfer page should show the current and new department/location and require a reason; BEMMS records it in device history.

### Archive and Deletion Design

Use the language `Archive`, `Deactivate`, or `Decommission` for real operational records. Only show `Permanently delete` for an erroneous empty record; present a clear warning and require typed confirmation if hospital policy requires it.

---

### 6.11 Reports and Notifications

### Reports and Statistics

The Reports area should have two clear destinations:

```text
Live Statistics | Generated Report History
```

Live Statistics should begin with these report categories:

* Device reliability — frequently broken devices, repeated failure categories, and downtime
* Breakdown trends — tickets created and resolved per month
* Maintenance costs — parts, vendor/service, and optional labor cost
* Maintenance compliance — due, overdue, and completed preventive work
* Engineer/team workload and performance — workload, target compliance, resolution time, preventive completion, and reopened tickets

Every report page must show its selected date range, filters, timezone, and calculation basis near the results. For engineer performance, show priority, device criticality, and maintenance type alongside completed-work totals; do not imply that the highest ticket count is automatically the best performance.

On desktop, reports can use filters and tables/charts. On mobile, prioritize a short summary, filter chips, key exceptions, and an export/share action. Do not try to reproduce wide desktop tables in a phone viewport.

Generated Report History shows official PDF/Excel snapshots with report type, period, filters, requester, generated date/time, and an authorized download. Live reports remain live; save an export snapshot only when a fixed monthly, management, or compliance report is needed.

### Notifications

Use a chronological notification list grouped by `New`, `Today`, and `Earlier`. Each notification must state what happened and open the relevant ticket, device, or task. Do not notify users about information they are not allowed to open.

---

## 7. Responsive Rules

### 7.1 Phone

* One column
* Bottom navigation
* Full-width primary form actions
* Large touch targets
* Camera scan and quick reporting first
* Long tables become list rows
* Filters use a drawer/bottom sheet

### 7.2 Tablet

* Two columns only when both remain readable
* Side-by-side task/checklist context may be appropriate
* Optional compact sidebar
* Data tables may remain usable with horizontal controls minimized

### 7.3 Desktop

* Persistent sidebar
* Tables, multi-filter queues, and reports
* Context panel alongside ticket/device work when it improves speed
* Bulk work actions only for explicitly authorized roles

### 7.4 Minimum Accessibility Targets

* Support widths down to 320 pixels without clipping essential content
* Touch targets approximately 44 by 44 pixels on phone screens
* Keyboard navigation and visible focus on desktop
* Text alternatives for icons and QR scanning errors
* Sufficient contrast in light and dark environments
* No required information conveyed by color alone
* Clear errors close to the affected field
* Essential actions available without hover or gesture-only controls

---

## 8. Error, Offline, and Loading States

### 8.1 Loading

Show structure-aware loading placeholders for lists and detail pages. Do not block the whole application while one panel refreshes.

### 8.2 Network Problem

If the network fails during a report or maintenance update:

* Preserve entered form data locally in the page until the user can retry
* Clearly state whether the ticket/update was submitted or not
* Do not show a success state until the server confirms it
* Offer retry without forcing users to re-enter text

Full offline synchronization is a later feature; the MVP must be honest about connection state.

### 8.3 Empty States

Empty states should explain what the user can do next:

* `No tickets need your response.`
* `No active maintenance tasks are assigned to you.`
* `No devices match these filters. Clear filters or search by asset number.`

Avoid decorative illustrations that distract from urgent hospital work.

### 8.4 Permission and Not Found States

Never reveal protected data in errors. Use messages such as:

* `You do not have access to this device.`
* `This QR label is no longer active. Search by asset number or contact Biomedical Engineering.`
* `This device could not be found.`

---

## 9. Core Screen Wireframes

### 9.1 Staff Mobile Dashboard

```text
┌────────────────────────────────────┐
│ Good morning, Dr. Sara              │
│ ICU · Central Teaching Hospital     │
├────────────────────────────────────┤
│ [ Scan device ]                     │
│ [ Report a problem ]                │
├────────────────────────────────────┤
│ Needs your response                 │
│ BEM-2026-00482 · Waiting for you    │
├────────────────────────────────────┤
│ Department availability              │
│ 2 devices unavailable                │
├────────────────────────────────────┤
│ Home   Scan   Report   My Work  More│
└────────────────────────────────────┘
```

### 9.2 Mobile Scan Result

```text
┌────────────────────────────────────┐
│ ← Scan result                       │
├────────────────────────────────────┤
│ ⚠ OUT OF SERVICE                    │
│ Do not use until released by BME.   │
├────────────────────────────────────┤
│ Infusion Pump                        │
│ INF-PUMP-00482                       │
│ ICU · Room 3                         │
├────────────────────────────────────┤
│ Open ticket: BEM-2026-00482          │
│ Status: Investigating                │
│ Last update: 12 min ago              │
├────────────────────────────────────┤
│ [ View active ticket ]               │
│ [ Add observation ]                  │
│ Request maintenance · View history   │
└────────────────────────────────────┘
```

### 9.3 Mobile Report Form

```text
┌────────────────────────────────────┐
│ ← Report a problem                  │
├────────────────────────────────────┤
│ Infusion Pump · INF-PUMP-00482       │
│ ICU · Room 3                         │
├────────────────────────────────────┤
│ What is wrong? *                     │
│ [ Device display is blank          ] │
│                                      │
│ Impact *                             │
│ ( ) Device is usable                 │
│ ( ) Device is not usable             │
│ ( ) May affect patient care — urgent │
│                                      │
│ [ Add photo ]                        │
│                                      │
│ [ Submit ticket ]                    │
└────────────────────────────────────┘
```

### 9.4 Biomedical Ticket Detail

```text
┌────────────────────────────────────┐
│ BEM-2026-00482        [P1 Critical]│
│ Investigating · Assigned to A. Omar │
├────────────────────────────────────┤
│ Infusion Pump · ICU Room 3          │
│ Reported: display blank              │
│ Impact: device not usable            │
├────────────────────────────────────┤
│ [ Update work status ]               │
│ [ Start corrective maintenance ]     │
├────────────────────────────────────┤
│ Timeline                             │
│ 10:24 Assigned to A. Omar            │
│ 10:13 Priority changed to P1         │
│ 10:09 Reported by Dr. Sara           │
└────────────────────────────────────┘
```

---

## 10. MVP UI/UX Acceptance Criteria

The MVP interface is ready for hospital testing only when:

1. A doctor or staff member can scan a device and report a problem with a short mobile form.
2. The same user can select a device from an authorized department if scanning is unavailable.
3. The scan/device page makes current availability, open-ticket state, and next action clear without scrolling through technical details.
4. Ticket progress is understandable to the reporter through simple public updates and a timeline.
5. Biomedical users can triage, assign, update, and convert tickets to maintenance without re-entering device/report information.
6. Public and internal updates are clearly separated before sending.
7. An administrator can manage users, departments/locations, and device inventory through clear create/edit/archive workflows.
8. Archive/deactivation is the normal removal action; permanent deletion is limited to incorrect empty records.
9. All essential pages work on a 320-pixel-wide phone and a desktop browser.
10. Pages expose clear loading, error, permission, empty, and retry states.
11. User tests with doctors, nurses, technicians, biomedical engineers, and administrators confirm that common tasks are understandable without training notes.

---

## 11. Final Design Principle

> **The user should never wonder which device they are viewing, whether it is available, what action they can take, or where their request is in the workflow.**
