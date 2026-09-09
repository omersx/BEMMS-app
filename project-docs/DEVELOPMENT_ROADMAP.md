# BEMMS Development Roadmap

> **Git-tracked delivery plan.** Updated at phase boundaries per AGENTS.md.

## Project Status

- **Repository:** New project — no existing source code
- **Technology:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Auth.js, Docker Compose
- **Current Phase:** Phase 6 — Dashboard & Reports
- **Last Updated:** 2026-08-29

---

## Phase 1: Foundation — `COMPLETE`

### Objective & Business Value
Establish the complete production project skeleton with authentication, authorization, database schema, audit logging, and Docker-based development environment. All subsequent phases depend on this foundation being correct and verified.

### In-Scope
- Next.js 15 App Router project with TypeScript strict mode
- Tailwind CSS + shadcn/ui component system
- PostgreSQL database with Drizzle ORM and migration system
- Docker Compose for local development (app + PostgreSQL)
- Auth.js (NextAuth v5) with credentials provider, session management
- Core database schema: organizations, hospitals, departments, locations, users, roles, permissions, user_role_assignments, user_access_scopes, audit_logs
- Server-side RBAC middleware with organization/hospital/department scope enforcement
- Audit logging engine (append-only)
- Responsive layout shell (sidebar desktop, bottom nav mobile)
- Login, logout, password reset pages
- Environment configuration (.env.example, Docker secrets)
- ESLint, Prettier, project structure conventions

### Dependencies
- None (first phase)

### Acceptance Criteria
1. `docker compose up` starts the app and PostgreSQL successfully
2. User can register, log in, and log out
3. Session persists across page refreshes with secure httpOnly cookies
4. Foundation database tables exist with correct relationships and constraints
5. Role-based middleware blocks unauthorized routes (returns 403)
6. Audit log records user login, registration, and role changes
7. Responsive shell renders correctly on mobile (320px) and desktop
8. TypeScript compiles with zero errors in strict mode
9. Database migrations run idempotently

### Risks & Unresolved Decisions
- Auth.js v5 API stability — mitigated by pinning version
- Initial seed data strategy for first admin user

### Required Verification
- `npm run build` succeeds
- `npm run lint` passes
- Docker Compose starts cleanly
- Manual login/logout test
- [x] **Phase 1:** Core Authentication & Foundation (`COMPLETE`)
- [x] **Phase 2:** Organization Structure & Administration (`COMPLETE`)
- [x] **Phase 3:** Equipment Lifecycle & QR Code Management (`COMPLETE`)
- [x] **Phase 4:** Helpdesk Tickets (`COMPLETE`)
- [x] **Phase 5:** Maintenance (`COMPLETE`)

### Status: `COMPLETE`

---

## Phase 2: Organization Structure & Administration — `COMPLETE`

### Objective & Business Value
Enable administrators to set up the organizational hierarchy (organizations, hospitals, departments, locations) and manage user accounts with role and scope assignments. This is the prerequisite for all device and ticket operations.

### In-Scope
- Organization CRUD (admin only)
- Hospital CRUD with organization association
- Department CRUD with hospital association, manager assignment
- Location/Room management within departments
- User invitation, activation, deactivation, archiving lifecycle
- Role and scope assignment UI
- Admin dashboard with actionable widgets
- Soft-delete/archive enforcement for entities with history

### Dependencies
- Phase 1 complete and verified

### Acceptance Criteria
1. Admin can create org → hospital → department → location hierarchy
2. Admin can invite users, assign roles and scopes
3. Deactivated users immediately lose session access
4. Departments with active devices cannot be deleted (blocked with message)
5. All admin actions create audit log entries
6. Organization-scoped data isolation verified

### Status: `COMPLETE`

---

## Phase 3: Device Management & QR — `IN_PROGRESS`

### Objective & Business Value
Implement the medical device inventory, QR code system, and scan-to-action workflow that forms the physical-to-digital bridge for all maintenance operations.

### In-Scope
- Device categories, manufacturers reference data
- Device CRUD with full field set
- Device status lifecycle and history
- Device search and multi-criteria filtering
- QR code generation with opaque references
- Printable QR label sheets (PDF)
- Mobile QR camera scanning (PWA)
- Scan result page with role-based actions
- Manual asset number fallback lookup
- Device documents/attachments
- Department equipment list view

### Dependencies
- Phase 2 complete (org structure, users, departments exist)

### Acceptance Criteria
1. Biomedical engineer can register a device with all required fields
2. Device receives stable QR code on creation
3. Scanning QR code shows correct scan result page with status and actions
4. Unauthenticated scan redirects to login, then returns to scanned device
5. Device search returns results in < 2 seconds
6. Status changes recorded in device_status_history with reason
7. Device list supports pagination and filtering

### Status: `NOT_STARTED`

---

## Phase 4: Helpdesk Tickets — `NOT_STARTED`

### Objective & Business Value
Enable hospital staff to report device problems and biomedical teams to triage, assign, and track resolution through a unified ticketing system.

### In-Scope
- Ticket reporting from QR scan and department device selector
- Duplicate ticket detection and warning
- Ticket state machine (New → Triaged → Assigned → ... → Closed)
- Priority system (P1-P4)
- Public comments and internal biomedical notes
- Triage queue for biomedical engineers
- Ticket assignment workflow
- Ticket detail page with timeline
- My Tickets and Department Tickets views
- Maintenance handoff (link ticket to maintenance task)

### Dependencies
- Phase 3 complete (devices and QR exist)

### Acceptance Criteria
1. Staff can report a problem in ≤ 4 steps from QR scan
2. Ticket state transitions enforce guards and role checks
3. Public vs internal comments are strictly segregated
4. Triage queue shows unassigned tickets sorted by priority
5. Resolving a ticket requires all linked maintenance tasks to be closed

### Status: `COMPLETE`

---

## Phase 5: Maintenance

- **Status:** **COMPLETE**
- **In-Scope:** Preventive Maintenance (PM), Work Orders, Checklists, Signatures
- **Acceptance:** PM schedule engine, Parts & Costs, e-Signatures with SHA-256.

### Objective & Business Value
Implement preventive and corrective maintenance workflows including PM scheduling, checklist execution, parts/cost tracking, electronic signatures, and immutable maintenance records.

### In-Scope
- Preventive maintenance plans with recurrence rules
- PM task auto-generation at configured lead times
- Maintenance task state machine
- Checklist template builder and execution engine
- Corrective maintenance from ticket handoff
- Parts used and cost tracking
- Electronic signatures (performer, reviewer, release)
- Immutable maintenance records with content hashing
- Record versioning and amendment workflow
- Automatic device summary updates on qualifying completion
- Maintenance calendar view

### Dependencies
- Phase 4 complete (tickets exist for corrective maintenance handoff)

### Acceptance Criteria
1. PM plans generate tasks automatically at lead time
2. Checklist execution blocks completion if failed items lack notes
3. Electronic signatures create immutable snapshots with SHA-256 hashes
4. Performers cannot self-approve high-risk work
5. Qualifying signed completion updates device next-PM-due-date
6. Amendments preserve original versions with full audit trail

### Status: `COMPLETE`

---

## Phase 6: Dashboard & Reports — `COMPLETE`

### Objective & Business Value
Provide role-tailored operational dashboards and compliance/performance reports with PDF/Excel export.

### In-Scope
- Role-specific dashboard views with KPI widgets
- Inventory reports, ticket performance, PM compliance
- Device reliability and breakdown trends
- Maintenance cost analysis
- Engineer workload and performance metrics
- PDF and Excel export engine
- Generated report history with download
- SLA target tracking

### Dependencies
- Phase 5 complete (maintenance data exists for reporting)

### Acceptance Criteria
1. Dashboards show correct scoped data per role
2. Reports enforce organizational scope boundaries
3. PDF/Excel exports include filters, date range, and timezone
4. Report history provides immutable download links

### Status: `COMPLETE`

---

## Phase 7: PWA & Notifications — `COMPLETE`

### Objective & Business Value
Complete the PWA installation experience and in-app notification system for real-time operational awareness.

### In-Scope
- Web App Manifest with icons
- Service worker for offline app shell
- Install prompt handling
- In-app notification center
- Notification preferences per user
- Real-time notification delivery (SSE/WebSocket)
- Notification triggers for tickets, maintenance, status changes

### Dependencies
- Phase 6 complete (dashboard and reports provide notification context)

### Acceptance Criteria
1. App installable on Android and iOS via browser
2. Offline shell loads when network unavailable
3. Notifications delivered in real-time for critical events
4. Users can configure notification preferences

### Status: `COMPLETE`

---

## Phase 8: Testing & Production Hardening — `COMPLETE`

### Objective & Business Value
Comprehensive testing, security hardening, and production deployment readiness.

### In-Scope
- Unit tests for business logic and state machines
- Integration tests for API endpoints
- Permission/authorization test suite
- Security testing (scope isolation, input validation)
- Performance testing against documented targets
- Production Docker Compose with Nginx/Caddy
- Backup configuration and restoration testing
- Error monitoring setup

### Dependencies
- All previous phases complete

### Acceptance Criteria
1. All documented acceptance criteria from Phases 1-7 pass automated tests
2. Permission tests verify scope isolation across organizations
3. Page load times meet documented performance targets
4. Production deployment starts successfully with `docker compose up`
5. Database backup and restoration verified

### Status: `COMPLETE`
