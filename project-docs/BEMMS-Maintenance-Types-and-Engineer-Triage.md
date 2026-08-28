# BEMMS Maintenance Types and Engineer Triage

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Electronic signatures](BEMMS-Electronic-Signatures-and-Traceability.md)
>
> **Related specifications:** [PM scheduling](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md) · [Role-based device profiles](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [UI/UX design](BEMMS-UI-UX-Design.md)

## 1. Purpose

This document defines how BEMMS classifies maintenance work and who selects that classification.

The key decision is:

> **Doctors and department staff report what they observe. Biomedical engineers decide the technical maintenance type, diagnosis, work plan, and final device decision.**

This keeps reporting simple for hospital staff, preserves the original problem statement, and gives biomedical teams accurate technical data for maintenance records, signatures, history, costs, and reliability reports.

This document complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — core BEMMS product requirements
* `QR-Helpdesk-Ticketing-Workflow.md` — ticket reporting, triage, and work tracking
* `BEMMS-Application-Modules-and-Pages.md` — modules and maintenance pages
* `BEMMS-Electronic-Signatures-and-Traceability.md` — signing, approval, and release accountability
* `BEMMS-Role-Based-Device-Profiles-and-QR-Access.md` — device context and role-specific access

---

## 2. Why Classification Must Be Separated

Words such as **broken device**, **faulty device**, **device error**, and **display problem** describe what a user sees. They do not reliably identify the correct technical work needed.

For example:

```text
Staff report: "The infusion-pump display is blank."

Biomedical engineer decision:
Maintenance type: Corrective maintenance
Problem category: Display / electrical
First work stage: Troubleshooting
Final diagnosis: Failed display power board
Repair action: Replace approved power board
Verification: Functional and electrical safety testing
Final device decision: Released to Operational after review
```

The user report remains unchanged. The engineering classification is added as a separate traceable decision.

---

## 3. Four-Layer Work Model

BEMMS must store four distinct layers. They must not be merged into one ambiguous field.

```text
1. Reporter information
   What did the reporter observe or request?

2. Engineer triage classification
   What type of biomedical work is appropriate?

3. Work stage and technical execution
   What is happening now: diagnosing, repairing, waiting, testing, reviewing?

4. Device availability decision
   Is the device operational, limited, under maintenance, out of service, or decommissioned?
```

| Layer | Selected by | Examples | Must preserve history? |
|---|---|---|---|
| Reporter information | Doctor, nurse, department staff, or biomedical reporter | `Display blank`, `Alarm sounds`, `Please inspect device`, `Device not usable` | Yes; never overwrite the original statement. |
| Engineer triage classification | Authorized biomedical engineer/manager | `Corrective maintenance`, `Calibration`, `Inspection`, `Troubleshooting` | Yes; changes require reason/audit event. |
| Work stage | Assigned technician/engineer, subject to workflow | `Investigating`, `Repairing`, `Waiting for parts`, `Testing` | Yes; timeline records transitions. |
| Device availability decision | Authorized biomedical engineer/manager | `Operational`, `Under maintenance`, `Out of service`, `Decommissioned` | Yes; status history and signatures when required. |

---

## 4. Responsibilities

### 4.1 Doctors and Department Staff

Department users should use simple, non-technical reporting language. They can:

* Scan or select a device
* Describe the observed problem or service need
* Select impact: `Device is usable`, `Device is not usable`, or `May affect patient care — urgent`
* Add photo/video and contact information
* Track public ticket progress
* Add observations when requested

They must not be required to select corrective maintenance, calibration, electrical safety testing, technical fault categories, root cause, or final device status.

### 4.2 Biomedical Technician

Technicians can:

* Accept assigned work
* Perform troubleshooting, repair, PPM, calibration, inspection, or tests assigned under the work plan
* Record findings, checklists, parts, measurements, work performed, and test results
* Update work stage
* Sign performed work when authorized
* Request review or escalation

Technicians may propose a classification or diagnosis, but the final maintenance-type decision and technical release authority remain controlled by the configured role policy.

### 4.3 Biomedical Engineer

The biomedical engineer is responsible for technical triage. They can:

* Review original ticket/report and device history
* Select or revise maintenance type and technical problem category
* Set priority, work plan, and assignee
* Decide whether the first stage is troubleshooting/diagnosis
* Create/convert a ticket into one or more maintenance tasks
* Confirm diagnosis and root cause
* Review technician work
* Sign/approve/release device status according to signature policy
* Reclassify work with a reason when evidence changes

### 4.4 Biomedical Manager

The biomedical manager can provide authorized triage/approval oversight, assign work, approve exceptions, configure classification policies, and review performance/reliability data. The manager does not replace the performer or reviewer accountability recorded on each maintenance record.

### 4.5 System Administrator

The system administrator manages reference data such as maintenance-type lists, problem categories, devices, users, departments, and access policies where authorized. They do not automatically choose a technical maintenance type, sign maintenance, approve testing, or release a device unless separately assigned an appropriate biomedical role.

---

## 5. Ticket Categories for Reporters

The reporter form should remain short. The user may choose a simple observed problem category, but it is not the final technical classification.

| Reporter category | Examples |
|---|---|
| Device will not power on | No power, battery will not charge, unexpected shutdown. |
| Device will not start | Device fails to begin normal operation. |
| Display or interface problem | Blank display, touchscreen/button issue, unreadable screen. |
| Alarm problem | Unexpected alarm, alarm not working, alarm message. |
| Sensor/accessory problem | Sensor disconnected, probe/accessory missing or faulty. |
| Electrical concern | Cable damage, electrical smell, power fluctuation. |
| Mechanical/physical damage | Broken wheel, case damage, loose component. |
| Software/configuration problem | Error message, login/configuration issue, abnormal software behavior. |
| Performance concern | Inaccurate reading, low performance, unstable output. |
| Maintenance/inspection request | Routine check, service, or inspection request. |
| Other | Free-text observation. |

The reporter impact is separate from category and must remain visible to the triage engineer:

* Device is usable
* Device is not usable
* May affect patient care — urgent

---

## 6. Engineer-Selected Maintenance Types

The maintenance type is selected or confirmed by an authorized biomedical engineer during triage. The list must be configurable by organization, but the following types are recommended.

| Maintenance type | When the engineer selects it | Typical output |
|---|---|---|
| Preventive maintenance / PPM | Scheduled recurring maintenance intended to prevent failure. | Completed checklist, findings, test result, next due date, signed record. |
| Corrective maintenance | A reported or identified fault requires repair, replacement, adjustment, or correction. | Diagnosis, root cause, repair action, parts, tests, final device status. |
| Troubleshooting / diagnostic inspection | The fault cause is not yet known and investigation is required before a repair decision. | Diagnostic findings, decision to repair/escalate/no fault found, or converted/linked corrective work. |
| General inspection | A condition, acceptance, safety, or periodic inspection is needed without a known repair requirement. | Inspection checklist/result and recommendations. |
| Calibration | Measurement accuracy must be verified or adjusted. | Measurements, tolerance result, certificate/reference, next calibration date. |
| Electrical safety testing | Required electrical safety measurements/checks are performed. | Test readings, pass/fail result, corrective action if failed. |
| Performance/functional testing | The device must be tested for expected operational performance. | Test procedure, readings/observations, pass/fail result. |
| Installation / commissioning | A new or relocated device must be installed, accepted, configured, and verified. | Installation checklist, initial tests, acceptance/release record. |
| Software/configuration work | Approved software update, configuration, firmware, network, or settings work is needed. | Version/configuration record, backup/rollback evidence, test result. |
| Decommissioning | A device is permanently removed from service. | Reason, disposition, required approvals, final decommissioned status. |

### 6.1 Important Distinction: Troubleshooting and Corrective Maintenance

Troubleshooting is normally the **diagnostic work stage or initial maintenance task** used to find the fault. Corrective maintenance is the **repair-oriented maintenance type** used when the device requires correction.

BEMMS should support either workflow based on hospital preference:

```text
Option A — One corrective task with troubleshooting stage
Corrective maintenance
→ Troubleshooting
→ Repairing
→ Testing

Option B — Diagnostic task followed by corrective task
Troubleshooting/diagnostic inspection
→ Diagnosis confirmed
→ Linked corrective maintenance task
→ Repairing and testing
```

Option A is simpler and recommended for most repairs. Option B is useful when diagnosis and repair require separate approvals, teams, vendors, or cost control.

### 6.2 Important Distinction: Fault and Maintenance Type

The following are fault/symptom categories, not final maintenance types:

* Faulty/broken device
* Device error
* Display problem
* Electrical issue
* Alarm issue
* Mechanical damage
* Sensor problem
* Software error

For example, `Broken display` becomes a reporter/technical problem category. The engineer may select `Corrective maintenance` as the maintenance type and `Troubleshooting` as the first work stage.

---

## 7. Corrective-Maintenance Technical Categories

When the engineer selects **Corrective maintenance**, they should also select an authorized technical category. These values drive reliability reporting and repeat-failure analysis.

| Technical category | Examples |
|---|---|
| Electrical/power | Power supply, battery, cable, fuse, charging, grounding issue. |
| Display/user interface | Screen, touchscreen, buttons, indicators, user controls. |
| Alarm/safety function | Alarm threshold, audible/visual alarm, safety interlock. |
| Sensor/measurement | Sensor, probe, transducer, inaccurate measurement. |
| Mechanical | Housing, wheel, pump, motor, connector, moving component. |
| Software/configuration | Application, firmware, configuration, data communication. |
| Performance/output | Output instability, flow/pressure/temperature/performance concern. |
| Accessory/consumable | Cable, probe, battery, adapter, disposable interface. |
| Physical damage | Impact, liquid damage, cracked enclosure, damaged port. |
| Communication/network | Network, interface, integration, communication port. |
| No fault found | Investigation did not reproduce/confirm a fault. |
| Other | Requires a clear engineer-entered explanation. |

The engineer may select more than one category only when necessary. The primary category must be recorded for reporting consistency.

---

## 8. Engineer Triage Workflow

### 8.1 From Ticket to Technical Decision

```text
Ticket reported from QR scan or department device selection
→ Biomedical engineer reviews report, impact, device status, active work, and history
→ Engineer confirms/changes ticket priority
→ Engineer chooses maintenance type and technical category
→ Engineer decides initial device availability action, if qualified
→ Engineer assigns technician/engineer or performs work
→ BEMMS creates linked maintenance task(s)
```

### 8.2 Required Triage Information

Before sending work, the triage engineer should record:

* Selected maintenance type
* Technical problem category, where applicable
* Priority and reason for change if reporter impact/priority is revised
* Assigned technician/engineer/team
* Work plan or first required action
* Whether the device is operational, limited, under maintenance, or out of service
* Required test/review/release policy
* Linked ticket and relevant device history

### 8.3 Triage UI

The ticket detail page should include a controlled **Biomedical Triage** panel:

```text
Reporter observation and impact (read-only original)

Maintenance type *
Technical category
Priority *
Device availability decision
Assign to
Required testing
Required signatures/review
Internal triage note

[ Create maintenance task ]
```

The original report remains visible beside or above the engineer decision; it must not be replaced by the engineering classification.

---

## 9. Work Stages and Task Statuses

Work stages track the current progress of a maintenance task. They are independent from maintenance type.

```text
Scheduled / Created
→ Assigned
→ Accepted
→ Investigating / Troubleshooting
→ Repairing / Performing maintenance
→ Waiting for requester / parts / vendor
→ Testing
→ Awaiting performer signature
→ Awaiting review/approval
→ Awaiting release, if required
→ Completed
```

Other controlled outcomes:

```text
Cancelled
No fault found
Escalated to vendor
Converted/linked to another maintenance task
```

### 9.1 Stage Rules

* An assignee records active work stages and technical evidence.
* A technician cannot mark a task complete if required checklist results, test data, or signatures are missing.
* A task cannot release a device to Operational until the signature/review policy is satisfied.
* Waiting stages require an explanatory note and, where useful, a public update to the reporter.
* `No fault found` requires recorded diagnostic steps and an authorized device-status decision.
* Changes to maintenance type after work begins require a reason and appear in the ticket/maintenance history.

---

## 10. Device Availability Decisions

Maintenance work progress and device status are linked but not identical.

| Situation | Possible maintenance stage | Possible device status |
|---|---|---|
| Ticket received but not assessed | New/Triaged | Operational, Requires inspection, or Reported problem. |
| Engineer is diagnosing | Troubleshooting | Under investigation, Operational with limitations, or Out of service. |
| Repair is being performed | Repairing | Under maintenance or Out of service. |
| Waiting for part/vendor | Waiting for parts/vendor | Waiting for spare parts, Under maintenance, or Out of service. |
| Testing completed | Testing/Awaiting review | Requires inspection or Under maintenance until release. |
| Work approved/released | Completed | Operational or Operational with limitations, with a documented reason. |

Creating a ticket or selecting corrective maintenance must not automatically set a device to Out of service. An authorized biomedical user makes that decision based on assessment and hospital policy.

---

## 11. Maintenance-Type Workflows

### 11.1 Preventive Maintenance / PPM

```text
Plan identifies device as due
→ Engineer/manager assigns task
→ Technician accepts work
→ Checklist and service work completed
→ Findings/tests recorded
→ Performer signs
→ Reviewer/release signature if required
→ Record completed and next due date calculated
```

The task includes the maintenance plan, frequency, checklist version, due date, and any device-specific notes.

### 11.2 Corrective Maintenance

```text
Ticket or engineer finding
→ Engineer selects Corrective maintenance
→ Diagnose/troubleshoot
→ Repair/replace/adjust
→ Record root cause, work, parts, and costs
→ Perform required functional/safety test
→ Performer signature
→ Review/release if required
→ Ticket resolved and device history updated
```

### 11.3 Troubleshooting / Diagnostic Inspection

```text
Ticket or concern
→ Engineer selects Troubleshooting
→ Reproduce/inspect/test fault
→ Record diagnostic findings
→ No fault found, linked corrective task, calibration, inspection, vendor escalation, or release decision
```

### 11.4 Calibration

```text
Calibration due/request
→ Engineer selects Calibration
→ Record standard/reference and required measurements
→ Record before/after values and tolerance result
→ Attach certificate where applicable
→ Sign/review according to policy
→ Set next calibration date and device status
```

### 11.5 Electrical Safety and Performance Testing

```text
Testing task created
→ Run approved test procedure
→ Record readings/results
→ Pass/fail determination
→ Corrective work if failed
→ Performer/reviewer signatures where required
→ Device release decision
```

### 11.6 Installation / Commissioning

```text
New/relocated device
→ Installation and setup
→ Acceptance/functional/safety checks
→ Initial device record/location verification
→ Commissioning signature/review
→ Device made Operational if approved
```

### 11.7 Decommissioning

```text
Authorized decommissioning decision
→ Reason and disposition recorded
→ Required data/documents retained
→ Approvals/signatures completed
→ Device status changed to Decommissioned/Archived
→ QR remains safely resolvable to unavailable state or is revoked under policy
```

---

## 12. Reclassification and Multiple Tasks

### 12.1 Reclassification

Evidence may change the engineer's initial decision. BEMMS must permit reclassification while preserving the initial decision and reason.

Example:

```text
Initial triage: Troubleshooting / Diagnostic inspection
Finding: Calibration drift outside tolerance
Reclassification: Calibration
Reason: Fault was measurement drift, not a repairable electrical failure.
```

Each reclassification creates a timeline/audit event with previous type, new type, actor, date/time, and reason.

### 12.2 Multiple Linked Tasks

One ticket may require multiple maintenance tasks:

```text
Ticket: Device error
├── Troubleshooting task
├── Corrective maintenance task
└── Electrical safety test task
```

Tasks remain linked to the original ticket and device. The ticket cannot be resolved until the engineer confirms that all required linked work is complete or explicitly cancels/defers the work with a reason.

### 12.3 Planned Work Without a Ticket

Preventive maintenance, routine calibration, and planned inspections may begin from a maintenance plan without a helpdesk ticket. They still appear in the device history and use the same task, record, signature, and release rules.

---

## 13. Data Model Requirements

### 13.1 Ticket Fields

* Original reporter description and attachments
* Reporter category and impact
* Triage priority and priority-change reason
* Engineer-selected maintenance type
* Engineer-selected technical category and primary category
* Triage decision, triage engineer, and timestamp
* Linked maintenance task(s)

### 13.2 Maintenance Task Fields

* Task ID and device ID
* Linked ticket ID, if any
* Maintenance type and current work stage
* Technical category/diagnosis/root cause
* Work plan and checklist template/version
* Assigned engineer/technician/team
* Required testing, reviewer, approval, and release policy
* Scheduled/start/completion timestamps
* Waiting/cancellation/no-fault reason where applicable
* Signature status and references

### 13.3 Maintenance Record Fields

* Completed task reference
* Original/selected maintenance type and reclassification history
* Work performed, findings, root cause, parts, costs, and attachments
* Test results, final result, recommendation, and next due date
* Previous and final device status
* Performer/reviewer/release signatures
* Signed record version and amendment history

### 13.4 Reference Data Administration

Administrators may manage the approved maintenance-type and category lists, but changes must be versioned and audit logged. Existing records retain the label/version that was valid when they were created; renaming a category must not rewrite historical meaning.

---

## 14. Reporting and Statistics

Engineer-selected maintenance types and technical categories enable accurate reports. The Reports module should support:

* Corrective, preventive, calibration, inspection, and testing workload by period
* Most frequent corrective-maintenance categories by device/category/department
* Breakdown trends by reporter symptom versus confirmed technical category
* No-fault-found rate and repeat-failure rate
* Time from ticket report to triage, task start, testing, release, and closure
* Maintenance cost by maintenance type and technical category
* PPM/calibration/safety-test completion and compliance
* Engineer/technician work by type, priority, device criticality, and signature/review status

Reports must clearly label whether they use reporter categories, engineer-confirmed categories, or both.

---

## 15. UI/UX Requirements

### 15.1 Reporter UI

The reporter sees simple terms:

```text
What is the problem?
How does it affect use of the device?
Add photo or note
```

The reporter does not see an engineering-maintenance type selector.

### 15.2 Engineer UI

The engineer sees a concise technical triage form with:

```text
Maintenance type
Technical category
Priority
Device availability decision
Assign work to
Required checklist/test
Required signature/review/release policy
Internal triage note
```

If the maintenance type changes, BEMMS asks for a reason and shows the prior value in history.

### 15.3 Technician UI

The technician sees the engineer-selected task type, work plan, current stage, checklist, testing requirements, and signature requirements. The screen must state whether the task is awaiting review/release after performer completion.

---

## 16. Security, Audit, and Signatures

* Only authorized biomedical roles can select or change technical maintenance type, technical category, diagnosis, root cause, device availability, or release status.
* The original reporter statement remains immutable except for permitted addenda/comments.
* Triage decisions, reclassifications, stage changes, diagnosis, work records, device-status changes, and signature actions are audit logged.
* Signed maintenance records follow the electronic-signature policy; they cannot be silently edited.
* An amendment or reclassification after signing requires reason, new record version, and required signatures/review.
* The server enforces allowed transitions and scopes; frontend controls are not the authorization boundary.

---

## 17. MVP Acceptance Criteria

The maintenance-classification feature is ready for hospital testing when:

1. Staff can report a problem or request service without selecting a technical maintenance type.
2. The original reporter description, category, impact, attachments, and time remain visible and unchanged after triage.
3. An authorized biomedical engineer can select maintenance type, technical category, priority, assignee, work plan, and device availability decision.
4. BEMMS supports at least preventive maintenance/PPM, corrective maintenance, troubleshooting/diagnostic inspection, inspection, calibration, electrical safety testing, performance testing, installation/commissioning, and decommissioning.
5. Corrective maintenance can use a troubleshooting stage and record final diagnosis/root cause, repair, parts, tests, and final device status.
6. A maintenance task shows current work stage separately from maintenance type.
7. One ticket can link to multiple tasks, and planned PPM/calibration can exist without a ticket.
8. Reclassification preserves old/new values, engineer, reason, and time in history.
9. Required test, review, signature, and release policies are visible and enforced before completion.
10. Device history, ticket timeline, maintenance records, and reports distinguish reporter observations from engineer-confirmed technical classifications.
11. All classification and technical-decision changes are server-authorized and audit logged.

---

## 18. Recommended Delivery Sequence

### Phase 1 — Simple Reporting and Core Types

* Reporter categories, impact, and device-linked tickets
* Engineer triage panel
* Preventive/PPM, corrective, troubleshooting, and inspection types
* Work stages, device-status decision, and linked ticket/task model

### Phase 2 — Complete Work Records

* Technical categories, diagnosis/root cause, checklists, parts, costs, tests, and history
* Multiple linked tasks and reclassification workflow
* Technician work interface and biomedical review workflow

### Phase 3 — Signatures and Advanced Types

* Performer/reviewer/release signatures
* Calibration, electrical safety, performance testing, installation/commissioning, and decommissioning policies
* Device release workflow and compliance dashboards

### Phase 4 — Reporting and Policy Administration

* Reliability/cost/performance reports using engineer-confirmed classifications
* Versioned management of maintenance types/categories and signature policies
* Organization-specific workflow templates and configuration

---

## 19. Final Recommendation

Make maintenance type a **technical decision owned by biomedical engineers**, not a choice forced on doctors or department staff.

> **Staff describe the observed problem. Engineers classify the technical work. Technicians perform the assigned task. Authorized engineers review, sign, and release the device.**
