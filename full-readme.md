# 🏥 BEMMS — Biomedical Engineering & Maintenance Management System
## Complete Architectural, Clinical, Technical, and Operational Reference Manual

---

## 📑 Table of Contents

1. [Executive Overview & Core Vision](#1-executive-overview--core-vision)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [Healthcare Facility Hierarchy & Multi-Tenancy](#3-healthcare-facility-hierarchy--multi-tenancy)
4. [User Roles, Permissions & Separation of Duties](#4-user-roles-permissions--separation-of-duties)
5. [Medical Equipment Inventory & Device Lifecycle](#5-medical-equipment-inventory--device-lifecycle)
6. [QR Code Engine & Mobile Field Access](#6-qr-code-engine--mobile-field-access)
7. [Helpdesk Fault Reporting & Ticket Lifecycle](#7-helpdesk-fault-reporting--ticket-lifecycle)
8. [Biomedical Engineer Triage & Work Orders](#8-biomedical-engineer-triage--work-orders)
9. [Preventive Maintenance (PM) & Compliance Scheduling](#9-preventive-maintenance-pm--compliance-scheduling)
10. [21 CFR Part 11 Electronic Signatures & Audit Traceability](#10-21-cfr-part-11-electronic-signatures--audit-traceability)
11. [Reports, Analytics & KPI Dashboards](#11-reports-analytics--kpi-dashboards)
12. [Complete Database Schema & Entity Relationships](#12-complete-database-schema--entity-relationships)
13. [Installation, Local Setup & Development Guide](#13-installation-local-setup--development-guide)
14. [Testing, Verification & Quality Assurance](#14-testing-verification--quality-assurance)
15. [Production Deployment & Containerization](#15-production-deployment--containerization)
16. [Security, Governance & Data Integrity](#16-security-governance--data-integrity)

---

## 1. Executive Overview & Core Vision

**BEMMS** (Biomedical Engineering & Maintenance Management System) is an enterprise-grade, regulatory-compliant Computerized Maintenance Management System (CMMS) engineered specifically for hospital networks, healthcare institutions, and biomedical engineering service organizations.

### The Problem in Modern Hospitals
In most healthcare facilities:
- Frontline nurses and doctors face complicated software when medical equipment fails, leading to unrecorded verbal complaints, equipment hoarding, or unquarantined faulty devices remaining at patient bedsides.
- Biomedical engineering departments manage paper-based work orders or generic IT ticketing systems that lack clinical risk scoring, IEC 62353 safety testing checklists, spare parts hold tracking, and calibration schedules.
- Regulatory audits (FDA, Joint Commission, ISO 13485) struggle to establish clear proof of who repaired, reviewed, and released a life-support device into patient service.

### The BEMMS Solution
BEMMS establishes an unbroken chain of custody and accountability between frontline clinical teams and specialized biomedical engineers:

```mermaid
sequenceDiagram
    autonumber
    actor Nurse as 👩‍⚕️ Clinical Staff (Ward)
    participant QR as 📱 Mobile QR Scanner
    participant App as 🏥 BEMMS Core
    actor Biomed as 🛠️ Biomedical Engineer
    participant Audit as 🔒 21 CFR Part 11 Ledger

    Nurse->>QR: Scans Equipment QR Code
    QR->>App: Fetches device identity & status
    App-->>Nurse: Displays Quick Report Form
    Nurse->>App: Submits Fault (Symptoms & Impact)
    App->>App: Sets Device to Under Repair
    App->>Biomed: Enqueues P1-P4 Ticket & Push Alert
    Biomed->>App: Acknowledges & Triages Work Order
    opt Waiting for Spare Parts
        Biomed->>App: Places Ticket on Hold (Part Name & Vendor PO)
        App->>Nurse: Ward Alert: "Waiting for Parts"
        Biomed->>App: Parts Received (Resume Work)
    end
    Biomed->>App: Executes Repair & IEC 62353 Safety Tests
    Biomed->>App: Submits Resolution & Re-authenticates Password
    App->>Audit: Cryptographic SHA-256 Signature Appended
    App->>App: Sets Device to Operational / Clean QA Release
    App-->>Nurse: Notification: "Device Safe for Patient Care"
```

### Core Design Principles
1. **Unified Helpdesk Model**: No split systems for "repairs" vs "maintenance." All equipment issues, preventive maintenance triggers, routine calibrations, and safety inspections flow through a single ticket pipeline.
2. **Device as the Source of Truth**: The physical device record is permanent. Identity, live availability, calibration history, historical tickets, location movements, and electronic signatures all tie back to the unique asset.
3. **Progressive Disclosure**: Clinical staff see simple, actionable interfaces (device operational status, report a fault, track ticket). Complex technical telemetry, electrical safety calculations, and vendor schematics are reserved for biomedical engineering profiles.
4. **Mobile-First Frontline UX**: Every clinical screen is optimized for touch targets ($\ge 44\text{px}$) and fast mobile camera QR scanning in hospital corridors and ICU suites.

---

## 2. System Architecture & Technology Stack

BEMMS is built upon a modern, full-stack TypeScript architecture optimized for high performance, strict type safety, and transactional reliability.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Front-End Presentation Layer                    │
│   Next.js 15 (App Router) • React 19 • Tailwind CSS • shadcn/ui        │
│   Radix UI Primitives • Lucide Icons • HTML5-QRCode Scanner            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Server Actions & REST APIs
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Application & Logic Layer                      │
│   • Server Actions with Transactional Integrity                        │
│   • RBAC & Scope Enforcement (`src/lib/auth/rbac.ts`)                   │
│   • Auth.js (NextAuth v5) Session Management                           │
│   • Zod Runtime Schema Validation                                      │
│   • Web Push (VAPID) & Server-Sent Events (SSE)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Drizzle ORM Type-Safe Queries
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Persistence & Security Layer                   │
│   • PostgreSQL 16 (Relational Database & JSONB Storage)                │
│   • SHA-256 Cryptographic Audit Chain (`src/lib/utils/crypto.ts`)      │
│   • 21 CFR Part 11 Electronic Signature Attestation Registry           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Containerization & Networking
┌───────────────────────────────────▼────────────────────────────────────┐
│                      Infrastructure & Deployment                       │
│   • Multi-Stage Docker Build (`Dockerfile`)                            │
│   • Docker Compose Orchestration (`docker-compose.prod.yml`)           │
│   • Caddy Automatic HTTPS Reverse Proxy (`Caddyfile`)                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Breakdown

| Component | Technology | Rationale |
|---|---|---|
| **Web Framework** | Next.js 15 (App Router, React 19) | Server Components for low client bundles; Server Actions for type-safe mutations without boilerplate REST endpoints. |
| **Language** | TypeScript 5.7 (Strict Mode) | Full-stack end-to-end typing from database schemas to UI component props. |
| **Database** | PostgreSQL 16 | ACID-compliant transactional consistency, native UUIDs, JSONB for filter parameters, and relational integrity. |
| **ORM** | Drizzle ORM 0.36 | Zero-overhead, type-safe SQL-like queries with automatic migration generation via Drizzle Kit. |
| **Authentication** | Auth.js (NextAuth v5 beta) | Battle-tested session cookies, JWT verification, and bcrypt password hashing. |
| **Validation** | Zod 3.24 | Runtime validation of all user inputs, API payloads, and query filters. |
| **Styling** | Tailwind CSS 3.4 + shadcn/ui | Accessible, consistent medical equipment aesthetic with dark/light mode support. |
| **Testing** | Vitest 5.0 | High-speed unit and integration testing with 10 test suites covering validators, crypto, and RBAC. |
| **Reverse Proxy** | Caddy 2 | Production TLS termination with automatic Let's Encrypt certificates and security headers. |

---

## 3. Healthcare Facility Hierarchy & Multi-Tenancy

To accurately mirror large hospital networks, BEMMS implements a strict 4-tier organizational hierarchy:
```mermaid
graph TD
    Org["🏢 Healthcare Organization (Multi-Hospital Tenant)"]
    Hosp1["🏥 Central Teaching Hospital"]
    Hosp2["🏥 Regional Trauma Center"]
    
    Org --> Hosp1
    Org --> Hosp2
    
    DeptICU["🩺 Intensive Care Unit (ICU)"]
    DeptER["🩺 Emergency Department (ED)"]
    DeptSurg["🩺 Surgical Theatres (OR)"]
    
    Hosp1 --> DeptICU
    Hosp1 --> DeptER
    Hosp1 --> DeptSurg
    
    Loc1["📍 ICU Bay 01 (Bed A)"]
    Loc2["📍 ICU Bay 02 (Bed B)"]
    Loc3["📍 Trauma Suite 1"]
    
    DeptICU --> Loc1
    DeptICU --> Loc2
    DeptER --> Loc3
    
    Dev1["🔬 Mindray N12 Patient Monitor"]
    Dev2["🔬 Dräger Evita V500 Ventilator"]
    Dev3["🔬 Zoll R-Series Defibrillator"]
    
    Loc1 --> Dev1
    Loc2 --> Dev2
    Loc3 --> Dev3

    classDef org fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef hosp fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef dept fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef loc fill:#f3e8ff,stroke:#9333ea,stroke-width:2px;
    classDef dev fill:#ffffff,stroke:#475569,stroke-width:2px;

    class Org org;
    class Hosp1,Hosp2 hosp;
    class DeptICU,DeptER,DeptSurg dept;
    class Loc1,Loc2,Loc3 loc;
    class Dev1,Dev2,Dev3 dev;
```

### Scope Enforcement Model
Every user account operates within an assigned organizational scope:
- **Global Scope (`organizationId`)**: System and Organization Administrators have visibility across all affiliated hospital campuses.
- **Hospital Scope (`hospitalId`)**: Hospital Administrators and Biomedical Service Teams operate across all departments within their designated medical center.
- **Department Scope (`departmentId`)**: Clinical Staff and Department Heads are restricted to equipment, tickets, and alerts physically or administratively assigned to their ward.

---

## 4. User Roles, Permissions & Separation of Duties

BEMMS enforces a **Multi-Role RBAC Matrix** defined in `src/lib/auth/rbac.ts` and `src/lib/db/schema/enums.ts`:

### Standard Roles

| Role Code | Title | Responsibilities | Scope Boundaries |
|---|---|---|---|
| `SYS_ADMIN` | System Administrator | System settings, telemetry, security policies, database management, global user provisioning. | Entire platform |
| `ORG_ADMIN` | Organization Administrator | Multi-hospital governance, master equipment categories, cross-facility reporting. | Organization |
| `HOSP_ADMIN` | Hospital Administrator | Facility-level user onboarding, department creation, hospital policy enforcement. | Hospital |
| `BIOMED_MGR` | Biomedical Manager | Work order allocation, triage supervision, QA review, clinical release sign-off. | Hospital / Biomed Dept |
| `BIOMED_ENG` | Biomedical Engineer | Triage assessment, diagnostic troubleshooting, repairs, parts management, performer signatures. | Hospital / Assigned Tickets |
| `BIOMED_TECH`| Biomedical Technician | Routine preventive maintenance, calibration checklists, battery replacements, visual inspections. | Hospital / Assigned Tasks |
| `DEPT_MGR` | Department Head / Nurse Manager | Department equipment availability, replacement requests, service approval, staff management. | Department |
| `STAFF` | Clinical Staff / Doctor / Nurse | Mobile QR scanning, fault reporting, tracking submitted requests, adding requester notes. | Department |
| `AUDITOR` | Regulatory & Quality Auditor | Read-only access to tamper-evident audit trails, signature records, calibration histories. | Organization / Read-Only |

### Separation of Duties (21 CFR Part 11 Rule)
To prevent conflicts of interest and regulatory non-compliance:
1. **Performer $\ne$ Reviewer**: An engineer who executes a repair or calibration cannot approve their own review gate when an independent review policy is enabled.
2. **Technical Authority Isolation**: An administrator cannot sign a clinical release or declare a medical device operational unless explicitly holding a certified biomedical role.

---

## 5. Medical Equipment Inventory & Device Lifecycle

The Medical Device is the core physical asset in BEMMS (`src/lib/db/schema/devices.ts`).

### Device Identification & Classification
- **Identifiers**: Asset Tag Number, Serial Number, Model Name, Manufacturer, Barcode/QR reference.
- **Risk Classifications (WHO / FDA Model)**:
  - `Class I`: Low risk (e.g., examination lamps, hospital beds).
  - `Class IIa`: Medium-low risk (e.g., infusion pumps, ultrasonic diagnostic units).
  - `Class IIb`: Medium-high risk (e.g., electrosurgical units, ventilators, anesthesia machines).
  - `Class III`: Critical / High risk (e.g., defibrillators, heart-lung machines, pacemakers).
- **Criticality Index**: Operational impact rating ($1$ to $5$) determining triage priority during equipment failure.

### Operational Availability State Machine

```mermaid
stateDiagram-v2
    [*] --> operational : Commission & Inspect
    
    operational --> under_repair : Report Fault / Breakdown
    operational --> under_maintenance : Scheduled PM / Calibration
    operational --> standby : Transferred to Reserve Pool
    
    standby --> operational : Deployed to Clinical Ward
    
    under_repair --> waiting_for_parts : Order Replacement Board / Sensor
    waiting_for_parts --> under_repair : Parts Received (Resume Work)
    
    under_repair --> awaiting_release : Repair Complete (Pending QA)
    under_maintenance --> awaiting_release : Service Complete (Pending QA)
    
    awaiting_release --> operational : QA Cleared & Certified Safe
    awaiting_release --> operational_with_limitations : Cleared with Clinical Constraints
    under_repair --> operational_with_limitations : Repaired with Partial Functions
    
    operational_with_limitations --> under_repair : Full Fix Resumed
    
    under_repair --> out_of_service : Condemned / Unrepairable
    operational --> out_of_service : Catastrophic Failure / Biohazard
    
    out_of_service --> decommissioned : Salvage Parts & Dispose Asset
    decommissioned --> [*]
```

### The 9 Device Status Codes

1. `operational`: Fully tested, calibrated, and cleared for bedside patient care.
2. `operational_with_limitations`: Cleared for clinical use with specific restrictions (e.g., *"Channel 2 disabled; Channel 1 calibrated for adult ECG only"*). The constraint note is permanently displayed on all ward views.
3. `under_repair`: Active corrective maintenance underway in workshop or on-site.
4. `waiting_for_parts`: Paused awaiting replacement boards, sensors, or vendor parts.
5. `under_maintenance`: Routine scheduled maintenance or calibration underway.
6. `awaiting_release`: Repair finished; device quarantined pending formal QA verification.
7. `standby`: Functional unit stored in hospital central equipment reserve.
8. `out_of_service`: Condemned, unrepairable, or hazardous. Barred from patient care.
9. `decommissioned`: Permanently archived and disposed. Removed from active inventory.

---

## 6. QR Code Engine & Mobile Field Access

BEMMS eliminates manual serial number data entry through an integrated QR engine.

### Label Architecture
- **High-Density Vector Generation**: Powered by `qrcode.react` and `qrcode`, producing vector-sharp SVGs and PNGs.
- **Printed Label Payload**: Includes Hospital Name, Department Name, Device Title, Asset Number, Unique Code, and an encoded direct mobile resolution link:
  `https://[hospital-domain]/scan/[unique-code]`
- **Opaque Reference Security**: QR URLs use cryptographically unique IDs, preventing malicious URL enumeration.

### Role-Aware Scan Landing (`/scan/[code]`)
When a QR code is scanned:

```mermaid
flowchart TD
    Scan["📷 Frontline User Scans Device QR Code"]
    AuthCheck{"Is User Logged In?"}
    
    Scan --> AuthCheck
    
    AuthCheck -->|No| PublicLanding["🌐 Public Safety Landing Page"]
    PublicLanding --> PubDetails["• Basic Device Name & Asset Tag<br/>• Safety Warning / Availability Banner<br/>• Prompts Login to Report Fault"]
    
    AuthCheck -->|Yes| RoleCheck{"What is User's Role & Scope?"}
    
    RoleCheck -->|Clinical Staff / Nurse| WardView["🩺 Clinical Ward Interface"]
    WardView --> WardActions["• Clear Operational / Limitation Banner<br/>• Instant 3-Step Fault Reporting Form<br/>• View Active Department Tickets<br/>• Track Submitted Requests"]
    
    RoleCheck -->|Biomedical Engineer| TechView["🛠️ Comprehensive Technical Profile"]
    TechView --> TechActions["• Full Specification & Schematics<br/>• Complete Ticket & Work Order History<br/>• PM & Calibration Status Checks<br/>• IEC 62353 Electrical Test Logs<br/>• Direct Actions: Change Status / Transfer / Sign"]
    
    RoleCheck -->|System / Hospital Admin| AdminView["⚙️ Asset Administration View"]
    AdminView --> AdminActions["• Edit Master Identity & Serial Numbers<br/>• Inter-Hospital Relocation & Transfer<br/>• Archive / Decommission Asset"]

    classDef start fill:#f8fafc,stroke:#334155,stroke-width:2px;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef clinical fill:#ecfdf5,stroke:#059669,stroke-width:2px;
    classDef biomed fill:#eff6ff,stroke:#2563eb,stroke-width:2px;
    classDef admin fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px;

    class Scan start;
    class AuthCheck,RoleCheck decision;
    class WardView,WardActions clinical;
    class TechView,TechActions biomed;
    class AdminView,AdminActions admin;
```

---

## 7. Helpdesk Fault Reporting & Ticket Lifecycle

### Frontline Clinical Fault Reporting (`/tickets/create`)
Clinical staff report faults through a guided 3-step form:
1. **Device Identification**: Scanned via mobile camera or selected from department inventory.
2. **Clinical Impact Level**:
   - `device_not_usable`: Unit completely non-functional.
   - `device_degraded`: Unit operating intermittently or with error alarms.
   - `safety_hazard`: Sparks, smoke, burning smell, loose high-voltage wiring, or fluid leakage.
   - `accessories_missing`: Cables, probes, or power adapters missing.
3. **Symptom Category**: Power supply, display, sensor probe, mechanical physical damage, calibration error, or connectivity.

### Helpdesk Ticket State Machine

| Status Code | Badge Name | Visual Styling | Description |
|---|---|---|---|
| `new` | New Ticket | 🔴 Red Rail (`border-l-rose-500`) | Submitted by ward staff; awaiting biomedical engineering acknowledgement. |
| `acknowledged`| Acknowledged | 🔵 Blue Rail (`border-l-blue-500`) | Biomed engineering has received the request into the triage queue. |
| `in_triage` | In Triage | 🟣 Purple Rail (`border-l-purple-500`) | Engineer assessing technical failure and assigning priority/specialist. |
| `in_progress` | In Progress | 🟡 Amber Rail (`border-l-amber-500`) | Active repair work or diagnostic testing in progress. |
| `waiting_parts_vendor` | Waiting Parts | 🟠 Orange Rail (`border-l-orange-500`) | On hold awaiting external vendor parts. Special hold card active. |
| `waiting_requester` | Waiting Info | ⚪ Sky Rail (`border-l-sky-500`) | Clarification requested from clinical department. |
| `resolved` | Resolved | 🟢 Emerald Rail (`border-l-emerald-500`) | Work completed and signed off with cryptographic SHA-256 signature. |
| `closed` | Closed | 🔘 Slate Rail (`border-l-slate-400`) | Formally signed and archived. |
| `cancelled` | Cancelled | ⚪ Zinc Rail (`border-l-zinc-300`) | Voided or duplicate request (cancellation reason required). |

```mermaid
stateDiagram-v2
    [*] --> new : Ward Staff Reports Fault
    
    new --> acknowledged : Biomed Acknowledges Request
    acknowledged --> in_triage : Begin Clinical Triage (P1-P4)
    
    in_triage --> waiting_requester : Request Ward Clarification
    waiting_requester --> in_triage : Staff Provides Information
    
    in_triage --> in_progress : Allocate & Start Repair
    
    in_progress --> waiting_parts_vendor : Supply Chain Hold (Order Spare Parts)
    waiting_parts_vendor --> in_progress : Parts Received (Resume Work)
    
    in_progress --> resolved : Resolve & Cryptographic e-Sign
    waiting_parts_vendor --> resolved : Direct Resolution / Condemn Asset
    
    resolved --> closed : Formal Managerial Verification Close
    
    resolved --> in_progress : Controlled Reopen / Recurrence
    closed --> in_progress : Controlled Reopen with Justification
    
    new --> cancelled : Voided / Duplicate Request
    in_triage --> cancelled : Non-Technical Issue Cancelled
```

### Cards Grid vs. Table View Switcher (`/tickets`)
The tickets module features a dual-layout interface:
- **Card Grid View**: Responsive 2-column cards featuring colored status rails, equipment name, asset tags, relative timestamps, priority pills, and spare parts indicators.
- **Data Table View**: Dense, column-sorted desktop table for bulk ticket processing.
- **Filter Pills**: One-click quick filters (All, New/Unassigned, In Progress, Waiting Parts, Resolved, Closed) with live ticket counters.

---

## 8. Biomedical Engineer Triage & Work Orders

When a ticket enters `in_triage`, a qualified biomedical engineer or supervisor executes the formal **Clinical Engineering Triage**:

### Priority Scoring & SLA Matrix

| Priority Code | Clinical Urgency | Target Response Time | Target Resolution Time | Example Clinical Scenarios |
|---|---|---|---|---|
| `p1_critical` | Immediate Life Threat | $\le 15\text{ minutes}$ | $\le 4\text{ hours}$ | Defibrillator failure in Emergency Department, ICU ventilator alarm malfunction. |
| `p2_high` | High Clinical Impact | $\le 1\text{ hour}$ | $\le 12\text{ hours}$ | Anesthesia monitor in operating theater, incubator temperature instability. |
| `p3_medium` | Moderate Clinical Disruption | $\le 4\text{ hours}$ | $\le 48\text{ hours}$ | Ward infusion pump battery failure, ECG machine lead malfunction. |
| `p4_low` | Low / Routine | $\le 24\text{ hours}$ | $\le 5\text{ days}$ | Examination light replacement, routine cosmetic bracket repair. |

### Technical Maintenance Categorization
The engineer designates the technical work type:
- `corrective_maintenance`: Unscheduled restoration of failed equipment.
- `preventive_maintenance`: Scheduled protocol servicing.
- `electrical_safety_testing`: Leakage current, grounding resistance (IEC 62353).
- `calibration`: Measurement standard verification (e.g., NIBP pressure simulator).
- `installation_commissioning`: New equipment verification and hospital intake.
- `decommissioning_disposal`: End-of-life condemnation and hazardous material purge.

---

## 9. Preventive Maintenance (PM) & Compliance Scheduling

BEMMS automates regulatory preventive maintenance schedules through recurring plans (`src/lib/db/schema/maintenance-plans.ts`).

### PM Engine Architecture
1. **Maintenance Plans**: Reusable templates defining frequency (e.g., Mindray N-Series 6-Month PM), attached checklists, and estimated labor hours.
2. **Scheduled Occurrences**: Concrete calendar obligations generated per equipment asset.
3. **Compliance Tracking**:
   - `scheduled`: Planned in future.
   - `due`: Maintenance window active ($30\text{ days}$ prior to deadline).
   - `overdue`: Regulatory deadline breached. Alerts triggered on management dashboards.
   - `completed`: Successfully verified and electronically signed.

### IEC 62353 Electrical Safety Inspection
Checklists include automated validation for:
- Protective Earth Resistance ($R_{\text{PE}} \le 0.2\,\Omega$).
- Equipment Leakage Current ($I_{\text{L}} \le 500\,\mu\text{A}$).
- Applied Part Leakage Current (Patient Leads $I_{\text{AP}} \le 50\,\mu\text{A}$).

---

## 10. 21 CFR Part 11 Electronic Signatures & Audit Traceability

To fulfill FDA 21 CFR Part 11 and international medical device compliance, BEMMS implements a cryptographic electronic signature system (`src/lib/actions/signatures.ts` and `src/lib/utils/crypto.ts`).

### The Electronic Signature Challenge
A standard browser session is **not** a valid legal signature. When signing an action (Acceptance, Resolution, Clinical Release, or Closure):
1. **Password Re-Authentication**: The user must explicitly re-enter their secret password.
2. **Binding Attestation Statement**: A legally binding statement is confirmed (e.g., *"I confirm that the issue has been resolved and the resolution summary accurately describes the work performed under 21 CFR Part 11"*).
3. **Cryptographic SHA-256 Digest**: The system generates a deterministic hash capturing:
   $$\text{Digest} = \text{SHA-256}(\text{Ticket ID} + \text{Device Status} + \text{Summary} + \text{Signer ID} + \text{Timestamp} + \text{Salt})$$
4. **Audit Chain Linking**: The signature is permanently inserted into `signatures` and `signature_events` tables with actor metadata, IP address, and hash chain.

```mermaid
flowchart LR
    subgraph Challenge["1. Signer Challenge"]
        A1["Biomed Engineer clicks<br/>'Resolve & Sign'"] --> A2["Password Re-Authentication<br/>(Secret Challenge)"]
        A2 --> A3["Binding Legal Attestation<br/>(21 CFR Part 11)"]
    end

    subgraph Digest["2. SHA-256 Digest"]
        A3 --> B1["Render Snapshot Payload:<br/>• Ticket ID<br/>• Resolution Summary<br/>• Final Device Status<br/>• Signer User ID & Role<br/>• Server ISO Timestamp"]
        B1 --> B2["Generate Deterministic<br/>SHA-256 Cryptographic Hash"]
    end

    subgraph Chain["3. Hash Chained Audit Ledger"]
        B2 --> C1["Fetch Previous Event Hash<br/>(Blockchain-style Chaining)"]
        C1 --> C2["Lock Record in PostgreSQL:<br/>• signatures table<br/>• signature_events table"]
        C2 --> C3["Immutable Regulatory Proof<br/>(Tamper-Evident)"]
    end

    classDef action fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
    classDef digest fill:#ecfdf5,stroke:#10b981,stroke-width:2px;
    classDef chain fill:#fef3c7,stroke:#f59e0b,stroke-width:2px;

    class A1,A2,A3 action;
    class B1,B2 digest;
    class C1,C2,C3 chain;
```

---

## 11. Reports, Analytics & KPI Dashboards

The reporting suite provides instant visibility into hospital equipment reliability and service performance:

### Core Management Reports
- **Inventory & Availability Report (`/reports/inventory`)**: Equipment count grouped by department, manufacturer, and operational availability status.
- **Ticket Performance & MTTR Report (`/reports/tickets`)**: Mean Time to Respond (MTTR), Mean Time to Resolve (MTBF), priority breakdowns, and backlog trends.
- **PM Compliance Report (`/reports/maintenance`)**: Percentage of scheduled maintenance completed on time vs. overdue, meeting Joint Commission inspection standards.
- **Cost Analytics Report (`/reports/costs`)**: Direct parts expenses, external vendor service invoices, and biomedical labor allocation.
- **Engineer Workload Report (`/reports/workload`)**: Fair allocation metrics tracking active assignments and resolution velocity.

### Tamper-Evident CSV Export Engine
All reports support one-click CSV export featuring:
- Byte Order Mark (`BOM`) for seamless opening in Microsoft Excel.
- Regulatory Transparency Header recording exact filter parameters, user identity, generation timestamp, and timezone.

---

## 12. Complete Database Schema & Entity Relationships

The BEMMS schema is organized into 22 dedicated tables managed via Drizzle ORM:

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ HOSPITALS : contains
    HOSPITALS ||--o{ DEPARTMENTS : contains
    DEPARTMENTS ||--o{ LOCATIONS : contains
    DEPARTMENTS ||--o{ DEVICES : owns
    LOCATIONS ||--o{ DEVICES : houses
    MANUFACTURERS ||--o{ DEVICES : produces
    DEVICE_CATEGORIES ||--o{ DEVICES : classifies
    
    DEVICES ||--o{ SERVICE_TICKETS : generates
    USERS ||--o{ SERVICE_TICKETS : reports
    USERS ||--o{ SERVICE_TICKETS : assigned_to
    
    SERVICE_TICKETS ||--o{ TICKET_COMMENTS : contains
    SERVICE_TICKETS ||--o{ MAINTENANCE_TASKS : spawns
    
    DEVICES ||--o{ MAINTENANCE_SCHEDULE_OCCURRENCES : schedules
    MAINTENANCE_PLANS ||--o{ MAINTENANCE_SCHEDULE_OCCURRENCES : defines
    MAINTENANCE_SCHEDULE_OCCURRENCES ||--o{ MAINTENANCE_TASKS : executes
    
    MAINTENANCE_TASKS ||--o{ MAINTENANCE_RECORDS : finalizes
    MAINTENANCE_RECORDS ||--o{ SIGNATURES : seals
    SERVICE_TICKETS ||--o{ SIGNATURES : seals
    SIGNATURES ||--o{ SIGNATURE_EVENTS : chains

    ORGANIZATIONS {
        uuid id PK
        text name
        text code
    }
    HOSPITALS {
        uuid id PK
        uuid organization_id FK
        text name
        text code
    }
    DEPARTMENTS {
        uuid id PK
        uuid hospital_id FK
        text name
        text code
    }
    DEVICES {
        uuid id PK
        text asset_number
        text serial_number
        text model_name
        varchar current_status_code
        text status_limitations_note
        varchar risk_classification
    }
    SERVICE_TICKETS {
        uuid id PK
        text ticket_number
        varchar status_code
        varchar priority_code
        text title
        text resolution_summary
        varchar final_device_status_code
    }
    SIGNATURES {
        uuid id PK
        uuid signer_user_id FK
        text signer_role
        text meaning
        text content_hash
        timestamp signed_at
    }
```

### Table Dictionary

| Table Name | Description | Key Relationships |
|---|---|---|
| `organizations` | Top-level healthcare network tenant. | Primary tenant boundary. |
| `hospitals` | Physical hospital campus or facility. | Foreign key to `organizations`. |
| `departments` | Hospital wards (ICU, ER, Surgery). | Foreign key to `hospitals`. |
| `locations` | Physical rooms, bays, and beds. | Foreign key to `departments`. |
| `users` | User accounts, credentials, and settings. | Linked to `organizations` and `hospitals`. |
| `roles` | RBAC role definitions. | Master role catalog. |
| `user_role_assignments`| User-to-role mappings with scope. | Links `users`, `roles`, `hospitals`, `departments`. |
| `device_categories` | Clinical equipment classifications. | WHO risk tiers and maintenance intervals. |
| `manufacturers` | Medical device vendors (Mindray, GE, Philips).| Master catalog of authorized vendors. |
| `devices` | Physical medical assets and live status. | Linked to `departments`, `locations`, `manufacturers`. |
| `service_tickets` | Helpdesk problem reports and triage. | Linked to `devices`, `users` (reporter, assignee). |
| `ticket_comments` | Discussion threads (public vs. internal). | Linked to `service_tickets` and `users`. |
| `maintenance_plans` | Reusable PM interval definitions. | Linked to `device_categories` or specific `devices`.|
| `maintenance_schedule_occurrences` | Dated PM obligations. | Linked to `maintenance_plans` and `devices`. |
| `maintenance_tasks` | Operational engineering work orders. | Linked to `service_tickets` or `occurrences`. |
| `maintenance_records`| Immutable finalized technical history. | Linked to `maintenance_tasks` and `devices`. |
| `signatures` | Cryptographic 21 CFR Part 11 signatures. | Linked to `maintenance_records` or `tickets`. |
| `signature_events` | Signature audit events (void, amend). | Linked to `signatures` with hash chain. |
| `signature_policies` | Requirements for performer/reviewer/release.| Configures signature rules per hospital. |
| `audit_logs` | Immutable audit trail for all changes. | Captures entity, action, before/after delta, user. |
| `report_history` | Archive of generated compliance reports. | Links report type, filters, and file metadata. |
| `notifications` | In-app alerts and web push subscriptions. | User notification queue and status. |

---

## 13. Installation, Local Setup & Development Guide

### Prerequisites
- **Node.js**: `v20.10.0` or higher
- **Package Manager**: `pnpm` (`v9.0.0` or higher recommended)
- **Docker**: Docker Engine & Docker Compose

### Step 1: Clone the Repository
```bash
git clone https://github.com/omersx/BEMMS-app.git
cd BEMMS-app
```

### Step 2: Environment Configuration
Create your local environment file:
```bash
cp .env.example .env.local
```

Verify your `.env.local` contains valid database parameters:
```env
# Database Connection
DATABASE_URL=postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db

# NextAuth Secret (Generate via: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-32-characters-min

# Node Environment
NODE_ENV=development

# Web Push VAPID Keys (Optional for local testing)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@example.com
```

### Step 3: Launch PostgreSQL Database
Start the PostgreSQL 16 container:
```bash
docker compose up -d db
```
Verify the container is healthy:
```bash
docker compose ps
```

### Step 4: Install Dependencies & Initialize Database
```bash
# Install NPM packages
pnpm install

# Push Drizzle schema to PostgreSQL
pnpm db:push

# Seed default organization, roles, permissions, and administrator
pnpm db:seed
```

### Step 5: Start Development Server
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Default Administrator Account
- **Username / Email**: `admin@bemms.local`
- **Password**: `admin123`

---

## 14. Testing, Verification & Quality Assurance

BEMMS maintains strict quality assurance through automated test suites and strict type validation.

### Running Test Suites
Execute Vitest test runner:
```bash
# Run all unit and integration tests
pnpm test

# Run tests in continuous watch mode
pnpm test:watch

# Run tests with code coverage report
pnpm test:coverage
```

### Test Coverage Highlights
- `src/lib/validators/__tests__/tickets.test.ts`: Triage schemas, resolution validations, limitations notes, out-of-service rules.
- `src/lib/validators/__tests__/signatures.test.ts`: 21 CFR Part 11 password checks, attestation validation.
- `src/lib/validators/__tests__/devices-profile.test.ts`: Transfer dialogs, status change state transitions.
- `src/lib/utils/__tests__/crypto.test.ts`: SHA-256 tamper-evident digest verification.
- `src/lib/auth/__tests__/rbac.test.ts`: Role-based access control and scope boundary enforcement.

### TypeScript Compilation Check
Verify strict type conformance:
```bash
pnpm exec tsc --noEmit
```

---

## 15. Production Deployment & Containerization

### Standalone Production Docker Build
BEMMS includes a multi-stage, hardened `Dockerfile` creating a lightweight Node.js Alpine runtime:

```bash
# Build production Docker image
docker build -t bemms-app:latest .
```

### Production Orchestration (`docker-compose.prod.yml`)
Run the full production stack including PostgreSQL, BEMMS Next.js Standalone, and Caddy Reverse Proxy:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Caddy Reverse Proxy (`Caddyfile`)
Caddy provides automatic HTTPS with zero-configuration SSL certificate renewal, gzip compression, and security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 16. Security, Governance & Data Integrity

### Immutable Audit Architecture
- **Soft Deletion Only**: Medical equipment, departments, tickets, and user accounts are deactivated or archived, never permanently deleted.
- **Traceability of Retracted Work**: When a maintenance record is returned for rework or a ticket is reopened, prior versions remain viewable in the audit trail with timestamps and reviewer comments.

### Password Security & Cryptography
- Passwords hashed using industry-standard `bcryptjs` with high salt work factors.
- Cryptographic signatures generated using standard Node.js crypto SHA-256 routines with zero third-party cloud dependencies.

---

## 📄 License & Attribution

This software is licensed under the [MIT License](LICENSE).  
Copyright (c) 2026 BEMMS Contributors.
