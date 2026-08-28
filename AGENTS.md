# BEMMS App Production Development Rules

You are developing BEMMS App as a production biomedical engineering and
maintenance-management application.

Your objective is to deliver complete, verified, maintainable outcomes—not merely
partial code changes.

## Source of Truth

Use this priority order:

1. Verified runtime behavior, repository code, and database state
2. Tests, builds, type checks, linting, and other verification
3. Git history and the current diff
4. Approved BME-BEMMS documentation
5. Antigravity session memory and active task plan
6. Conversation context and assumptions

If documentation conflicts with verified implementation, identify the conflict.
Do not silently preserve incorrect documentation or code.

## Documentation Routing

For substantial work, first read:

- `project-docs/BEMMS-Documentation-Index.md`
- `project-docs/BEMMS-main-idea.md`
- `project-docs/DEVELOPMENT_ROADMAP.md` if it exists

Then load only documentation relevant to the task:

| Task area | Documentation |
|---|---|
| Modules, pages, navigation | `BEMMS-Application-Modules-and-Pages.md` |
| Database models, relations, migrations | `BEMMS-Database-Schema-and-ERD.md` |
| Administration, users, roles | `BEMMS-Administration-Settings-and-User-Management.md` |
| Permissions, approvals, workflow states | `BEMMS-Permissions-and-State-Machines.md`, `BEMMS-Role-Based-User-Experience-and-Workflow.md` |
| Departments, devices, equipment lifecycle | `BEMMS-Department-Device-Management-and-*.md` |
| Device profiles, QR access, QR workflow | `BEMMS-Role-Based-Device-Profiles-and-QR-*.md`, `QR-Helpdesk-Ticketing-Workflow.md` |
| Maintenance and engineer triage | `BEMMS-Maintenance-Types-and-Engineer-Triage.md` |
| Preventive maintenance | `BEMMS-Preventive-Maintenance-Scheduling-and-*.md` |
| Electronic signatures, audit trails, traceability | `BEMMS-Electronic-Signatures-and-Traceability.md` |
| UI, layouts, interaction behavior | `BEMMS-UI-UX-Design.md` |

Use the documentation index when a filename differs slightly.
Do not load every document for a small, isolated change.
Do not invent business, medical, approval, compliance, or access-control rules.

## Development Management

Maintain `project-docs/DEVELOPMENT_ROADMAP.md` as the Git-tracked, high-level delivery plan.

If it does not exist, create it from verified documentation before beginning major
implementation. Keep it concise and update it at phase boundaries.

For each phase, record:

- objective and business value
- in-scope modules and dependencies
- acceptance criteria
- risks and unresolved decisions
- required verification and release criteria
- status: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, or `COMPLETE`

Use Antigravity’s built-in planning for the current phase only.

Keep one phase actively in progress unless parallel work is clearly safe and
isolated. Do not advance a phase merely because code was written; advance only
when acceptance criteria and required verification are complete.

At phase boundaries, reassess dependencies, risks, documentation conflicts, and
the next highest-value milestone.

## Planning and Continuity

Use Antigravity’s built-in planning for:

- tasks with three or more meaningful steps
- work spanning multiple modules
- research or architectural decisions
- long-running implementation or debugging

Keep the active plan accurate after each meaningful milestone:

- completed work
- current phase
- relevant files
- verification performed
- remaining work
- blockers
- exact next action

Use Antigravity memory as supporting context, but verify important claims against
the repository, Git history, and tests.

## Autonomous Execution

Act proactively to complete the user’s requested outcome.

You may independently:

- inspect documentation, code, Git history, tests, configuration, and dependencies
- choose conventional implementation details that fit the documented system
- create focused modules, tests, migrations, and documentation updates
- resolve bugs and implementation gaps within the current task scope
- run safe verification and refine the active plan
- continue to the next ready, dependent roadmap phase after verification
- make reversible assumptions that do not change product intent

Ask for direction before:

- inventing or changing medical, business, compliance, approval, or workflow rules
- changing the overall architecture or technology stack
- introducing paid services, external accounts, secrets, or credentials
- deleting data, rewriting Git history, or making irreversible data changes
- weakening security, authorization, audit, signature, or traceability controls
- making a high-impact decision that cannot be safely reversed

When blocked, inspect available evidence and attempt safe solutions first. Ask the
smallest concrete question only when a missing decision prevents correct progress.

## Development Cycle

For every substantial feature or milestone, follow:

```text
UNDERSTAND
→ PLAN
→ INSPECT
→ IMPLEMENT
→ VERIFY
→ REVIEW
→ UPDATE DOCUMENTATION
→ UPDATE ROADMAP
→ CONTINUE