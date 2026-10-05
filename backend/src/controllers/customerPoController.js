const CustomerPO = require('../models/CustomerPO');
const POVerification = require('../models/POVerification');
const SalesOrder = require('../models/SalesOrder');
const Quotation = require('../models/Quotation');
const ProformaInvoice = require('../models/ProformaInvoice');
const POVerificationService = require('../services/poVerificationService');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

exports.getCustomerPOs = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    const pos = await CustomerPO.find(filter)
      .populate('customerId', 'companyName customerCode contactPerson')
      .populate('quotationId', 'quotationNumber grandTotal')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Customer POs fetched', { pos });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerPOById = async (req, res, next) => {
  try {
    const po = await CustomerPO.findById(req.params.id)
      .populate('customerId')
      .populate('quotationId')
      .populate('proformaId')
      .populate('verifiedBy', 'name email');

    if (!po) throw new AppError('Customer PO not found', 404);

    const verification = await POVerification.findOne({ customerPoId: po._id }).sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Customer PO details', { po, verification });
  } catch (err) {
    next(err);
  }
};

exports.createCustomerPO = async (req, res, next) => {
  try {
    const { poNumber, poDate, customerId, quotationId, revisionId, proformaId, items, totalAmount, paymentTerms, deliveryTerms, warrantyTerms, deliveryRequestedDate } = req.body;

    if (!poNumber || !customerId || !quotationId || !items || !totalAmount) {
      throw new AppError('Missing required PO details', 400, 'VALIDATION_ERROR');
    }

    const documentPath = req.file ? req.file.path : null;

    const po = new CustomerPO({
      poNumber,
      poDate: poDate || new Date(),
      customerId,
      quotationId,
      revisionId,
      proformaId,
      items: typeof items === 'string' ? JSON.parse(items) : items,
      totalAmount,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      deliveryRequestedDate,
      documentPath,
      status: STATUSES.CUSTOMER_PO.RECEIVED
    });

    await po.save();

    await AuditService.log({
      entityType: 'CUSTOMER_PO',
      entityId: po._id,
      action: 'CUSTOMER_PO_RECORDED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: null,
      newStatus: STATUSES.CUSTOMER_PO.RECEIVED,
      reason: `Client PO ${po.poNumber} logged for ₹${po.totalAmount}`
    });

    await NotificationService.notify({
      title: 'Customer PO Received',
      message: `Customer PO ${po.poNumber} uploaded. 4-Way Verification pending.`,
      targetRole: ROLES.SALES_MANAGER,
      entityType: 'CUSTOMER_PO',
      entityId: po._id
    });

    return ApiResponse.created(res, 'Customer PO recorded', { po });
  } catch (err) {
    next(err);
  }
};

exports.runPOVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const verification = await POVerificationService.runVerification(id, req.user._id);

    const po = await CustomerPO.findById(id);

    await AuditService.log({
      entityType: 'PO_VERIFICATION',
      entityId: verification._id,
      action: 'PO_VERIFICATION_EXECUTED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      newStatus: verification.overallStatus,
      reason: `Verification verdict: ${verification.overallStatus}. Mismatches: ${verification.mismatchSummary.length}`
    });

    return ApiResponse.success(res, `PO verification completed with verdict: ${verification.overallStatus}`, {
      verification,
      po
    });
  } catch (err) {
    next(err);
  }
};

exports.confirmSalesOrderFromPO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { managerOverrideReason } = req.body;

    const po = await CustomerPO.findById(id).populate('customerId');
    if (!po) throw new AppError('Customer PO not found', 404);

    if (po.status !== STATUSES.CUSTOMER_PO.VERIFIED && !managerOverrideReason) {
      throw new AppError('Cannot create Sales Order: PO is not verified. Manager override reason is required if continuing with mismatches.', 400, 'PO_NOT_VERIFIED');
    }

    // Check if sales order already exists for this PO
    let existingSO = await SalesOrder.findOne({ customerPoId: po._id });
    if (existingSO) {
      throw new AppError(`Sales Order ${existingSO.salesOrderNumber} already exists for this Customer PO`, 409, 'SO_ALREADY_EXISTS');
    }

    const salesOrderNumber = `SO-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const advancePercent = 30;
    const advanceRequired = Math.round((po.totalAmount * (advancePercent / 100)) * 100) / 100;

    const salesOrder = new SalesOrder({
      salesOrderNumber,
      customerId: po.customerId._id,
      customerPoId: po._id,
      quotationId: po.quotationId,
      proformaId: po.proformaId,
      items: po.items,
      grandTotal: po.totalAmount,
      advanceRequiredPercent: advancePercent,
      advanceRequiredAmount: advanceRequired,
      advanceReceivedAmount: 0,
      balanceDueAmount: po.totalAmount,
      status: STATUSES.SALES_ORDER.CONFIRMED,
      deliveryCommittedDate: po.deliveryRequestedDate || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(),
      shippingAddress: po.customerId.shippingAddress,
      createdBy: req.user._id
    });

    await salesOrder.save();

    await AuditService.log({
      entityType: 'SALES_ORDER',
      entityId: salesOrder._id,
      action: 'SALES_ORDER_CONFIRMED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: null,
      newStatus: STATUSES.SALES_ORDER.CONFIRMED,
      reason: `Generated from PO ${po.poNumber}. Advance due: ₹${advanceRequired}`
    });

    await NotificationService.notify({
      title: 'Sales Order Confirmed',
      message: `Sales Order ${salesOrder.salesOrderNumber} confirmed. Advance payment invoice pending.`,
      targetRole: ROLES.ACCOUNTS,
      entityType: 'SALES_ORDER',
      entityId: salesOrder._id
    });

    return ApiResponse.created(res, `Sales Order ${salesOrder.salesOrderNumber} generated and confirmed`, { salesOrder });
  } catch (err) {
    next(err);
  }
};
