# CryoTech Industrial ERP — Complete Business Workflow & Operations Guide

## 1. Executive Overview & System Architecture

CryoTech Industrial ERP is a high-precision, workflow-driven enterprise resource planning web application architected for cryogenic equipment manufacturing, sales, procurement, quality assurance, logistics, and field service operations.

The application enforces an authoritative backend state machine across all 42 business subsystems, ensuring zero dead buttons, zero fake responses, zero broken routes, and zero client-only business rules.

---

## 2. Demo User Credentials (Development & Review)

The system is pre-seeded with 12 specialized role personas. Each account is fully provisioned with appropriate role permissions in the authoritative RBAC database.

**Universal Demo Password:** `Password@123`

| Role Identifier | Login Email | Assigned Role | Primary Operational Responsibilities |
|---|---|---|---|
| **System Administrator** | `admin@example.com` | `ADMIN` | User provisioning, master data, RBAC permissions, audit trail |
| **Executive Management** | `management@example.com` | `MANAGEMENT` | High-level commercial approvals, executive KPI metrics |
| **Sales Executive** | `sales@example.com` | `SALES` | Lead capture, customer onboarding, quotation generation |
| **Sales Manager** | `manager@example.com` | `SALES_MANAGER` | Quotation commercial approval, customer PO verification, SO confirmation |
| **Accounts / Finance** | `accounts@example.com` | `ACCOUNTS` | Advance payment verification, GST tax invoices, refund/credit notes |
| **Procurement Specialist** | `purchase@example.com` | `PURCHASE` | Shortage RFQs, vendor bid comparison matrix, vendor purchase orders |
| **Store & Inventory Keeper** | `store@example.com` | `STORE` | Goods Receipt Notes (GRN), inventory ledger issues, stock adjustments |
| **Production Supervisor** | `production@example.com` | `PRODUCTION` | Work order release, BOM explosion, floor routing operations |
| **QA / Quality Compliance** | `qa@example.com` | `QA` | Helium mass-spec leak tests, cryo pull-down, compliance certification |
| **Logistics & Dispatch** | `dispatch@example.com` | `DISPATCH` | Shock-mount crating, outbound dispatch advice, LR & E-Way bill tracking |
| **Field Service Manager** | `service@example.com` | `SERVICE_MANAGER` | Installation scheduling, RMA authorizations, warranty administration |
| **Field Service Engineer** | `engineer@example.com` | `SERVICE_ENGINEER` | Site installation, pull-down commissioning, field diagnosis, repair |

---

## 3. End-to-End Enterprise Workflow

```
[CUSTOMER REQUIREMENT]
        ↓
    [01. LEAD] ──────────→ (Qualified) ──────────→ [02. CUSTOMER]
        ↓                                                ↓
[03. QUOTATION] (Draft) → (Submitted) → (Approved) → [04. SENT]
        ↓
[05. CUSTOMER RESPONSE] ─── (Negotiate) ───→ [06. REVISION] → [Approved/Sent]
        ↓ (Accept)
[07. ACCEPTANCE] ───→ [08. PROFORMA INVOICE] ───→ [09. CUSTOMER PO]
                                                         ↓
                                                [10. 4-WAY PO VERIFICATION]
                                                         ↓ (Match)
                                                [11. SALES ORDER CONFIRMED]
                                                         ↓
                                                [12. ADVANCE PAYMENT VERIFIED]
                                                         ↓
                                                [13. PRODUCTION RELEASE]
                                                         ↓
                                                [14. PRODUCTION ORDER & BOM]
                                                         ↓
                                                [15. MATERIAL REQUEST]
                                                         ↓
        ┌────────────────────────────────────────────────┴──────────────────────┐
        ↓ (Stock Available)                                                     ↓ (Stock Shortage)
[16. RESERVE & ISSUE]                                                   [17. PROCUREMENT RFQ]
        │                                                                       ↓
        │                                                               [18. VENDOR QUOTES COMPARISON]
        │                                                                       ↓
        │                                                               [19. VENDOR SELECTION & PO]
        │                                                                       ↓
        │                                                               [20. DOCK GRN INSPECTION]
        │                                                                       ↓
        │                                                               [21. ACCEPT TO LEDGER]
        └─────────────────────────────────┬─────────────────────────────────────┘
                                          ↓
                              [22. SHOPFLOOR OPERATIONS]
                              • Fabrication & Inner Vessel Welding
                              • Refrigeration & Multi-Layer Insulation (MLI)
                              • Electrical Wiring & Digital Sensors
                              • Final Outer Jacket Assembly
                                          ↓
                              [23. PRODUCTION COMPLETE & WIP]
                                          ↓
                              [24. QA CRYOGENIC TESTING]
                              • Helium Mass Spec Leak Detection (< 1x10⁻⁹ mbar·L/s)
                              • Static Vacuum Hold Test (< 1x10⁻⁴ mbar)
                              • Cryogenic Liquid Nitrogen Pull-Down (-196°C)
                                          ↓ (PASS)
                              [25. COMPLIANCE CERTIFICATE ISSUED]
                                          ↓
                              [26. 360° SERIAL TRACEABILITY PASSPORT]
                                          ↓
                              [27. SHOCK-MOUNT CRATING & PACKING LIST]
                                          ↓
                              [28. FINAL GST TAX INVOICE]
                                          ↓
                              [29. OUTBOUND FREIGHT DISPATCH & E-WAY BILL]
                                          ↓
                              [30. TRANSIT & CONSIGNEE DELIVERY POD SIGNED]
                                          ↓
                              [31. SITE RIGGING & MECHANICAL INSTALLATION]
                                          ↓
                              [32. SITE PULL-DOWN COMMISSIONING TRIALS]
                                          ↓ (PASSED)
                              [33. WARRANTY ACTIVATION (12-36 MONTHS)]
                                          ↓
                              [34. FIELD SERVICE TICKETING & COMPLAINTS]
                              • Warranty Coverage Check (Free vs Chargeable)
                              • Diagnosis & Technical Root Cause
                              • Spare Parts Requisition & Replacement
                              • Site Repair & Customer Sign-off
                              • Ticket Closure & Product Passport Archive
                                          ↓
                              [35. RMA & FACTORY RETURN EXCEPTION]
                              • Factory Return Dock Intake
                              • Teardown Metallography Inspection
                              • Resolution: Repair / Replacement Serial / Credit Note
```

---

## 4. Module-by-Module Operational Specifications

### Phase I: Commercial Operations (Sales & Revenue)

#### Module 01: Lead / Enquiry
- **Actors**: `SALES`, `SALES_MANAGER`
- **Inputs**: Contact name, organization, email, phone, equipment interest, estimated capacity (Litres), estimated value.
- **Statuses**: `NEW`, `CONTACTED`, `QUALIFIED`, `LOST`.
- **Transitions**:
  - `qualify`: Creates a persistent Customer master entry and unlocks Quotation generation.
  - `lose`: Flags reason for disqualification (budget, competitor, non-cryo application).
- **Audit Event**: `LEAD_QUALIFIED`, `LEAD_LOST`.

#### Module 02: Customer Master
- **Actors**: `SALES`, `SALES_MANAGER`, `ADMIN`
- **Inputs**: Corporate legal name, GSTIN (GST Tax Identification Number), billing address, shipping address, PAN, credit limit.
- **Enforcement**: Duplication checks on email and GSTIN.

#### Module 03: Quotation & Pricing Engine
- **Actors**: `SALES`, `SALES_MANAGER`
- **Inputs**: Customer selection, line items (product, description, quantity, unit price, discount %, tax rate %), payment terms, delivery terms, warranty terms.
- **Statuses**: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `NEGOTIATION`, `REVISED`, `ACCEPTED`, `REJECTED`, `EXPIRED`.
- **State Actions**:
  - `submit`: Submits draft for commercial management review.
  - `approve`: Sales Manager approves pricing and discount margins.
  - `send`: Formats and delivers quotation to client.
  - `negotiate`: Records client discount counter-proposals.
  - `revise`: Clones quotation into a versioned child revision without overwriting prior records.
  - `accept`: Locks final quotation, marks customer acceptance, and triggers automated Proforma generation.
- **Preconditions**: Total value > 0, customer verified, valid line items.

#### Module 04: Quotation Revisions
- **Architecture**: Deep immutable revision tree.
- **Fields**: `revisionNumber`, `parentQuotationId`, `previousRevisionId`, `changedItems`, `oldTotal`, `newTotal`, `reason`, `createdBy`.
- **Enforcement**: Only the latest approved revision can be accepted by the customer.

#### Module 05: Proforma Invoice (PI)
- **Actors**: `SALES`, `ACCOUNTS`
- **Inputs**: Automated creation upon quotation acceptance; specifies advance payment milestone percentage (e.g. 30% advance with PO, 70% against delivery).

#### Module 06: Customer Purchase Order (Customer PO)
- **Actors**: `SALES`, `SALES_MANAGER`
- **Inputs**: Customer's external PO number, PO date, line items, quoted delivery date, upload of scanned PO document.

#### Module 07: Automated 4-Way PO Verification Engine
- **Actors**: `SALES_MANAGER`, `ACCOUNTS`
- **Engine Logic**: Compares Line-by-Line:
  1. Original Quotation
  2. Accepted Revision
  3. Proforma Invoice
  4. Customer Purchase Order
- **Comparison Vectors**: Product Code, Quantity, Unit Price, Total Value, Payment Terms, Delivery Terms, Warranty Terms.
- **Verification Outcomes**:
  - `MATCH`: Unlocks single-click conversion to Confirmed Sales Order.
  - `MISMATCH`: Places PO into `HOLD` state with detailed mismatch breakdown; requires client PO amendment or formal amendment note.

#### Module 08: Sales Order (SO)
- **Actors**: `SALES_MANAGER`
- **Statuses**: `DRAFT`, `CONFIRMED`, `IN_PRODUCTION`, `READY_FOR_DISPATCH`, `DISPATCHED`, `COMPLETED`, `CANCELLED`.
- **Preconditions**: PO verification status = `MATCH`.

#### Module 09: Payment Accounting & Release
- **Actors**: `ACCOUNTS`
- **Inputs**: Sales order reference, payment method (RTGS, NEFT, Cheque), bank name, transaction reference ID, received amount.
- **Statuses**: `PENDING`, `RECEIVED`, `VERIFIED`, `REVERSED`, `REFUNDED`.
- **Release Condition**: Production release is unlocked when advance payment percentage is satisfied according to configured payment terms.

---

### Phase II: Manufacturing & Supply Chain

#### Module 10: Production Release & Work Orders
- **Actors**: `PRODUCTION`, `MANAGEMENT`
- **Inputs**: Sales order selection, target completion date, assigned assembly line.
- **Statuses**: `DRAFT`, `RELEASED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED`.
- **Automation**: Automatic Work Order creation, Bill of Materials (BOM) explosion, and material shortage calculation.

#### Module 11: Bill of Materials (BOM) & Explosion
- **Actors**: `PRODUCTION`
- **Structure**: Multi-level engineering hierarchy linking raw materials (SS304L cryogenic steel, outer carbon steel, MLI reflective foil, getter materials, dual safety valves, capacitive level transmitters) to finished equipment codes.

#### Module 12: Material Requests & Stock Reservation
- **Actors**: `PRODUCTION`, `STORE`
- **Logic**: Evaluates required vs available inventory.
  - *Full Stock Available*: Automatically reserves and issues items to shopfloor.
  - *Partial / Zero Stock*: Allocates existing inventory and raises automated Procurement Requisitions (MR) for the deficit.

#### Module 13: Procurement RFQ & Vendor Quotation Matrix
- **Actors**: `PURCHASE`
- **Workflow**:
  1. Material Shortage RFQ created.
  2. Bids received from accredited cryogenic suppliers recorded (unit price, delivery lead time, warranty terms, rating).
  3. Commercial comparison matrix generated.
  4. Vendor selected and Purchase Order (Vendor PO) dispatched.

#### Module 14: Goods Receipt Notes (GRN) & Double-Entry Ledger
- **Actors**: `STORE`
- **Workflow**:
  1. Physical dock intake against Vendor PO.
  2. Physical count vs packing challan check.
  3. Visual damage and dimensional acceptance.
  4. Action `accept`: Automatically records double-entry movement into `InventoryLedger` (`GRN_RECEIPT`), updating on-hand stock and fulfilling pending material requests.

#### Module 15: Production Routing Operations & WIP Tracking
- **Actors**: `PRODUCTION`
- **Workstations**:
  1. **Fabrication Station**: Inner pressure vessel rolling, longitudinal seam welding, radiographic weld check.
  2. **Refrigeration & Vacuum Station**: Superinsulation multi-layer wrapping, getter catalyst placement, outer jacket closure, high-vacuum turbo-pumping down to $1 \times 10^{-4}$ mbar.
  3. **Electrical & Instrumentation**: Digital level probe, temperature sensors, solenoid safety valves wiring.
  4. **Final Mechanical Assembly**: Structural base skid mounting, valve manifold plumbing, nameplate stamping.
- **Tracking**: Operator, start time, completion time, machine center, rejected pieces.

---

### Phase III: Quality Assurance & Traceability

#### Module 16: Cryogenic QA & Testing Suite
- **Actors**: `QA`
- **Inspection Checklist**:
  - High-sensitivity Helium Mass Spectrometer Leak Detection ($\le 1 \times 10^{-9}$ mbar·L/s).
  - Hydrostatic / Pneumatic Proof Pressure Test (1.5x Maximum Allowable Working Pressure).
  - Liquid Nitrogen Cold-Shock Pull-Down Test (-196°C) for thermal contraction and boil-off stability.
  - Vacuum retention check under ambient heat load.
- **Outcomes**:
  - `PASS`: Generates signed Cryogenic Compliance Certificate and updates serial status to `QA_PASSED`.
  - `FAIL`: Triggers Non-Conformance Report (NCR) and routes equipment to `RECTIFICATION`, `RETEST`, `REWORK`, or `SCRAP`.

#### Module 17: 360° Serial Traceability & Digital Product Passport
- **Actors**: All roles
- **Capabilities**: Complete end-to-end historical audit queryable by Serial Number:
  - Raw steel heat numbers and vendor receipts
  - BOM revision applied and parts consumed
  - Shopfloor workstation operators and timestamps
  - Cryogenic QA test results, leak charts, and certificates
  - Packing list, transport docket, and consignee POD
  - Site installation and commissioning pull-down telemetry
  - Active warranty dates and field service ticket history

---

### Phase IV: Logistics, Delivery & Site Commissioning

#### Module 18: Crating & Packing Lists
- **Actors**: `DISPATCH`
- **Process**: Shock-mount heavy-duty export crating, nitrogen dry-charge blanket, tilt indicators applied, dimensions and gross weight recorded.

#### Module 19: Final GST Tax Invoices
- **Actors**: `ACCOUNTS`
- **Features**: GST compliant invoice generation, HSN 84186990 cryogenic classification, CGST/SGST/IGST tax schedule, accounts ledger posting.

#### Module 20: Outbound Freight Dispatch
- **Actors**: `DISPATCH`
- **Parameters**: Transporter carrier, vehicle registration number, Lorry Receipt (LR) number, driver contact, E-Way Bill verification, factory gate-out authorization.

#### Module 21: Delivery & Consignee Proof of Delivery (POD)
- **Actors**: `DISPATCH`, `SERVICE_ENGINEER`
- **Actions**: Consignee site offloading, physical inspection for transit tilt or seal tampering, receiver signature capture, POD document upload. Triggers readiness for site installation.

#### Module 22: Site Mechanical Installation
- **Actors**: `SERVICE_ENGINEER`
- **Scope**: Rigging into plant pad, seismic anchoring, external cryogenic piping tie-ins, safety relief stack ducting.

#### Module 23: Pull-Down Commissioning & Warranty Activation
- **Actors**: `SERVICE_ENGINEER`
- **Scope**: Liquid Nitrogen cold-fill trial, boil-off rate monitoring, relief valve pop-off pressure validation, customer sign-off.
- **Automated Rule**: When Commissioning is marked `PASSED`, the backend state engine automatically activates the 12-to-36-month product warranty.

---

### Phase V: After-Sales Service, Warranty & RMA

#### Module 24: Field Service Tickets
- **Actors**: `SERVICE_MANAGER`, `SERVICE_ENGINEER`
- **Workflow**:
  1. Incident logged with customer complaint and urgency priority.
  2. System checks active warranty status (`FREE_SERVICE` under warranty vs `CHARGEABLE` if expired/void).
  3. Engineer dispatched to customer site.
  4. Diagnosis findings recorded.
  5. Spare parts requisitioned from warehouse stock.
  6. Repair executed and calibrated.
  7. Customer sign-off captured; ticket closed and archived to digital product passport.

#### Module 25: Return Material Authorization (RMA) & Factory Overhaul
- **Actors**: `SERVICE_MANAGER`, `QA`, `PRODUCTION`
- **Workflow**:
  1. RMA authorized for severe vacuum loss or inner vessel repair.
  2. Dock receipt at factory.
  3. Teardown metallography and non-destructive examination (NDE).
  4. Official resolution decision: `REPAIR`, `REPLACEMENT` (issues new serial number while linking previous history), `CREDIT_NOTE`, or `REFUND`.

---

## 5. Security & Authoritative State Governance

1. **No Client-Side Authority**: Frontend buttons only dispatch actions to `/api/:resource/:id/actions/:action`. Backend verifies user token, evaluates role permission, queries current state, executes transaction, and logs audit entry.
2. **Double-Entry Stock Ledger**: Inventory is strictly updated via ledger debit/credit movements (`InventoryLedger`), preventing ghost stock drifts.
3. **Immutable Audit Trails**: Every critical action generates a tamper-evident audit record capturing actor ID, timestamp, prior state, next state, IP address, and payload delta.
