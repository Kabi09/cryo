# CryoTech Industrial ERP — In-App Notifications Architecture

## 1. Overview & Architecture

The CryoTech ERP notification system provides real-time, event-driven in-app alerts across all functional roles. Notifications inform stakeholders of pending approvals, commercial negotiations, material shortages, quality defects, and field service milestones.

### Notification Model Schema
```javascript
{
  title: String,             // Concise event summary
  message: String,           // Actionable context details
  recipientUserId: ObjectId, // Targeted user (optional)
  recipientRole: String,     // Targeted role (e.g. 'SALES_MANAGER', 'PURCHASE')
  entityType: String,        // Subsystem reference ('QUOTATION', 'QA_TEST', etc.)
  entityId: ObjectId,        // Source record identifier
  isRead: Boolean,           // Read status (Default: false)
  createdAt: Date            // Event timestamp
}
```

---

## 2. Event-to-Role Broadcast Matrix

| Event Code | Trigger Condition | Recipient Role(s) | Notification Title & Sample Message |
|---|---|---|---|
| `QUOTATION_APPROVAL_REQ` | Sales draft submitted | `SALES_MANAGER`, `MANAGEMENT` | **Commercial Approval Required**: Quotation QT-2026-0001 requires commercial review. |
| `QUOTATION_APPROVED` | Manager approves quotation | `SALES` | **Quotation Approved**: QT-2026-0001 authorized for client transmission. |
| `CUSTOMER_NEGOTIATION` | Client requests discount | `SALES`, `SALES_MANAGER` | **Client Negotiation**: Counter-proposal received for QT-2026-0001. |
| `PO_MISMATCH` | 4-way contract diff fails | `SALES_MANAGER`, `ACCOUNTS` | **Customer PO Mismatch**: Discrepancies detected in PO-2026-9901. Status set to HOLD. |
| `PAYMENT_RECEIVED` | Advance remittance logged | `ACCOUNTS` | **Payment Received**: ₹2,55,000 received for SO-2026-0001 awaiting verification. |
| `PAYMENT_VERIFIED` | Accounts confirms funds | `SALES`, `PRODUCTION` | **Advance Verified**: Production Release unlocked for Sales Order SO-2026-0001. |
| `MATERIAL_SHORTAGE` | BOM inventory check deficit | `PURCHASE`, `STORE` | **Cryogenic Material Shortage**: Shortage detected for PO-2026-0001. RFQ required. |
| `VENDOR_PO_APPROVAL` | RFQ awarded to vendor | `PURCHASE`, `ACCOUNTS` | **Vendor PO Generated**: VPO-2026-0001 ready for supplier transmission. |
| `GRN_PENDING_INSPECT` | Vendor shipment at dock | `STORE`, `QA` | **Dock Inbound Intake**: Delivery challan arrived for VPO-2026-0001 awaiting inspection. |
| `QA_TEST_FAILED` | Helium leak / cryo defect | `PRODUCTION`, `QA` | **QA Defect Alert**: Non-conformance detected on Serial CRYO-2026-0001. |
| `READY_FOR_DISPATCH` | Unit passed QA & crated | `DISPATCH`, `SALES` | **Equipment Ready for Freight**: CRYO-2026-0001 crated and cleared for gate pass. |
| `DELIVERY_FAILED` | Consignee gate refusal | `DISPATCH`, `SERVICE_MANAGER` | **Delivery Exception**: Consignment refused at customer site. Reschedule required. |
| `INSTALLATION_ASSIGNED` | Delivery confirmed | `SERVICE_ENGINEER` | **Site Installation Scheduled**: Rigging assignment for CRYO-2026-0001. |
| `WARRANTY_ACTIVATED` | Commissioning passed | `SALES`, `CUSTOMER` | **Warranty Active**: 12-Month guarantee activated for Serial CRYO-2026-0001. |
| `SERVICE_TICKET_RAISED`| Malfunction logged | `SERVICE_MANAGER` | **Service Incident**: Priority complaint logged for Serial CRYO-2026-0001. |
| `SERVICE_COMPLETED` | Customer sign-off captured | `SERVICE_MANAGER`, `ACCOUNTS`| **Service Call Closed**: Field repairs signed off by customer. |
