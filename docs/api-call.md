# CryoTech Industrial ERP — Comprehensive REST API Specification

This document provides exhaustive documentation for all REST API endpoints implemented in the CryoTech Industrial ERP backend.

Standard Response Wrapper Format:
```json
// Success Response:
{
  "success": true,
  "message": "Descriptive success string",
  "data": { ... },
  "meta": { "total": 1, "page": 1 }
}

// Error Response:
{
  "success": false,
  "message": "Descriptive error message",
  "errorCode": "RESOURCE_NOT_FOUND",
  "errors": [ ... ]
}
```

---

## 1. Authentication & Identity Management

### 1.1 POST /api/auth/login
- **Purpose**: Authenticates user credentials and issues signed JWT bearer token.
- **Authentication**: Public
- **Permission**: None
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "sales@example.com",
    "password": "Password@123"
  }
  ```
- **Validation**: Email must be valid format, password required.
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "660c1...",
        "name": "Jane Doe",
        "email": "sales@example.com",
        "role": "SALES",
        "permissions": ["quotation.create", "quotation.view"]
      }
    }
  }
  ```
- **Error Codes**: 401 Unauthorized (Invalid credentials), 422 Unprocessable (Validation error).
- **Database Effect**: None (read only).

### 1.2 GET /api/auth/me
- **Purpose**: Retrieves authenticated profile of current token holder.
- **Authentication**: Bearer Token
- **Permission**: None
- **Headers**: `Authorization: Bearer <token>`
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "660c1...",
        "name": "Jane Doe",
        "email": "sales@example.com",
        "role": "SALES"
      }
    }
  }
  ```
- **Error Codes**: 401 Unauthorized.

---

## 2. Sales & Commercial Subsystem

### 2.1 GET /api/sales/leads
- **Purpose**: Lists incoming cryogenic sales leads and customer enquiries.
- **Authentication**: Bearer Token
- **Permission**: `lead.view`
- **Query Params**: `status` (optional), `search` (optional)
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "leads": [
        {
          "_id": "660a1...",
          "leadNumber": "LD-2026-0001",
          "contactName": "Dr. Ramesh Patel",
          "companyName": "Cryo Health Labs",
          "email": "ramesh@cryohealth.org",
          "status": "QUALIFIED"
        }
      ]
    }
  }
  ```

### 2.2 POST /api/sales/leads
- **Purpose**: Creates a new commercial enquiry or lead.
- **Authentication**: Bearer Token
- **Permission**: `lead.create`
- **Request Body**:
  ```json
  {
    "contactName": "Dr. Ramesh Patel",
    "companyName": "Cryo Health Labs",
    "email": "ramesh@cryohealth.org",
    "phone": "+91 98765 43210",
    "equipmentInterest": "Liquid Nitrogen Storage 1000L",
    "estimatedValue": 850000
  }
  ```
- **Success (201 Created)**: Returns created lead with status `NEW`.
- **Database Effect**: Inserts document into `leads` collection.

### 2.3 POST /api/sales/leads/:id/actions/:action
- **Purpose**: State transition on lead (`qualify`, `lose`).
- **Authentication**: Bearer Token
- **Permission**: `lead.qualify` or `lead.lose`
- **Path Params**: `id`, `action` (`qualify` or `lose`)
- **Request Body**:
  ```json
  {
    "remarks": "Qualified after technical requirement review"
  }
  ```
- **Success (200 OK)**: Updates lead status to `QUALIFIED` or `LOST`.
- **Workflow Effect**: Qualifying automatically creates/links Customer master record.

---

### 2.4 GET /api/sales/quotations
- **Purpose**: Lists commercial proposals and quotations.
- **Authentication**: Bearer Token
- **Permission**: `quotation.view`
- **Success (200 OK)**: Returns array of quotations with client and total values.

### 2.5 POST /api/sales/quotations
- **Purpose**: Generates a new official cryogenic quotation.
- **Authentication**: Bearer Token
- **Permission**: `quotation.create`
- **Request Body**:
  ```json
  {
    "customerId": "660b2...",
    "leadId": "660a1...",
    "validUntil": "2026-11-30T00:00:00.000Z",
    "lineItems": [
      {
        "productId": "660c3...",
        "itemCode": "CRYO-VESSEL-1000L",
        "description": "1000L Liquid Nitrogen Storage Vessel",
        "quantity": 1,
        "unitPrice": 850000,
        "discountPercent": 0,
        "taxRate": 18
      }
    ],
    "paymentTerms": "30% Advance, 70% Before Dispatch",
    "deliveryTerms": "Ex-Works Factory",
    "warrantyTerms": "12 Months Comprehensive"
  }
  ```
- **Validation**: Customer required, items non-empty, prices positive.
- **Success (201 Created)**: Quotation generated with status `DRAFT`.

### 2.6 POST /api/sales/quotations/:id/actions/:action
- **Purpose**: Authoritative state transition (`submit`, `approve`, `reject`, `send`, `negotiate`, `accept`, `cancel`).
- **Authentication**: Bearer Token
- **Permission**: Action-specific (`quotation.submit`, `quotation.approve`, `quotation.send`, etc.)
- **Request Body**:
  ```json
  {
    "remarks": "Approved by Commercial Committee",
    "reason": "Margin complies with policy"
  }
  ```
- **Workflow Effect**:
  - `submit`: Moves from `DRAFT` $\to$ `PENDING_APPROVAL`.
  - `approve`: Moves from `PENDING_APPROVAL` $\to$ `APPROVED`.
  - `send`: Moves from `APPROVED` $\to$ `SENT`.
  - `negotiate`: Moves from `SENT` $\to$ `NEGOTIATION`.
  - `accept`: Moves from `SENT` $\to$ `ACCEPTED`, automatically triggers Proforma Invoice generation.

### 2.7 POST /api/sales/quotations/:id/actions/revise
- **Purpose**: Creates an immutable child quotation revision.
- **Authentication**: Bearer Token
- **Permission**: `quotationRevision.create`
- **Request Body**:
  ```json
  {
    "reason": "Offered 5% volume concession per negotiation",
    "lineItems": [ ... ]
  }
  ```
- **Success (201 Created)**: Generates child revision `QT-0001-R1` while preserving parent history.

---

### 2.8 POST /api/sales/customer-pos/:id/verify
- **Purpose**: Runs automated 4-way contract comparison (Quotation vs Revision vs Proforma vs Customer PO).
- **Authentication**: Bearer Token
- **Permission**: `salesOrder.confirm`
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "match": true,
      "status": "MATCH",
      "comparison": {
        "product": "MATCH",
        "quantity": "MATCH",
        "unitPrice": "MATCH",
        "tax": "MATCH",
        "totalAmount": "MATCH",
        "paymentTerms": "MATCH",
        "deliveryTerms": "MATCH",
        "warrantyTerms": "MATCH"
      }
    }
  }
  ```
- **Workflow Effect**: Unlocks creation of Confirmed Sales Order.

### 2.9 POST /api/sales/orders/:id/actions/:action
- **Purpose**: Transition Sales Order (`confirm`, `cancel`).
- **Success (200 OK)**: Transitions to `CONFIRMED`.

### 2.10 POST /api/sales/payments/:id/actions/verify
- **Purpose**: Verifies advance payment remittance against bank statement.
- **Permission**: `payment.verify`
- **Success (200 OK)**: Marks payment as `VERIFIED`.
- **Workflow Effect**: Evaluates milestone criteria to unlock Production Release.

---

## 3. Manufacturing & Shopfloor Operations

### 3.1 POST /api/production/orders
- **Purpose**: Creates production order and work order for confirmed sales order.
- **Permission**: `production.create`
- **Request Body**:
  ```json
  {
    "salesOrderId": "660d4...",
    "productId": "660c3...",
    "plannedQuantity": 1,
    "targetDate": "2026-12-15"
  }
  ```
- **Workflow Effect**: Explodes BOM, checks stock availability, issues material requests.

### 3.2 POST /api/production/orders/:id/actions/:action
- **Purpose**: Production state transition (`release`, `start`, `hold`, `complete`).
- **Permission**: `production.release`, `production.start`, `production.complete`
- **Workflow Effect**: On `complete`, creates unit serial number and queues automated QA test suite.

### 3.3 POST /api/production/operations/:id/actions/:action
- **Purpose**: Records completion of routing workstation (Fabrication, Refrigeration, Electrical, Assembly).
- **Request Body**:
  ```json
  {
    "completedQuantity": 1,
    "rejectedQuantity": 0,
    "remarks": "Radiography weld inspection passed"
  }
  ```

---

## 4. Inventory, Ledger & Procurement

### 4.1 GET /api/inventory/stock
- **Purpose**: Current stock balances across warehouses with reserved/available breakdown.
- **Permission**: `inventory.view`

### 4.2 POST /api/inventory/adjust
- **Purpose**: Posts manual inventory adjustment with reason to double-entry ledger.
- **Permission**: `inventory.adjust`
- **Database Effect**: Creates `InventoryLedger` movement record and recalculates `StockItem` balance.

### 4.3 POST /api/procurement/rfqs/:id/select-vendor
- **Purpose**: Awards procurement RFQ to supplier based on bid matrix.
- **Request Body**: `{ "vendorId": "660e5..." }`
- **Workflow Effect**: Automatically generates approved Vendor Purchase Order.

### 4.4 POST /api/procurement/grns/:id/actions/accept
- **Purpose**: Accepts inspected dock delivery into warehouse stock.
- **Permission**: `inventory.issue`
- **Workflow Effect**: Posts `GRN_RECEIPT` into `InventoryLedger`, increases available stock, fulfills pending Material Requests.

---

## 5. Quality Assurance & Serial Traceability

### 5.1 POST /api/qa/tests/:id/actions/pass
- **Purpose**: Marks cryogenic testing as passed.
- **Permission**: `qa.pass`
- **Workflow Effect**: Generates Cryogenic Compliance Certificate, serial status becomes `QA_PASSED`.

### 5.2 POST /api/qa/tests/:id/actions/fail
- **Purpose**: Marks testing as failed with defect observations.
- **Permission**: `qa.fail`
- **Workflow Effect**: Generates NCR, unlocks `retest`, `rework`, or `scrap`.

### 5.3 GET /api/serials/:serialNumber/trace
- **Purpose**: 360-degree digital product passport query.
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "trace": {
        "serial": { "serialNumber": "CRYO-2026-0001", "status": "WARRANTY_ACTIVE" },
        "productionOrder": { ... },
        "qaTest": { ... },
        "packingList": { ... },
        "dispatch": { ... },
        "warranty": { ... },
        "timeline": [
          { "event": "SERIAL_CREATED", "timestamp": "..." },
          { "event": "QA_PASSED", "timestamp": "..." },
          { "event": "WARRANTY_ACTIVATED", "timestamp": "..." }
        ]
      }
    }
  }
  ```

---

## 6. Logistics, Delivery & Site Service

### 6.1 POST /api/logistics/packing-lists/:id/actions/complete
- **Purpose**: Confirms equipment crating and shock mounting.
- **Workflow Effect**: Serial status becomes `PACKED`.

### 6.2 POST /api/logistics/invoices/:id/actions/post
- **Purpose**: Posts final tax invoice to General Ledger.
- **Workflow Effect**: Invoice status becomes `POSTED`.

### 6.3 POST /api/logistics/dispatches/:id/actions/dispatch
- **Purpose**: Authorizes factory gate-out with carrier LR and E-Way bill.
- **Workflow Effect**: Serial status becomes `DISPATCHED`.

### 6.4 POST /api/logistics/deliveries/:id/actions/deliver
- **Purpose**: Confirms consignee arrival with receiver name and digital POD.
- **Workflow Effect**: Delivery marked `DELIVERED`, unlocks Site Installation scheduling.

### 6.5 POST /api/service/commissioning/:id/actions/pass
- **Purpose**: Passes site pull-down cryogenic trial.
- **Workflow Effect**: Automatically triggers Warranty Activation (`WARRANTY_ACTIVE`) for 12-36 months.

### 6.6 POST /api/service/tickets/:id/actions/:action
- **Purpose**: Field incident lifecycle (`assign`, `diagnose`, `repair`, `signoff`, `close`).
- **Workflow Effect**: Updates ticket status, records spare part consumption, logs to serial passport.

### 6.7 POST /api/service/rmas/:id/actions/decide
- **Purpose**: Records official resolution on factory returned equipment.
- **Request Body**:
  ```json
  {
    "decision": "REPLACEMENT",
    "decisionNotes": "Inner vessel vacuum seal irreparably fractured"
  }
  ```
- **Workflow Effect**: RMA status marked `DECIDED`, triggers replacement serial issue or credit note.

---

## 7. Governance, Audit & Dashboard

### 7.1 GET /api/system/audit-logs
- **Purpose**: Queries immutable audit trail.
- **Query Params**: `entityType`, `page`, `limit`
- **Success (200 OK)**: Returns chronological audit logs with actor and delta payload.

### 7.2 GET /api/system/dashboard/kpis
- **Purpose**: Aggregates role-aware operational metrics across sales, manufacturing, inventory, QA, logistics, and service.
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "kpis": {
        "openLeads": 1,
        "pendingApprovals": 0,
        "activeSalesOrders": 1,
        "verifiedPayments": 1,
        "productionOrders": 1,
        "lowStockAlerts": 0,
        "pendingQATests": 0,
        "activeWarranties": 1,
        "openServiceTickets": 0
      }
    }
  }
  ```
