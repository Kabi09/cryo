# CryoTech Industrial ERP — Enterprise Architecture Specification

## 1. Architectural Philosophy & Design Principles

CryoTech Industrial ERP is engineered as an enterprise-grade, workflow-driven MERN platform designed for high-consequence cryogenic vessel manufacturing and servicing.

### Core Architectural Axioms
1. **Authoritative Backend State Machines**: The frontend is treated strictly as an untrusted rendering layer. All business rules, contract checks, quantity validations, inventory balances, and workflow transitions execute exclusively in backend services.
2. **Double-Entry Stock Ledger**: Inventory is never updated via naive counters (`quantity -= x`). Every movement is immutably journaled in `InventoryLedger` with source transaction references.
3. **Immutable 360° Serial Traceability**: Serialized cryogenic pressure vessels carry a lifetime Digital Product Passport linking BOM heat numbers, shopfloor operators, QA helium leak logs, shipping dockets, installation commissioning data, and service complaints.
4. **Automated Contract Integrity**: Customer Purchase Orders undergo automated 4-way contract verification against original quotations, approved revisions, and proforma terms before sales order confirmation is permitted.
5. **Granular Action-Based RBAC**: Permissions follow the `resource.action` paradigm (e.g. `quotation.approve`, `inventory.issue`, `qa.pass`) enforced via centralized middleware.

---

## 2. Layered Application Architecture

```
[FRONTEND WEB APPLICATION]
Page View (e.g. QuotationDetail.jsx)
    ↓
Feature Component / Action Modal
    ↓
Redux Toolkit Dispatch (e.g. approveQuotation)
    ↓
Redux Saga Worker (Asynchronous side-effect orchestration)
    ↓
Axios API Client (Bearer token injection & 401 interceptor)
    ↓  (HTTP REST JSON)
════════════════════════════════════════════════════════════════
[BACKEND APPLICATION GATEWAY]
Express.js Route Definition (e.g. quotationRoutes.js)
    ↓
authenticate (JWT token verification, user hydration)
    ↓
authorizePermission (Granular RBAC evaluation)
    ↓
validateRequest (express-validator schema sanitization)
    ↓
Controller (HTTP parameter extraction & response formatting)
    ↓
Workflow & Business Service (State preconditions & rule validation)
    ↓
Data Models / Mongoose Repositories (Schema validation & compound indexing)
    ↓
MongoDB Database Engine
    ↓
Audit Trail Logger (Immutable action & diff persistence)
    ↓
Notification Service (Role-based in-app alerts)
```

---

## 3. Frontend Technology Stack & Component Structure

### Technologies
- **Core Library**: React 18 (Strictly JavaScript / JSX, NO TypeScript)
- **Bundler & Tooling**: Vite 5
- **Styling Architecture**: Clean custom SCSS Modules (Strictly NO Tailwind, NO Bootstrap)
- **Routing**: React Router v6 with declarative protected layout wrappers
- **State Management**: Redux Toolkit (8 functional slices) paired with Redux Saga middleware
- **Icons**: MUI Material Icons exclusively

### State Management Topology
```
store/
├── slices/
│   ├── authSlice.js        // JWT, user profile, role permissions
│   ├── salesSlice.js       // Leads, customers, quotations, sales orders
│   ├── productionSlice.js  // Work orders, BOMs, floor routing
│   ├── inventorySlice.js   // Stock balances, double-entry movements
│   ├── qualitySlice.js     // QA test checklists, certificates
│   ├── logisticsSlice.js   // Packing lists, tax invoices, dispatches, PODs
│   ├── serviceSlice.js     // Installations, commissioning, tickets, RMAs
│   └── systemSlice.js      // Audit logs, notifications, dashboard KPIs
└── rootSaga.js             // Saga orchestrator for async side-effects
```

---

## 4. Backend Technology Stack & Service Layering

### Technologies
- **Runtime Environment**: Node.js v24 LTS
- **Web Framework**: Express.js
- **Database Engine**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with 24-hour expiration
- **Password Security**: bcryptjs (10 salt rounds)
- **Input Validation**: express-validator schemas
- **File Uploads**: Multer disk storage in `backend/src/uploads/`

### Specialized Domain Services
1. **`workflowService.js`**: Enforces allowable state transitions, required inputs, reason prompts, and precondition audits across all 42 modules.
2. **`inventoryService.js`**: Executes transactional stock reserves, ledger journal entries, deficit calculation, and balance recomputations.
3. **`poVerificationService.js`**: Performs deep 4-way contract diffing between Quotation, Revision, Proforma, and Customer PO.
4. **`serialTraceService.js`**: Appends chronological lifecycle events to serialized product passports and compiles 360-degree audit histories.
5. **`auditService.js`**: Records immutable actor footprints, previous/new status values, and payload change deltas.
6. **`notificationService.js`**: Dispatches in-app notifications targeted to authorized roles or specific users upon critical workflow milestones.

---

## 5. Security & RBAC Enforcement Matrix

Every incoming API request is filtered through a two-stage security boundary:
1. `authenticate`: Verifies the cryptographic signature of the `Authorization: Bearer <token>` header, decodes the user payload, and binds `req.user` to the request context.
2. `authorizePermission(permission)`: Checks if the user's role contains the required permission token or if the user is an `ADMIN` (superuser bypass). If missing, terminates immediately with `403 FORBIDDEN`.
