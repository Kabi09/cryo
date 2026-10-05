# CryoTech Industrial ERP — State Machine Transitions & Invariants

This document specifies the authoritative finite state machines implemented in `backend/src/services/workflowService.js`. Every state transition enforces strict preconditions, required input validation, permission checks, audit logging, and notification broadcasts.

---

## 1. Commercial Subsystems

### 1.1 Lead State Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `NEW` | `contact` | `lead.edit` | Valid contact notes | `CONTACTED` | `LEAD_CONTACTED` | Lead Follow-up |
| `CONTACTED` | `qualify` | `lead.qualify` | Company name, email, equipment requirement | `QUALIFIED` | `LEAD_QUALIFIED` | Lead Qualified Alert |
| `NEW` / `CONTACTED` | `lose` | `lead.lose` | Loss reason mandatory | `LOST` | `LEAD_LOST` | Lead Disqualified |

### 1.2 Quotation State Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `DRAFT` | `submit` | `quotation.submit` | $\ge 1$ line item, total $> 0$, customer verified | `PENDING_APPROVAL` | `QUOTATION_SUBMITTED` | Quotation Approval Requested |
| `PENDING_APPROVAL`| `approve` | `quotation.approve` | User has managerial authorization | `APPROVED` | `QUOTATION_APPROVED` | Quotation Approved Alert |
| `PENDING_APPROVAL`| `reject` | `quotation.reject` | Rejection remarks mandatory | `DRAFT` | `QUOTATION_REJECTED` | Quotation Rejected Alert |
| `APPROVED` | `send` | `quotation.send` | Customer email verified | `SENT` | `QUOTATION_SENT` | Quotation Transmitted |
| `SENT` | `negotiate` | `quotation.edit` | Customer counter-proposal notes | `NEGOTIATION` | `QUOTATION_NEGOTIATION`| Customer Negotiation Alert |
| `NEGOTIATION` | `revise` | `quotationRevision.create` | Concession reason, updated lines | `REVISED` | `QUOTATION_REVISED` | New Revision Created |
| `SENT` | `accept` | `quotation.edit` | Customer written acceptance | `ACCEPTED` | `QUOTATION_ACCEPTED` | Quotation Accepted (Auto PI) |
| Any except `ACCEPTED`| `cancel`| `quotation.cancel`| Cancellation reason mandatory | `CANCELLED` | `QUOTATION_CANCELLED` | Quotation Voided |

### 1.3 Customer PO & Verification State Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `PENDING` | `verify` | `salesOrder.confirm` | 4-way contract engine executed | `MATCH` or `MISMATCH` | `PO_VERIFIED` | PO Verification Alert |
| `MISMATCH` | `hold` | `salesOrder.confirm` | Mismatch discrepancy reasons logged | `HOLD` | `PO_ON_HOLD` | Customer PO Mismatch |
| `HOLD` | `reverify` | `salesOrder.confirm` | Amended PO uploaded | `MATCH` | `PO_REVERIFIED` | PO Ready for SO |

### 1.4 Sales Order State Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `DRAFT` | `confirm` | `salesOrder.confirm` | Customer PO status = `MATCH` | `CONFIRMED` | `SALES_ORDER_CONFIRMED`| Sales Order Confirmed |
| `CONFIRMED` | `release` | `production.release`| Advance payment verified | `RELEASED` | `ORDER_RELEASED` | Released to Production |
| `RELEASED` | `complete` | `production.complete`| All floor operations done | `READY_FOR_DISPATCH`| `ORDER_READY` | Ready for Freight |
| `READY_FOR_DISPATCH`| `dispatch` | `dispatch.dispatch` | LR number assigned | `DISPATCHED` | `ORDER_DISPATCHED` | Dispatched Alert |

---

## 2. Manufacturing & Shopfloor Subsystems

### 2.1 Production Order State Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `DRAFT` | `release` | `production.release` | BOM exploded, advance confirmed | `RELEASED` | `PRODUCTION_RELEASED` | Work Order Released |
| `RELEASED` | `check_material` | `materialRequest.issue`| All material requests allocated | `MATERIAL_READY` | `MATERIAL_ALLOCATED` | Shopfloor Stock Ready |
| `MATERIAL_READY`| `start` | `production.start` | Machine center assigned | `IN_PROGRESS` | `PRODUCTION_STARTED` | Production In Progress |
| `IN_PROGRESS` / `RELEASED`| `complete`| `production.complete`| Workstations finished, serial generated | `COMPLETED` | `PRODUCTION_COMPLETED`| Unit Ready for QA |
| Any | `hold` | `production.hold` | Engineering query remarks | `ON_HOLD` | `PRODUCTION_HELD` | Production Hold Alert |

---

## 3. Inventory & Procurement Subsystems

### 3.1 Goods Receipt Note (GRN) Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `DRAFT` | `inspect` | `grn.inspect` | Visual inspection complete | `INSPECTED` | `GRN_INSPECTED` | Dock Inspection Done |
| `INSPECTED` | `accept` | `grn.accept` | Accepted qty $> 0$, ledger debited | `ACCEPTED` | `GRN_ACCEPTED` | Stock Inward Posted |
| `INSPECTED` | `reject` | `grn.inspect` | Rejection reason logged | `REJECTED` | `GRN_REJECTED` | Supplier Reject Alert |

---

## 4. Quality, Serial & Logistics Subsystems

### 4.1 Cryogenic QA Testing Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `PENDING` | `test` | `qa.test` | Helium leak / cold pull-down | `UNDER_TEST` | `QA_TEST_STARTED` | QA Test Underway |
| `UNDER_TEST` / `PENDING`| `pass` | `qa.pass` | All test points meet standard | `PASSED` | `QA_TEST_PASSED` | Cryo Cert Issued |
| `UNDER_TEST` / `PENDING`| `fail` | `qa.fail` | Defect observations logged | `FAILED` | `QA_TEST_FAILED` | QA Failure Alert |
| `FAILED` | `retest` | `qa.retest` | Rectification completed | `UNDER_TEST` | `QA_RETEST_QUEUED` | Retest Queued |
| `FAILED` | `scrap` | `qa.fail` | Plant manager authorization | `SCRAPPED` | `UNIT_SCRAPPED` | Scrap Notice |

### 4.2 Serial Number Lifecycle Transitions
```
CREATED → IN_PRODUCTION → QA_PASSED → PACKED → DISPATCHED → DELIVERED → INSTALLED → WARRANTY_ACTIVE → (IN_SERVICE / RMA_RETURNED)
```

### 4.3 Consignment Delivery Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `IN_TRANSIT` | `deliver` | `delivery.complete` | Consignee name, signed POD | `DELIVERED` | `DELIVERY_COMPLETED` | Delivery Confirmed |
| `IN_TRANSIT` | `fail` | `delivery.fail` | Site rejection reason | `FAILED` | `DELIVERY_FAILED` | Delivery Failure |
| `FAILED` | `reschedule` | `delivery.complete` | New dispatch slot | `IN_TRANSIT` | `DELIVERY_RESCHEDULED`| Rescheduled Transit |

---

## 5. Field Service & Warranty Subsystems

### 5.1 Site Commissioning Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `PENDING` | `pass` | `commissioning.pass`| Pull-down -196C verified | `PASSED` | `COMMISSIONING_PASSED`| Warranty Activated! |
| `PENDING` | `fail` | `commissioning.pass`| Boil-off rate defect | `FAILED` | `COMMISSIONING_FAILED`| Commissioning Revisit |

### 5.2 Field Service Ticket Transitions
| Current Status | Action | Required Permission | Preconditions & Required Inputs | Next Status | Audit Event | Notification Event |
|---|---|---|---|---|---|---|
| `OPEN` | `assign` | `service.assign` | Certified engineer assigned | `ASSIGNED` | `SERVICE_ASSIGNED` | Engineer Dispatched |
| `ASSIGNED` | `diagnose` | `service.diagnose`| Root cause analysis | `DIAGNOSED` | `SERVICE_DIAGNOSED` | Diagnosis Logged |
| `DIAGNOSED` | `repair` | `service.repair` | Spare parts replaced | `REPAIRED` | `SERVICE_REPAIRED` | Repair Completed |
| `REPAIRED` | `signoff` | `service.signoff` | Customer signature captured | `SIGNED_OFF` | `CUSTOMER_SIGNED_OFF` | Sign-off Recorded |
| `SIGNED_OFF` | `close` | `service.close` | Final passport archiving | `CLOSED` | `TICKET_CLOSED` | Ticket Archived |
