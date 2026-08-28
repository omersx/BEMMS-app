# BEMMS Electronic Signatures, Approval, and Traceability

> **Documentation navigation:** [Developer start here](BEMMS-Documentation-Index.md) · [Core product vision](<BEMMS- main-idea.md>) · [Maintenance triage](BEMMS-Maintenance-Types-and-Engineer-Triage.md) · [PM scheduling](BEMMS-Preventive-Maintenance-Scheduling-and-Alerts.md)
>
> **Related specifications:** [QR helpdesk](QR-Helpdesk-Ticketing-Workflow.md) · [Role-based device profiles](BEMMS-Role-Based-Device-Profiles-and-QR-Access.md) · [Administration policies](BEMMS-Administration-Settings-and-User-Management.md) · [Role-based UX](BEMMS-Role-Based-User-Experience-and-Workflows.md)

## 1. Purpose

This document defines the BEMMS electronic-signature, approval, and traceability system for biomedical engineering work.

The purpose is to ensure that every important action on a medical device can be traced to the responsible authorized person, including who performed the work, who reviewed it, who released the device to service, and when those actions occurred.

The core principle is:

> **Every important action is attributable to an authenticated person, tied to the exact record they signed, preserved in history, and never silently overwritten.**

This document complements:

* [BEMMS core product vision](<BEMMS- main-idea.md>) — product, security, and system requirements
* `QR-Helpdesk-Ticketing-Workflow.md` — ticket and maintenance workflow
* `BEMMS-Application-Modules-and-Pages.md` — modules, pages, and permissions
* `BEMMS-UI-UX-Design.md` — mobile/desktop UI and interaction design

---

## 2. Scope

### 2.1 Included

* Authenticated electronic signatures for important ticket, device, maintenance, testing, PPM, and calibration actions
* Performer, reviewer, approver, and device-release accountability
* Configurable signature policies by maintenance type and device criticality
* Immutable signature records, amendments, and audit history
* Record versioning and signed-content snapshots
* Device history showing the most recent signed maintenance, repair, calibration, and release information
* Signature status dashboards and reports
* Mobile-friendly signing flows for technicians and engineers

### 2.2 Not Included in the Initial Version

* Patient medical records or patient signatures
* A claim that BEMMS signatures are legally equivalent to a qualified digital signature in every jurisdiction
* Certificate-based or smart-card-based digital signatures
* External identity-provider integration beyond normal BEMMS authentication
* Biometric storage by BEMMS

If a hospital requires a specific regulated or legally qualified digital-signature standard, the policy and technical design must be reviewed against the applicable local law, hospital policy, and accreditation requirements before BEMMS is represented as meeting that standard.

---

## 3. Key Terms

| Term | Meaning |
|---|---|
| Audit event | Automatic log of an important system action, including actor, time, entity, and before/after values where relevant. |
| Authenticated electronic signature | An explicit authenticated confirmation by a named BEMMS user that binds them to a defined action and exact record version. |
| Performer signature | Confirmation that the signer performed the work and recorded it accurately. |
| Reviewer signature | Confirmation that an authorized person reviewed the work, findings, and evidence. |
| Approval signature | Confirmation that a defined decision or exception is accepted according to policy. |
| Release signature | Confirmation by an authorized person that a device may be returned to the selected operational status. |
| Record version | An immutable version of a ticket, maintenance record, calibration record, or device-status decision at a point in time. |
| Signed snapshot | Canonical copy of the record fields and attachments references covered by a signature. |
| Amendment | A new signed correction or clarification that preserves the original signed record. |
| Signature policy | Configurable rule defining which roles and signatures are required for a particular action. |

---

## 4. Design Principles

### 4.1 Audit Trail and Electronic Signature Are Different

Both are required:

| Capability | What it proves |
|---|---|
| Audit trail | An action/change occurred in the system, by a user/session, at a time. |
| Electronic signature | The authenticated signer explicitly accepted responsibility for a defined action and exact content. |

An audit log alone must not be treated as proof that an engineer formally accepted maintenance completion or released a device for use.

### 4.2 Sign Important Decisions, Not Every Click

Signatures should be required for actions with technical, safety, accountability, or compliance importance. Routine navigation, viewing, drafting, and ordinary comments should be audited when appropriate but should not require a reauthentication signature.

### 4.3 One Person, One Account

Every signer must use their individual BEMMS account. Shared accounts are prohibited because they defeat accountability. BEMMS must never allow one user to sign on behalf of another user.

### 4.4 No Silent Changes After Signature

Once a record is signed, its signed content cannot be edited in place. Corrections must create a new amendment/version with a reason, audit event, and any required new signatures.

### 4.5 The Server Is Authoritative

Server-side checks determine who may sign, what they may sign, the applicable policy, the record version, the timestamp, and whether the requested state transition is valid. The browser must not be trusted to authorize or generate a signature by itself.

---

## 5. Signature Roles and Responsibilities

| Signature role | Responsibility | Typical authorized role |
|---|---|---|
| Reporter acknowledgement | Confirms the reporter submitted the described problem/request. Normal ticket submission records this automatically; separate reauthentication is not required for ordinary reporting. | Doctor, nurse, department staff, department manager. |
| Assignee acceptance | Confirms that the assignee accepts responsibility for assigned ticket or maintenance work. | Biomedical technician, biomedical engineer. |
| Performer | Confirms that the signer performed the inspection, repair, PPM, calibration, test, or other recorded work. | Biomedical technician or biomedical engineer, as policy allows. |
| Reviewer | Confirms review of the performed work, findings, evidence, and results. | Biomedical engineer, biomedical manager, or explicitly qualified reviewer. |
| Approver | Approves a defined exception, recommendation, or workflow decision. | Biomedical manager or policy-defined approver. |
| Release authority | Confirms the device can be changed to an allowed operational status after appropriate work and testing. | Authorized biomedical engineer or biomedical manager. |
| Ticket closer | Confirms that the ticket resolution is sufficiently documented and completes closure under policy. | Biomedical engineer, biomedical manager, or workflow-defined closer. |

A single person may hold multiple roles only where the configured policy permits it. For high-criticality work, the policy may require reviewer and release signatures from a different qualified person.

---

## 6. Signature Policy Model

Signature requirements must be configurable by organization and may be refined by hospital, device criticality, device category, maintenance type, and action.

### 6.1 Recommended Initial Policies

| Action | Required signature | Additional signature when policy requires |
|---|---|---|
| Accept ticket assignment | Assignee acceptance | None normally. |
| Complete corrective maintenance | Performer | Reviewer for high-criticality devices, failed tests, or technician-performed work. |
| Complete preventive maintenance / PPM | Performer | Reviewer for critical devices or policy-defined checklist categories. |
| Complete calibration | Performer | Reviewer/approver, especially where a certificate or regulated measurement result is required. |
| Complete electrical safety or performance test | Performer | Reviewer for failed/exception results or high-criticality equipment. |
| Release device to Operational | Release authority | Reviewer approval before release if the policy requires it. |
| Change device to Out of service/Decommissioned | Authorized status-change signature | Manager approval for decommissioning if policy requires it. |
| Resolve ticket after maintenance | Responsible engineer signature | Department confirmation or manager closure when configured. |
| Close ticket | Ticket closer signature | Optional requester/department confirmation. |
| Approve exception or override | Approver signature | A second approver for high-risk policy exceptions. |

### 6.2 Criticality-Based Rules

Recommended starting policy:

* **Low/medium criticality:** qualified performer signature; reviewer only for exceptions, failed testing, or local policy.
* **High criticality:** performer signature plus reviewer signature before release to service.
* **Critical/life-support or policy-designated equipment:** performer signature, independent qualified review, and explicit release signature. The hospital decides its exact categories and rules.

BEMMS must show the currently required signatures before work is submitted, so a technician never discovers a missing approval only after completing a task.

---

## 7. Signature Lifecycle

### 7.1 Signature States

```text
Draft
→ Work in progress
→ Awaiting performer signature
→ Performed and signed
→ Awaiting review, if required
→ Reviewed/approved
→ Awaiting release, if required
→ Released / Completed
→ Resolved / Closed
```

Other controlled states:

```text
Rejected for correction
Amended
Superseded
Voided by authorized workflow
```

### 7.2 Standard Maintenance Signature Workflow

```text
Assigned task
→ Assignee accepts work
→ Work, checklist, findings, parts, and tests recorded
→ Performer reviews record and signs completion
→ Reviewer approves or rejects for correction when required
→ Authorized engineer signs device release when required
→ Maintenance record is complete
→ Linked ticket is resolved/closed under policy
```

### 7.3 Rejection and Correction

If a reviewer rejects a record:

1. The reviewer selects `Reject for correction`.
2. A clear rejection reason is required.
3. The original signed version remains visible and intact.
4. The performer creates an amendment/new version.
5. The amended version follows the required signature policy again.

---

## 8. Signing User Experience

### 8.1 Clear Action Labels

Use specific labels that say what the user is accepting:

```text
Sign and accept ticket
Sign and submit maintenance for review
Sign completed PPM
Review and approve maintenance
Sign and release device to Operational
Sign and close ticket
```

Avoid generic labels such as `Approve` or `Confirm` when the impact is unclear.

### 8.2 Signature Confirmation Screen

Before the signature is committed, show a review panel containing:

* Device name and asset number
* Record type and record number
* Action being signed
* Work/finding/test/result summary
* Proposed final device status
* Required next signature or approval, if any
* Signer's full name and role
* Server-recorded signing time and timezone
* Required attestation statement

Example attestation:

> I confirm that I performed the recorded preventive maintenance and that the information entered is accurate to the best of my knowledge.

The signer then explicitly selects **Sign** after completing the required reauthentication step.

### 8.3 Reauthentication

For critical signatures, require recent authentication. The initial MVP should support one or more of:

* Re-enter current password
* Personal signing PIN, stored securely as a password-equivalent verifier
* Passkey/WebAuthn confirmation where available

BEMMS must never store plaintext passwords or PINs. A successful reauthentication event is recorded as the authentication method for the signature; the secret itself is never stored in the signature record.

Biometric confirmation may be provided by the device/passkey platform, but BEMMS must not collect or store biometric data.

### 8.4 Mobile Signing

The signing flow must work on a phone:

* Use a full-screen review sheet or page rather than a tiny modal.
* Make the sign action prominent but visually distinct from normal `Save draft`.
* Require scroll/review acknowledgment only when the summary is genuinely long; do not force ritual scrolling on short records.
* Keep critical information visible: device, action, result, and final status.
* Preserve data if authentication fails or the network connection is interrupted.

### 8.5 Signature Result

After signing, show a durable confirmation state, not only a temporary toast:

```text
Maintenance signed
Signed by: Ahmed Omar, Biomedical Technician
25 Aug 2026, 14:32 UTC+3
Status: Awaiting engineer review
```

The record page must immediately display the new signature in its signature/history section.

---

## 9. Signed Content and Integrity

### 9.1 Signed Snapshot

A signature must bind to a canonical server-generated snapshot of the important content at signing time. For a maintenance record, the snapshot normally includes:

* Device ID, asset number, hospital, department, and location snapshot
* Maintenance record ID and version number
* Maintenance type and linked ticket(s)
* Performer/technician/engineer assignments
* Start and completion time
* Checklist results, notes, and required follow-up items
* Findings, root cause, work performed, and parts/cost entries
* Test results, final result, recommendations, and next due date
* Proposed or final device status
* References to authorized attachments

For a device release, the snapshot includes the device's previous status, new status, release reason, linked completed maintenance/test records, and required review/approval references.

### 9.2 Integrity Record

For each signature, BEMMS records a hash of the canonical signed snapshot. The application must also create an append-only integrity/audit event. The recommended implementation is:

```text
Canonical signed snapshot
→ SHA-256 content hash
→ signature metadata + previous event hash
→ append-only event hash chain
→ optional server-held HMAC/integrity seal
```

This makes unintended or database-only alterations detectable by the application. Database backups and access controls remain required; no hash chain replaces secure infrastructure or proper backups.

### 9.3 Attachments

The signature must record attachment identifiers and file integrity metadata for attachments included in the signed record. A file must not be silently replaced after signing. A corrected file is added as a new attachment/version with an audit event and, where required, an amendment signature.

### 9.4 Time

Use server-recorded UTC time plus the applicable displayed timezone. Do not rely on a phone or browser clock as the authoritative signing time.

---

## 10. Data Model

The final schema may use different names, but it must preserve the following logical records and relationships.

### 10.1 `record_versions`

Immutable version snapshots for records that can be signed.

* Version ID
* Entity type — ticket, maintenance record, device status change, calibration record, test record
* Entity ID
* Version number
* Canonical content snapshot
* Content hash
* Created by and created time
* Amendment reason, if applicable
* Supersedes/superseded-by version references

### 10.2 `electronic_signatures`

* Signature ID
* Entity type and entity ID
* Record version ID
* Signature purpose — accept, perform, review, approve, release, resolve, close, reject, amend, void
* Signer user ID
* Signer display name and role snapshot
* Signer organization/hospital/department scope snapshot
* Attestation text/version
* Authentication method — password reauthentication, signing PIN, passkey, approved SSO method
* Signed timestamp in UTC and displayed timezone snapshot
* Signed content hash
* Integrity event/hash reference
* Status — active, superseded, rejected, voided
* Reason/comment where required
* IP address, device/session identifier, or network metadata only where permitted by policy

### 10.3 `signature_policies`

* Policy ID and organization/hospital scope
* Action type
* Maintenance/device category/criticality applicability
* Required signature purposes and allowed roles
* Whether independent review is required
* Whether the performer may also release the device
* Whether reauthentication is required
* Effective date, active status, and policy version

### 10.4 `signature_events`

Append-only trace events for signature creation, review, rejection, amendment, supersession, and voiding:

* Event ID
* Signature ID
* Event type
* Actor ID
* Timestamp
* Previous and new status, where applicable
* Reason
* Previous event hash and current event hash

### 10.5 Links to Existing BEMMS Records

* `maintenance_records` reference performer/reviewer/release signature IDs and final signed version.
* `maintenance_tasks` reference assignee-acceptance signature and task-completion signature status.
* `service_tickets` reference acceptance, resolution, and closure signature status.
* `device_status_history` references the required status/release signature.
* `audit_logs` reference related signature IDs for important actions.

---

## 11. Device, Ticket, and Maintenance Traceability

### 11.1 Device Detail Page

The device overview must show derived, trusted summary values from the latest qualifying signed record:

```text
Last corrective maintenance
Performed by: Ahmed Omar, Biomedical Technician
Signed: 25 Aug 2026, 14:32 UTC+3
Reviewed by: Dr. Lina Hassan, Biomedical Engineer
Final result: Passed

Last preventive maintenance
Performed by: Ahmed Omar
Signed and approved: 03 Aug 2026, 10:11 UTC+3
Next due: 03 Feb 2027

Last calibration
Performed by: Fatima Ali, Biomedical Engineer
Reviewed by: Dr. Lina Hassan
Certificate: CAL-2026-0189
```

These summary values must be calculated from signed/approved records. Draft, unsigned, rejected, or superseded records must not be displayed as the official "last maintenance" or "last calibration."

### 11.2 Ticket Detail Page

The ticket timeline must show:

```text
Reported by → Assigned to → Accepted by → Work performed by
→ Reviewed by → Device released by → Resolved by → Closed by
```

Each item links to the authorized relevant record and shows timestamp, role, result, and signature status where applicable.

### 11.3 Maintenance Record Page

The maintenance record must have a dedicated **Signatures and approvals** section showing:

* Required signatures and their status
* Signed by, signed time, role, and attestation
* Reviewer/approver decision and comments
* Release status
* Amendment and supersession history
* Link to the full audit timeline

---

## 12. Amendments, Voids, and Record Corrections

### 12.1 Amendments

An amendment is required if an already signed record needs correction or clarification. The user must:

1. Select `Create amendment`.
2. State the reason for the change.
3. Create a new record version linked to the original.
4. Apply the required signature policy to the amended content.

The user interface must clearly identify which version is current and provide access to the prior signed version.

### 12.2 Voiding a Signature or Record

Signatures and signed records must not be deleted. An authorized workflow may mark them **voided** or **superseded** only when policy allows. A void requires:

* Authorized role
* Required reason
* Audit event
* Link to replacement record/amendment where available
* Any required manager/reviewer approval signature

### 12.3 Correcting a Ticket After Closure

A closed ticket cannot be silently edited. Reopen it with a reason, or create a linked follow-up ticket. The history must preserve the original closure and the actor who reopened it.

---

## 13. Permissions and Separation of Duties

### 13.1 Server-Enforced Checks

Before accepting a signature, the server must verify:

* The user is authenticated and active
* Recent reauthentication requirements are met
* The user has the allowed role and organization/hospital/department scope
* The record exists and is in a signable state
* The submitted version matches the latest expected version
* All required prior signatures have been completed
* The requested state transition is valid
* The user is not attempting to sign for another user
* Independent-review requirements are met where configured

### 13.2 Independent Review

When policy requires independent review, the system must ensure the reviewer is not the performer. For critical equipment, BEMMS may also require that the release authority be different from the performer, based on hospital policy.

### 13.3 Administrator Boundaries

System administrators can manage user accounts, organizations, departments, device inventory, and policies within their assigned scope. They do not automatically receive authority to perform, review, approve, or release technical medical-device work. Such permissions must be explicitly granted through a biomedical role.

---

## 14. Security Requirements

### 14.1 Authentication and Secrets

* Do not store passwords, PINs, or passkey private keys in signature records.
* Store only the result and method of a successful reauthentication event.
* Apply rate limiting, lockout/backoff, and monitoring to failed signing authentication attempts.
* End stale sessions and require a fresh sign-in according to policy.
* Use HTTPS for all signature-related traffic.

### 14.2 Data Protection

* Store signatures, snapshots, audit events, and attachments in protected services with least-privilege access.
* Restrict internal technical notes and signatures to authorized users.
* Protect database backups and test restoration regularly.
* Do not expose database credentials, signing secrets, or privileged service keys to the browser.

### 14.3 Audit and Monitoring

Audit security-relevant events, including:

* Signature created, rejected, voided, superseded, or amended
* Signing authentication failures and excessive failed attempts
* Policy changes
* User role/scope changes
* Attempts to access unauthorized records
* Export/download of signed official records where required by policy

---

## 15. Reports and Oversight

The dashboard and Reports module should include:

* Unsigned maintenance work awaiting performer signature
* Work awaiting review/approval/release
* Overdue reviews and releases
* Signed maintenance, PPM, calibration, and test completion by engineer/technician
* Rejected, amended, voided, or reopened records
* Device records missing a required current signed maintenance/calibration record
* Signature-policy compliance by department, device category, or period
* Full signature history for a selected device, ticket, maintenance record, or user

Performance reporting must distinguish work performed, reviewed, released, and closed. It must not treat pending approval as completed work.

---

## 16. API and Transaction Requirements

Each signature operation must occur as one server-side transaction that:

1. Loads and locks the current target record/version as appropriate.
2. Verifies authorization, signature policy, reauthentication, and state transition.
3. Creates the canonical signed snapshot and content hash.
4. Creates the electronic-signature record and append-only signature event.
5. Updates only the permitted workflow/signature status fields.
6. Creates corresponding audit events.
7. Queues authorized notifications after the transaction succeeds.

If any step fails, the signature and related state transition must not partially complete. PostgreSQL is the permanent system of record. Optional Redis/BullMQ may deliver notifications and reminders but must not be the only store for signature information.

---

## 17. UI Pages and Components

| Page/component | Purpose |
|---|---|
| Signature status panel | Shows required/completed/missing signatures for a ticket, task, maintenance record, or status change. |
| Sign action review | Displays the exact action, record summary, attestation, reauthentication, and final sign control. |
| Review/approval panel | Allows authorized reviewer to approve, reject for correction, or request amendment with a reason. |
| Release device panel | Shows previous/new status, linked work/test evidence, required approvals, and release signature action. |
| Signature history | Chronological, read-only history of signatures, amendments, rejections, voids, and policy information. |
| Policy management | Authorized administrator/manager page for signature rules, criticality mappings, and effective policy versions. |
| Signature compliance dashboard | Displays unsigned, awaiting review, overdue approval, and policy-exception work. |

On phones, signature actions use a full-screen review page. On desktop, they may use a side panel or focused dialog if all critical content remains visible.

---

## 18. MVP Acceptance Criteria

The electronic-signature feature is ready for hospital testing only when:

1. Individual users can sign only using their own active authenticated account.
2. Required actions show a clear signature purpose and attestation before signing.
3. BEMMS binds every signature to the exact server-generated record version and content hash.
4. A performer can sign completed corrective maintenance, PPM, calibration, or testing according to policy.
5. An authorized engineer can review, reject for correction, or approve work according to policy.
6. High-criticality work can require independent reviewer and release signatures.
7. An authorized engineer can sign release of a device to an allowed operational status only after required work and approvals are complete.
8. Device details show the latest qualifying signed maintenance, repair, calibration, and release information with responsible people and timestamps.
9. Ticket and maintenance history shows the complete responsibility chain from assignment to closure.
10. A signed record cannot be silently edited; amendment, supersession, and void workflows preserve the original record and reasons.
11. Unauthorized, stale, duplicate, or out-of-order signing attempts are rejected by the server.
12. Signature status and missing approvals appear in authorized dashboards and reports.
13. All signature and policy changes are audit logged.
14. The signature flow works on a mobile phone and remains usable on desktop.

---

## 19. Recommended Delivery Sequence

### Phase 1 — Foundation

* Individual accounts, roles, access scopes, audit logs, and server-side authorization
* Record versioning model and append-only signature event model
* Basic performer/reviewer/release policy definitions

### Phase 2 — Maintenance and Device Signatures

* Performer signature for corrective maintenance and PPM
* Signed maintenance snapshot and immutable history
* Device detail summary derived from signed records
* Signature status panel and mobile signing review

### Phase 3 — Review and Release

* Reviewer rejection/approval workflow
* Independent review for configured criticality levels
* Device release signature and signed status-change history
* Ticket resolve/close signatures

### Phase 4 — Calibration, Reporting, and Administration

* Calibration/testing signature policies and certificate support
* Policy management pages and compliance reports
* Amendment/void workflows and audit dashboards
* Passkey/SSO/certificate-based signing assessment if required by hospital policy

---

## 20. Final Recommendation

Begin with **authenticated electronic signatures** that are tightly integrated with BEMMS accounts, record versions, server time, permission checks, audit history, and a clear review/release process.

Do not treat a signature as merely a name typed into a text field. Treat it as a controlled responsibility decision attached permanently to the exact maintenance, calibration, test, ticket, or device-status action.

> **BEMMS should always be able to answer: what happened, to which device, who performed it, who reviewed it, who released it, when it happened, and which signed record proves it.**
