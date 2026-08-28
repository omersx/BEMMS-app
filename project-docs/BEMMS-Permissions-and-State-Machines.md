# BEMMS Permissions and State-Machine Specification

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Database schema and ERD](BEMMS-Database-Schema-and-ERD.md) · [Application modules](BEMMS-Application-Modules-and-Pages.md)
>
> **Related workflow specifications:** [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Maintenance triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) · [PM scheduling](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md) · [Electronic signatures](BEMMS-Electronic-Signatures-and-Traceability.md) · [Administration](BEMMS-Administration-Settings-and-User-Management.md) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md)

## 1. Purpose

This is the canonical BEMMS specification for authorization and workflow state. It tells developers:

* who may perform each action;
* which organization, hospital, department, location, and device a user may act on;
* which record-state transitions are valid;
* which reason, checklist, test, review, or electronic signature is required; and
* how the server records, rejects, and audits important actions.

It applies to every web page, QR route, mobile view, API, background job, import, and administrative tool. Hiding an interface button helps usability but is not security. The server must make the final permission and state decision.

This document complements the [Database Schema and ERD](BEMMS-Database-Schema-and-ERD.md): the database document defines persistent data; this document defines the business rules allowed to change it.

The core decision model is:

~~~text
Authorized action
= active account
+ active permission through a role
+ matching organization / hospital / department scope
+ a state transition allowed from the current record state
+ required evidence, review, and signatures
~~~

If any check fails, deny the action and leave the record unchanged.

---

## 2. Design Principles

1. **Least privilege.** Users receive only access required for their work.
2. **Role is not enough.** Permission, organizational scope, current state, and required evidence must all be valid.
3. **Technical authority is explicit.** Inventory administration alone never grants authority to diagnose, sign technical work, approve work, or release a device.
4. **One QR, tailored view.** A device QR identifies one device profile; the server returns only the fields and actions allowed for the viewer.
5. **State changes are commands.** Clients request named actions such as acknowledge, start work, approve review, or release device. They do not freely edit a status field.
6. **Signed evidence is immutable.** A signed record remains evidence. Corrections create an amendment/version, never an invisible edit.
7. **Archive, do not erase.** Operational records, devices, departments, plans, policies, users, and configuration are normally archived/deactivated rather than deleted.
8. **Every consequential action is traceable.** Record actor, time, old/new state, reason, evidence, and policy version.
9. **Fail safely.** If access, scope, evidence, or signature cannot be verified, reject the action.

---

## 3. Authorization Model

### 3.1 Scope Hierarchy

~~~text
Organization
└── Hospital / site
    └── Department
        └── Location
            └── Device
~~~

An organization grant can cover all hospitals. A hospital grant covers only that hospital. A department grant covers its current locations and devices. Device-specific exceptions should be rare, explicit, time-bounded where possible, and always audited.

Current device location/department controls normal access. Historical tickets, maintenance records, signatures, and events retain a snapshot of former scope so past work remains understandable after transfer.

### 3.2 Permission Vocabulary

Permissions are stable capability codes, not screen names. Suggested capability families:

| Family | Examples |
|---|---|
| Device inventory | devices.view, devices.create, devices.edit_identity, devices.transfer, devices.archive |
| Device safety | devices.change_non_technical_status, devices.remove_from_service, devices.release_for_clinical_use |
| QR access | qr.scan_public_profile, qr.scan_internal_profile |
| Tickets | tickets.create, tickets.view_own, tickets.view_department, tickets.comment_requester, tickets.comment_internal, tickets.acknowledge, tickets.assign, tickets.triage, tickets.cancel, tickets.close, tickets.reopen |
| Maintenance | maintenance.create_task, maintenance.assign, maintenance.start, maintenance.record_work, maintenance.complete_work, maintenance.review, maintenance.release, maintenance.amend_record |
| PM and calibration | pm_plans.view, pm_plans.manage, pm_occurrences.manage |
| Signatures | signatures.sign_performer, signatures.sign_reviewer, signatures.sign_release |
| Reporting | reports.view_operational, reports.view_costs, reports.export |
| Administration | admin.users.manage, admin.roles.manage, admin.departments.manage, admin.settings.manage, audit.view |

The implementation may split a capability more finely, but it must preserve these security boundaries. Role labels sent from a browser are never trusted.

### 3.3 Authorization Outcome

For a protected command, return one of these outcomes:

| Outcome | Behavior |
|---|---|
| Allowed | Perform the command transactionally; add workflow and audit evidence. |
| Denied: unauthenticated | Require sign-in; do not reveal restricted information. |
| Denied: missing permission | Explain the action is unavailable without exposing sensitive data. |
| Denied: out of scope | Deny as not available; do not leak another department’s record. |
| Denied: invalid state | Return current permitted state/action guidance. |
| Denied: evidence/signature missing | State what authorized next step is required. |
| Conflict | Do not overwrite; reload the current record and let the user retry. |

---

## 4. Roles and Separation of Duties

Organizations may use local role names, but these baseline roles give BEMMS safe boundaries.

| Role | Main purpose | Boundaries |
|---|---|---|
| Staff / doctor / requester | Find a device, report a problem, track tickets, add requester comments. | Cannot choose final technical classification, access internal notes, edit technical records, sign, approve, or release a device. |
| Department manager | Monitor department devices and requests; give operational context and confirm local receipt when policy requires. | Has no technical sign/release authority unless separately assigned an appropriate biomedical role. |
| Biomedical engineer | Triage, diagnose, choose maintenance type, work on a device, record tests, and sign performer evidence. | May not bypass required review/release; normally acts only within assigned/scoped work. |
| Senior engineer / supervisor | Allocate work, review/reject evidence, approve qualifying work, and release devices where authorized. | Must follow separation-of-duties rules. |
| Administrator | Manage users, roles, departments, inventory, templates, and settings. | Administration does not automatically include maintenance, signature, review, or release authority. |
| Auditor / quality officer | Read authorized records, signatures, histories, and audit evidence. | Read-only; cannot change any operational or audit record. |
| Scheduler / service account | Create scheduled occurrences and notifications. | Narrow non-human permission only; cannot impersonate a person or make a human electronic signature. |

### 4.1 Multiple Roles

One person may carry multiple independently scoped roles. The permission engine evaluates all active grants, but it still requires scope, valid state, and separation-of-duties conditions.

### 4.2 Separation of Duties

The default recommendation is that performer, reviewer, and releaser are different people when risk or local policy requires it.

| Work condition | Performer may review? | Performer may release? |
|---|---:|---:|
| Routine low-risk work where policy has no review gate | Not applicable | Only when specifically authorized |
| PM with independent review required | No | No |
| Calibration, electrical safety, high-risk repair, or clinical release | No | No |
| Emergency work | No automatic exception | No automatic exception |

Emergency handling requires a documented emergency policy, reason, temporary disposition, named authorization, and follow-up review. It never creates an untraceable bypass.

---

## 5. Permission Matrix

Every Yes below still means “only when scope, state, and evidence checks pass.”

| Capability | Staff / doctor | Department manager | Engineer | Supervisor | Administrator | Auditor |
|---|---:|---:|---:|---:|---:|---:|
| View permitted device profile | Yes | Yes | Yes | Yes | Yes | Read-only scoped |
| View technical device fields | No | No by default | Yes | Yes | Limited inventory only | Read-only by policy |
| Create helpdesk ticket | Yes | Yes | Yes | Yes | No default need | No |
| View tickets | Own / department policy | Department | Assigned/scoped | Scoped | Scoped | Read-only scoped |
| Add requester-visible comment | Yes | Yes | Yes | Yes | No default need | No |
| Add internal engineering note | No | No | Yes | Yes | No default need | Read-only by policy |
| Acknowledge, assign, triage ticket | No | No | Yes | Yes | No default need | No |
| Select maintenance type | No | No | Yes | Yes | No | No |
| Perform/record maintenance | No | No | Yes | Yes | No | No |
| Performer signature | No | No | Yes | Yes | No | No |
| Review or reject work | No | No by default | Only if separately authorized and not performer | Yes | No | No |
| Release device | No | No | Only if policy grants it | Yes, if authorized | No automatic authority | No |
| Manage PM plans/templates | No | View only | Limited scoped actions | Yes | Configuration only | Read-only |
| Edit device identity/location | No | Request proposal | Limited technical edit by policy | Yes | Yes | No |
| Transfer/archive device | No | Request transfer | May propose/confirm technical impact | Approve if policy | Yes | No |
| Manage users, roles, departments | No | No | No | No | Yes | No |
| View audit/signature evidence | Own limited history | Department summary | Scoped work | Scoped work | Yes, policy-scoped | Yes, read-only |

---

## 6. QR and Device-Profile Access

### 6.1 Same QR, Different Authorized Result

The QR code contains an opaque stable reference. It must not include a sequential device ID, credentials, internal maintenance data, or patient data.

| Viewer | Result after scan |
|---|---|
| Unauthenticated person | Sign-in landing page; optionally a minimal organization-approved device identity view. No ticket history, serial number, cost, internal note, or maintenance record. |
| Staff / doctor | Device name, current service-safe status, department/location, basic instructions, Report a problem, and Track my ticket. |
| Department manager | Staff view plus department ticket summary and allowed operational information. |
| Engineer / supervisor | Full scoped technical profile: history, tickets, tasks, PM/calibration, documents, signatures, and permitted actions. |
| Administrator | Inventory/configuration view in scope. Technical work/release actions remain unavailable unless the person also has the needed biomedical role. |
| Auditor | Read-only evidence/history view in policy scope. |

### 6.2 QR Safety Rules

* Scanning does not bypass authentication for restricted information or actions.
* Scanning can preselect the device during ticket creation, but the server confirms the device is active and within scope.
* Archived or decommissioned devices show a safe explanatory view and disallow inappropriate new routine requests.
* Internal QR scans may be audited under local policy without making ordinary staff use feel like surveillance.

---

## 7. Common State-Machine Rules

All BEMMS state machines follow these rules:

1. Store a current state for queues/filters and append an immutable transition event for history.
2. Change state only through named server-side commands.
3. Validate current state in the same transaction as the update.
4. Store previous state, next state, command, actor, time, reason, policy version, and linked evidence.
5. Use a record version or optimistic-concurrency check to reject stale submissions.
6. Do not expose unrestricted generic status editing in an API or form.
7. Localize display labels, but keep stored codes stable.
8. Cancellation, rejection, merge, reopening, amendment, or transfer preserves prior evidence.

### 7.1 Generic Transition Evidence

| Transition | Required evidence |
|---|---|
| Normal progress | Authorized actor and automatic workflow event. |
| Assignment/reassignment | Assignee and assigning actor; handoff note required if work has started. |
| Cancellation | Authorized actor and mandatory reason. |
| Rejection | Reviewer and mandatory reason linked to affected record version. |
| Clinical release | Required test/checklist results and required approval/signatures. |
| Amendment | Original version, change reason, new version, and new signatures as required. |
| Emergency exception | Emergency policy reference, reason, authorizing actor, temporary status, and follow-up review. |

---

## 8. Helpdesk Ticket State Machine

### 8.1 States

| Code | Meaning | Requester-facing label |
|---|---|---|
| new | Submitted and awaiting engineering acknowledgement. | Submitted |
| acknowledged | Engineering received the request. | Acknowledged |
| in_triage | Engineer is assessing the problem and choosing the work path. | Under assessment |
| in_progress | Linked technical work is underway. | Work in progress |
| waiting_requester | Engineering needs access, information, or confirmation. | Information needed |
| waiting_parts_vendor | Work is delayed by parts, supplier, or external service. | Waiting for parts/service |
| resolved | Required technical work is complete/released and engineering reports resolution. | Resolved |
| closed | Formally complete. | Closed |
| cancelled | Withdrawn, duplicate, invalid, or no longer needed. | Cancelled |

### 8.2 Allowed Transitions

| Current state | Command | Allowed roles | Next state | Conditions |
|---|---|---|---|---|
| new | acknowledge | Engineer, supervisor | acknowledged | Scoped ticket permission. |
| new, acknowledged | begin triage | Engineer, supervisor | in_triage | Priority/department checked. |
| in_triage | request information | Engineer, supervisor | waiting_requester | Requester-visible question required. |
| waiting_requester | provide information | Requester, manager, engineer | in_triage | Comment/attachment recorded. |
| in_triage | start work | Engineer, supervisor | in_progress | Create/link maintenance task when technical work is required. |
| in_progress | wait for dependency | Engineer, supervisor | waiting_parts_vendor | Dependency type and note required. |
| waiting_parts_vendor | resume work | Engineer, supervisor | in_progress | Update note required. |
| in_progress, in_triage | resolve | Engineer, supervisor | resolved | Required linked tasks closed/released; requester-facing resolution note. |
| resolved | close | System, requester if policy allows, manager, supervisor | closed | Closure policy satisfied. |
| new, acknowledged, in_triage, waiting_requester | cancel | Requester for own new ticket; manager; engineer; supervisor | cancelled | Reason required. |
| resolved, closed, cancelled | controlled reopen | Requester, manager, engineer, supervisor | in_triage or linked new ticket | Reason required; original history preserved. |

### 8.3 Ticket Rules

* The requester describes a problem; the engineer selects the final technical maintenance type and diagnosis.
* A ticket can link to several maintenance tasks. It cannot resolve while a required task is open, returned for rework without follow-up, or awaiting required release.
* Requester-visible comments and internal engineering notes are separate. Internal notes are never returned to staff/public QR views.
* A duplicate is linked/merged with an explanation, not deleted.

~~~mermaid
stateDiagram-v2
    [*] --> new
    new --> acknowledged: acknowledge
    acknowledged --> in_triage: begin triage
    in_triage --> waiting_requester: request information
    waiting_requester --> in_triage: information received
    in_triage --> in_progress: start work
    in_progress --> waiting_parts_vendor: dependency
    waiting_parts_vendor --> in_progress: resume
    in_progress --> resolved: required work released
    resolved --> closed: close or auto-close
    closed --> in_triage: controlled reopen
~~~

---

## 9. Maintenance Task State Machine

### 9.1 States

| Code | Meaning |
|---|---|
| draft | Created but not assigned/activated. |
| assigned | Assigned to an engineer/team; work has not begun. |
| in_progress | Technical work, diagnosis, test, or documentation is underway. |
| waiting_dependency | Blocked by access, part, vendor, clinical availability, or another recorded dependency. |
| work_complete | Performer says work/data capture is complete; not fully approved/released. |
| awaiting_review | Submitted for required review. |
| returned_for_rework | Reviewer rejected evidence/work and returned it to performer. |
| awaiting_release | Work/review complete; required device release is pending. |
| closed | Work is complete, approved/released as needed, and official record is finalized. |
| cancelled | No longer required or created in error; prior work evidence is retained. |

### 9.2 Allowed Transitions

| Current state | Command | Allowed roles | Next state | Required evidence |
|---|---|---|---|---|
| draft | assign | Authorized allocator, supervisor | assigned | Assignee/team and maintenance type. |
| assigned | start | Assigned engineer, supervisor | in_progress | Performer identified. |
| in_progress | mark waiting | Assigned engineer, supervisor | waiting_dependency | Dependency type and explanation. |
| waiting_dependency | resume | Assigned engineer, supervisor | in_progress | Resolution/update note. |
| in_progress | complete work | Assigned engineer | work_complete | Work summary, checklist/tests, parts/costs if relevant, performer signature when required. |
| work_complete | submit for review | Engineer, supervisor | awaiting_review | All required evidence completed. |
| work_complete | request release | Authorized engineer/supervisor | awaiting_release | Only if review is not required. |
| awaiting_review | approve review | Authorized reviewer | awaiting_release or closed | Valid reviewer signature. |
| awaiting_review | return for rework | Authorized reviewer | returned_for_rework | Mandatory rework reason. |
| returned_for_rework | resume | Assigned engineer | in_progress | Original version retained; correction reason recorded. |
| awaiting_release | release device | Authorized independent releaser | closed | Required signatures, tests, and checklist. |
| draft, assigned | cancel | Creator, supervisor | cancelled | Reason required. |
| in_progress, waiting_dependency | cancel | Supervisor or emergency-policy actor | cancelled | Reason, safety disposition, ticket/device impact. |

### 9.3 Maintenance Rules

* Biomedical engineer or supervisor selects maintenance type during triage. Suggested values: preventive maintenance, corrective maintenance, troubleshooting, calibration, electrical safety, performance testing, inspection, installation/commissioning, software/service, and decommissioning.
* Work complete never automatically means safe for clinical use.
* The performer cannot review or release their own work when policy requires independent duties.
* Missing/invalid signatures block any dependent transition.
* Closing creates/links the official immutable maintenance record; the task remains the workflow history.

~~~mermaid
stateDiagram-v2
    [*] --> draft
    draft --> assigned: assign
    assigned --> in_progress: start
    in_progress --> waiting_dependency: blocked
    waiting_dependency --> in_progress: resume
    in_progress --> work_complete: performer attests
    work_complete --> awaiting_review: submit
    awaiting_review --> returned_for_rework: reject
    returned_for_rework --> in_progress: rework
    awaiting_review --> awaiting_release: approve
    work_complete --> awaiting_release: no review required
    awaiting_release --> closed: release
~~~

---

## 10. PM, Calibration, and Scheduled-Occurrence States

Maintenance plans are reusable configuration; scheduled occurrences are dated obligations created from a plan.

### 10.1 Plan States

| Code | Meaning |
|---|---|
| active | Scheduler may create/manage future occurrences. |
| paused | Existing open occurrences remain visible; no regular new occurrences are generated. |
| archived | History retained; no new work created. |

Only authorized PM planners/supervisors activate, pause, resume, edit, or archive plans. Editing a plan must not silently rewrite completed occurrence history.

### 10.2 Occurrence States

| Code | Meaning |
|---|---|
| scheduled | Planned but not due/started. |
| due | Due date has arrived. |
| overdue | Due date passed without qualifying completion. |
| task_created | A linked maintenance task exists. |
| in_progress | Linked task is active. |
| completed | Qualifying signed record completed the obligation. |
| deferred | Authorized deferment; original due date/reason/approval retained. |
| cancelled | No longer applicable; reason retained. |

### 10.3 Rules

* Scheduler moves scheduled to due and due to overdue, and generates configured notifications.
* Creating a task moves occurrence to task_created; the occurrence and task stay linked.
* An occurrence becomes completed only after its linked task closes with qualifying valid signature evidence.
* Due date cannot be silently cleared. Deferment records approver, reason, old/new date, and policy reference.
* Calibration expiry is confirmed by its plan/occurrence and qualifying record, not a manually typed status field.

---

## 11. Device Operational State Machine

Device operational state is safety-sensitive and separate from ticket/task state.

| Code | Meaning | Clinical-use rule |
|---|---|---|
| available | Cleared for normal service. | May be used if no other local restriction applies. |
| limited_use | Available only under documented limitation. | Prominently show limitation. |
| under_maintenance | Engineering work is underway. | Not for clinical use. |
| awaiting_release | Work ended but release pending. | Not for clinical use. |
| out_of_service | Faulty, unsafe, quarantined, or unavailable. | Not for clinical use. |
| decommissioned | Removed from active service. | Cannot receive new routine work. |

| Current state | Command | Allowed roles | Next state | Conditions |
|---|---|---|---|---|
| available, limited_use | remove from service | Engineer, supervisor; emergency staff role if policy permits | under_maintenance or out_of_service | Reason plus ticket/task; emergency actor recorded. |
| under_maintenance, out_of_service | mark awaiting release | Authorized engineer/supervisor | awaiting_release | Work/test evidence exists. |
| awaiting_release | release for clinical use | Authorized releaser | available or limited_use | Required test, approvals, signatures, and limitation if relevant. |
| available, limited_use, out_of_service | decommission | Supervisor or authorized administrator with technical approval | decommissioned | Reason, disposition, approvals. |
| decommissioned | restore to service | Supervisor through controlled recommissioning | under_maintenance or awaiting_release | Never directly to available. |

Administrative access alone cannot set a safety-critical available, limited_use, awaiting_release, or decommissioned status. A generic device edit endpoint must not bypass this state machine.

---

## 12. Electronic Signatures and Versioning

This section implements the detailed [Electronic Signatures and Traceability](BEMMS-Electronic-Signatures-and-Traceability.md) requirements.

### 12.1 Record Version States

| Code | Meaning |
|---|---|
| draft | Working version; editable by authorized people. |
| awaiting_performer_signature | Data ready for performer attestation. |
| awaiting_review_signature | Performer-signed record awaits review. |
| awaiting_release_signature | Required review complete; release attestation pending. |
| finalized | Required signatures valid; version immutable. |
| superseded | Later approved amendment exists; version remains readable. |
| rejected | Review rejected version; it remains evidence and may lead to amendment. |

### 12.2 Signature Rules

* A signature attests to one record version, its rendered content/hash, signer identity, signer role, declared meaning, and timestamp.
* The signer must reauthenticate or pass the organization-approved signing challenge. A normal session alone is not a signature.
* Performer means “I performed/recorded this work truthfully.” Reviewer means “I reviewed this evidence.” Releaser means “I authorize the documented disposition.”
* Invalidating a signature never deletes it: record why, who, when, policy authority, and the safe downstream impact.
* Correcting finalized work creates an amendment with a link to the original; it never overwrites it.

### 12.3 Signature Gates

| Business action | Required condition |
|---|---|
| Mark work complete | Performer-required fields/evidence and performer signature, when policy requires. |
| Submit for review | Valid performer signature and no missing mandatory evidence. |
| Approve review | Authorized independent reviewer and valid reviewer signature. |
| Release device | Required signatures, test/checklist evidence, and release signature. |
| Update last maintenance/calibration summary | Linked qualifying record reaches required finalized/closed state. |
| Amend signed record | New amendment, reason, original link, and new signature path. |

---

## 13. Account, Role, and Scope Lifecycle

| User state | Meaning | Access |
|---|---|---|
| invited | Invitation sent but not accepted. | None. |
| active | Credentials and needed role/scope are active. | As granted. |
| suspended | Temporarily disabled for security, HR, or investigation. | No new session/action. |
| deactivated | Employment or assignment ended. | No future access; history/signatures remain. |

Role/scope assignments carry their own active, expired, or revoked effective state. Removing a role changes future access only; it never removes historic attribution.

High-impact role, scope, workflow-policy, signature-policy, and audit-access changes create before/after audit evidence. Consider a second-administrator approval for privileged grants/policy changes. Policy changes apply prospectively unless a documented migration defines in-flight handling.

---

## 14. Exceptions and Recovery

| Situation | Required behavior |
|---|---|
| Duplicate ticket | Link/merge through an event; tell requester; preserve both submissions. |
| Wrong device selected | Correct before work starts or cancel with reason/create correct record. Never move signed work silently. |
| Device unsafe during work | Move to appropriate non-clinical state, notify relevant people, and block release until requirements are met. |
| Engineer unavailable | Supervisor reassigns with handoff note; current state remains intact. |
| Work rejected | Return for rework with reason; preserve rejected version/signature history. |
| Reviewer unavailable | Use authorized delegation; performer cannot self-approve unless documented emergency policy permits. |
| Emergency restoration | Record emergency authority, temporary disposition, and mandatory retrospective review. |
| Ticket reopened | Preserve original ticket; use controlled reopen or a linked new ticket with reason. |
| Device transfer with open work | Block or use controlled handoff; preserve original/new location snapshots. |
| Plan edited after occurrence exists | Existing occurrence follows its stored policy snapshot unless formally adjusted. |

---

## 15. Server, API, and Database Enforcement

### 15.1 Command-Based APIs

Use explicit protected actions, for example:

~~~text
POST /tickets/{id}/acknowledge
POST /tickets/{id}/begin-triage
POST /tickets/{id}/resolve
POST /maintenance-tasks/{id}/start
POST /maintenance-tasks/{id}/submit-for-review
POST /maintenance-tasks/{id}/release
POST /devices/{id}/remove-from-service
POST /devices/{id}/release-for-clinical-use
POST /records/{id}/sign
~~~

Each command accepts only needed fields, checks authorization/state/evidence, performs the primary change plus event/audit rows in one transaction, and returns only the new permitted view.

### 15.2 Database Protections

* Enforce foreign keys, unique constraints, scoped tenancy, checks, and append-only rules described in the [Database Schema and ERD](BEMMS-Database-Schema-and-ERD.md).
* Use separate database roles for migrations, application runtime, read-only audit access, and backup.
* Do not permit ordinary update/delete access to signature, audit, and historical event rows.
* Use transactions plus locking or optimistic concurrency on current states/version fields.
* The scheduler/service account can create occurrences/notifications but cannot make a human signature or claim human technical work.

### 15.3 Minimum Audit Event

~~~text
event_id
organization_id
entity_type and entity_id
action_code
previous_state and new_state
actor_user_id or service identity
occurred_at
reason/comment reference
record_version_id / signature_id where relevant
policy_version_id where relevant
request/correlation_id
~~~

Never put passwords, authentication secrets, patient details, or sensitive signing-challenge data into audit text.

---

## 16. Notifications and Interface Behavior

Notifications inform people; they never grant a missing permission or make an invalid state change valid.

| Event | Typical recipients |
|---|---|
| Ticket created, acknowledged, or status changes | Requester, assigned engineer, department/supervisor as relevant. |
| Information requested | Requester and department manager. |
| Task assigned or reassigned | Assigned engineer and supervisor. |
| PM/calibration approaching, due, or overdue | Scoped biomedical team and supervisor. |
| Work awaiting review/release | Assigned reviewer/releaser and supervisor. |
| Work returned for rework | Performer and supervisor. |
| Device removed from service or released | Relevant department, ticket requester, and biomedical team as policy allows. |
| Privileged role/policy change | Affected user plus designated administrator/auditor. |

The interface should always present plain-language current status, next responsible party, available next action, missing condition, and allowed history. If an action is disabled, show a short useful explanation when that helps the user proceed safely.

---

## 17. Database Mapping

| Requirement | Primary records |
|---|---|
| Roles, permissions, scope | roles, permissions, role_permissions, user_role_assignments, user_access_scopes |
| Account lifecycle | users, user_invitations, security/audit events |
| Device state/history | devices, device_status_history |
| QR lifecycle/access | device_qr_labels and server authorization rules |
| Ticket workflow | service_tickets, service_ticket_events, service_ticket_comments, service_ticket_attachments |
| Maintenance workflow | maintenance_tasks, maintenance_records, checklist/test/part/cost records |
| PM/calibration | maintenance_plans, maintenance_schedule_occurrences, notification events |
| Signatures/amendments | record_versions, electronic_signatures, signature_events, signature_policies |
| Accountability | audit_logs, event tables, immutable snapshots |

Physical columns can evolve, but the event/version/signature relationships required by these workflows must remain intact.

---

## 18. Acceptance Criteria

The implementation is acceptable only if it can demonstrate all of the following:

1. A staff user can scan a department device QR, submit a ticket, and see only authorized device/ticket information.
2. The same QR returns a scoped engineer’s technical profile/actions without exposing them to ordinary staff.
3. A ticket cannot resolve while a required linked task is incomplete, rejected without follow-up, or awaiting release.
4. Engineer/supervisor selects technical maintenance type; requester cannot set a final technical classification.
5. A person cannot release a device by editing a generic status field or calling an API directly without permission/state/evidence.
6. A performer cannot approve/release their own high-risk work when policy requires separate people.
7. A signature is bound to a specific version and survives later correction through amendment history.
8. An administrator can manage users/departments/inventory but cannot technically sign, approve, or release based on administration alone.
9. A revoked, expired, suspended, or out-of-scope user is denied even via direct URL/API request.
10. Cancellation, reopening, merge, rejection, transfer, deferment, and amendment all retain attributable history.
11. The scheduler can notify/create planned work but cannot complete work or create a human signature.
12. Concurrent requests cannot create invalid double assignment, double completion, or release from an obsolete record version.

---

## 19. Final Recommendation

Implement BEMMS workflow and security as a **permission + scope + state + evidence** decision model, enforced by server-side command handlers and backed by append-only history.

~~~text
Authorized person identifies a device
→ submits or triages a ticket
→ engineer performs controlled work
→ evidence and signatures are captured
→ independent review/release occurs where policy requires
→ device and ticket history update atomically and remain traceable
~~~

This prevents the key weaknesses of a simple CRUD application: unrestricted status changes, accidental device release, untraceable edits, and administrators unintentionally receiving technical authority.
