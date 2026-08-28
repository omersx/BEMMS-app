# BEMMS Preventive Maintenance Scheduling, Calibration Expiry, and Alerts

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Maintenance triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) · [Electronic signatures](BEMMS-Electronic-Signatures-and-Traceability.md)
>
> **Related specifications:** [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md) · [Device profiles and QR access](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [Administration policies](BEMMS-Administration-Settings-and-User-Management.md) · [UI/UX design](BEMMS-UI-UX-Design.md)

## 1. Purpose

This document defines the BEMMS preventive-maintenance (PM/PPM), periodic testing, and calibration scheduling system.

It covers how authorized users create and manage recurring schedules for devices; how BEMMS creates due maintenance tasks; how engineers receive alerts; how overdue work is managed; and how completed, signed work automatically updates the trusted device record.

The core lifecycle is:

```text
Maintenance plan
→ Scheduled task
→ Alert / assignment
→ Work, checklist, tests, and signatures
→ Official maintenance record
→ Device profile and next-due date update
```

The central principle is:

> **A schedule creates work to be done. Only a completed and qualifying signed record proves that work was done and updates the official device maintenance history.**

This document complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — product, database, security, notification, and reporting requirements
* `BEMMS-Maintenance-Types-and-Engineer-Triage.md` — maintenance types, stages, technical classification, and engineer decisions
* `BEMMS-Electronic-Signatures-and-Traceability.md` — performer/reviewer/release signatures and immutable records
* `BEMMS-Application-Modules-and-Pages.md` — Maintenance module pages and navigation
* `BEMMS-UI-UX-Design.md` — mobile/desktop interface requirements

---

## 2. Goals

The PM scheduling system must:

1. Allow authorized biomedical users to create, edit, activate, pause, archive, and manage recurring maintenance/calibration plans for devices.
2. Support preventive maintenance, calibration, electrical safety testing, performance testing, and other approved periodic work types.
3. Calculate upcoming due dates reliably and create maintenance tasks early enough for planning.
4. Notify assigned engineers/technicians before due dates, on due dates, and after work becomes overdue.
5. Alert biomedical managers about overdue, critical, or unassigned work based on configurable policy.
6. Provide clear views of upcoming, due, overdue, completed, deferred, and paused work.
7. Support recurring calibration expiry/due-date management and certificate tracking.
8. Link every scheduled task to the correct device, location, checklist, assignee, and signature/review policy.
9. Update device profile maintenance summaries only from completed, qualifying signed records.
10. Preserve all plan changes, task decisions, deferrals, missed work, signatures, and device updates in history and audit records.

---

## 3. Core Terms

| Term | Meaning |
|---|---|
| Maintenance plan | A recurring rule defining what work is due for a specific device and when. It does not prove work was performed. |
| Schedule occurrence | One calculated planned instance of a maintenance plan, such as `PM due 15 Sep 2026`. |
| Maintenance task | An actionable work item created for an occurrence and assigned to a biomedical user/team. |
| Maintenance record | The completed technical record containing work performed, findings, tests, results, and signatures. |
| PM / PPM | Preventive or periodic planned maintenance designed to prevent failure and verify condition. |
| Calibration due date | The date by which calibration must be completed according to the configured interval/policy. |
| Calibration expiry date | The date after which the last valid calibration certificate/result is no longer considered valid, where the hospital uses such a rule. |
| Due soon | Work within the configured alert window but not yet due. |
| Due today | Work due on the current hospital-local date. |
| Overdue | Work not completed by its due date. |
| Deferral | Authorized decision to move a due date, with reason, approval, and audit history. |
| Pause | Temporary suspension of a plan without deleting its history. |
| Archive | End-of-life administrative state for a plan that must retain its history. |

---

## 4. Model: Plan, Task, Record, and Device Profile

BEMMS must treat these as separate connected records:

```text
Device
├── Maintenance plan: repeat every 6 months
│   ├── Scheduled task: due 15 Sep 2026
│   │   └── Signed maintenance record: completed 14 Sep 2026
│   └── Next scheduled task: due 15 Mar 2027
└── Device profile: last PM and next PM derived from qualifying record + active plan
```

### 4.1 Why This Separation Matters

| Record | What it answers | What it must not be used to claim |
|---|---|---|
| Plan | What recurring work is expected and when? | That the work was performed. |
| Task | What work is currently scheduled/assigned/in progress? | That the work was completed successfully. |
| Maintenance record | What technical work, findings, testing, and signatures were completed? | That a future interval is configured, unless tied to a plan. |
| Device profile summary | What is the latest official maintenance/calibration state? | A manually editable substitute for signed maintenance evidence. |

### 4.2 Planned Work Does Not Require a Helpdesk Ticket

Scheduled PM, calibration, electrical safety testing, and periodic performance testing usually begin from a maintenance plan and do not require a helpdesk ticket.

If planned work discovers a fault, the engineer can create a linked corrective-maintenance task and, where required by workflow, a linked ticket. The original scheduled task and new corrective work remain connected in device history.

---

## 5. Supported Periodic Work Types

An organization may configure its own list, but BEMMS should support at least:

| Periodic plan type | Purpose | Typical interval |
|---|---|---|
| Preventive maintenance / PPM | Routine inspection, cleaning, servicing, functional checks, and prevention of failure. | Monthly, quarterly, six-monthly, annually, or custom. |
| Calibration | Verify or adjust measurement accuracy and retain supporting certificate/evidence. | Typically six-monthly, annually, or policy-defined. |
| Electrical safety testing | Perform electrical safety checks and record readings/results. | Annually or policy-defined. |
| Performance/functional testing | Verify defined device performance and functional behavior. | Policy-defined. |
| Periodic inspection | Condition, acceptance, safety, or visual inspection. | Policy-defined. |
| Warranty/service-contract review | Administrative review of warranty or vendor support milestone. | Policy-defined; not necessarily a technical maintenance record. |

Corrective maintenance, troubleshooting, installation/commissioning, and decommissioning can use the same task/record system but normally are not generated by recurring PM plans.

---

## 6. Who Can Manage Plans and Tasks

| Action | Department staff/doctor | Biomedical technician | Biomedical engineer | Biomedical manager | System administrator |
|---|---:|---:|---:|---:|---:|
| View public due/maintenance status on device | Yes, authorized scope | Yes, assigned/authorized scope | Yes | Yes | Authorized inventory scope |
| Create PM/calibration plan | No | Propose only if policy allows | Yes | Yes | Reference-data/admin scope only unless biomedical role |
| Edit plan interval/checklist/assignment | No | No, unless delegated draft | Yes | Yes | Administrative configuration only unless biomedical role |
| Pause/archive plan | No | No | Yes, with reason | Yes | Administrative archive support only unless biomedical role |
| Assign PM task | No | No | Yes | Yes | No automatic technical authority |
| Perform scheduled work | No | Assigned work | Yes | Yes, if performing work | Only with biomedical role |
| Review/release/sign | No | Performer only where permitted | Yes | Yes | Only with biomedical role |
| View due/overdue reports | Department summary only | Assigned work | Authorized scope | Authorized scope | Authorized system/report scope |

All permissions are constrained by organization, hospital, department, device category/criticality, and assigned-work scope.

---

## 7. PM Schedule and Plan Management Pages

The Maintenance module should provide these primary views:

```text
My Tasks | Maintenance Queue | PM Plans | PM Calendar | Due & Overdue | Records
```

### 7.1 PM Plans Page

The PM Plans page is the management list for recurring schedules. It should provide:

* Search by device name, asset number, manufacturer/model, hospital, department, or assigned engineer
* Filters for plan type, status, due date, criticality, checklist, and assignment
* Columns/list data: device, plan type, interval, last qualifying completion, next due date, assigned user/team, plan status, due state
* Quick actions for authorized users: Add plan, edit, assign, pause, resume, archive, view device, and view task history
* Clear warning when a plan is overdue, unassigned, or has no active checklist/signature policy

### 7.2 Add/Edit PM Plan Page

The plan form should be clear and structured rather than a large ungrouped form.

#### A. Device and Work Definition

* Device — selected from authorized inventory; required
* Plan type — PM/PPM, calibration, electrical safety testing, performance testing, inspection, or configured type; required
* Plan title — optional concise local name
* Maintenance/checklist template and version; required when policy requires it
* Device-specific instructions or service notes
* Required documents/reference manuals

#### B. Schedule

* Start/effective date
* Frequency — monthly, every 3 months, every 6 months, annually, or custom days/months
* Schedule calculation method
* First due date or initial baseline date
* Next due date, calculated and previewed before saving
* Hospital timezone
* Grace/overdue policy, if allowed by organization policy

#### C. Ownership and Policy

* Assigned engineer, technician, team, or assignment queue
* Device criticality snapshot
* Required test/checklist
* Required performer/reviewer/release signature policy
* Alert policy and escalation recipients

#### D. Status and History

* Plan state — active, paused, archived
* Pause/archive reason where applicable
* Created/updated by and time
* Plan revision history

### 7.3 PM Calendar Page

The calendar must offer both calendar and list views. It should show:

* Upcoming planned work
* Due today
* Overdue work
* Assigned work
* Completed work
* Calibration expiry dates

On mobile, prioritize an ordered date list with status badges and filter controls; a full month-grid calendar is optional rather than mandatory.

### 7.4 Due & Overdue Page

This is the engineer's operational priority list. It must show:

* Due today
* Due in configured alert windows
* Overdue by number of days
* Unassigned tasks
* Tasks waiting for review or release
* Calibration due/expired items
* Device criticality and current operational status

Filters should include hospital, department, plan type, device category, criticality, assignee/team, task state, due range, and days overdue.

### 7.5 PM Task Detail Page

Every task page must show device context first:

```text
Device name · Asset number
Hospital · Department · Room
Plan type and interval
Due date and due/overdue state
Assigned user/team
Linked ticket, if one exists
```

Then provide sections for:

```text
Task summary | Checklist | Findings/work | Parts & costs | Tests | Attachments | Signatures | History
```

The task must include a clear primary action appropriate to state, such as `Accept task`, `Start work`, `Continue work`, `Sign and submit for review`, or `Review and release device`.

---

## 8. Schedule Calculation Rules

Schedule calculation must be explicit and consistent. Every plan must use one configured calculation method.

### 8.1 Fixed Calendar Schedule

The due date follows the planned calendar cadence, regardless of the actual completion date, subject to approved deferral rules.

Example:

```text
Plan: Every 6 months, due on 15 March and 15 September
Work completed: 10 March
Next due: 15 September
```

Use this method when a hospital must maintain a defined calendar cycle.

### 8.2 Completion-Based Interval

The next due date is calculated from the latest qualifying completed date.

Example:

```text
Plan: Every 6 months
Work completed and signed: 10 March
Next due: 10 September
```

Use this method when the planned interval starts from actual completed work.

### 8.3 Recommended Default

The organization must decide the method for each plan type/category. BEMMS should not silently change the method. A reasonable default is:

* PM/PPM: fixed calendar or organization policy
* Calibration: certificate expiry / fixed validity date where applicable
* Safety/performance testing: fixed calendar or policy-defined

### 8.4 Qualifying Completion

A task advances a schedule only when it meets all configured requirements:

* Required checklist/work fields completed
* Required test results recorded
* Result is eligible to count as completed
* Performer signature completed
* Reviewer/approval/release signature completed when the policy requires it

Draft, cancelled, failed without an authorized resolution, unsigned, rejected, or superseded records must not automatically move the next due date or be presented as successful last maintenance.

### 8.5 Manual Next-Date Override

Only authorized biomedical roles may override the calculated next due date. The override requires:

* New due date
* Reason
* Actor and timestamp
* Required approval signature where policy requires it

The original calculated date and override history must remain visible.

---

## 9. Task Generation and Assignment

### 9.1 Generation Timing

BEMMS should generate or activate a scheduled maintenance task at a configurable planning lead time, for example 30 days before due. This gives managers time to assign work and coordinate device availability.

The task may have a `Scheduled` state until it enters the alert window, then becomes `Due soon`, `Due`, or `Overdue` based on current hospital-local date.

### 9.2 Prevent Duplicate Tasks

For an active plan occurrence, BEMMS must create only one active primary task unless an authorized user intentionally creates linked work. The scheduled task generator must be idempotent: repeated runs must not create duplicate PM tasks or duplicate alerts.

### 9.3 Assignment

Tasks may be assigned:

* Directly to a biomedical engineer
* Directly to a biomedical technician
* To a biomedical team/queue, then accepted by an individual
* Automatically using a configured assignment rule, only when policy and workload data support it

The assignee must see device location, due date, checklist, required testing, and signature/review rules before accepting the task.

### 9.4 Device Access and Scheduling Coordination

If maintenance requires department access or planned downtime, the assigned engineer can set `Waiting for department` and request an access window. This updates the task timeline and sends an authorized public notification without exposing internal technical notes.

---

## 10. Alert and Notification Design

### 10.1 Notification Principles

Alerts must be useful, actionable, and routed only to authorized users. They must identify:

* Device name and asset number
* Hospital/department/location
* Plan/task type
* Due date or expiry date
* Current urgency, such as `Due in 7 days` or `Overdue by 3 days`
* Assigned user/team where relevant
* Direct link to the authorized task/device page

The alert must not reveal restricted patient, technical, or internal-note data.

### 10.2 Recommended Alert Schedule

Each organization can configure alert windows by plan type and device criticality. A recommended initial pattern is:

| Trigger | Recipient | Suggested action |
|---|---|---|
| 30 days before due/expiry | Assigned engineer/team and manager digest | Plan/assign work. |
| 14 days before due/expiry | Assignee/team | Confirm schedule and device access. |
| 7 days before due/expiry | Assignee/team | Start/complete planning. |
| 1 day before due/expiry | Assignee/team and, for critical devices, manager | Prioritize work. |
| Due today | Assignee/team | Complete or defer through authorized workflow. |
| Overdue | Assignee/team and manager according to criticality | Escalate, reschedule, or document deferral. |
| Calibration expired | Assignee/team and manager; critical-device escalation by policy | Urgent assessment and policy-defined availability action. |
| Awaiting review/release | Required reviewer/release authority | Review and complete approval. |

In-app notifications are required for the MVP. Email, push, SMS, or external messaging may be added later only after hospital policy, contact-data protection, and delivery reliability are addressed.

### 10.3 Notification Center

The Notification Center must group alerts by:

* New
* Due soon
* Due today
* Overdue
* Calibration expiry
* Awaiting my review/release
* Completed/cleared

Users can mark an alert read, but this does not complete, defer, or dismiss the underlying maintenance task.

### 10.4 Reminder De-duplication and Escalation

The system records each notification event. It must not repeatedly send the same alert every time the scheduler runs. Escalation frequency and recipients must be configurable. When a task is completed, cancelled, paused, or validly deferred, obsolete reminder sequences stop.

---

## 11. Calibration Expiry Management

Calibration requires special attention because the measured/calibrated validity may depend on a certificate, external provider, or defined validity period.

### 11.1 Calibration Plan Fields

In addition to standard plan fields, calibration plans should store:

* Calibration method/procedure
* Required standard/reference, where policy allows
* Certificate required: yes/no
* Certificate number
* Certificate issue date
* Calibration completed date
* Calibration validity/expiry date
* Next planned calibration date
* External vendor/provider, where applicable
* Tolerance/pass-fail outcome

### 11.2 Expiry Versus Due

These values are related but distinct:

| Value | Meaning |
|---|---|
| Next calibration due | Planned date by which BEMMS expects a new calibration task to be completed. |
| Calibration expiry | Date on which the previous calibration is no longer valid under the certificate/policy. |

The calibration task should normally be scheduled early enough to finish before expiry. If due and expiry differ, the device profile must show both clearly.

### 11.3 Expired Calibration

When calibration expires, BEMMS must:

1. Mark calibration status as `Expired`.
2. Create/escalate the required notification sequence.
3. Show a clear warning on the device profile to authorized users.
4. Require an authorized biomedical decision about device availability, according to hospital policy.
5. Preserve the prior certificate and expiry evidence in history.

BEMMS must not automatically set every expired-calibration device to `Out of service` unless the organization policy explicitly defines that behavior for the applicable device/category.

---

## 12. Due, Overdue, Deferral, and Missed Work

### 12.1 Due State

| State | Definition |
|---|---|
| Scheduled | Task exists but has not entered the configured alert window. |
| Due soon | Current date is inside alert window but before due date. |
| Due today | Current hospital-local date equals due date. |
| Overdue | Due date has passed without qualifying completion, approved deferral, or valid cancellation. |
| In progress | Assignee has started work; due state remains visible separately. |
| Awaiting review/release | Performer work is complete but required approval is pending. |
| Completed | Qualifying completion/signatures are complete. |
| Deferred | An authorized user approved a new due date and reason. |
| Cancelled | Work is no longer applicable; a reason and authorized decision are recorded. |

### 12.2 Deferral Workflow

Deferral is not a casual date edit. It requires:

```text
Select task
→ Request deferral
→ Enter reason, proposed new date, and risk/availability note
→ Required approver reviews, if policy requires
→ New due date becomes active
→ Original due date, reason, approver, and audit history remain visible
```

The system must prevent a user from hiding overdue work by repeatedly changing dates without a traceable authorized deferral.

### 12.3 Missed or Cancelled PM

If work cannot be completed, record the actual outcome such as `Deferred`, `Cancelled`, `Unable to access device`, `Vendor delay`, or `Device decommissioned`. Do not mark the task `Completed` unless qualifying work was actually performed.

---

## 13. Automatic Device Profile Updates

### 13.1 Authoritative Source

Device maintenance summary values must be derived from the latest qualifying completed and signed maintenance/calibration record—not manually typed into the device profile.

The device profile displays derived values such as:

```text
Last preventive maintenance
Completed by: Ahmed Omar, Biomedical Technician
Signed and reviewed: 26 Aug 2026, 14:32 UTC+3
Result: Passed
Next PM due: 26 Feb 2027

Calibration
Status: Valid
Completed by: Fatima Ali, Biomedical Engineer
Certificate: CAL-2026-0189
Expires: 15 May 2027
```

### 13.2 Fields Updated After Qualifying Completion

When a completed maintenance task meets its required policy, BEMMS must update or derive:

| Device profile field | Source/behavior |
|---|---|
| Last maintenance date | Completion date of latest qualifying maintenance record of the relevant type. |
| Last maintenance type | Signed record type: PM, corrective, calibration, safety test, etc. |
| Last maintenance performed by | Performer signature/user from qualifying record. |
| Last maintenance reviewed/released by | Required reviewer/release signature(s), if applicable. |
| Last maintenance result | Signed final result: passed, failed, passed with recommendations, etc. |
| Next PM due date | Active PM plan calculation after qualifying completion or approved override. |
| Calibration completed date | Latest qualifying calibration record. |
| Calibration certificate/expiry | Signed calibration record/certificate validity fields. |
| Current device status | Updated only by an authorized device-status decision/release workflow, not merely by task completion. |
| Device history | New linked maintenance, task, signature, status, and audit events. |

### 13.3 Work That Does Not Update Official Summary

The following must not replace official last-maintenance/calibration values or advance schedules automatically:

* Draft work
* Incomplete checklists
* Unsigned performer work
* Work awaiting required review/release
* Rejected work
* Cancelled work
* Failed work without an approved eligible completion rule
* Superseded/voided records

### 13.4 Failed or Exception Results

If PM, calibration, or testing fails:

* Preserve the result in maintenance and device history.
* Create/link corrective work or ticket when required.
* Show the appropriate availability warning and status decision.
* Do not show the device as successfully maintained or calibrated.
* Do not advance the schedule unless an authorized policy explicitly defines an eligible partial/exception outcome.

### 13.5 Transactional Update Rule

When a qualifying record is completed, BEMMS must use a server-side transaction to create/confirm the signed record, update permitted schedule state, refresh derived device summary values, create history/audit events, and queue notifications. If any part fails, the system must not leave partially updated device history or next-due values.

---

## 14. Device Profile and User Views

### 14.1 Staff/Doctor Device View

Staff see a simplified maintenance summary:

* Current availability/status
* Whether maintenance is in progress, due, or overdue where policy permits
* Last/next PM date summary
* Calibration status/expiry summary where policy permits
* Public maintenance/ticket progress
* Report problem/request maintenance actions

They do not automatically see internal checklists, technical readings, costs, root cause, restricted certificates, or internal notes.

### 14.2 Biomedical Device View

Biomedical users see the full authorized maintenance profile:

* Active plans and next occurrences
* Due/overdue task status
* Plan revisions, deferrals, and assignment history
* Checklists, findings, tests, parts, costs, calibration evidence, and certificates
* Signature/review/release status
* Corrective work linked to planned tasks
* Full device maintenance timeline

### 14.3 Manager View

Managers see cross-device exception summaries:

* Due/overdue counts
* Critical devices with uncompleted PM/calibration
* Unassigned work
* Work awaiting review/release
* Completion compliance by hospital/department/category/team
* Deferral and missed-work trends

---

## 15. Data Model Requirements

The final database may use different physical names, but it must preserve these logical records.

### 15.1 `maintenance_plans`

* Plan ID
* Device ID
* Organization/hospital/department/location scope snapshot
* Plan type and title
* Active checklist/procedure version
* Schedule calculation method — fixed calendar or completion-based
* Frequency/unit and baseline/effective date
* Next due date and last qualifying completion reference
* Alert policy/version
* Assigned user/team/queue
* Signature/review/release policy
* Plan status — active, paused, archived
* Pause/archive reason and actor
* Created/updated/revision audit data

### 15.2 `maintenance_schedule_occurrences`

* Occurrence ID
* Plan ID
* Planned due date
* Planned date window/start date where used
* Current due state
* Generated task ID
* Original due date and current due date
* Deferral/cancellation state and reference
* Completion record reference, when qualifying work completes

### 15.3 `maintenance_tasks`

* Task ID and occurrence ID, where scheduled
* Device ID and linked ticket ID, if any
* Maintenance type and current work stage
* Assignee/team and assignment timestamps
* Due date/state and planned work window
* Checklist, testing, document, and signature requirements
* Start/completion timestamps
* Waiting/deferral/cancellation/no-fault reasons
* Link to resulting maintenance record

### 15.4 `maintenance_records`

* Completed task reference
* Work/finding/checklist/test details
* Final result and device-status decision reference
* Parts/vendor/labor cost information where enabled
* Calibration certificate, validity, and expiry data where applicable
* Performer/reviewer/release signatures
* Signed record version, amendment, and audit references

### 15.5 `maintenance_notification_events`

* Notification event ID
* Plan/occurrence/task reference
* Trigger type — due soon, due today, overdue, calibration expiry, review required, etc.
* Recipient user/team/role
* Delivery channel and delivery status
* Created/sent/read timestamps
* Idempotency key to prevent duplicate alerts

### 15.6 Essential Constraints and Indexes

* One active plan per device/type/checklist scope where organization policy requires it.
* One primary active scheduled task per occurrence.
* Due dates and intervals must be valid for the configured schedule method.
* Only authorized users can alter plan, deferral, assignment, or completion state.
* Index active plans/tasks by device, hospital, department, plan type, due date, overdue state, assignee, and criticality.
* Index calibration expiry for timely alert processing.
* Preserve plan/task history when plans are paused or archived.

---

## 16. Notifications, Background Jobs, and Reliability

### 16.1 Scheduled Processing

A server-side scheduled job must evaluate plans, occurrences, task state, due dates, calibration expiry, and alerts using the configured hospital timezone. It should:

1. Generate planned occurrences/tasks within the configured planning window.
2. Update due-state visibility based on current date/time.
3. Create only missing, valid notification events.
4. Escalate according to plan/device criticality policy.
5. Stop obsolete alerts after completion, authorized deferral, cancellation, pause, archive, or decommissioning.

### 16.2 Architecture

PostgreSQL remains the system of record. The initial implementation may run scheduled processing in the self-hosted application environment. Optional Redis plus BullMQ can later provide reliable distributed job queues, retry handling, notification delivery, and scaling.

No alert is considered permanently sent merely because a background worker started it; notification delivery state must be recorded in PostgreSQL-backed application records.

### 16.3 Timezone Rules

Store all timestamps in UTC, but calculate and display maintenance due dates and alert boundaries using the configured hospital timezone. Every report/export should show the timezone used.

---

## 17. Reports and Statistics

The Reports module should support:

* PM completion rate by hospital, department, device category, criticality, assignee, and period
* Due, overdue, deferred, cancelled, and completed work counts
* Days overdue and aging of overdue maintenance
* Calibration valid/due soon/expired status
* Safety/performance testing compliance
* Unassigned work and work awaiting review/release
* PM plan coverage — devices missing required plans
* Deferral reasons and repeated deferrals
* Maintenance workload by engineer/technician and plan type
* Corrective work discovered during PM/calibration
* Maintenance costs by planned-work type, device, department, and period

Reports must distinguish:

* Scheduled work from qualifying completed work
* Due date from calibration certificate expiry
* Work performed from work awaiting signature/review/release
* Fixed-calendar compliance from completion-based schedule intervals

---

## 18. UI/UX Requirements

### 18.1 Engineer Daily Experience

An engineer should be able to follow this path quickly:

```text
Notification
→ Due & Overdue list
→ Open assigned task
→ Review device context and checklist
→ Perform work and tests
→ Sign/submit for review
→ See next due date and updated device record
```

### 18.2 Mobile Requirements

* Large `Accept task`, `Start work`, `Continue work`, and signing buttons
* Due/overdue state visible in the task header
* Device location and asset number visible without navigating away
* Checklist supports one-tap result selection with notes/attachments
* Save draft/progress during field work
* Clear indication when work is awaiting review/release rather than fully completed
* Calendar may collapse to a chronological task list on phone screens

### 18.3 Plan Editing Safety

Editing a plan must show the impact before saving, especially when interval, due date, checklist, or signature policy changes. The UI should state whether the change affects an existing upcoming task. Significant changes require a reason and create a plan revision event.

### 18.4 Archive Rather Than Delete

The normal removal action is `Pause` or `Archive`, not permanent deletion:

* **Pause:** temporarily suspend new task/alert generation; preserve current/history data.
* **Archive:** retire a plan when device/service need ends; preserve history.
* **Permanent deletion:** allowed only for an erroneous plan with no generated task, record, notification, or audit history, and only through an authorized confirmed workflow.

---

## 19. Security, Audit, and Electronic Signatures

The system must audit:

* Plan creation, activation, edits, pause/resume, archive, and deletion where allowed
* Frequency, due date, calculation-method, alert-policy, checklist, and signature-policy changes
* Task generation, assignment, acceptance, deferral, cancellation, and completion
* Due/overdue/calibration-expiry escalations
* Device summary updates derived from completed records
* Calibration certificate upload, replacement, expiry, and validity actions
* Performer, reviewer, approval, and release signatures

Completion of PM, calibration, safety, and performance work must follow the applicable electronic-signature policy. A device cannot be shown as officially maintained/calibrated from draft or unsigned work when policy requires signatures.

---

## 20. Important Special Cases

### 20.1 Device Is Decommissioned or Archived

When a device is decommissioned/archived, active plans should be paused or archived through an authorized workflow. The system must stop future routine alerts while preserving all historical records. The device profile remains traceable and displays unavailable/decommissioned status.

### 20.2 Device Is Moved

When device location changes, future tasks and alerts use the new authoritative location. Existing tasks retain a location snapshot and indicate when the device has moved, so engineers can avoid going to the wrong room.

### 20.3 Task Is Started but Becomes Overdue

Keep both states visible: `In progress` and `Overdue by 2 days`. Starting work does not silently remove an overdue alert. The engineer/manager must complete, defer, or document the reason under policy.

### 20.4 Completed Work Is Later Amended or Voided

If a qualifying signed record is amended, superseded, or voided, BEMMS must reevaluate derived device summary values and schedule state through an authorized transaction. The old history remains visible. The system must not silently retain an invalid record as the official last maintenance/calibration.

### 20.5 Duplicate Device or Duplicate Plan

Administrators/engineers should search for existing active plans before creating a new one. The system should warn about potentially duplicate plan types for the same device and require authorized confirmation/reason if duplicates are permitted.

---

## 21. MVP Acceptance Criteria

The PM scheduling and alert feature is ready for hospital testing only when:

1. An authorized biomedical user can create an active PM/PPM or calibration plan for a device with interval, due date, assignment, checklist, and signature policy.
2. BEMMS calculates and displays the next due date using the plan's configured calculation method.
3. BEMMS generates one actionable scheduled task per occurrence without duplicate tasks.
4. Assigned engineers/technicians receive in-app alerts before due dates, on due dates, and when tasks are overdue.
5. Calibration due/expiry alerts appear in authorized notifications and device views.
6. Engineers/managers can view/filter due, overdue, unassigned, and awaiting-review work by authorized hospital/department/device scope.
7. A PM/calibration task displays device context, due state, checklist, findings, tests, attachments, and signature status.
8. Completing qualifying signed work automatically updates derived device maintenance/calibration summaries and calculates the correct next due date.
9. Draft, unsigned, rejected, cancelled, or non-qualifying work does not update official last-maintenance/calibration values or silently advance schedules.
10. Failed PM/calibration/testing results preserve evidence, create required follow-up work, and do not incorrectly show the device as successfully maintained.
11. Deferrals, plan edits, pauses, archives, assignments, alerts, completion, signatures, and device summary updates are audit logged.
12. Plan archive/pause preserves history; permanent deletion is restricted to erroneous empty records.
13. Device profile, maintenance history, dashboards, notifications, and reports consistently show the same authorized maintenance state.
14. Due/expiry calculation respects the hospital timezone and reports display the timezone used.

---

## 22. Recommended Delivery Sequence

### Phase 1 — PM Plans and Tasks

* Maintenance plan data model and authorized plan editor
* PM/PPM and calibration plan types
* Fixed-calendar and completion-based due-date calculation
* Planned task generation, assignment, and due/overdue lists
* Basic in-app due/overdue notifications

### Phase 2 — Completion and Device Updates

* PM task/checklist workflow
* Signed qualifying maintenance records
* Automatic derived device last/next maintenance fields
* Device history and report integration

### Phase 3 — Calibration and Escalation

* Certificate, validity, and expiry support
* Calibration due/expired alerts and policy-defined availability workflow
* Deferral approval and escalation rules
* Manager compliance dashboards

### Phase 4 — Advanced Planning and Reporting

* Safety/performance periodic plans
* Plan revision impact previews and policy management
* Redis/BullMQ-backed scheduled notification scaling where required
* Advanced compliance/cost/aging/deferral reports and official exports

---

## 23. Final Recommendation

Make the PM Schedule page the operational planning center for biomedical teams, not merely a place to type dates.

> **Plans define what should happen. Alerts bring work to the right engineer. Signed maintenance proves what happened. The device profile always reflects the latest qualifying result and the next required action.**
