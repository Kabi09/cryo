const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Lead
  LEAD_VIEW: 'lead.view',
  LEAD_CREATE: 'lead.create',
  LEAD_EDIT: 'lead.edit',
  LEAD_QUALIFY: 'lead.qualify',
  LEAD_LOSE: 'lead.lose',

  // Customer
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_EDIT: 'customer.edit',

  // Quotation
  QUOTATION_VIEW: 'quotation.view',
  QUOTATION_CREATE: 'quotation.create',
  QUOTATION_EDIT: 'quotation.edit',
  QUOTATION_SUBMIT: 'quotation.submit',
  QUOTATION_APPROVE: 'quotation.approve',
  QUOTATION_REJECT: 'quotation.reject',
  QUOTATION_SEND: 'quotation.send',
  QUOTATION_CANCEL: 'quotation.cancel',
  QUOTATION_NEGOTIATE: 'quotation.negotiate',
  QUOTATION_ACCEPT: 'quotation.accept',

  // Quotation Revision
  QUOTATION_REVISION_CREATE: 'quotationRevision.create',
  QUOTATION_REVISION_APPROVE: 'quotationRevision.approve',
  QUOTATION_REVISION_SEND: 'quotationRevision.send',

  // Proforma Invoice
  PROFORMA_VIEW: 'proforma.view',
  PROFORMA_CREATE: 'proforma.create',

  // Customer PO & Verification
  CUSTOMER_PO_VIEW: 'customerPo.view',
  CUSTOMER_PO_CREATE: 'customerPo.create',
  CUSTOMER_PO_VERIFY: 'customerPo.verify',
  CUSTOMER_PO_HOLD: 'customerPo.hold',

  // Sales Order
  SALES_ORDER_VIEW: 'salesOrder.view',
  SALES_ORDER_CREATE: 'salesOrder.create',
  SALES_ORDER_CONFIRM: 'salesOrder.confirm',
  SALES_ORDER_RELEASE_PRODUCTION: 'salesOrder.releaseProduction',
  SALES_ORDER_CANCEL: 'salesOrder.cancel',

  // Payment
  PAYMENT_VIEW: 'payment.view',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_VERIFY: 'payment.verify',
  PAYMENT_REVERSE: 'payment.reverse',
  PAYMENT_REFUND: 'payment.refund',

  // Production
  PRODUCTION_VIEW: 'production.view',
  PRODUCTION_CREATE: 'production.create',
  PRODUCTION_RELEASE: 'production.release',
  PRODUCTION_START: 'production.start',
  PRODUCTION_HOLD: 'production.hold',
  PRODUCTION_COMPLETE: 'production.complete',

  // BOM
  BOM_VIEW: 'bom.view',
  BOM_CREATE: 'bom.create',
  BOM_EDIT: 'bom.edit',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_RESERVE: 'inventory.reserve',
  INVENTORY_ISSUE: 'inventory.issue',
  INVENTORY_RETURN: 'inventory.return',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_ADJUST: 'inventory.adjust',

  // Procurement & Vendor
  PROCUREMENT_VIEW: 'procurement.view',
  PROCUREMENT_RFQ: 'procurement.rfq',
  PROCUREMENT_COMPARE: 'procurement.compare',
  VENDOR_PO_CREATE: 'vendorPo.create',
  VENDOR_PO_APPROVE: 'vendorPo.approve',
  GRN_CREATE: 'grn.create',
  GRN_INSPECT: 'grn.inspect',

  // QA
  QA_VIEW: 'qa.view',
  QA_TEST: 'qa.test',
  QA_PASS: 'qa.pass',
  QA_FAIL: 'qa.fail',
  QA_RETEST: 'qa.retest',
  QA_REWORK: 'qa.rework',
  QA_SCRAP: 'qa.scrap',

  // Serial Traceability
  SERIAL_VIEW: 'serial.view',
  SERIAL_CREATE: 'serial.create',
  SERIAL_TRACK: 'serial.track',

  // Packing & Invoice
  PACKING_VIEW: 'packing.view',
  PACKING_CREATE: 'packing.create',
  PACKING_COMPLETE: 'packing.complete',
  INVOICE_VIEW: 'invoice.view',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_POST: 'invoice.post',

  // Dispatch & Delivery
  DISPATCH_VIEW: 'dispatch.view',
  DISPATCH_CREATE: 'dispatch.create',
  DISPATCH_DISPATCH: 'dispatch.dispatch',
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_COMPLETE: 'delivery.complete',
  DELIVERY_FAIL: 'delivery.fail',
  DELIVERY_RESCHEDULE: 'delivery.reschedule',

  // Installation & Commissioning
  INSTALLATION_VIEW: 'installation.view',
  INSTALLATION_UPDATE: 'installation.update',
  COMMISSIONING_VIEW: 'commissioning.view',
  COMMISSIONING_TEST: 'commissioning.test',
  WARRANTY_VIEW: 'warranty.view',

  // Service Management
  SERVICE_VIEW: 'service.view',
  SERVICE_CREATE: 'service.create',
  SERVICE_ASSIGN: 'service.assign',
  SERVICE_DIAGNOSE: 'service.diagnose',
  SERVICE_REPAIR: 'service.repair',
  SERVICE_TEST: 'service.test',
  SERVICE_CLOSE: 'service.close',
  RMA_MANAGE: 'rma.manage',

  // Masters
  MASTERS_VIEW: 'masters.view',
  MASTERS_MANAGE: 'masters.manage',

  // System Controls
  AUDIT_VIEW: 'audit.view',
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_UPLOAD: 'documents.upload',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export'
};

module.exports = PERMISSIONS;
