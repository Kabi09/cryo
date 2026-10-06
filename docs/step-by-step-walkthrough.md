# CryoTech Industrial ERP — Step-by-Step Operational & Testing Guide

> **A comprehensive user manual and verification guide detailing role switches, step-by-step user journeys (Lead $\to$ Quotation $\to$ Production $\to$ QA $\to$ Dispatch $\to$ Warranty $\to$ Field Service), multiple testing scenarios, and exact UI button references.**

---

## 1. Quick Start & Prerequisites

1. **Verify Services Are Running**:
   - Backend API: `http://localhost:5000`
   - Frontend Web App: `http://localhost:5173`
   - MongoDB: Local instance connected to `cryo_erp`
2. **Open the Application**:
   Navigate your browser to: **`http://localhost:5173`**
3. **Reset Database with Fresh Data (Optional)**:
   If you ever want to test starting from a clean slate, open terminal in project root:
   ```bash
   node scripts/seed.js
   ```

---

## 2. Role Personas & Demo Credentials

Use these pre-seeded accounts for role-specific testing. All demo accounts share the same password.

**Universal Demo Password:** `Password@123`

| Operational Stage | User Email | Role | Quick Login Hint on UI |
|---|---|---|---|
| **Superuser / All-Access** | `admin@example.com` | `ADMIN` | Top-left pill on demo accounts bar |
| **Sales Rep** | `sales@example.com` | `SALES` | Lead creation, customer entry, quotation drafting |
| **Sales Manager** | `manager@example.com` | `SALES_MANAGER` | Quotation approval, PO verification, Sales order confirm |
| **Accounts / Finance** | `accounts@example.com` | `ACCOUNTS` | Payment verification, tax invoicing, refund notes |
| **Procurement Head** | `purchase@example.com` | `PURCHASE` | Material shortage RFQs, vendor quotes comparison |
| **Store Keeper** | `store@example.com` | `STORE` | Stock ledger, dock GRN receiving, reservations |
| **Production Supervisor** | `production@example.com` | `PRODUCTION` | Work order release, BOM explosion, floor routing |
| **QA Inspector** | `qa@example.com` | `QA` | Helium leak tests, cryo pull-down, certificates |
| **Logistics Manager** | `dispatch@example.com` | `DISPATCH` | Shock-mount crating, outbound freight, gate passes |
| **Field Service Manager** | `service@example.com` | `SERVICE_MANAGER` | Field incident ticketing, RMA factory returns |
| **Field Service Engineer** | `engineer@example.com` | `SERVICE_ENGINEER` | Site installation, commissioning, repairs |

> 💡 **Tip:** On the Login page (`/login`), click any role pill to automatically fill in the credentials and click **Sign In**.

---

## 3. Step-by-Step Primary Workflow Walkthrough

### 📍 STEP 1: Log in as Sales Executive
1. Go to `http://localhost:5173/login`.
2. Click the **Sales Rep** pill (`sales@example.com`) or type the credentials.
3. Click **Sign In**.
4. **Expected Result**: You are directed to `/dashboard` with executive KPI cards, recent activity, and top action buttons.

---

### 📍 STEP 2: Create a New Sales Lead (Enquiry)
1. **How to Navigate**:
   - In the left sidebar, click the **Enquiries / Leads** link (located under the *SALES & COMMERCIALS* group header).
   - *OR* simply click the **+ New Enquiry** button in the top right of the Dashboard.
2. In the top right of the Enquiries page, click the **+ Capture Enquiry** button.
3. Fill in the modal form:
   - **Company Name**: `Apollo Cryogenics Research Institute`
   - **Contact Person**: `Dr. S. K. Narayanan`
   - **Email Address**: `dr.narayanan@apollocryo.org`
   - **Phone**: `+91 98401 23456`
   - **Lead Source**: Select `WEBSITE` or `DIRECT_INQUIRY`
   - **Requirement / Equipment Details**: `Liquid Nitrogen Cryo Storage Vessel 1000L`
   - **Estimated Budget (₹)**: `850000`
4. Click **Capture Lead**.
5. **Expected Result**:
   - Success alert appears.
   - Lead table displays the new row with number (e.g. `LEAD-XXXXXX`), company name, and status badge **NEW**.

---

### 📍 STEP 3: Qualify Lead to Enterprise Customer Master
1. In the Enquiries & Leads table, locate your newly created lead.
2. In the rightmost column, click the green button **Qualify**.
3. **Expected Result**:
   - The lead badge changes from **NEW** $\rightarrow$ **QUALIFIED**.
   - A success popup confirms customer creation.
4. In the left sidebar, click **Customers** (under *SALES & COMMERCIALS*).
5. **Expected Result**:
   - `Apollo Cryogenics Research Institute` is now automatically listed as an active Enterprise Customer with a generated code (e.g. `CUST-XXXXX`).

---

### 📍 STEP 4: Create Commercial Quotation
1. **How to Navigate**:
   - In the left sidebar, click **Quotations & Revisions** (under *SALES & COMMERCIALS*).
   - *OR* from the Dashboard, click the **+ Create Quotation** button in the top right.
2. On the Quotations page, click the **+ Draft Quotation** button in the header.
3. Fill in the Draft Commercial Proposal form:
   - **Select Customer Account**: Select `Apollo Cryogenics Research Institute` from the dropdown.
   - **Select Cryogenic Product**: Select any equipment (e.g. `Liquid Nitrogen Storage Vessel 1000L` or `Cascade Cryo-Chiller`).
   - **Quantity**: `1`
   - **Unit Price (INR)**: Auto-filled from master (or adjust as needed).
   - **Discount %**: `5`
   - **Commercial Terms**:
     - Payment Terms: `30% Advance, 70% against Proforma Invoice prior to dispatch`
     - Delivery Terms: `Ex-Works Chennai factory, freight extra`
     - Warranty Terms: `12 Months comprehensive warranty from the date of Commissioning PASS`
4. Click **Generate Quotation**.
5. **Expected Result**:
   - A new quotation row appears in the table (e.g. `QT-2026-XXXXX`) with status **DRAFT**.
6. In the table row, click **View & Manage →** to navigate to the Quotation Detail view (`/sales/quotations/:id`).

---

### 📍 STEP 5: Submit Quotation for Commercial Management Review
1. On the Quotation Details page, review the calculated Taxable Subtotal, Discount, GST Tax (18%), and Grand Total.
2. In the top right action area, click the blue button **Submit for Manager Review →**.
3. **Expected Result**:
   - Quotation status transitions from **DRAFT** $\rightarrow$ **PENDING_APPROVAL**.
   - An in-app notification is automatically dispatched to the Sales Manager.

---

### 📍 STEP 6: Manager Approval & Client Transmission
1. **Switch User**: Click the logout icon in the top right navbar.
2. Log in as **Sales Manager** (`manager@example.com` / `Password@123`).
3. In the left sidebar, click **Quotations & Revisions** $\rightarrow$ Click **View & Manage →** on your quotation (`QT-2026-XXXXX`).
4. Notice the available managerial action buttons:
   - **Approve Quotation** (green)
   - **Reject** (red)
5. Click **Approve Quotation**.
6. **Expected Result**:
   - Status updates to **APPROVED**.
7. Now click the blue button **Dispatch to Customer**.
8. **Expected Result**:
   - Status updates to **SENT**. Official commercial proposal is now active with the client.

---

### 📍 STEP 7: Customer Interaction Scenarios

#### 🔄 SCENARIO 7A: Customer Negotiates & Revision Cycle (Concessions)
1. On the Quotation Detail screen (`SENT` status), click the grey button **Log Counter-Offer**.
2. Enter the client's request:
   - Requested Discount: `7%`
   - Client Notes: `Client requested volume concession per institutional budget`.
   - Click **Save Negotiation Notes**. Status becomes **NEGOTIATION**.
3. Click the blue button **Create New Revision**.
4. Set discount to `7%` and enter reason: `Applied 7% concession`. Click **Create Versioned Revision**.
5. **Expected Result**:
   - Quotation is incremented to **Revision 1** (`QT-XXXXX-R1`).
   - Prior revision history is immutably preserved in the **Revision History** tab.
   - Click **Approve Quotation** $\rightarrow$ **Dispatch to Customer** for the new revision.

#### 🔄 SCENARIO 7B: Customer Accepts Quotation
1. On the active sent quotation, click the green button **Customer Accepts (Generate PI)**.
2. **Expected Result**:
   - Status becomes **ACCEPTED**.
   - The system automatically generates a **Proforma Invoice** (e.g. `PI-2026-XXXXX`) detailing the advance payment milestone.

---

### 📍 STEP 8: Customer PO Submission & 4-Way Verification
1. In the left sidebar, click **Customer PO & 4-Way** (under *SALES & COMMERCIALS*).
2. Click the top button **+ Ingest Customer PO**.
3. In the modal:
   - **Accepted Quotation Ref**: Select your accepted quotation.
   - **Customer PO Number**: `PO-APOLLO-2026-0099`
   - **Total PO Amount**: Auto-filled matching quotation grand total.
4. Click **Submit Customer PO**.

#### 🔍 4-Way Verification Engine Check:
1. In the Customer PO list, click **Run 4-Way Verification →** on the newly added PO.
2. The verification modal compares all 4 contracts line by line:
   - Original Quotation vs Accepted Revision vs Proforma Invoice vs Customer PO
3. **Verify the Comparison Vectors**:
   - Product Model: `MATCH`
   - Quantity: `MATCH`
   - Quoted Price: `MATCH`
   - Tax Calculations: `MATCH`
   - Commercial Terms: `MATCH`
4. Click the green button **✓ Confirm & Generate Sales Order**.
5. **Expected Result**:
   - Sales Order is generated (e.g. `SO-2026-XXXXX`).

---

### 📍 STEP 9: Advance Payment Remittance & Verification
1. Log out and sign in as **Accounts** (`accounts@example.com` / `Password@123`).
2. In the left sidebar, click **Payment Receipts** (under *SALES & COMMERCIALS*).
3. Click **+ Record Inward Payment**:
   - **Sales Order**: Select your Sales Order (`SO-2026-XXXXX`).
   - **Amount (INR)**: Auto-filled with required advance (e.g. `255000` or `807120`).
   - **Payment Method**: Select `RTGS` or `NEFT`.
   - **Bank Name**: `HDFC Bank`
   - **Transaction Reference**: `UTR-SBIN202610069988`
4. Click **Record Payment Entry**.
5. In the payments table row, click **Verify Remittance**.
6. **Expected Result**:
   - Status updates to **VERIFIED**.
   - Production Release threshold is unlocked!

---

### 📍 STEP 10: Production Release & Routing Operations
1. Sign in as **Production Supervisor** (`production@example.com` / `Password@123`).
2. In the left sidebar, click **Sales Orders** (under *SALES & COMMERCIALS*).
3. Click **Release to Production** on your confirmed order.
4. Now in the sidebar, click **Production Orders** (under *MANUFACTURING & STAGING*).
5. Locate the generated order (e.g. `PRD-2026-XXXXX`).
6. Click **Release Order (Stage Materials)**.
7. Click **Floor Operations** (under *MANUFACTURING & STAGING*).
8. Execute each workstation routing operation:
   - **Fabrication Station**: Click **Start Operation** $\rightarrow$ Click **Complete Operation** (Inner pressure vessel rolled and welded).
   - **Refrigeration & Vacuum**: Click **Start Operation** $\rightarrow$ Click **Complete Operation** (MLI superinsulation wrapped, vacuum pulled).
   - **Electrical & Controls**: Click **Start Operation** $\rightarrow$ Click **Complete Operation** (Level sensors and solenoid valves wired).
   - **Final Mechanical Skid**: Click **Start Operation** $\rightarrow$ Click **Complete Operation** (Outer vessel bolted and torqued).
9. Return to **Production Orders** $\rightarrow$ Click **Complete Assembly & Send to QA →**.
10. **Expected Result**:
    - Manufacturing is finished and a unique Serial Number is generated (e.g. `CRYO-2026-XXXX`).

---

### 📍 STEP 11: Cryogenic QA Compliance Testing
1. Sign in as **QA Inspector** (`qa@example.com` / `Password@123`).
2. In the left sidebar, click **QA Testing & Certs** (under *QUALITY & TRACEABILITY*).
3. In the testing table, locate your unit.
4. Click **View Checklist** to review all test parameters:
   - Helium Mass Spectrometer Leak Detection ($\le 1 \times 10^{-9}$ mbar·L/s)
   - Deep Cold Liquid Nitrogen Pull-Down (-196°C)
   - Hydrostatic Proof Pressure (1.5x MAWP)
   - Static Outer Vacuum Retention ($< 1 \times 10^{-4}$ mbar)

#### 🧪 SCENARIO 11A: PASS (Compliance Certificate Generated)
1. Click **Pass & Certify**.
2. **Expected Result**:
   - Status updates to **PASSED**.
   - Click the Certificate button (e.g. `CERT-CRYO-XXXXXX`) to inspect the signed Cryogenic Quality Compliance Certificate.
   - Serial status automatically advances to `QA_PASSED`.

#### 🧪 SCENARIO 11B: FAIL Exception (Defect / Retest)
1. If you click **Fail**, enter defect notes (*Micro-leak detected on auxiliary gland*).
2. Unit enters **FAILED** status.
3. Click **Retest** or **Rework** to log corrective actions before re-certifying.

---

### 📍 STEP 12: 360° Serial Traceability Passport
1. In the left sidebar, click **360° Serial Traceability** (under *QUALITY & TRACEABILITY*).
2. Enter your serial number in the search bar, or click your serial pill in the active serials row.
3. **Verify the Digital Product Passport**:
   - Equipment Model, Serial Number, Owner (`Apollo Cryogenics`).
   - Connected ERP documents (Production Order, QA Certificate).
   - 360° Lifecycle timeline detailing creation, shopfloor completion, and QA certification.

---

### 📍 STEP 13: Crating, Invoicing & Freight Logistics
1. Sign in as **Logistics Manager** (`dispatch@example.com` / `Password@123`).
2. In the left sidebar, click **Packing Lists** (under *LOGISTICS & INVOICING*).
3. Click **Create Packing List**:
   - Select your Sales Order and Serial Number.
   - Package Type: `Heavy-duty Wooden Crate with Cryo Shock Mounts`.
   - Click **Generate Packing List** $\rightarrow$ Click **Complete & Seal**.
4. In the left sidebar, click **Tax Invoices**:
   - Click **Generate Tax Invoice** for the order.
   - In the table row, click **Post to GL** (Status: `POSTED`).
5. In the left sidebar, click **Dispatch Advice**:
   - Click **Create Dispatch Advice**.
   - Transporter: `VRL Heavy Logistics` | Vehicle: `KA-01-EQ-9988` | LR: `LR-44012` | E-Way: `EWB-99881122`.
   - Click **Authorize Gate Out** $\rightarrow$ Click **Mark In-Transit**.

---

### 📍 STEP 14: Consignee Delivery & Proof of Delivery (POD)
1. In the left sidebar, click **Deliveries & POD** (under *LOGISTICS & INVOICING*).
2. Locate the in-transit delivery and click **Confirm POD**:
   - Consignee Full Name: `Dr. S. K. Narayanan`
   - Receiver Notes: `Crate received intact, shock mount sensors intact, vacuum normal`.
3. Click **Confirm POD & Accept**.
4. **Expected Result**:
   - Consignment status becomes **DELIVERED & VERIFIED**.
   - Site Rigging & Installation is unlocked.

---

### 📍 STEP 15: Site Installation & Pull-Down Commissioning
1. Sign in as **Field Service Engineer** (`engineer@example.com` / `Password@123`).
2. In the left sidebar, click **Installations** (under *FIELD SERVICE & WARRANTY*):
   - Click **Schedule Installation** for the serial.
   - In the table row, click **Start Rigging** $\rightarrow$ Click **Complete & Handover**.
3. In the left sidebar, click **Commissioning Tests**:
   - Click **Initiate Commissioning**.
   - Review cryogenic cold-fill telemetry (-196°C target).
   - Click **Pass & Activate Warranty**.
4. **Expected Result**:
   - Commissioning test marked **PASSED**.
   - A 12-Month product warranty is **automatically activated** in the database.
5. In the left sidebar, click **Warranties** $\rightarrow$ Observe the active guarantee card!

---

### 📍 STEP 16: Field Service Incident & Customer Sign-Off
1. Sign in as **Field Service Manager** (`service@example.com` / `Password@123`).
2. In the left sidebar, click **Service Tickets** (under *FIELD SERVICE & WARRANTY*).
3. Click **Raise Service Ticket**:
   - Serial Number: Choose your serial.
   - Urgency Priority: `HIGH`.
   - Customer Complaint: `Auxiliary decant valve weeping cryogenic vapor`.
4. Observe the badge: **WARRANTY VALID** (System verified active warranty coverage!).
5. Step through the ticket lifecycle:
   - Click **Assign** (Assigns regional field engineer).
   - Click **Diagnose** (Enter findings: *PTFE valve seal compressed*).
   - Click **Execute Repair** (Replaced PTFE gland packing).
   - Click **Customer Sign-Off** (Customer verified zero-leak at operating pressure).
   - Click **Close Ticket**.
6. **Expected Result**:
   - Incident closed and archived to the unit's 360° digital passport.

---

### 📍 STEP 17: Return Material Authorization (RMA) Factory Overhaul
1. In the left sidebar, click **RMA & Factory Return** (under *FIELD SERVICE & WARRANTY*).
2. Click **Initiate RMA Request**:
   - Serial Number: Select serial.
   - Reason: `Severe outer jacket vacuum degradation requiring factory re-evacuation`.
3. Execute RMA lifecycle:
   - Click **Authorize Return** (`APPROVED`).
   - Click **Dock Intake** (`RECEIVED`).
   - Click **Inspect Unit** (`INSPECTED`).
   - Click **Make Decision** $\rightarrow$ Select `REPAIR`, `REPLACEMENT`, `CREDIT_NOTE`, or `REFUND` $\rightarrow$ Confirm.
4. **Expected Result**:
   - RMA is marked **DECIDED**.

---

### 📍 STEP 18: Audit Trail & Live Dashboard Verification
1. Sign in as **System Administrator** (`admin@example.com` / `Password@123`).
2. In the left sidebar, click **Audit Trail** (under *GOVERNANCE & MASTERS*).
   - Review the complete chronological log of every action performed.
   - Click **Inspect** on any log to view the actor ID, timestamp, transition, and payload delta.
3. In the left sidebar, click **Dashboard** (under *CORE OPERATIONS*).
   - Notice the live updated Gross Revenue, Production runs, QA passed units, and verified payment metrics.

---

## 4. Verification Checklist Matrix

| Subsystem | Test Action | Expected Result | Verified |
|---|---|---|:---:|
| **Auth** | Sign in as each of the 12 demo users | Successful login, appropriate role badge in navbar | [x] |
| **Leads** | Click `+ Capture Enquiry` $\rightarrow$ Click `Qualify` | Lead qualified $\rightarrow$ Customer automatically created | [x] |
| **Quotation** | Click `+ Draft Quotation` $\rightarrow$ Click `Submit for Manager Review →` | Status changes to `PENDING_APPROVAL` | [x] |
| **Approval** | Manager clicks `Approve Quotation` $\rightarrow$ `Dispatch to Customer` | Status updates to `APPROVED` then `SENT` | [x] |
| **Negotiate** | Click `Log Counter-Offer` $\rightarrow$ `Create New Revision` | Versioned revision `QT-XXXXX-R1` created | [x] |
| **Accept** | Click `Customer Accepts (Generate PI)` | Status `ACCEPTED` $\rightarrow$ Proforma Invoice generated | [x] |
| **Customer PO**| Click `+ Ingest Customer PO` $\rightarrow$ `Run 4-Way Verification →` | 4-way comparison shows `MATCH` across all vectors | [x] |
| **Sales Order**| Click `✓ Confirm & Generate Sales Order` | Sales Order generated with advance amount | [x] |
| **Payment** | Click `+ Record Inward Payment` $\rightarrow$ `Verify Remittance` | Advance verified $\rightarrow$ Production release unlocked | [x] |
| **Production** | Click `Release Order (Stage Materials)` $\rightarrow$ Complete all 4 operations | Operations finished $\rightarrow$ Serial number generated | [x] |
| **QA** | Click `View Checklist` $\rightarrow$ `Pass & Certify` | Cryogenic Compliance Certificate generated | [x] |
| **Serial** | Search serial in 360° Traceability | Complete timeline displays with all linked records | [x] |
| **Packing** | Click `Create Packing List` $\rightarrow$ `Complete & Seal` | Status `COMPLETED` | [x] |
| **Invoice** | Click `Generate Tax Invoice` $\rightarrow$ `Post to GL` | Tax invoice posted with GST breakdown | [x] |
| **Dispatch** | Click `Create Dispatch Advice` $\rightarrow$ `Authorize Gate Out` | Outbound dispatch advice in transit | [x] |
| **Delivery** | Click `Confirm POD` $\rightarrow$ Sign | Delivery confirmed $\rightarrow$ Ready for installation | [x] |
| **Install** | Click `Schedule Installation` $\rightarrow$ `Start Rigging` $\rightarrow$ `Complete` | Installation marked complete | [x] |
| **Commission**| Click `Initiate Commissioning` $\rightarrow$ `Pass & Activate Warranty` | Commissioned $\rightarrow$ **Warranty Activated** | [x] |
| **Service** | Click `Raise Service Ticket` $\rightarrow$ `Assign` $\rightarrow$ `Diagnose` $\rightarrow$ `Repair` $\rightarrow$ `Sign-Off` | Ticket closed, active warranty applied | [x] |
| **RMA** | Click `Initiate RMA Request` $\rightarrow$ `Authorize` $\rightarrow$ `Receive` $\rightarrow$ `Inspect` $\rightarrow$ `Make Decision` | Decision (Repair/Replace/Credit) recorded | [x] |
| **Audit** | Query audit log in `/system/audit` | Every transition logged with actor & diff | [x] |

---

## 5. Automated E2E Workflow Test Runner

To test all 11 phases in seconds via headless script:
```bash
node scripts/verification/test-e2e-workflow.js
```
*Expected Output:*
```
========================================================
  ALL E2E WORKFLOW PHASES PASSED WITH ZERO ERRORS
========================================================
```
