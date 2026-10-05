const path = require('path');
module.paths.push(path.join(__dirname, '../backend/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Constants
const ROLES = require('../backend/src/constants/roles');
const STATUSES = require('../backend/src/constants/statuses');
const ROLE_PERMISSIONS = require('../backend/src/constants/rolePermissions');

// Models
const User = require('../backend/src/models/User');
const Customer = require('../backend/src/models/Customer');
const Product = require('../backend/src/models/Product');
const Vendor = require('../backend/src/models/Vendor');
const Warehouse = require('../backend/src/models/Warehouse');
const WorkCenter = require('../backend/src/models/WorkCenter');
const TermMaster = require('../backend/src/models/TermMaster');
const StockItem = require('../backend/src/models/StockItem');
const InventoryLedger = require('../backend/src/models/InventoryLedger');
const BOM = require('../backend/src/models/BOM');
const Lead = require('../backend/src/models/Lead');
const Quotation = require('../backend/src/models/Quotation');
const QuotationRevision = require('../backend/src/models/QuotationRevision');
const ProformaInvoice = require('../backend/src/models/ProformaInvoice');
const CustomerPO = require('../backend/src/models/CustomerPO');
const POVerification = require('../backend/src/models/POVerification');
const SalesOrder = require('../backend/src/models/SalesOrder');
const Payment = require('../backend/src/models/Payment');
const ProductionOrder = require('../backend/src/models/ProductionOrder');
const MaterialRequest = require('../backend/src/models/MaterialRequest');
const ProcurementRFQ = require('../backend/src/models/ProcurementRFQ');
const VendorQuotation = require('../backend/src/models/VendorQuotation');
const VendorPO = require('../backend/src/models/VendorPO');
const GRN = require('../backend/src/models/GRN');
const ProductionOperation = require('../backend/src/models/ProductionOperation');
const QATest = require('../backend/src/models/QATest');
const SerialNumber = require('../backend/src/models/SerialNumber');
const PackingList = require('../backend/src/models/PackingList');
const FinalInvoice = require('../backend/src/models/FinalInvoice');
const Dispatch = require('../backend/src/models/Dispatch');
const Delivery = require('../backend/src/models/Delivery');
const Installation = require('../backend/src/models/Installation');
const Commissioning = require('../backend/src/models/Commissioning');
const Warranty = require('../backend/src/models/Warranty');
const ServiceTicket = require('../backend/src/models/ServiceTicket');
const RMA = require('../backend/src/models/RMA');
const AuditLog = require('../backend/src/models/AuditLog');
const Notification = require('../backend/src/models/Notification');
const AuditService = require('../backend/src/services/auditService');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cryo_erp';
  console.log(`[Seed] Connecting to MongoDB: ${uri}`);
  await mongoose.connect(uri);

  console.log('[Seed] Dropping existing database to purge collections and indexes...');
  await mongoose.connection.db.dropDatabase();

  console.log('[Seed] Seeding Users for all 12 roles...');
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const demoUsersConfig = [
    { email: 'admin@example.com', name: 'Alexander Vance', role: ROLES.ADMIN, department: 'Executive Management' },
    { email: 'management@example.com', name: 'Victoria Sterling', role: ROLES.MANAGEMENT, department: 'Board of Directors' },
    { email: 'sales@example.com', name: 'Rohan Sharma', role: ROLES.SALES, department: 'Industrial Sales' },
    { email: 'manager@example.com', name: 'Priya Narayanan', role: ROLES.SALES_MANAGER, department: 'Commercial Operations' },
    { email: 'accounts@example.com', name: 'Karthik Raman', role: ROLES.ACCOUNTS, department: 'Finance & Treasury' },
    { email: 'purchase@example.com', name: 'Devendra Patel', role: ROLES.PURCHASE, department: 'Global Procurement' },
    { email: 'store@example.com', name: 'Murugan Sundaram', role: ROLES.STORE, department: 'Materials & Warehousing' },
    { email: 'production@example.com', name: 'Anand Kulkarni', role: ROLES.PRODUCTION, department: 'Plant Manufacturing' },
    { email: 'qa@example.com', name: 'Dr. Shalini Menon', role: ROLES.QA, department: 'Quality Assurance & Compliance' },
    { email: 'dispatch@example.com', name: 'Ganesh Pillai', role: ROLES.DISPATCH, department: 'Logistics & Shipping' },
    { email: 'service@example.com', name: 'Siddharth Roy', role: ROLES.SERVICE_MANAGER, department: 'Customer Support Services' },
    { email: 'engineer@example.com', name: 'Vikram Seth', role: ROLES.SERVICE_ENGINEER, department: 'Field Engineering' }
  ];

  const seededUsers = {};
  for (const u of demoUsersConfig) {
    const userDoc = new User({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      department: u.department,
      permissions: ROLE_PERMISSIONS[u.role] || [],
      isActive: true
    });
    await userDoc.save();
    seededUsers[u.role] = userDoc;
  }

  console.log('[Seed] Seeding Warehouses & Work Centers...');
  const warehouses = await Warehouse.insertMany([
    { code: 'WH-RM', name: 'Raw Materials & Components Yard', type: 'RAW_MATERIALS', location: 'Bay A1, Ambattur Plant' },
    { code: 'WH-SA', name: 'Sub-Assembly & Staging Bay', type: 'SUB_ASSEMBLY', location: 'Bay B2, Ambattur Plant' },
    { code: 'WH-FG', name: 'Finished Goods Insulated Depot', type: 'FINISHED_GOODS', location: 'Dock C, Ambattur Plant' },
    { code: 'WH-QR', name: 'Quarantine & Inspection Hold', type: 'QUARANTINE', location: 'Bay Q, Ambattur Plant' },
    { code: 'WH-SP', name: 'Central Field Spares Depot', type: 'SPARES_DEPOT', location: 'Logistics Annex 1' }
  ]);

  const workCenters = await WorkCenter.insertMany([
    { code: 'WC-FAB', name: 'Stainless Steel Vessel Fabrication', stage: 'FABRICATION', hourlyRate: 1400 },
    { code: 'WC-REF', name: 'Dual Cascade Refrigeration Piping', stage: 'REFRIGERATION', hourlyRate: 1800 },
    { code: 'WC-ELE', name: 'Cryogenic Control & Microprocessor Wiring', stage: 'ELECTRICAL', hourlyRate: 1600 },
    { code: 'WC-ASM', name: 'Chamber Vacuum Insulation & Final Assembly', stage: 'ASSEMBLY', hourlyRate: 2000 },
    { code: 'WC-QAT', name: 'Helium Leak & Pulldown Test Chamber', stage: 'QA_TESTING', hourlyRate: 2500 }
  ]);

  console.log('[Seed] Seeding Commercial & Tax Terms...');
  await TermMaster.insertMany([
    { category: 'TAX', code: 'GST-18', title: 'Standard GST 18%', percentage: 18, isDefault: true },
    { category: 'TAX', code: 'GST-12', title: 'Concessional Equipment GST 12%', percentage: 12 },
    { category: 'PAYMENT', code: 'ADV-30-BAL-DISP', title: '30% Advance, 70% against Proforma prior to dispatch', isDefault: true },
    { category: 'PAYMENT', code: 'NET-30', title: '100% Payment within 30 days of Delivery' },
    { category: 'DELIVERY', code: 'EXW', title: 'Ex-Works Chennai Factory, Transit Extra', isDefault: true },
    { category: 'DELIVERY', code: 'CIF', title: 'Cost, Insurance and Freight included to client site' },
    { category: 'WARRANTY', code: 'WAR-12M', title: '12 Months comprehensive warranty from Commissioning PASS', isDefault: true },
    { category: 'WARRANTY', code: 'WAR-36M-COMP', title: '12M Comprehensive + 36M Compressor Warranty' }
  ]);

  console.log('[Seed] Seeding Industrial Products & Cryogenic Equipment...');
  const products = await Product.insertMany([
    {
      sku: 'CRYO-ULT-800',
      name: 'CryoTech ULT-800 Ultra-Low Cryogenic Chamber',
      modelNumber: 'ULT-800-CAS',
      category: 'CRYOGENIC_FREEZER',
      capacity: '800 Liters',
      tempRating: '-150°C to -196°C',
      refrigerantType: 'R508B / R404A Dual Cascade Eco',
      electricalSpec: '415V 3-Phase 50Hz 4.2kW',
      basePrice: 1850000,
      warrantyMonths: 12,
      dimensions: '1450 x 1020 x 2050 mm',
      weightKg: 480
    },
    {
      sku: 'CRYO-LN2-500',
      name: 'CryoTech BioVault 500 Liquid Nitrogen Storage Tank',
      modelNumber: 'BV-500-LN2',
      category: 'LN2_STORAGE',
      capacity: '500 Liters',
      tempRating: '-196°C Liquid Phase',
      refrigerantType: 'Liquid Nitrogen (LN2)',
      electricalSpec: '230V 1-Phase Auto-fill controller',
      basePrice: 1250000,
      warrantyMonths: 24,
      dimensions: '1100 x 1100 x 1650 mm',
      weightKg: 280
    },
    {
      sku: 'CRYO-CAS-CHILL',
      name: 'Cascade Cryo-Chiller Sub-Zero Heat Exchanger',
      modelNumber: 'CCH-300-PRO',
      category: 'CASCADE_CHILLER',
      capacity: '300 kW Cooling',
      tempRating: '-86°C Continuous Run',
      refrigerantType: 'R507A / R23 Dual Loop',
      electricalSpec: '415V 3-Phase 50Hz 8.5kW',
      basePrice: 2400000,
      warrantyMonths: 12,
      dimensions: '2100 x 1300 x 1850 mm',
      weightKg: 650
    }
  ]);

  console.log('[Seed] Seeding Customers & Vendors...');
  const customer = new Customer({
    customerCode: 'CUST-APOLLO',
    companyName: 'Apollo Advanced Cell Therapeutics Ltd',
    contactPerson: 'Dr. Rajesh Sundaram',
    email: 'biotech.procurement@apollohealth.org',
    phone: '+91 98401 23456',
    gstin: '33AABCA1234F1Z8',
    pan: 'AABCA1234F',
    billingAddress: { street: 'Greams Lane, Off Greams Road', city: 'Chennai', state: 'Tamil Nadu', zipCode: '600006' },
    shippingAddress: { street: 'Biotech Innovation Park, Siruseri', city: 'Chennai', state: 'Tamil Nadu', zipCode: '603103' },
    creditLimit: 5000000,
    creditDays: 30,
    status: STATUSES.CUSTOMER.ACTIVE
  });
  await customer.save();

  const vendor = new Vendor({
    vendorCode: 'VEND-DANFOSS',
    companyName: 'Danfoss Cryogenic & Industrial Compressors',
    contactPerson: 'Suresh Raina',
    email: 'industrial.sales@danfoss-supplies.com',
    phone: '+91 99620 98765',
    gstin: '33AAACD9876E1Z4',
    paymentTerms: '30 Days Net',
    rating: 4.8,
    suppliedCategories: ['COMPRESSOR', 'CRYOGENIC_VALVE'],
    isActive: true
  });
  await vendor.save();

  console.log('[Seed] Seeding Stock Items and Inventory Ledger Movements...');
  const stockItems = await StockItem.insertMany([
    {
      sku: 'COMP-DAN-5HP',
      name: 'Danfoss 5HP Hermetic Deep Cryo Compressor',
      category: 'COMPRESSOR',
      uom: 'NOS',
      primaryWarehouseId: warehouses[0]._id,
      availableQuantity: 15,
      reservedQuantity: 0,
      reorderLevel: 5,
      unitCost: 185000
    },
    {
      sku: 'VALV-CRYO-05',
      name: 'Cryogenic Solenoid Expansion Valve 1/2" SS316',
      category: 'CRYOGENIC_VALVE',
      uom: 'NOS',
      primaryWarehouseId: warehouses[0]._id,
      availableQuantity: 40,
      reservedQuantity: 0,
      reorderLevel: 10,
      unitCost: 32000
    },
    {
      sku: 'SENS-PT100-RTD',
      name: 'Ultra-Precision 4-Wire PT-100 RTD Cryo Sensor',
      category: 'SENSOR',
      uom: 'NOS',
      primaryWarehouseId: warehouses[0]._id,
      availableQuantity: 50,
      reservedQuantity: 0,
      reorderLevel: 15,
      unitCost: 9500
    },
    {
      sku: 'TUBE-COP-HEAVY',
      name: 'Heavy Wall Deoxidized Refrigeration Copper Coils',
      category: 'COPPER_TUBE',
      uom: 'MTRS',
      primaryWarehouseId: warehouses[0]._id,
      availableQuantity: 500,
      reservedQuantity: 0,
      reorderLevel: 100,
      unitCost: 1200
    },
    {
      sku: 'GAS-R508B-CYL',
      name: 'R508B Ultra-Low Refrigerant Gas 10kg Cylinder',
      category: 'REFRIGERANT_GAS',
      uom: 'CYLINDERS',
      primaryWarehouseId: warehouses[0]._id,
      availableQuantity: 20,
      reservedQuantity: 0,
      reorderLevel: 4,
      unitCost: 65000
    }
  ]);

  // Record opening balance in InventoryLedger
  for (const item of stockItems) {
    const mov = new InventoryLedger({
      movementNumber: `MOV-INIT-${item.sku}`,
      movementType: STATUSES.INVENTORY_MOVEMENT.OPENING,
      itemId: item._id,
      warehouseId: item.primaryWarehouseId,
      quantity: item.availableQuantity,
      balanceAfter: item.availableQuantity,
      referenceEntityType: 'OPENING_BALANCE',
      referenceEntityId: String(item._id),
      unitCost: item.unitCost,
      totalValue: item.availableQuantity * item.unitCost,
      remarks: 'Initial master stock allocation',
      createdBy: seededUsers[ROLES.STORE]._id
    });
    await mov.save();
  }

  console.log('[Seed] Seeding Bill of Materials (BOM)...');
  const bom = new BOM({
    bomNumber: 'BOM-ULT-800-REV1',
    productId: products[0]._id,
    version: '1.0',
    items: [
      { stockItemId: stockItems[0]._id, sku: stockItems[0].sku, name: stockItems[0].name, quantityPerUnit: 2, uom: 'NOS', estimatedUnitCost: 185000, totalEstimatedCost: 370000 },
      { stockItemId: stockItems[1]._id, sku: stockItems[1].sku, name: stockItems[1].name, quantityPerUnit: 4, uom: 'NOS', estimatedUnitCost: 32000, totalEstimatedCost: 128000 },
      { stockItemId: stockItems[2]._id, sku: stockItems[2].sku, name: stockItems[2].name, quantityPerUnit: 6, uom: 'NOS', estimatedUnitCost: 9500, totalEstimatedCost: 57000 },
      { stockItemId: stockItems[3]._id, sku: stockItems[3].sku, name: stockItems[3].name, quantityPerUnit: 45, uom: 'MTRS', estimatedUnitCost: 1200, totalEstimatedCost: 54000 },
      { stockItemId: stockItems[4]._id, sku: stockItems[4].sku, name: stockItems[4].name, quantityPerUnit: 2, uom: 'CYLINDERS', estimatedUnitCost: 65000, totalEstimatedCost: 130000 }
    ],
    totalEstimatedCost: 739000,
    status: STATUSES.BOM.ACTIVE,
    remarks: 'Approved standard engineering BOM for ULT-800 series',
    createdBy: seededUsers[ROLES.PRODUCTION]._id
  });
  await bom.save();

  console.log('[Seed] Generating Complete Connected E2E Transaction Flow...');
  // 1. Lead
  const lead = new Lead({
    leadNumber: 'LEAD-2026-001',
    source: 'EXHIBITION',
    companyName: customer.companyName,
    contactName: customer.contactPerson,
    email: customer.email,
    phone: customer.phone,
    requirementDetails: 'Need 1 unit of -150°C ultra-low temperature cryogenic chamber for vaccine banking.',
    estimatedBudget: 2200000,
    status: STATUSES.LEAD.QUALIFIED,
    assignedTo: seededUsers[ROLES.SALES]._id,
    qualifiedCustomerId: customer._id,
    qualifiedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
  });
  await lead.save();

  // 2. Quotation
  const quoteItems = [{
    productId: products[0]._id,
    sku: products[0].sku,
    name: products[0].name,
    description: 'Industrial Ultra-Low Temperature Freezer with Dual Cascade Refrigeration',
    quantity: 1,
    unitPrice: 1850000,
    discountPercent: 5, // 5% discount
    taxPercent: 18,
    total: 2073850 // (1850000 * 0.95) * 1.18 = 1757500 + 316350 = 2073850
  }];

  const quotation = new Quotation({
    quotationNumber: 'QT-2026-0001',
    leadId: lead._id,
    customerId: customer._id,
    currentRevisionNumber: 1,
    items: quoteItems,
    subtotal: 1757500,
    discountAmount: 92500,
    taxAmount: 316350,
    grandTotal: 2073850,
    paymentTerms: '30% Advance, 70% against Proforma Invoice prior to dispatch',
    deliveryTerms: 'Ex-Works Chennai factory, freight & transit insurance extra',
    warrantyTerms: '12 Months comprehensive warranty from the date of Commissioning PASS',
    status: STATUSES.QUOTATION.ACCEPTED,
    approvedBy: seededUsers[ROLES.SALES_MANAGER]._id,
    approvedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    createdBy: seededUsers[ROLES.SALES]._id
  });
  await quotation.save();

  // 2b. Quotation Revision (QT-2026-0001-R1)
  const quotationRevision = new QuotationRevision({
    revisionCode: 'QT-2026-0001-R1',
    revisionNumber: 1,
    parentQuotationId: quotation._id,
    items: quoteItems,
    oldTotal: 2183000,
    newTotal: 2073850,
    subtotal: 1757500,
    discountAmount: 92500,
    taxAmount: 316350,
    grandTotal: 2073850,
    paymentTerms: quotation.paymentTerms,
    deliveryTerms: quotation.deliveryTerms,
    warrantyTerms: quotation.warrantyTerms,
    changeReason: 'Customer requested 5% commercial goodwill discount during negotiation meeting.',
    status: STATUSES.QUOTATION_REVISION.ACCEPTED,
    approvedBy: seededUsers[ROLES.SALES_MANAGER]._id,
    approvedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    createdBy: seededUsers[ROLES.SALES]._id
  });
  await quotationRevision.save();

  // 3. Proforma Invoice
  const proforma = new ProformaInvoice({
    piNumber: 'PI-2026-0001',
    quotationId: quotation._id,
    revisionId: quotationRevision._id,
    customerId: customer._id,
    items: quoteItems,
    subtotal: 1757500,
    taxAmount: 316350,
    grandTotal: 2073850,
    requiredAdvancePercentage: 30,
    advanceAmountDue: 622155, // 30% of 2073850
    status: STATUSES.PROFORMA_INVOICE.PAID,
    issuedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    createdBy: seededUsers[ROLES.ACCOUNTS]._id
  });
  await proforma.save();

  // 4. Customer PO & Verification
  const customerPO = new CustomerPO({
    poNumber: 'PO-APOLLO-2026-88',
    poDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
    customerId: customer._id,
    quotationId: quotation._id,
    revisionId: quotationRevision._id,
    proformaId: proforma._id,
    items: quoteItems,
    totalAmount: 2073850,
    paymentTerms: '30% Advance, 70% against Proforma Invoice prior to dispatch',
    deliveryTerms: 'Ex-Works Chennai factory, freight & transit insurance extra',
    warrantyTerms: '12 Months comprehensive warranty from the date of Commissioning PASS',
    deliveryRequestedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    documentPath: '/uploads/customer_pos/PO-APOLLO-2026-88.pdf',
    status: STATUSES.CUSTOMER_PO.VERIFIED,
    verifiedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    verifiedBy: seededUsers[ROLES.SALES_MANAGER]._id
  });
  await customerPO.save();

  const poVerification = new POVerification({
    verificationNumber: 'POV-2026-0001',
    customerPoId: customerPO._id,
    quotationId: quotation._id,
    revisionId: quotationRevision._id,
    proformaId: proforma._id,
    itemComparisons: [{
      sku: products[0].sku,
      name: products[0].name,
      quotationQty: 1,
      poQty: 1,
      quotationUnitPrice: 1850000,
      poUnitPrice: 1850000,
      quotationTotal: 2073850,
      poTotal: 2073850,
      status: 'MATCH',
      diffNotes: 'Line items match approved quotation specifications exactly.'
    }],
    commercialComparisons: [{
      parameter: 'GRAND_TOTAL',
      quotationValue: 2073850,
      poValue: 2073850,
      status: 'MATCH',
      diffNotes: 'Total value ₹2,073,850 matches agreed revision.'
    }],
    termComparisons: [
      { termType: 'PAYMENT_TERMS', quotationTerm: quotation.paymentTerms, poTerm: customerPO.paymentTerms, status: 'MATCH', diffNotes: 'Terms match.' },
      { termType: 'DELIVERY_TERMS', quotationTerm: quotation.deliveryTerms, poTerm: customerPO.deliveryTerms, status: 'MATCH', diffNotes: 'Terms match.' },
      { termType: 'WARRANTY_TERMS', quotationTerm: quotation.warrantyTerms, poTerm: customerPO.warrantyTerms, status: 'MATCH', diffNotes: 'Terms match.' }
    ],
    overallStatus: STATUSES.PO_VERIFICATION.MATCH,
    mismatchSummary: [],
    verifiedBy: seededUsers[ROLES.SALES_MANAGER]._id,
    verifiedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
  });
  await poVerification.save();

  // 5. Sales Order
  const salesOrder = new SalesOrder({
    salesOrderNumber: 'SO-2026-0001',
    customerId: customer._id,
    customerPoId: customerPO._id,
    quotationId: quotation._id,
    proformaId: proforma._id,
    items: quoteItems,
    grandTotal: 2073850,
    advanceRequiredPercent: 30,
    advanceRequiredAmount: 622155,
    advanceReceivedAmount: 622155,
    balanceDueAmount: 1451695,
    status: STATUSES.SALES_ORDER.CONFIRMED,
    deliveryCommittedDate: customerPO.deliveryRequestedDate,
    confirmedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    productionReleasedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    productionReleasedBy: seededUsers[ROLES.ACCOUNTS]._id,
    shippingAddress: customer.shippingAddress,
    createdBy: seededUsers[ROLES.SALES_MANAGER]._id
  });
  await salesOrder.save();

  // 6. Advance Payment
  const advancePayment = new Payment({
    paymentNumber: 'PAY-2026-001',
    customerId: customer._id,
    salesOrderId: salesOrder._id,
    expectedAmount: 622155,
    receivedAmount: 622155,
    paymentType: 'ADVANCE',
    method: 'RTGS',
    bankName: 'State Bank of India',
    transactionReference: 'SBINR5202603018899',
    paymentDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    status: STATUSES.PAYMENT.VERIFIED,
    verifiedBy: seededUsers[ROLES.ACCOUNTS]._id,
    verifiedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    notes: 'Advance 30% payment verified in HDFC Current A/C',
    recordedBy: seededUsers[ROLES.ACCOUNTS]._id
  });
  await advancePayment.save();

  // 7. Production Order
  const productionOrder = new ProductionOrder({
    productionOrderNumber: 'PRD-2026-0001',
    salesOrderId: salesOrder._id,
    productId: products[0]._id,
    bomId: bom._id,
    plannedQuantity: 1,
    producedQuantity: 1,
    rejectedQuantity: 0,
    startDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    targetCompletionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    actualCompletionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    status: STATUSES.PRODUCTION_ORDER.COMPLETED,
    releasedBy: seededUsers[ROLES.PRODUCTION]._id,
    releasedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
  });
  await productionOrder.save();

  // 8. Material Request & Floor Issue
  const materialRequest = new MaterialRequest({
    requestNumber: 'MR-2026-0001',
    productionOrderId: productionOrder._id,
    items: bom.items.map(bi => ({
      stockItemId: bi.stockItemId,
      sku: bi.sku,
      name: bi.name,
      requiredQty: bi.quantityPerUnit,
      issuedQty: bi.quantityPerUnit,
      shortageQty: 0,
      uom: bi.uom,
      stockStatus: 'FULL_STOCK'
    })),
    status: STATUSES.MATERIAL_REQUEST.ISSUED,
    requiredDate: productionOrder.startDate,
    createdBy: seededUsers[ROLES.PRODUCTION]._id
  });
  await materialRequest.save();

  // 9. Production Operations
  const opsData = [
    { type: 'FABRICATION', wc: workCenters[0], seq: 1 },
    { type: 'REFRIGERATION', wc: workCenters[1], seq: 2 },
    { type: 'ELECTRICAL', wc: workCenters[2], seq: 3 },
    { type: 'ASSEMBLY', wc: workCenters[3], seq: 4 }
  ];

  for (const op of opsData) {
    const pop = new ProductionOperation({
      operationNumber: `OP-PRD-2026-0001-${op.seq}`,
      productionOrderId: productionOrder._id,
      operationType: op.type,
      sequenceNumber: op.seq,
      workCenterId: op.wc._id,
      operatorId: seededUsers[ROLES.PRODUCTION]._id,
      startTime: new Date(Date.now() - (15 - op.seq) * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - (14 - op.seq) * 24 * 60 * 60 * 1000),
      actualDurationHours: 8.5,
      yieldQuantity: 1,
      rejectedQuantity: 0,
      status: STATUSES.PRODUCTION_OPERATION.COMPLETED,
      remarks: `${op.type} operation completed within design tolerances.`
    });
    await pop.save();
  }

  // 10. QA Test & Serial Traceability
  const serialNoStr = 'CRYO-2026-0042';

  const qaTest = new QATest({
    testNumber: 'QA-2026-0001',
    productionOrderId: productionOrder._id,
    productId: products[0]._id,
    serialNumber: serialNoStr,
    testType: 'CRYOGENIC_PERFORMANCE_AND_SAFETY',
    parameters: [
      { parameterName: 'Deep Cryo Pull-down Temp', specificationRequired: '-150°C within 5 hours', actualValue: '-152.4°C', result: 'PASS' },
      { parameterName: 'Vacuum Retention Level', specificationRequired: '< 1x10^-3 Torr', actualValue: '0.0001 Torr', result: 'PASS' },
      { parameterName: 'Cascade Pressure Hold Test', specificationRequired: '22 Bar Nitrogen Hold 24h', actualValue: '22.1 Bar', result: 'PASS' },
      { parameterName: 'Electrical Insulation Resistance', specificationRequired: '> 100 MOhm at 1000V DC', actualValue: '280 MOhm', result: 'PASS' },
      { parameterName: 'Safety Relief Valve Pop Test', specificationRequired: 'Opens at 25 Bar +/- 0.5', actualValue: '25.1 Bar', result: 'PASS' }
    ],
    overallResult: STATUSES.QA_TEST.PASSED,
    attemptNumber: 1,
    certificateNumber: 'CERT-CRYO-2026-0042',
    certificateUrl: '/uploads/certificates/CERT-CRYO-2026-0042.pdf',
    testerId: seededUsers[ROLES.QA]._id,
    testedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  });
  await qaTest.save();

  // 11. Packing List
  const packingList = new PackingList({
    packingNumber: 'PKG-2026-0001',
    salesOrderId: salesOrder._id,
    serialNumbers: [serialNoStr],
    packageDimensions: { lengthMm: 1600, widthMm: 1200, heightMm: 2200 },
    grossWeightKg: 520,
    netWeightKg: 480,
    boxCount: 1,
    checklist: { desiccantPlaced: true, valvesSecured: true, shockWatchAffixed: true, manualEnclosed: true, vacuumPortCapped: true },
    status: STATUSES.PACKING_LIST.PACKED,
    inspectedBy: seededUsers[ROLES.DISPATCH]._id,
    inspectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  });
  await packingList.save();

  // 12. Final Tax Invoice
  const finalInvoice = new FinalInvoice({
    invoiceNumber: 'INV-2026-0001',
    salesOrderId: salesOrder._id,
    customerId: customer._id,
    items: quoteItems.map(i => ({
      ...i,
      serialNumbers: [serialNoStr],
      cgstAmount: i.total * 0.09,
      sgstAmount: i.total * 0.09
    })),
    subtotal: 1757500,
    taxAmount: 316350,
    grandTotal: 2073850,
    paidAmount: 622155,
    balanceDue: 1451695,
    paymentDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: STATUSES.FINAL_INVOICE.POSTED,
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdBy: seededUsers[ROLES.ACCOUNTS]._id
  });
  await finalInvoice.save();

  // 13. Dispatch Advice & Delivery Tracking
  const dispatch = new Dispatch({
    dispatchNumber: 'DSP-2026-0001',
    salesOrderId: salesOrder._id,
    invoiceId: finalInvoice._id,
    packingId: packingList._id,
    transporterName: 'VRL Heavy Cryogenic Logistics Ltd',
    vehicleNumber: 'TN-09-BX-7890',
    driverName: 'R. Velusamy',
    driverPhone: '+91 94441 55667',
    lrNumber: 'LR-VRL-889911',
    eWayBillNumber: '331098765432',
    gatePassNumber: 'GP-2026-0042',
    dispatchDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: STATUSES.DISPATCH.DISPATCHED,
    dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: seededUsers[ROLES.DISPATCH]._id
  });
  await dispatch.save();

  const delivery = new Delivery({
    deliveryNumber: 'DEL-2026-0001',
    dispatchId: dispatch._id,
    salesOrderId: salesOrder._id,
    currentStatus: STATUSES.DELIVERY.DELIVERED,
    trackingHistory: [
      { status: 'IN_TRANSIT', location: 'Factory Gate, Ambattur', notes: 'Vehicle departed factory dock.' },
      { status: 'OUT_FOR_DELIVERY', location: 'Siruseri Hub, Chennai', notes: 'Out for final client delivery.' },
      { status: 'DELIVERED', location: 'Apollo Biotech Campus, Siruseri', notes: 'Unloaded and handed over to site receiver.' }
    ],
    podDocumentPath: '/uploads/pod/POD-2026-0001.pdf',
    receiverName: 'M. Senthil Kumar',
    receiverDesignation: 'Facility Chief Engineer',
    receiverPhone: '+91 98409 11223',
    signatureUrl: '/uploads/pod/sig-senthil.png',
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });
  await delivery.save();

  // 14. Installation & Commissioning
  const installation = new Installation({
    installationNumber: 'INS-2026-0001',
    salesOrderId: salesOrder._id,
    serialNumber: serialNoStr,
    customerId: customer._id,
    siteAddress: customer.shippingAddress,
    assignedEngineerId: seededUsers[ROLES.SERVICE_ENGINEER]._id,
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    siteReadinessCheck: { threePhasePowerReady: true, dedicatedEarthingOk: true, unloadingClearanceOk: true, ambientVentilationOk: true },
    status: STATUSES.INSTALLATION.COMPLETED,
    installationNotes: 'Chamber positioned in Cleanroom Bay 2. Electrical connections verified.',
    completionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  });
  await installation.save();

  const commissioning = new Commissioning({
    commissioningNumber: 'COMM-2026-0001',
    installationId: installation._id,
    serialNumber: serialNoStr,
    checklist: {
      inputVoltageV: 415,
      ambientTempDegC: 22.5,
      pullDownTargetDegC: -150,
      achievedTempDegC: -152.1,
      pullDownTimeHours: 4.2,
      vacuumLevelTorr: 0.0001,
      safetyReliefPressureBar: 22,
      alarmSystemTest: 'PASS',
      tempUniformityTest: 'PASS',
      compressorCurrentAmps: 11.8
    },
    status: STATUSES.COMMISSIONING.PASSED,
    commissionedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    clientSignOffName: 'Dr. Rajesh Sundaram',
    conductedBy: seededUsers[ROLES.SERVICE_ENGINEER]._id
  });
  await commissioning.save();

  // 15. Active Warranty
  const warrantyStartDate = commissioning.commissionedAt;
  const warrantyEndDate = new Date(warrantyStartDate);
  warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);

  const warranty = new Warranty({
    warrantyNumber: 'WAR-2026-0001',
    serialNumber: serialNoStr,
    customerId: customer._id,
    startDate: warrantyStartDate,
    endDate: warrantyEndDate,
    durationMonths: 12,
    coveredComponents: ['Dual Stage Cryo Compressor', 'Vacuum Insulated Vessel', 'Microprocessor Controller', 'PT-100 RTD Sensors'],
    excludedConditions: ['Customer site voltage surge (>460V)', 'Refrigerant line physical impact', 'Unauthorized third-party tampering'],
    status: STATUSES.WARRANTY.ACTIVE
  });
  await warranty.save();

  // 16. Service Ticket (Demonstrating Field Service Workflow)
  const serviceTicket = new ServiceTicket({
    ticketNumber: 'TKT-2026-0001',
    customerId: customer._id,
    serialNumber: serialNoStr,
    complaintDescription: 'Scheduled 100-hour preventive calibration and vacuum seal check.',
    priority: 'LOW',
    warrantyStatus: 'COVERED',
    isChargeable: false,
    assignedEngineerId: seededUsers[ROLES.SERVICE_ENGINEER]._id,
    serviceType: 'ON_SITE',
    diagnosis: {
      findings: 'All cryogenic circuits nominal. Small drift in auxiliary PT-100 channel B.',
      rootCause: 'Cable junction oxidation in ambient sensor lead.',
      diagnosedAt: new Date(),
      sparesRequired: true
    },
    sparesRequested: [{
      stockItemId: stockItems[2]._id,
      sku: stockItems[2].sku,
      name: stockItems[2].name,
      quantity: 1,
      issued: true
    }],
    repairWorkNotes: 'Replaced auxiliary PT-100 sensor and verified calibration at -150°C.',
    testPassed: true,
    customerSignOff: {
      signedBy: 'Dr. Rajesh Sundaram',
      rating: 5,
      feedback: 'Excellent proactive service response from CryoTech field team.',
      signedAt: new Date()
    },
    status: STATUSES.SERVICE_TICKET.CLOSED,
    closedAt: new Date(),
    createdBy: seededUsers[ROLES.SERVICE_MANAGER]._id
  });
  await serviceTicket.save();

  // 17. Master Serial Number Record with 360-degree timeline events
  const serial = new SerialNumber({
    serialNumber: serialNoStr,
    productId: products[0]._id,
    productionOrderId: productionOrder._id,
    salesOrderId: salesOrder._id,
    customerId: customer._id,
    qaTestId: qaTest._id,
    packingId: packingList._id,
    invoiceId: finalInvoice._id,
    dispatchId: dispatch._id,
    deliveryId: delivery._id,
    installationId: installation._id,
    commissioningId: commissioning._id,
    warrantyId: warranty._id,
    serviceTickets: [serviceTicket._id],
    currentStatus: STATUSES.SERIAL_NUMBER.WARRANTY_ACTIVE,
    history: [
      { eventType: 'UNIT_PRODUCED', stage: 'MANUFACTURING', description: `Fabricated under PRD-2026-0001.`, timestamp: productionOrder.actualCompletionDate },
      { eventType: 'QA_INSPECTION_PASSED', stage: 'QUALITY_ASSURANCE', description: `Passed QA test. Certificate ${qaTest.certificateNumber}.`, timestamp: qaTest.testedAt },
      { eventType: 'CRATED_AND_PACKED', stage: 'PACKING', description: `Packed into crate. Gross weight: 520kg.`, timestamp: packingList.inspectedAt },
      { eventType: 'TAX_INVOICE_GENERATED', stage: 'FINANCE', description: `Billed under Invoice ${finalInvoice.invoiceNumber}.`, timestamp: finalInvoice.postedAt },
      { eventType: 'DISPATCHED_TO_CARRIER', stage: 'LOGISTICS', description: `Dispatched via VRL. LR: ${dispatch.lrNumber}.`, timestamp: dispatch.dispatchedAt },
      { eventType: 'DELIVERY_POD_SIGNED', stage: 'DELIVERY', description: `Delivered to Apollo Biotech. Signed by M. Senthil Kumar.`, timestamp: delivery.deliveredAt },
      { eventType: 'INSTALLATION_COMPLETED', stage: 'INSTALLATION', description: `Positioned and powered at client cleanroom.`, timestamp: installation.completionDate },
      { eventType: 'COMMISSIONING_PASSED', stage: 'COMMISSIONING', description: `Pulldown test achieved -152.1°C. Warranty active.`, timestamp: commissioning.commissionedAt },
      { eventType: 'PREVENTIVE_SERVICE_COMPLETED', stage: 'FIELD_SERVICE', description: `100h check completed. Sensor B recalibrated. Rated 5/5.`, timestamp: serviceTicket.closedAt }
    ]
  });
  await serial.save();

  console.log('[Seed] Seeding Initial In-App Notifications & Audit Logs...');
  await Notification.insertMany([
    {
      title: 'Welcome to CryoTech ERP',
      message: 'System initialization and master catalog data loaded successfully.',
      recipientUserId: seededUsers[ROLES.ADMIN]._id,
      entityType: 'SYSTEM',
      entityId: '0'
    },
    {
      title: 'Sales Order SO-2026-0001 Dispatched',
      message: 'Consignment for Apollo Cell Therapeutics in transit.',
      targetRole: ROLES.MANAGEMENT,
      entityType: 'SALES_ORDER',
      entityId: salesOrder._id
    }
  ]);

  await AuditService.log({
    entityType: 'SYSTEM',
    entityId: 'SEED_RUNNER',
    action: 'SYSTEM_SEEDED',
    actorUserId: seededUsers[ROLES.ADMIN]._id,
    actorName: seededUsers[ROLES.ADMIN].name,
    actorRole: seededUsers[ROLES.ADMIN].role,
    reason: 'Initial demo dataset and end-to-end workflow transaction seeded.'
  });

  console.log('========================================================');
  console.log('  CRYO-ERP SEEDING COMPLETE');
  console.log('========================================================');
  console.log(`Demo Users seeded (Password for all accounts: Password@123):`);
  demoUsersConfig.forEach(u => console.log(` - ${u.email} (${u.role})`));
  console.log('========================================================');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
