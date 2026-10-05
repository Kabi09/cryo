# CryoTech Industrial ERP — Role-Based Access Control (RBAC) & Permission Matrix

## 1. Security Architecture & RBAC Design

CryoTech Industrial ERP implements a strictly declarative, action-based Role-Based Access Control (RBAC) engine.

### Core Principles
- **No Role String Comparisons in Business Logic**: Backend route guards verify capability tokens (`permission.action`) rather than comparing raw role strings.
- **Admin Superuser Override**: The `ADMIN` role inherently bypasses capability checks and possesses universal authority.
- **Dual Layer Enforcement**:
  - *Backend Middleware*: Authoritative boundary via `authorizePermission(permissionToken)`.
  - *Frontend Redux UI Guarding*: Sidebar navigation items and action buttons evaluate user capabilities before rendering interactive controls.

---

## 2. Granular Permission Dictionary

| Functional Area | Permission Identifier | Description / Authorized Action |
|---|---|---|
| **System & Dashboard** | `dashboard.view` | View executive dashboards and operational KPIs |
| | `audit.view` | Inspect immutable audit logs and change deltas |
| | `masters.manage` | Create/edit products, vendors, warehouses, terms |
| **Sales & Commercial** | `lead.view` | Query sales enquiries and lead database |
| | `lead.create` | Register new customer enquiry |
| | `lead.edit` | Modify lead contact information |
| | `lead.qualify` | Convert lead into persistent customer record |
| | `lead.lose` | Flag disqualified lead with loss reason |
| | `customer.view` | Query customer directory and credit ratings |
| | `customer.create` | Onboard new enterprise customer |
| | `customer.edit` | Update customer GSTIN, address, credit terms |
| | `quotation.view` | Access commercial quotations |
| | `quotation.create` | Draft quotation and compute pricing/margins |
| | `quotation.edit` | Update quotation draft line items |
| | `quotation.submit` | Submit draft quotation for managerial approval |
| | `quotation.approve` | Authorize commercial pricing and margins |
| | `quotation.reject` | Reject quotation with commercial feedback |
| | `quotation.send` | Transmit approved quotation to client |
| | `quotation.cancel` | Void/cancel commercial proposal |
| | `quotationRevision.create` | Create versioned child quotation revision |
| | `salesOrder.view` | Inspect sales orders and delivery schedules |
| | `salesOrder.create` | Draft sales order |
| | `salesOrder.confirm` | Confirm sales order after 4-way PO verification |
| | `salesOrder.cancel` | Void or abort sales order |
| **Finance & Accounts** | `payment.view` | Inspect remittance receipts and status |
| | `payment.create` | Record client wire transfer or cheque receipt |
| | `payment.verify` | Validate bank funds and unlock production release |
| | `payment.reverse` | Reverse bounced or erroneous remittance |
| | `payment.refund` | Issue customer refund |
| | `invoice.create` | Generate GST compliant commercial tax invoice |
| | `invoice.post` | Post final tax invoice to General Ledger |
| **Manufacturing** | `production.view` | View production orders and scheduling |
| | `production.create` | Create production work orders |
| | `production.release` | Release order to shopfloor upon advance payment |
| | `production.start` | Start shopfloor manufacturing cycle |
| | `production.hold` | Place production order on hold |
| | `production.complete` | Finalize equipment assembly and generate serial |
| | `bom.view` | View multi-level engineering Bill of Materials |
| | `bom.manage` | Create and revise product BOM recipes |
| | `materialRequest.create` | Issue shopfloor stock reservation request |
| | `materialRequest.issue` | Fulfill and allocate raw materials to order |
| **Store & Inventory** | `inventory.view` | Access stock balances and warehouse bins |
| | `inventory.reserve` | Soft-reserve stock for active work order |
| | `inventory.issue` | Issue stock debit movement from warehouse |
| | `inventory.return` | Record unused material return to store |
| | `inventory.adjust` | Post stock audit adjustment to ledger |
| | `grn.create` | Create dock Goods Receipt Note |
| | `grn.inspect` | Perform physical and dimensional inspection |
| | `grn.accept` | Accept inbound shipment into stock ledger |
| **Procurement** | `procurement.view` | Inspect shortage RFQs and vendor bids |
| | `procurement.rfq` | Issue Request for Quotation to suppliers |
| | `procurement.compare` | Evaluate vendor quotes in comparison matrix |
| | `procurement.po` | Award and dispatch official Vendor PO |
| **Quality Compliance** | `qa.view` | View quality test templates and logs |
| | `qa.test` | Record test parameter measurements |
| | `qa.pass` | Issue signed Cryogenic Compliance Certificate |
| | `qa.fail` | Issue Non-Conformance Report (NCR) |
| | `qa.retest` | Retest equipment after shopfloor rectification |
| | `serial.view` | Query 360-degree digital product passport |
| **Logistics** | `packing.create` | Generate packing list and shock-mount crating |
| | `dispatch.view` | Access outbound dispatch advice |
| | `dispatch.create` | Create vehicle dispatch advice and assign LR |
| | `dispatch.dispatch` | Authorize factory gate-out |
| | `delivery.view` | Track in-transit consignments |
| | `delivery.complete` | Record consignee signature and signed POD |
| | `delivery.fail` | Record site delivery failure |
| **Field Service** | `installation.create` | Schedule site mechanical installation |
| | `installation.execute` | Execute site rigging and tie-ins |
| | `commissioning.create` | Initialize site pull-down trials |
| | `commissioning.pass` | Pass commissioning and trigger warranty |
| | `warranty.view` | Query active product guarantees |
| | `service.view` | Query field service incident tickets |
| | `service.create` | Log customer field incident complaint |
| | `service.assign` | Assign field technician to incident |
| | `service.diagnose` | Record diagnostic root cause |
| | `service.repair` | Execute field repair and replace parts |
| | `service.signoff` | Capture customer acceptance signature |
| | `service.close` | Archive completed ticket to product passport |
| | `rma.create` | Initiate Return Material Authorization |
| | `rma.decide` | Issue resolution: repair, replace, credit note |

---

## 3. Role-to-Permission Mapping Matrix

```
LEGEND:
[X] Fully Authorized Capability
[-] Restricted / Unauthorized

PERMISSION TOKEN           ADMIN  MGMT  SALES  S_MGR  ACCT  PURCH  STORE  PROD  QA  DISP  SVC_M  SVC_E
────────────────────────────────────────────────────────────────────────────────────────────────────
dashboard.view              [X]   [X]    [X]    [X]   [X]    [X]    [X]   [X]  [X]  [X]   [X]   [X]
lead.view                   [X]   [X]    [X]    [X]    -      -      -     -    -    -     -     -
lead.create                 [X]    -     [X]    [X]    -      -      -     -    -    -     -     -
lead.qualify                [X]    -     [X]    [X]    -      -      -     -    -    -     -     -
customer.create             [X]    -     [X]    [X]   [X]     -      -     -    -    -     -     -
quotation.create            [X]    -     [X]    [X]    -      -      -     -    -    -     -     -
quotation.approve           [X]   [X]     -     [X]    -      -      -     -    -    -     -     -
quotation.send              [X]    -     [X]    [X]    -      -      -     -    -    -     -     -
salesOrder.confirm          [X]   [X]     -     [X]    -      -      -     -    -    -     -     -
payment.verify              [X]   [X]     -      -    [X]     -      -     -    -    -     -     -
invoice.create              [X]    -      -      -    [X]     -      -     -    -    -     -     -
production.release          [X]   [X]     -      -     -      -      -    [X]   -    -     -     -
production.complete         [X]    -      -      -     -      -      -    [X]   -    -     -     -
bom.manage                  [X]    -      -      -     -      -      -    [X]   -    -     -     -
inventory.adjust            [X]    -      -      -     -      -     [X]    -    -    -     -     -
grn.accept                  [X]    -      -      -     -      -     [X]    -    -    -     -     -
procurement.po              [X]   [X]     -      -     -     [X]     -     -    -    -     -     -
qa.pass                     [X]    -      -      -     -      -      -     -   [X]   -     -     -
qa.fail                     [X]    -      -      -     -      -      -     -   [X]   -     -     -
packing.create              [X]    -      -      -     -      -      -     -    -   [X]    -     -
dispatch.dispatch           [X]    -      -      -     -      -      -     -    -   [X]    -     -
delivery.complete           [X]    -      -      -     -      -      -     -    -   [X]    -    [X]
commissioning.pass          [X]    -      -      -     -      -      -     -    -    -    [X]   [X]
service.repair              [X]    -      -      -     -      -      -     -    -    -     -    [X]
rma.decide                  [X]   [X]     -      -     -      -      -     -   [X]   -    [X]    -
audit.view                  [X]   [X]     -      -     -      -      -     -    -    -     -     -
────────────────────────────────────────────────────────────────────────────────────────────────────
```
