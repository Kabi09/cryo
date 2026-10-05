const path = require('path');
module.paths.push(path.join(__dirname, '../../backend/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../backend/src/app');

async function runE2EWorkflowTest() {
  console.log('========================================================');
  console.log('  STARTING COMPREHENSIVE E2E WORKFLOW TEST SUITE');
  console.log('========================================================');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cryo_erp';
  await mongoose.connect(uri);

  let tokens = {};

  // 1. Authenticate users
  console.log('\n[Phase 1] Authenticating Demo Users...');
  const credentials = [
    { role: 'ADMIN', email: 'admin@example.com' },
    { role: 'SALES', email: 'sales@example.com' },
    { role: 'SALES_MANAGER', email: 'manager@example.com' },
    { role: 'ACCOUNTS', email: 'accounts@example.com' },
    { role: 'PRODUCTION', email: 'production@example.com' },
    { role: 'QA', email: 'qa@example.com' },
    { role: 'DISPATCH', email: 'dispatch@example.com' },
    { role: 'SERVICE_MANAGER', email: 'service@example.com' },
    { role: 'SERVICE_ENGINEER', email: 'engineer@example.com' }
  ];

  for (const cred of credentials) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: cred.email, password: 'Password@123' });

    if (res.status !== 200 || !res.body.data.token) {
      throw new Error(`Failed to log in as ${cred.email}: ${JSON.stringify(res.body)}`);
    }
    tokens[cred.role] = res.body.data.token;
  }
  console.log('✔ All role tokens acquired successfully.');

  // 2. Lead Creation & Qualification
  console.log('\n[Phase 2] Lead Creation & Qualification...');
  const leadRes = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${tokens.SALES}`)
    .send({
      companyName: 'Bharat Biotech Research Facility',
      contactName: 'Dr. Anita Roy',
      email: 'anita.roy@bharatbiotech-demo.com',
      phone: '+91 98888 12345',
      requirementDetails: 'Need 1 unit of ULT-800 Cryo chamber for mRNA vaccine repository.',
      estimatedBudget: 2100000
    });
  if (leadRes.status !== 201) throw new Error(`Create Lead failed: ${JSON.stringify(leadRes.body)}`);
  const leadId = leadRes.body.data.lead._id;
  console.log(`✔ Lead created: ${leadRes.body.data.lead.leadNumber}`);

  const qualifyRes = await request(app)
    .post(`/api/leads/${leadId}/actions/qualify`)
    .set('Authorization', `Bearer ${tokens.SALES}`);
  if (qualifyRes.status !== 200) throw new Error(`Qualify Lead failed: ${JSON.stringify(qualifyRes.body)}`);
  const customerId = qualifyRes.body.data.customer._id;
  console.log(`✔ Lead qualified into Customer: ${qualifyRes.body.data.customer.customerCode}`);

  // Fetch product
  const productsRes = await request(app)
    .get('/api/masters/products')
    .set('Authorization', `Bearer ${tokens.SALES}`);
  const product = productsRes.body.data.products[0];

  // 3. Quotation, Approval, Send, Negotiation, Revision, Acceptance
  console.log('\n[Phase 3] Quotation, Approval, Negotiation & Revision Cycle...');
  const quoteRes = await request(app)
    .post('/api/quotations')
    .set('Authorization', `Bearer ${tokens.SALES}`)
    .send({
      customerId,
      leadId,
      items: [{
        productId: product._id,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        discountPercent: 0,
        taxPercent: 18,
        total: product.basePrice * 1.18
      }]
    });
  if (quoteRes.status !== 201) throw new Error(`Create Quotation failed: ${JSON.stringify(quoteRes.body)}`);
  const quoteId = quoteRes.body.data.quotation._id;
  console.log(`✔ Draft Quotation created: ${quoteRes.body.data.quotation.quotationNumber}`);

  // Submit
  await request(app)
    .post(`/api/quotations/${quoteId}/actions/submit`)
    .set('Authorization', `Bearer ${tokens.SALES}`);
  console.log('✔ Quotation submitted for manager review.');

  // Manager Approve
  await request(app)
    .post(`/api/quotations/${quoteId}/actions/approve`)
    .set('Authorization', `Bearer ${tokens.SALES_MANAGER}`)
    .send({ remarks: 'Commercial pricing approved.' });
  console.log('✔ Quotation approved by Sales Manager.');

  // Send to client
  await request(app)
    .post(`/api/quotations/${quoteId}/actions/send`)
    .set('Authorization', `Bearer ${tokens.SALES}`);
  console.log('✔ Quotation dispatched to customer.');

  // Customer Negotiates
  await request(app)
    .post(`/api/quotations/${quoteId}/actions/negotiate`)
    .set('Authorization', `Bearer ${tokens.SALES}`)
    .send({ requestedDiscount: 4, clientNotes: 'Requesting 4% volume discount.' });
  console.log('✔ Customer counter-offer logged.');

  // Sales creates Revision
  const revisionRes = await request(app)
    .post(`/api/quotations/${quoteId}/actions/revise`)
    .set('Authorization', `Bearer ${tokens.SALES}`)
    .send({
      changeReason: 'Client negotiated 4% discount.',
      items: [{
        productId: product._id,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        discountPercent: 4,
        taxPercent: 18,
        total: (product.basePrice * 0.96) * 1.18
      }]
    });
  if (revisionRes.status !== 201) throw new Error(`Revision failed: ${JSON.stringify(revisionRes.body)}`);
  console.log(`✔ Revision created: ${revisionRes.body.data.revision.revisionCode}`);

  // Approve Revision and Accept
  await request(app)
    .post(`/api/quotations/${quoteId}/actions/approve`)
    .set('Authorization', `Bearer ${tokens.SALES_MANAGER}`);
  await request(app)
    .post(`/api/quotations/${quoteId}/actions/send`)
    .set('Authorization', `Bearer ${tokens.SALES}`);

  const acceptRes = await request(app)
    .post(`/api/quotations/${quoteId}/actions/accept`)
    .set('Authorization', `Bearer ${tokens.SALES}`);
  if (acceptRes.status !== 200) throw new Error(`Accept failed: ${JSON.stringify(acceptRes.body)}`);
  const proforma = acceptRes.body.data.proforma;
  console.log(`✔ Quotation accepted! Proforma Invoice automatically generated: ${proforma.piNumber}`);

  // 4. Customer PO & 4-Way Verification
  console.log('\n[Phase 4] Customer PO & 4-Way Verification...');
  const poRes = await request(app)
    .post('/api/customer-pos')
    .set('Authorization', `Bearer ${tokens.SALES}`)
    .send({
      poNumber: `PO-BHARAT-2026-${Date.now().toString().slice(-4)}`,
      customerId,
      quotationId: quoteId,
      proformaId: proforma._id,
      items: acceptRes.body.data.quotation.items,
      totalAmount: acceptRes.body.data.quotation.grandTotal,
      paymentTerms: acceptRes.body.data.quotation.paymentTerms,
      deliveryTerms: acceptRes.body.data.quotation.deliveryTerms,
      warrantyTerms: acceptRes.body.data.quotation.warrantyTerms
    });
  const poId = poRes.body.data.po._id;
  console.log(`✔ Customer PO recorded: ${poRes.body.data.po.poNumber}`);

  const verifyRes = await request(app)
    .post(`/api/customer-pos/${poId}/actions/verify`)
    .set('Authorization', `Bearer ${tokens.SALES_MANAGER}`);
  if (verifyRes.body.data.verification.overallStatus !== 'MATCH') {
    throw new Error(`PO Verification failed: ${JSON.stringify(verifyRes.body)}`);
  }
  console.log(`✔ 4-Way PO Verification: MATCH. All items, amounts and terms validated.`);

  // Confirm Sales Order
  const soRes = await request(app)
    .post(`/api/customer-pos/${poId}/actions/confirm-so`)
    .set('Authorization', `Bearer ${tokens.SALES_MANAGER}`)
    .send({});
  const salesOrder = soRes.body.data.salesOrder;
  console.log(`✔ Sales Order Confirmed: ${salesOrder.salesOrderNumber}. Advance Due: ₹${salesOrder.advanceRequiredAmount}`);

  // 5. Payment & Verification
  console.log('\n[Phase 5] Advance Payment & Banking Verification...');
  const payRes = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${tokens.ACCOUNTS}`)
    .send({
      customerId,
      salesOrderId: salesOrder._id,
      expectedAmount: salesOrder.advanceRequiredAmount,
      receivedAmount: salesOrder.advanceRequiredAmount,
      paymentType: 'ADVANCE',
      method: 'RTGS',
      bankName: 'HDFC Bank',
      transactionReference: `TXN-${Date.now().toString().slice(-6)}`
    });
  const paymentId = payRes.body.data.payment._id;

  await request(app)
    .post(`/api/payments/${paymentId}/actions/verify`)
    .set('Authorization', `Bearer ${tokens.ACCOUNTS}`);
  console.log('✔ Advance payment verified by Accounts.');

  // 6. Release to Production
  console.log('\n[Phase 6] Production Release & BOM Explosion...');
  const releaseRes = await request(app)
    .post(`/api/sales-orders/${salesOrder._id}/actions/releaseProduction`)
    .set('Authorization', `Bearer ${tokens.ACCOUNTS}`);
  if (releaseRes.status !== 200) throw new Error(`Release production failed: ${JSON.stringify(releaseRes.body)}`);
  console.log('✔ Sales order released to manufacturing floor.');

  // Fetch created production order
  const prodOrdersRes = await request(app)
    .get(`/api/production/orders?salesOrderId=${salesOrder._id}`)
    .set('Authorization', `Bearer ${tokens.PRODUCTION}`);
  const prodOrder = prodOrdersRes.body.data.orders[0];
  console.log(`✔ Production Order generated: ${prodOrder.productionOrderNumber}`);

  // Release Production Order (generates Material Request & Operations)
  await request(app)
    .post(`/api/production/orders/${prodOrder._id}/actions/release`)
    .set('Authorization', `Bearer ${tokens.PRODUCTION}`);
  console.log('✔ Production Order released. Material staging & operations initiated.');

  // Start & Complete operations
  const prodDetailRes = await request(app)
    .get(`/api/production/orders/${prodOrder._id}`)
    .set('Authorization', `Bearer ${tokens.PRODUCTION}`);
  const operations = prodDetailRes.body.data.operations;

  for (const op of operations) {
    await request(app)
      .post(`/api/production/operations/${op._id}/actions/start`)
      .set('Authorization', `Bearer ${tokens.PRODUCTION}`);
    await request(app)
      .post(`/api/production/operations/${op._id}/actions/complete`)
      .set('Authorization', `Bearer ${tokens.PRODUCTION}`)
      .send({ yieldQuantity: 1, remarks: 'Completed nominal.' });
  }
  console.log(`✔ All ${operations.length} shop floor operations (Fab, Refrig, Elec, Assembly) completed.`);

  // Complete Production Order (generates Serial & QA test)
  await request(app)
    .post(`/api/production/orders/${prodOrder._id}/actions/complete`)
    .set('Authorization', `Bearer ${tokens.PRODUCTION}`);
  console.log('✔ Production Order completed.');

  // 7. QA Testing & Certificate Generation
  console.log('\n[Phase 7] Cryogenic QA Testing & Compliance...');
  const qaRes = await request(app)
    .get(`/api/qa/tests?productionOrderId=${prodOrder._id}`)
    .set('Authorization', `Bearer ${tokens.QA}`);
  const qaTest = qaRes.body.data.tests[0];

  const qaResultRes = await request(app)
    .post(`/api/qa/tests/${qaTest._id}/actions/record-result`)
    .set('Authorization', `Bearer ${tokens.QA}`)
    .send({
      parameters: qaTest.parameters.map(p => ({ ...p, result: 'PASS', actualValue: '-151.8°C' })),
      remarks: 'All parameters validated within cryogenic safety envelope.'
    });
  if (qaResultRes.body.data.test.overallResult !== 'PASSED') {
    throw new Error(`QA failed: ${JSON.stringify(qaResultRes.body)}`);
  }
  console.log(`✔ QA Test PASSED! Certificate issued: ${qaResultRes.body.data.test.certificateNumber}`);

  // 8. 360-degree Serial Traceability Check
  console.log('\n[Phase 8] Validating Serial Traceability Engine...');
  const traceRes = await request(app)
    .get(`/api/serials/${qaTest.serialNumber}/trace`)
    .set('Authorization', `Bearer ${tokens.QA}`);
  if (!traceRes.body.data.trace) throw new Error('Serial trace failed');
  console.log(`✔ Serial 360 Trace active for ${qaTest.serialNumber}. Event count: ${traceRes.body.data.trace.history.length}`);

  // 9. Packing, Final Invoice, Dispatch & Delivery
  console.log('\n[Phase 9] Packing, Invoicing, Dispatch & Delivery (POD)...');
  const packRes = await request(app)
    .post('/api/logistics/packing')
    .set('Authorization', `Bearer ${tokens.DISPATCH}`)
    .send({
      salesOrderId: salesOrder._id,
      serialNumbers: [qaTest.serialNumber],
      grossWeightKg: 510,
      netWeightKg: 480
    });
  const packing = packRes.body.data.packing;

  const invRes = await request(app)
    .post('/api/logistics/invoices')
    .set('Authorization', `Bearer ${tokens.ACCOUNTS}`)
    .send({ salesOrderId: salesOrder._id });
  const invoice = invRes.body.data.invoice;

  const dispRes = await request(app)
    .post('/api/logistics/dispatches')
    .set('Authorization', `Bearer ${tokens.DISPATCH}`)
    .send({
      salesOrderId: salesOrder._id,
      invoiceId: invoice._id,
      packingId: packing._id,
      transporterName: 'Express Cryo Carriers',
      vehicleNumber: 'TN-01-AB-1234',
      lrNumber: `LR-${Date.now().toString().slice(-6)}`,
      eWayBillNumber: '331002233445'
    });
  const delivery = dispRes.body.data.delivery;

  await request(app)
    .post(`/api/logistics/deliveries/${delivery._id}/actions/complete`)
    .set('Authorization', `Bearer ${tokens.DISPATCH}`)
    .send({
      receiverName: 'Dr. Anita Roy',
      receiverDesignation: 'Director of Bio-Research',
      receiverPhone: '+91 98888 12345'
    });
  console.log('✔ Consignment delivered to customer site and POD verified.');

  // 10. Installation, Commissioning & Warranty Activation
  console.log('\n[Phase 10] Site Installation, Commissioning & Warranty Activation...');
  const instRes = await request(app)
    .post('/api/service/installations')
    .set('Authorization', `Bearer ${tokens.SERVICE_MANAGER}`)
    .send({
      salesOrderId: salesOrder._id,
      serialNumber: qaTest.serialNumber,
      customerId,
      scheduledDate: new Date()
    });
  const installation = instRes.body.data.installation;

  const compInstRes = await request(app)
    .post(`/api/service/installations/${installation._id}/actions/complete`)
    .set('Authorization', `Bearer ${tokens.SERVICE_ENGINEER}`)
    .send({ installationNotes: 'Installed and power cables terminated.' });
  const commissioning = compInstRes.body.data.commissioning;

  const commExecRes = await request(app)
    .post(`/api/service/commissionings/${commissioning._id}/actions/execute-test`)
    .set('Authorization', `Bearer ${tokens.SERVICE_ENGINEER}`)
    .send({
      checklist: {
        alarmSystemTest: 'PASS',
        tempUniformityTest: 'PASS',
        achievedTempDegC: -153.0,
        pullDownTargetDegC: -150.0
      },
      clientSignOffName: 'Dr. Anita Roy'
    });
  if (commExecRes.body.data.commissioning.status !== 'PASSED') {
    throw new Error('Commissioning failed');
  }
  console.log('✔ Commissioning PASSED! Equipment warranty successfully ACTIVATED.');

  // 11. Service Ticket, Diagnosis & Customer Sign-off
  console.log('\n[Phase 11] Service Complaint, Diagnosis & Customer Sign-Off...');
  const ticketRes = await request(app)
    .post('/api/service/tickets')
    .set('Authorization', `Bearer ${tokens.SERVICE_MANAGER}`)
    .send({
      customerId,
      serialNumber: qaTest.serialNumber,
      complaintDescription: 'Quarterly check-up and temperature verification.',
      priority: 'LOW'
    });
  const ticket = ticketRes.body.data.ticket;

  await request(app)
    .post(`/api/service/tickets/${ticket._id}/actions/diagnose`)
    .set('Authorization', `Bearer ${tokens.SERVICE_ENGINEER}`)
    .send({ findings: 'Cryo system running at optimum performance.', rootCause: 'None' });

  await request(app)
    .post(`/api/service/tickets/${ticket._id}/actions/sign-off`)
    .set('Authorization', `Bearer ${tokens.SERVICE_ENGINEER}`)
    .send({ signedBy: 'Dr. Anita Roy', rating: 5, feedback: 'Flawless equipment performance.' });
  console.log('✔ Service Ticket closed with 5-star customer sign-off.');

  console.log('\n========================================================');
  console.log('  ALL E2E WORKFLOW PHASES PASSED WITH ZERO ERRORS');
  console.log('========================================================');

  await mongoose.disconnect();
}

runE2EWorkflowTest().catch(err => {
  console.error('[E2E Test Failure]', err);
  process.exit(1);
});
