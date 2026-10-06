# CryoTech Industrial ERP — Enterprise MERN Web Application

> **Production-grade, connected Enterprise Resource Planning (ERP) web application engineered for cryogenic equipment manufacturing, sales, procurement, quality assurance, logistics, and field service operations.**

---

## 1. System Overview

CryoTech Industrial ERP is a high-reliability, workflow-driven enterprise platform. It eliminates fragmented spreadsheets and siloed legacy systems by connecting the entire manufacturing lifecycle:
- **Sales & Commercials**: Lead capture, qualification, multi-revision quotation engine, automated 4-way Customer PO verification, confirmed sales orders, and advance payment verification.
- **Supply Chain & Inventory**: Automated Bill of Materials (BOM) explosion, stock reservation, double-entry inventory ledger movements, procurement RFQs, vendor bid comparison, and dock Goods Receipt Notes (GRN).
- **Manufacturing Shopfloor**: Work order scheduling, routing operations (Fabrication, Refrigeration/MLI, Electrical, Assembly), and Work-In-Progress (WIP) tracking.
- **Quality Assurance**: Helium mass-spectrometer leak tests, deep cold liquid nitrogen pull-down (-196°C), and automated Cryogenic Compliance Certification.
- **360° Digital Product Passport**: Immutable serialized lifecycle tracking linking raw materials, heat numbers, workstation operators, QA certificates, shipping manifests, and service logs.
- **Logistics & Invoicing**: Export shock-mount crating manifests, GST commercial tax invoices, outbound freight dispatch with LR/E-Way bill tracking, and consignee Proof of Delivery (POD).
- **Field Engineering**: Site rigging installation, pull-down commissioning, automated 12-to-36-month warranty activation, incident ticketing, and factory Return Material Authorization (RMA).

---

## 2. Technology Stack

- **Frontend**:
  - React 18 (Strictly JavaScript / JSX, NO TypeScript)
  - Vite 5 (High-speed bundler & dev server)
  - SCSS Modules & Custom Industrial CSS (Strictly NO Tailwind, NO Bootstrap)
  - React Router v6 (Declarative layout & protected route guards)
  - Redux Toolkit & Redux Saga (Asynchronous enterprise state orchestration)
  - Axios (JWT injection & 401 automatic redirection)
  - Material-UI Icons (Visual indicators & status badging)
- **Backend**:
  - Node.js v24 LTS & Express.js
  - MongoDB & Mongoose ODM (35+ collections with compound indexes)
  - JWT (JSON Web Tokens) Authentication & bcryptjs password hashing
  - Authoritative Finite State Machines (`workflowService.js`)
  - Centralized Error Middleware (`AppError`, HTTP 400-500 codes)
  - Multer Disk Uploads
- **Quality Assurance & Verification**:
  - Headless multi-phase automated integration test runner (`scripts/verification/test-e2e-workflow.js`)
  - Vite production bundle verification

---

## 3. Demo User Accounts

The system is pre-seeded with 12 specialized role personas.

**Universal Demo Password:** `Password@123`

| Persona | Email | Role | Core Access |
|---|---|---|---|
| **System Administrator** | `admin@example.com` | `ADMIN` | Universal Access, Master Data, Audit Trail |
| **Executive Management** | `management@example.com` | `MANAGEMENT` | Executive Approvals, High-level KPIs |
| **Sales Executive** | `sales@example.com` | `SALES` | Leads, Customers, Quotations |
| **Sales Manager** | `manager@example.com` | `SALES_MANAGER` | Quotation Approval, PO Verification, Sales Orders |
| **Accounts / Finance** | `accounts@example.com` | `ACCOUNTS` | Payment Verification, GST Tax Invoices |
| **Procurement Head** | `purchase@example.com` | `PURCHASE` | Shortage RFQs, Vendor Quotes, Vendor POs |
| **Store Keeper** | `store@example.com` | `STORE` | Stock Ledger, GRN Dock Receiving, Reservations |
| **Production Supervisor** | `production@example.com` | `PRODUCTION` | Work Orders, BOM Explosion, Floor Routing |
| **QA Inspector** | `qa@example.com` | `QA` | Helium Leak Tests, Pull-down Tests, Certs |
| **Logistics Manager** | `dispatch@example.com` | `DISPATCH` | Shock-Mount Crating, Freight Dispatches, PODs |
| **Service Manager** | `service@example.com` | `SERVICE_MANAGER` | Field Service Tickets, RMA Overhauls |
| **Field Service Engineer** | `engineer@example.com` | `SERVICE_ENGINEER` | Site Installations, Commissioning, Field Repairs |

---

## 4. Project Directory Structure

```
erp-project/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection & app constants
│   │   ├── constants/       # Centralized Roles, Permissions, Statuses
│   │   ├── controllers/     # HTTP endpoint handlers
│   │   ├── middlewares/     # Auth, RBAC, Validator, Uploads, ErrorHandler
│   │   ├── models/          # 35+ Mongoose Schemas with compound indexing
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Authoritative Workflow, Inventory, Serial Services
│   │   ├── utils/           # Standardized API response wrappers
│   │   ├── uploads/         # Uploaded documents and proof receipts
│   │   ├── app.js           # Express application configuration
│   │   └── server.js        # Server bootstrap
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Common UI (StatusBadge, Timeline, LoadingSpinner)
│   │   ├── layouts/         # MainLayout, Sidebar (42 modules), Navbar
│   │   ├── pages/           # 31 Page Views (Sales, Prod, Inv, QA, Logistics, Service)
│   │   ├── routes/          # AppRoutes with ProtectedRoute guards
│   │   ├── services/        # Axios API client
│   │   ├── store/           # Redux Toolkit store, 8 slices, Redux Saga
│   │   ├── styles/          # Variables, mixins, global SCSS styling
│   │   ├── App.jsx          # Root application component
│   │   └── main.jsx         # React DOM mounting
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/                    # Exhaustive Technical Documentation
│   ├── implementation-plan.md
│   ├── workflow.md
│   ├── api-call.md
│   ├── architecture.md
│   ├── database.md
│   ├── permissions.md
│   ├── status-transitions.md
│   ├── notifications.md
│   ├── deployment.md
│   ├── testing.md
│   └── mismatch-report.md
│
├── scripts/
│   ├── seed.js              # Complete database seeder with realistic dataset
│   └── verification/
│       └── test-e2e-workflow.js # 11-Phase automated end-to-end integration test
│
└── README.md
```

---

## 5. Prerequisites & Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on v24.x)
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster URI
- **Git**

### Installation & Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd cryo
   ```

2. **Install Dependencies:**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   cd ..
   ```

3. **Configure Environment Variables:**
   - In `backend/.env`:
     ```env
     PORT=5000
     NODE_ENV=development
     MONGODB_URI=mongodb://127.0.0.1:27017/cryo_erp
     JWT_SECRET=super_secret_jwt_key_for_cryotech_erp_development_2026
     JWT_EXPIRES_IN=24h
     CLIENT_URL=http://localhost:5173
     UPLOAD_DIR=./src/uploads
     ```
   - In `frontend/.env`:
     ```env
     VITE_API_BASE_URL=http://localhost:5000/api
     ```

4. **Seed Database with Realistic Demo Data:**
   ```bash
   npm run seed
   # (Or: node scripts/seed.js)
   ```

5. **Run the Automated End-to-End Workflow Test:**
   ```bash
   npm run test:workflow
   # (Or: node scripts/verification/test-e2e-workflow.js)
   ```

6. **Start Development Servers:**
   - Start Backend API (Port 5000):
     ```bash
     cd backend
     npm run dev
     ```
   - Start Frontend Dev Server (Port 5173):
     ```bash
     cd frontend
     npm run dev
     ```
   - Open your browser at `http://localhost:5173` and sign in using any demo account (e.g. `admin@example.com` / `Password@123`).

---

## 6. Documentation Index

For in-depth technical documentation, refer to the files in `/docs`:
- [`docs/step-by-step-walkthrough.md`](docs/step-by-step-walkthrough.md) — **Step-by-step interactive user testing guide (Lead → Quotation → Production → QA → Service).**
- [`docs/workflow.md`](docs/workflow.md) — Complete 42-module business workflow and operational guide.
- [`docs/api-call.md`](docs/api-call.md) — Exhaustive REST API specification with example payloads and error codes.
- [`docs/architecture.md`](docs/architecture.md) — Layered software architecture, state machine, and data flow.
- [`docs/database.md`](docs/database.md) — Complete MongoDB schema dictionary and indexing strategy.
- [`docs/permissions.md`](docs/permissions.md) — Granular RBAC matrix across 12 roles.
- [`docs/status-transitions.md`](docs/status-transitions.md) — State machine transition invariants.
- [`docs/notifications.md`](docs/notifications.md) — In-app notification event triggers and routing.
- [`docs/deployment.md`](docs/deployment.md) — Production deployment guide for cloud infrastructure.
- [`docs/testing.md`](docs/testing.md) — Testing strategy and automated test runner documentation.
- [`docs/mismatch-report.md`](docs/mismatch-report.md) — Complete cross-verification audit with 0 critical/high mismatches.
