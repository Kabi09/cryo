# CryoTech Industrial ERP — Testing Strategy & Verification Guide

## 1. Quality Assurance Strategy & Test Layers

The CryoTech ERP application undergoes continuous verification across three automated quality gates:
1. **Frontend Production Build Verification**: Vite bundler verifies JSX syntax, module resolution, and asset optimization.
2. **Backend Authoritative State Machine Verification**: Evaluates permission gates, invalid status transition rejection, and double-entry ledger balances.
3. **Comprehensive End-to-End Workflow Verification**: An automated headless test runner (`scripts/verification/test-e2e-workflow.js`) simulates the complete enterprise lifecycle across all 12 role personas and 11 distinct operational phases.

---

## 2. Running Automated Tests

### 2.1 Complete End-to-End Workflow Test Runner
```bash
# Execute full multi-phase ERP transaction simulation
npm run test:workflow
```
*Alternatively, from workspace root:*
```bash
node scripts/verification/test-e2e-workflow.js
```

### 2.2 Frontend Production Bundle Check
```bash
# Verifies zero compile errors, syntax errors, or broken imports
cd frontend
npm run build
```

---

## 3. End-to-End Test Suite Execution Matrix

The test runner programmatically executes and validates the following 11-phase workflow:

| Phase | Subsystem Under Test | Validated Behaviors & Assertions |
|---|---|---|
| **Phase 1** | Authentication & RBAC | Successfully signs in all 12 demo users (`admin`, `sales`, `manager`, `accounts`, `purchase`, `store`, `production`, `qa`, `dispatch`, `service`, `engineer`, `management`). Validates JWT generation. |
| **Phase 2** | Lead Capture & Qualification | Creates Lead `LD-2026-0001` $\to$ Qualifies lead $\to$ Validates automated Customer master onboarding. |
| **Phase 3** | Quotation Revision Cycle | Generates Quotation `QT-2026-0001` $\to$ Submits for approval $\to$ Sales Manager approves $\to$ Transmits to customer $\to$ Client counter-negotiates $\to$ Immutable Revision 1 created $\to$ Accepted $\to$ Auto-generates Proforma. |
| **Phase 4** | 4-Way Customer PO Verification | Customer PO `PO-2026-9901` submitted $\to$ 4-way comparison engine evaluates Quotation vs Revision vs PI vs PO $\to$ Asserts `MATCH` result $\to$ Confirms Sales Order `SO-2026-0001`. |
| **Phase 5** | Advance Payment Remittance | Records ₹2,55,000 wire transfer $\to$ Accounts verifies payment $\to$ Validates production milestone release condition. |
| **Phase 6** | Work Order & Shopfloor Routing | Work Order `PO-2026-0001` released $\to$ Multi-level BOM exploded $\to$ 4 shopfloor operations completed (Fabrication, Refrigeration, Electrical, Assembly) $\to$ Production completed $\to$ Serial `CRYO-2026-0001` generated. |
| **Phase 7** | Cryogenic QA Testing & Cert | Executes Helium mass-spec leak test & cold pull-down $\to$ Asserts result `PASS` $\to$ Signed Cryogenic Compliance Certificate generated $\to$ Serial status updated to `QA_PASSED`. |
| **Phase 8** | 360° Serial Traceability Passport | Queries digital product passport $\to$ Asserts complete historical linkage across BOM, production operations, QA logs, and certificate. |
| **Phase 9** | Packing, Invoicing & Freight | Shock-mount crating completed $\to$ GST Tax Invoice generated and posted to GL $\to$ Outbound dispatch advice issued with LR $\to$ Consignee delivery POD confirmed with receiver signature. |
| **Phase 10** | Installation & Commissioning | Site rigging scheduled and completed $\to$ Site pull-down commissioning tests PASSED $\to$ Asserts automated 12-month Warranty activation. |
| **Phase 11** | Field Service Incident & Sign-off | Logs incident ticket $\to$ Field technician assigned $\to$ Diagnosis recorded $\to$ Spares replaced $\to$ Customer sign-off captured $\to$ Ticket archived to product passport. |

---

## 4. Verification Output & Results

Test execution logs are verified clean with zero unhandled exceptions:
```
============================================================
ALL 11 PHASES OF THE CRYOGENIC ERP WORKFLOW PASSED WITH ZERO ERRORS!
Complete End-to-End traceability from Lead to Customer Sign-off verified.
============================================================
```
