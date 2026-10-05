const ProcurementRFQ = require('../models/ProcurementRFQ');
const VendorQuotation = require('../models/VendorQuotation');
const VendorPO = require('../models/VendorPO');
const GRN = require('../models/GRN');
const StockItem = require('../models/StockItem');
const InventoryService = require('../services/inventoryService');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

// --- RFQ ---
exports.getRFQs = async (req, res, next) => {
  try {
    const rfqs = await ProcurementRFQ.find()
      .populate('vendorIds', 'companyName vendorCode contactPerson rating')
      .populate('selectedVendorId', 'companyName vendorCode')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'RFQs fetched', { rfqs });
  } catch (err) {
    next(err);
  }
};

exports.createRFQ = async (req, res, next) => {
  try {
    const { title, items, vendorIds, deadlineDate, materialRequestId } = req.body;
    const rfqNumber = `RFQ-${Date.now().toString().slice(-6)}`;

    const rfq = new ProcurementRFQ({
      rfqNumber,
      materialRequestId,
      title,
      items,
      vendorIds,
      deadlineDate: deadlineDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: STATUSES.PROCUREMENT_RFQ.PUBLISHED,
      createdBy: req.user._id
    });
    await rfq.save();

    return ApiResponse.created(res, 'RFQ created and published', { rfq });
  } catch (err) {
    next(err);
  }
};

// --- Vendor Quotes & Comparison ---
exports.getVendorQuotesForRFQ = async (req, res, next) => {
  try {
    const quotes = await VendorQuotation.find({ rfqId: req.params.rfqId })
      .populate('vendorId')
      .sort({ totalAmount: 1 });
    return ApiResponse.success(res, 'Vendor quotations for comparison', { quotes });
  } catch (err) {
    next(err);
  }
};

exports.submitVendorQuote = async (req, res, next) => {
  try {
    const { rfqId, vendorId, quotationRef, items, totalAmount, deliveryLeadDays, paymentTerms, warrantyMonths } = req.body;

    const quote = new VendorQuotation({
      rfqId,
      vendorId,
      quotationRef,
      items,
      totalAmount,
      deliveryLeadDays,
      paymentTerms,
      warrantyMonths,
      status: STATUSES.VENDOR_QUOTATION.SUBMITTED
    });
    await quote.save();

    await ProcurementRFQ.findByIdAndUpdate(rfqId, { status: STATUSES.PROCUREMENT_RFQ.QUOTES_RECEIVED });

    return ApiResponse.created(res, 'Vendor quote submitted', { quote });
  } catch (err) {
    next(err);
  }
};

exports.selectWinningQuote = async (req, res, next) => {
  try {
    const { id } = req.params; // rfqId
    const { winningQuoteId, selectionJustification } = req.body;

    const rfq = await ProcurementRFQ.findById(id);
    if (!rfq) throw new AppError('RFQ not found', 404);

    const winningQuote = await VendorQuotation.findById(winningQuoteId).populate('vendorId');
    if (!winningQuote) throw new AppError('Winning quote not found', 404);

    winningQuote.status = STATUSES.VENDOR_QUOTATION.ACCEPTED;
    await winningQuote.save();

    // Mark other quotes rejected
    await VendorQuotation.updateMany(
      { rfqId: rfq._id, _id: { $ne: winningQuote._id } },
      { status: STATUSES.VENDOR_QUOTATION.REJECTED }
    );

    rfq.selectedVendorId = winningQuote.vendorId._id;
    rfq.selectionJustification = selectionJustification || 'Best commercial rate and compliant delivery timeline.';
    rfq.status = STATUSES.PROCUREMENT_RFQ.CLOSED;
    await rfq.save();

    // Automatically generate Vendor PO
    const vpoNumber = `VPO-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (winningQuote.deliveryLeadDays || 14));

    const vpo = new VendorPO({
      vpoNumber,
      vendorId: winningQuote.vendorId._id,
      rfqId: rfq._id,
      items: winningQuote.items,
      subtotal: winningQuote.subtotal || (winningQuote.totalAmount / 1.18),
      taxAmount: winningQuote.taxAmount || (winningQuote.totalAmount - (winningQuote.totalAmount / 1.18)),
      grandTotal: winningQuote.totalAmount,
      deliveryDate,
      paymentTerms: winningQuote.paymentTerms,
      status: STATUSES.VENDOR_PO.APPROVED,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      createdBy: req.user._id
    });
    await vpo.save();

    await AuditService.log({
      entityType: 'VENDOR_PO',
      entityId: vpo._id,
      action: 'VENDOR_PO_GENERATED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      reason: `Awarded to ${winningQuote.vendorId.companyName}. Justification: ${rfq.selectionJustification}`
    });

    return ApiResponse.success(res, 'Vendor selected and Vendor PO generated', { rfq, winningQuote, vpo });
  } catch (err) {
    next(err);
  }
};

// --- Vendor POs ---
exports.getVendorPOs = async (req, res, next) => {
  try {
    const vpos = await VendorPO.find()
      .populate('vendorId', 'companyName vendorCode gstin phone')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Vendor POs fetched', { vpos });
  } catch (err) {
    next(err);
  }
};

// --- GRN ---
exports.getGRNs = async (req, res, next) => {
  try {
    const grns = await GRN.find()
      .populate('vendorId', 'companyName vendorCode')
      .populate('vpoId', 'vpoNumber')
      .populate('warehouseId', 'name code')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'GRNs fetched', { grns });
  } catch (err) {
    next(err);
  }
};

exports.createGRN = async (req, res, next) => {
  try {
    const { vpoId, vendorId, warehouseId, vendorInvoiceNumber, vendorInvoiceDate, items } = req.body;
    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;

    const grn = new GRN({
      grnNumber,
      vpoId,
      vendorId,
      warehouseId,
      vendorInvoiceNumber,
      vendorInvoiceDate: vendorInvoiceDate || new Date(),
      items,
      status: STATUSES.GRN.PENDING_INSPECTION,
      receivedBy: req.user._id
    });
    await grn.save();

    await NotificationService.notify({
      title: 'Material Received at Dock (GRN)',
      message: `Consignment received under ${grnNumber}. Store/QA inspection required.`,
      targetRole: ROLES.STORE,
      entityType: 'GRN',
      entityId: grn._id
    });

    return ApiResponse.created(res, 'GRN logged awaiting inspection', { grn });
  } catch (err) {
    next(err);
  }
};

exports.inspectGRN = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, inspectionNotes } = req.body; // items has acceptedQty and rejectedQty

    const grn = await GRN.findById(id);
    if (!grn) throw new AppError('GRN not found', 404);

    let hasRejection = false;
    let totalAccepted = 0;

    for (const incomingItem of items) {
      const match = grn.items.find(i => String(i.stockItemId) === String(incomingItem.stockItemId));
      if (match) {
        match.acceptedQty = incomingItem.acceptedQty || 0;
        match.rejectedQty = incomingItem.rejectedQty || 0;
        match.rejectionReason = incomingItem.rejectionReason || '';
        match.batchNumber = incomingItem.batchNumber || `BAT-${Date.now().toString().slice(-4)}`;

        if (match.rejectedQty > 0) hasRejection = true;
        totalAccepted += match.acceptedQty;

        // Post accepted items to inventory ledger
        if (match.acceptedQty > 0) {
          await InventoryService.postMovement({
            movementType: STATUSES.INVENTORY_MOVEMENT.GRN_RECEIPT,
            itemId: match.stockItemId,
            warehouseId: grn.warehouseId,
            quantity: match.acceptedQty,
            referenceEntityType: 'GRN',
            referenceEntityId: grn._id,
            batchNumber: match.batchNumber,
            remarks: `Received via ${grn.grnNumber}`,
            userId: req.user._id
          });
        }
      }
    }

    grn.status = hasRejection
      ? (totalAccepted > 0 ? STATUSES.GRN.PARTIALLY_ACCEPTED : STATUSES.GRN.REJECTED)
      : STATUSES.GRN.ACCEPTED;
    grn.inspectedBy = req.user._id;
    grn.inspectedAt = new Date();
    grn.inspectionNotes = inspectionNotes || 'Physical inspection and dimension check passed.';
    await grn.save();

    await AuditService.log({
      entityType: 'GRN',
      entityId: grn._id,
      action: 'GRN_INSPECTED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: STATUSES.GRN.PENDING_INSPECTION,
      newStatus: grn.status,
      reason: `Inspection complete. Accepted: ${totalAccepted} units.`
    });

    return ApiResponse.success(res, `GRN inspection complete. Status: ${grn.status}`, { grn });
  } catch (err) {
    next(err);
  }
};
