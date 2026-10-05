# CryoTech Industrial ERP — Database Schema & Data Dictionary

## 1. Database Overview & Strategy
- **Database Engine**: MongoDB
- **Object Data Modeling (ODM)**: Mongoose
- **Database Name**: `cryo_erp`
- **Indexing Philosophy**:
  - Unique compound indexes on business identifiers (`quotationNumber`, `salesOrderNumber`, `serialNumber`, `poNumber`, etc.)
  - Foreign key reference indexing (`customerId`, `vendorId`, `productId`, `productionOrderId`)
  - Status and date range query indexes for high-throughput dashboard KPI aggregations

---

## 2. Collection & Model Reference

### 2.1 Core Master Collections

#### `users` (Model: User)
- **Purpose**: Authenticated system users, roles, and credential hashes.
- **Fields**:
  - `name`: `String` (Required, Trimmed)
  - `email`: `String` (Required, Unique, Lowercase, Indexed)
  - `password`: `String` (Required, Hashed via bcryptjs)
  - `role`: `String` (Enum: `ADMIN`, `MANAGEMENT`, `SALES`, `SALES_MANAGER`, `ACCOUNTS`, `PURCHASE`, `STORE`, `PRODUCTION`, `QA`, `DISPATCH`, `SERVICE_MANAGER`, `SERVICE_ENGINEER`)
  - `phone`: `String`
  - `isActive`: `Boolean` (Default: `true`)
  - `createdAt`, `updatedAt`: `Date` (Timestamps)

#### `customers` (Model: Customer)
- **Purpose**: Verified commercial clients and hospital/research organizations.
- **Fields**:
  - `customerCode`: `String` (Unique, Indexed, e.g. `CUST-2026-0001`)
  - `name`: `String` (Required)
  - `email`: `String` (Required, Indexed)
  - `phone`: `String`
  - `address`: `String`
  - `gstNumber`: `String` (Indexed, GSTIN format)
  - `panNumber`: `String`
  - `creditLimit`: `Number` (Default: 0)

#### `products` (Model: Product)
- **Purpose**: Finished cryogenic equipment models and components.
- **Fields**:
  - `productCode`: `String` (Unique, Indexed, e.g. `CRYO-VESSEL-1000L`)
  - `name`: `String` (Required)
  - `category`: `String` (Enum: `STORAGE_VESSEL`, `TRANSPORT_TANKER`, `VAPORIZER`, `CYLINDER_MANIFOLD`, `SPARES`)
  - `capacityLitres`: `Number`
  - `designPressureBar`: `Number`
  - `mawpBar`: `Number`
  - `standardCost`: `Number`
  - `basePrice`: `Number`
  - `hsnCode`: `String` (Default: `84186990`)
  - `defaultWarrantyMonths`: `Number` (Default: 12)

#### `vendors` (Model: Vendor)
- **Purpose**: Certified raw material and cryogenic component suppliers.
- **Fields**:
  - `vendorCode`: `String` (Unique, Indexed)
  - `name`: `String` (Required)
  - `category`: `String`
  - `email`: `String` (Required)
  - `gstNumber`: `String`
  - `rating`: `Number` (Default: 4.5)

#### `warehouses` (Model: Warehouse)
- **Purpose**: Physical plant storage bays and staging locations.
- **Fields**:
  - `code`: `String` (Unique, Indexed, e.g. `WH-RAW`, `WH-WIP`, `WH-FG`)
  - `name`: `String`
  - `type`: `String` (Enum: `RAW_MATERIAL`, `WORK_IN_PROGRESS`, `FINISHED_GOODS`, `SERVICE_SPARES`)
  - `location`: `String`

#### `workcenters` (Model: WorkCenter)
- **Purpose**: Manufacturing shopfloor stations for routing operations.
- **Fields**:
  - `code`: `String` (Unique, Indexed, e.g. `WC-FAB`, `WC-REFRIG`, `WC-ELEC`, `WC-ASSY`)
  - `name`: `String`
  - `operationType`: `String`
  - `costPerHour`: `Number`

---

### 2.2 Commercial Subsystem Collections

#### `leads` (Model: Lead)
- **Fields**: `leadNumber` (Unique, Indexed), `contactName`, `companyName`, `email`, `phone`, `equipmentInterest`, `estimatedValue`, `status` (Enum: `NEW`, `CONTACTED`, `QUALIFIED`, `LOST`), `lossReason`.

#### `quotations` (Model: Quotation)
- **Fields**:
  - `quotationNumber`: `String` (Unique, Indexed, e.g. `QT-2026-0001`)
  - `customerId`: `ObjectId` (Ref: `Customer`, Indexed)
  - `leadId`: `ObjectId` (Ref: `Lead`)
  - `currentRevisionNumber`: `Number` (Default: 0)
  - `lineItems`: `Array` of `{ productId, itemCode, description, quantity, unitPrice, discountPercent, taxRate, totalPrice }`
  - `subtotal`: `Number`
  - `taxAmount`: `Number`
  - `totalAmount`: `Number` (Indexed)
  - `paymentTerms`: `String`
  - `deliveryTerms`: `String`
  - `warrantyTerms`: `String`
  - `status`: `String` (Enum: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `NEGOTIATION`, `REVISED`, `ACCEPTED`, `REJECTED`, `EXPIRED`)
  - `approvedBy`: `ObjectId` (Ref: `User`)
  - `approvedAt`: `Date`

#### `quotation_revisions` (Model: QuotationRevision)
- **Fields**: `revisionNumber`, `parentQuotationId` (Ref: `Quotation`, Indexed), `previousRevisionId`, `lineItems`, `oldTotal`, `newTotal`, `reason`, `createdBy` (Ref: `User`).

#### `customer_pos` (Model: CustomerPO)
- **Fields**: `poNumber` (Indexed), `customerId` (Ref: `Customer`), `quotationId` (Ref: `Quotation`), `lineItems`, `totalAmount`, `documentUrl`, `verificationStatus` (Enum: `PENDING`, `MATCH`, `MISMATCH`, `HOLD`).

#### `sales_orders` (Model: SalesOrder)
- **Fields**: `salesOrderNumber` (Unique, Indexed, e.g. `SO-2026-0001`), `customerId` (Ref: `Customer`), `customerPoId` (Ref: `CustomerPO`), `lineItems`, `totalAmount`, `advanceRequiredPercent`, `advancePaidAmount`, `status` (Enum: `DRAFT`, `CONFIRMED`, `RELEASED`, `IN_PRODUCTION`, `READY_FOR_DISPATCH`, `DISPATCHED`, `COMPLETED`, `CANCELLED`).

#### `payments` (Model: Payment)
- **Fields**: `paymentNumber` (Unique, Indexed), `salesOrderId` (Ref: `SalesOrder`, Indexed), `customerId` (Ref: `Customer`), `amount`, `paymentMethod`, `bankName`, `transactionReference` (Indexed), `status` (Enum: `PENDING`, `RECEIVED`, `VERIFIED`, `REVERSED`, `REFUNDED`), `verifiedBy` (Ref: `User`), `verifiedAt`.

---

### 2.3 Manufacturing & Inventory Collections

#### `boms` (Model: BOM)
- **Fields**: `bomNumber` (Unique, Indexed), `productId` (Ref: `Product`), `version`, `materials`: `Array` of `{ itemCode, description, quantityRequired, uom }`, `isDefault`: `Boolean`.

#### `production_orders` (Model: ProductionOrder)
- **Fields**: `productionOrderNumber` (Unique, Indexed, e.g. `PO-2026-0001`), `salesOrderId` (Ref: `SalesOrder`), `productId` (Ref: `Product`), `plannedQuantity`, `producedQuantity`, `targetDate`, `status` (Enum: `DRAFT`, `RELEASED`, `MATERIAL_READY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).

#### `material_requests` (Model: MaterialRequest)
- **Fields**: `requestNumber` (Unique, Indexed), `productionOrderId` (Ref: `ProductionOrder`), `items`: `Array` of `{ itemCode, quantityRequired, quantityReserved, quantityIssued, status }`, `status`.

#### `stock_items` (Model: StockItem)
- **Fields**: `itemCode` (Unique, Indexed), `name`, `category`, `primaryWarehouseId` (Ref: `Warehouse`), `quantityOnHand`, `quantityReserved`, `quantityAvailable`, `unitCost`, `reorderLevel`.

#### `inventory_ledgers` (Model: InventoryLedger)
- **Fields**: `transactionNumber` (Unique, Indexed), `itemId` (Ref: `StockItem`, Indexed), `warehouseId` (Ref: `Warehouse`), `movementType` (Enum: `OPENING`, `GRN_RECEIPT`, `RESERVATION`, `ISSUE`, `CONSUMPTION`, `RETURN`, `ADJUSTMENT`, `SERVICE_ISSUE`), `quantity`, `balanceAfter`, `referenceDocumentType`, `referenceDocumentId`, `remarks`.

---

### 2.4 Quality, Serial & Logistics Collections

#### `qa_tests` (Model: QATest)
- **Fields**: `testNumber` (Unique, Indexed), `productionOrderId` (Ref: `ProductionOrder`), `serialNumberId` (Ref: `SerialNumber`), `parameters`: `Array` of `{ parameterName, requiredValue, actualValue, result }`, `overallResult` (Enum: `PENDING`, `PASS`, `FAIL`), `certificateNumber` (Indexed), `status`.

#### `serial_numbers` (Model: SerialNumber)
- **Fields**:
  - `serialNumber`: `String` (Unique, Indexed, e.g. `CRYO-2026-0001`)
  - `productId`: `ObjectId` (Ref: `Product`, Indexed)
  - `productionOrderId`: `ObjectId` (Ref: `ProductionOrder`)
  - `qaTestId`: `ObjectId` (Ref: `QATest`)
  - `customerId`: `ObjectId` (Ref: `Customer`)
  - `currentLocation`: `String`
  - `status`: `String` (Enum: `CREATED`, `IN_PRODUCTION`, `QA_PASSED`, `PACKED`, `DISPATCHED`, `DELIVERED`, `INSTALLED`, `WARRANTY_ACTIVE`, `IN_SERVICE`, `RMA_RETURNED`, `SCRAPPED`)

#### `packing_lists` (Model: PackingList)
- **Fields**: `packingListNumber` (Unique, Indexed), `salesOrderId` (Ref: `SalesOrder`), `packageType`, `dimensions`, `grossWeight`, `serialNumbers` (`Array` of `ObjectId`), `status`.

#### `final_invoices` (Model: FinalInvoice)
- **Fields**: `invoiceNumber` (Unique, Indexed), `salesOrderId` (Ref: `SalesOrder`), `customerId` (Ref: `Customer`), `lineItems`, `subtotal`, `taxAmount`, `totalAmount`, `status` (Enum: `DRAFT`, `POSTED`, `PAID`, `CANCELLED`).

#### `dispatches` (Model: Dispatch)
- **Fields**: `dispatchNumber` (Unique, Indexed), `invoiceId` (Ref: `FinalInvoice`), `transporterName`, `vehicleNumber`, `lrNumber`, `ewayBillNumber`, `status`.

#### `deliveries` (Model: Delivery)
- **Fields**: `deliveryNumber` (Unique, Indexed), `dispatchId` (Ref: `Dispatch`), `deliveryAddress`, `receivedBy`, `deliveredAt`, `podDocumentUrl`, `status` (Enum: `IN_TRANSIT`, `DELIVERED`, `FAILED`, `RESCHEDULED`).

---

### 2.5 Field Service & Governance Collections

#### `installations` (Model: Installation)
- **Fields**: `installationNumber` (Unique, Indexed), `serialNumberId` (Ref: `SerialNumber`), `customerId` (Ref: `Customer`), `leadEngineer`, `scheduledDate`, `completedDate`, `status`.

#### `commissionings` (Model: Commissioning)
- **Fields**: `commissioningNumber` (Unique, Indexed), `installationId` (Ref: `Installation`), `serialNumberId` (Ref: `SerialNumber`), `tests`, `status` (Enum: `PENDING`, `PASSED`, `FAILED`).

#### `warranties` (Model: Warranty)
- **Fields**: `warrantyNumber` (Unique, Indexed), `serialNumberId` (Ref: `SerialNumber`, Indexed), `customerId` (Ref: `Customer`), `startDate`, `endDate` (Indexed), `durationMonths`, `coveredParts`, `status` (Enum: `ACTIVE`, `EXPIRED`, `VOID`).

#### `service_tickets` (Model: ServiceTicket)
- **Fields**: `ticketNumber` (Unique, Indexed), `serialNumberId` (Ref: `SerialNumber`), `customerId` (Ref: `Customer`), `complaint`, `priority`, `warrantyStatus`, `assignedEngineer`, `status` (Enum: `OPEN`, `ASSIGNED`, `DIAGNOSED`, `REPAIRED`, `SIGNED_OFF`, `CLOSED`).

#### `rmas` (Model: RMA)
- **Fields**: `rmaNumber` (Unique, Indexed), `serialNumberId` (Ref: `SerialNumber`), `customerId` (Ref: `Customer`), `reason`, `decision` (Enum: `REPAIR`, `REPLACEMENT`, `CREDIT_NOTE`, `REFUND`), `status`.

#### `audit_logs` (Model: AuditLog)
- **Fields**: `auditId`, `entityType` (Indexed), `entityId` (Indexed), `action` (Indexed), `actorUserId` (Ref: `User`), `timestamp` (Indexed), `previousStatus`, `newStatus`, `changedFields`, `reason`, `ipAddress`.

#### `notifications` (Model: Notification)
- **Fields**: `title`, `message`, `recipientUserId` (Ref: `User`, Indexed), `recipientRole` (Indexed), `entityType`, `entityId`, `isRead` (Indexed), `createdAt`.
