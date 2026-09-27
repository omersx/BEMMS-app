# 🏥 BEMMS — Biomedical Engineering & Maintenance Management System

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.36-C5F74F?style=flat&logo=drizzle)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-5.0-6E9F18?style=flat&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Compliance](https://img.shields.io/badge/Compliance-21_CFR_Part_11-emerald)]()

**BEMMS** is a production-grade, full-stack Biomedical Engineering and Computerized Maintenance Management System (CMMS) designed for hospitals, clinical healthcare networks, and medical device service teams.

It bridges the gap between frontline clinical healthcare workers and biomedical engineering teams—enabling instant equipment triage, QR-based mobile fault reporting, preventive maintenance tracking, and FDA 21 CFR Part 11 compliant cryptographic electronic signatures.

---

## 🌟 Key Features

### 1. 📋 Medical Equipment Inventory & Lifecycle Management
- **Centralized Asset Registry**: Track equipment across hospitals, departments, wards, and rooms.
- **Criticality & Risk Scoring**: Classify devices by WHO risk tiers (Class I, IIa, IIb, III) and operational criticality.
- **Availability State Machine**: Real-time status tracking (`operational`, `operational_with_limitations`, `under_maintenance`, `under_repair`, `waiting_for_parts`, `awaiting_release`, `standby`, `out_of_service`, `decommissioned`).
- **Complete Audit Trail**: Every status change, location relocation, and calibration event is permanently logged with timestamps and actor IDs.

### 2. 📱 QR Code Generation & Mobile Field Scanning
- **Instant Camera Scanner**: Built-in QR camera scanner (`html5-qrcode`) for instant mobile device lookup.
- **High-Resolution QR Labels**: Printable labels with hospital branding, equipment name, asset tag, and direct URL.
- **Public & Authenticated Scan Workflow**: Clinical staff can scan any unit from their phone to immediately view availability and report faults without typing serial numbers.

### 3. 🎫 Clinical Helpdesk & Ticket Triage System
- **Color-Coded Triage Queue**: Visual priority cards with left accent rails:
  - 🔴 **Red / Rose**: New, unassigned, and high-urgency problem tickets.
  - 🟡 **Yellow / Amber**: Active repairs underway.
  - 📦 **Orange**: Paused awaiting spare parts from vendor.
  - 🟢 **Emerald Green**: Repaired and certified operational.
  - ⚪ **Slate Blue**: Signed off and permanently archived.
- **Card View vs. Table View**: Seamless switcher between touch-friendly responsive cards and compact data tables.
- **Live Status Filtering**: Real-time search by title, ticket #, equipment model, asset tag, and department.

### 4. 📦 Spare Parts Hold & Vendor Workflow
- **Integrated Supply Chain Hold**: Pause active repairs when replacement boards, sensors, or cables must be ordered.
- **Clinical Department Visibility**: Automatically notifies ward staff and dashboard that equipment is on hold.
- **One-Click Resumption**: Resume work instantly when parts arrive at the hospital workshop.

### 5. 🔏 21 CFR Part 11 Compliant Electronic Signatures
- **Cryptographic Tamper-Evidence**: Password re-authentication generates SHA-256 hash digests permanently chained into regulatory audit tables.
- **Binding Attestation Statements**: Legal attestation captured for Acceptance, Resolution, and Formal Closure.
- **Multi-Party Sign-Off**: Performer, Reviewer, and Release Authority signature hierarchies.

### 6. 🔧 Preventive Maintenance (PM) & Compliance
- **Automated Recurrence Engine**: Scheduled maintenance occurrences generated based on calendar frequency (monthly, quarterly, semi-annual, annual).
- **Inspection Checklists**: Step-by-step biomedical verification procedures with electrical safety and calibration standards.

### 7. 🏥 Hospital Hierarchy & Role-Based Access Control (RBAC)
- **Multi-Tenant Architecture**: Organization ➔ Hospital ➔ Department ➔ Location.
- **Strict Role Separation**:
  - `SYS_ADMIN`: Complete system configuration, user provisioning, and audit logs.
  - `BIOMED_MGR`: Work order allocation, QA approval, and compliance reporting.
  - `BIOMED_ENG` / `BIOMED_TECH`: Active repair execution, electronic signatures, and parts tracking.
  - `DEPT_MGR` / `CLINICAL_STAFF`: Equipment scanning, department availability tracking, and fault reporting.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Actions, React 19) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Database & ORM**| [PostgreSQL 16](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) |
| **Authentication** | [Auth.js / NextAuth v5](https://authjs.dev/) with bcrypt password hashing |
| **Validation** | [Zod](https://zod.dev/) type validation schemas |
| **Testing** | [Vitest](https://vitest.dev/) (Unit & integration test suites) |
| **Deployment** | [Docker Compose](https://docs.docker.com/compose/) + [Caddy](https://caddyserver.com/) Reverse Proxy |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (v9+) or npm
- [Docker & Docker Compose](https://www.docker.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/omersx/BEMMS-app.git
cd BEMMS-app
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(The default `.env.example` is pre-configured to work out-of-the-box with the local Docker database).*

### 3. Start Database via Docker
```bash
docker compose up -d db
```

### 4. Install Dependencies & Initialize Database
```bash
pnpm install
pnpm db:push
pnpm db:seed
```

### 5. Start the Development Server
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

**Default Administrator Account:**
- **Email:** `admin@bemms.local`
- **Password:** `admin123`

---

## 🧪 Testing & Code Quality

Run automated test suites with Vitest:
```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate code coverage report
pnpm test:coverage
```

Type checking:
```bash
pnpm exec tsc --noEmit
```

---

## 📁 Project Structure

```text
BEMMS-app/
├── src/
│   ├── app/                      # Next.js 15 App Router pages & API routes
│   │   ├── (auth)/               # Login & authentication routes
│   │   ├── (dashboard)/          # Authenticated application modules
│   │   │   ├── admin/            # Hospital, department, user, and system administration
│   │   │   ├── departments/      # Department overview and device availability
│   │   │   ├── devices/          # Equipment lifecycle, profiles, and QR codes
│   │   │   ├── maintenance/      # Tasks, work orders, and electronic signatures
│   │   │   ├── reports/          # KPI dashboards, compliance, and workload reports
│   │   │   ├── scan/             # Mobile camera QR scanner & lookup
│   │   │   └── tickets/          # Helpdesk triage, status cards, and resolution
│   │   └── api/                  # REST endpoints (export, QR, web push)
│   ├── components/               # React UI components (shadcn/ui + domain components)
│   │   ├── admin/                # Settings, audit logs, and data management
│   │   ├── departments/          # Department visual cards and metrics
│   │   ├── devices/              # Status badges, QR generators, and transfer dialogs
│   │   ├── signatures/           # 21 CFR Part 11 signature dialogs and audit chain
│   │   ├── tickets/              # Ticket cards view, triage panels, and resolution flows
│   │   └── ui/                   # Reusable shadcn/ui primitives
│   ├── lib/
│   │   ├── actions/              # Next.js Server Actions (type-safe business logic)
│   │   ├── auth/                 # RBAC, session verification, and permission checks
│   │   ├── db/                   # Drizzle ORM schema definitions and migrations
│   │   ├── utils/                # Cryptography (SHA-256), attestations, and exports
│   │   └── validators/           # Zod validation schemas and unit tests
├── docker-compose.yml            # Local development PostgreSQL configuration
├── docker-compose.prod.yml       # Production container deployment
├── Dockerfile                    # Multi-stage optimized production Docker build
├── Caddyfile                     # Automatic HTTPS Caddy configuration
└── package.json                  # Dependencies and scripts
```

---

## 📜 Compliance & Regulatory Standards

- **FDA 21 CFR Part 11**: Cryptographic password re-authentication, immutable audit logging, electronic signature manifest, and SHA-256 chain of custody.
- **IEC 62353**: In-service and post-repair medical electrical equipment safety testing workflows.
- **Role Separation of Duties**: Prevents engineers from approving their own work orders when managerial sign-off policy is active.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
