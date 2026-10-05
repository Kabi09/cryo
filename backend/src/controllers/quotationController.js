const Quotation = require('../models/Quotation');
const QuotationRevision = require('../models/QuotationRevision');
const ProformaInvoice = require('../models/ProformaInvoice');
const Customer = require('../models/Customer');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const WorkflowService = require('../services/workflowService');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

const calculateTotals = (items, discountAmount = 0) => {
  let subtotal = 0;
  let taxAmount = 0;

  const calculatedItems = items.map(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = (itemSubtotal * (item.discountPercent || 0)) / 100;
    const taxable = itemSubtotal - itemDiscount;
    const itemTax = (taxable * (item.taxPercent || 18)) / 100;
    const total = taxable + itemTax;

    subtotal += taxable;
    taxAmount += itemTax;

    return {
      ...item,
      total: Math.round(total * 100) / 100
    };
  });

  const grandTotal = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    grandTotal: Math.max(0, grandTotal)
  };
};

exports.getQuotations = async (req, res, next) => {
  try {
    const { status, customerId, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (search) {
      filter.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const quotations = await Quotation.find(filter)
      .populate('customerId', 'companyName customerCode contactPerson email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Quotations fetched', { quotations });
  } catch (err) {
    next(err);
  }
};

exports.getQuotationById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customerId')
      .populate('items.productId')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!quotation) throw new AppError('Quotation not found', 404, 'QUOTATION_NOT_FOUND');

    const revisions = await QuotationRevision.find({ parentQuotationId: quotation._id }).sort({ revisionNumber: 1 });

    return ApiResponse.success(res, 'Quotation details', { quotation, revisions });
  } catch (err) {
    next(err);
  }
};

exports.createQuotation = async (req, res, next) => {
  try {
    const { customerId, leadId, items, discountAmount = 0, paymentTerms, deliveryTerms, warrantyTerms, validityDays = 30 } = req.body;

    if (!customerId) throw new AppError('Customer is required', 400, 'MISSING_CUSTOMER');
    if (!items || items.length === 0) throw new AppError('At least one line item is required', 400, 'MISSING_ITEMS');

    const customer = await Customer.findById(customerId);
    if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');

    const calculated = calculateTotals(items, discountAmount);
    const quotationNumber = `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const quotation = new Quotation({
      quotationNumber,
      customerId,
      leadId,
      items: calculated.items,
      subtotal: calculated.subtotal,
      discountAmount,
      taxAmount: calculated.taxAmount,
      grandTotal: calculated.grandTotal,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      validityDays,
      validUntil,
      status: STATUSES.QUOTATION.DRAFT,
      createdBy: req.user._id
    });

    await quotation.save();

    await AuditService.log({
      entityType: 'QUOTATION',
      entityId: quotation._id,
      action: 'QUOTATION_CREATED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: null,
      newStatus: STATUSES.QUOTATION.DRAFT,
      reason: `Quotation created with grand total ₹${calculated.grandTotal}`
    });

    return ApiResponse.created(res, 'Quotation created successfully', { quotation });
  } catch (err) {
    next(err);
  }
};

exports.executeAction = async (req, res, next) => {
  try {
    const { id, action } = req.params;
    const payload = req.body || {};

    if (action === 'revise') {
      return exports.createRevision(req, res, next);
    }

    // Special handling for accept: generates Proforma Invoice automatically
    if (action === 'accept') {
      const quotation = await Quotation.findById(id).populate('items.productId');
      if (!quotation) throw new AppError('Quotation not found', 404);

      const updatedDoc = await WorkflowService.transition({
        entityType: 'QUOTATION',
        entityId: id,
        action,
        payload,
        user: req.user,
        req
      });

      // Generate Proforma Invoice
      const piNumber = `PI-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
      const advancePercentage = 30; // standard advance
      const advanceDue = Math.round((updatedDoc.grandTotal * (advancePercentage / 100)) * 100) / 100;

      const proforma = new ProformaInvoice({
        piNumber,
        quotationId: updatedDoc._id,
        customerId: updatedDoc.customerId,
        items: updatedDoc.items.map(i => ({
          productId: i.productId,
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxPercent: i.taxPercent,
          total: i.total
        })),
        subtotal: updatedDoc.subtotal,
        taxAmount: updatedDoc.taxAmount,
        grandTotal: updatedDoc.grandTotal,
        requiredAdvancePercentage: advancePercentage,
        advanceAmountDue: advanceDue,
        paymentTerms: updatedDoc.paymentTerms,
        deliveryTerms: updatedDoc.deliveryTerms,
        status: STATUSES.PROFORMA_INVOICE.ISSUED,
        createdBy: req.user._id
      });
      await proforma.save();

      await AuditService.log({
        entityType: 'PROFORMA_INVOICE',
        entityId: proforma._id,
        action: 'PROFORMA_GENERATED',
        actorUserId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        reason: `Generated upon acceptance of Quotation ${updatedDoc.quotationNumber}`
      });

      return ApiResponse.success(res, `Action '${action}' executed successfully. Proforma Invoice generated.`, {
        quotation: updatedDoc,
        proforma
      });
    }

    // Special handling for negotiate: log counter offer in quotation history
    if (action === 'negotiate') {
      const quotation = await Quotation.findById(id);
      if (!quotation) throw new AppError('Quotation not found', 404);

      quotation.negotiationHistory.push({
        requestedDiscount: payload.requestedDiscount || 0,
        clientNotes: payload.clientNotes || '',
        internalNotes: payload.internalNotes || '',
        recordedBy: req.user._id,
        date: new Date()
      });
      await quotation.save();
    }

    const updatedDoc = await WorkflowService.transition({
      entityType: 'QUOTATION',
      entityId: id,
      action,
      payload,
      user: req.user,
      req
    });

    return ApiResponse.success(res, `Action '${action}' executed successfully`, { quotation: updatedDoc });
  } catch (err) {
    next(err);
  }
};

exports.createRevision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, changeReason, discountAmount = 0, paymentTerms, deliveryTerms, warrantyTerms } = req.body;

    if (!changeReason) throw new AppError('Reason for quotation revision is mandatory', 400, 'MISSING_REASON');
    if (!items || items.length === 0) throw new AppError('Revision must have line items', 400, 'MISSING_ITEMS');

    const parent = await Quotation.findById(id);
    if (!parent) throw new AppError('Parent quotation not found', 404);

    const calculated = calculateTotals(items, discountAmount);
    const newRevisionNumber = (parent.currentRevisionNumber || 0) + 1;
    const revisionCode = `${parent.quotationNumber}-R${newRevisionNumber}`;

    const revision = new QuotationRevision({
      revisionCode,
      revisionNumber: newRevisionNumber,
      parentQuotationId: parent._id,
      items: calculated.items,
      oldTotal: parent.grandTotal,
      newTotal: calculated.grandTotal,
      subtotal: calculated.subtotal,
      discountAmount,
      taxAmount: calculated.taxAmount,
      grandTotal: calculated.grandTotal,
      paymentTerms: paymentTerms || parent.paymentTerms,
      deliveryTerms: deliveryTerms || parent.deliveryTerms,
      warrantyTerms: warrantyTerms || parent.warrantyTerms,
      changeReason,
      status: STATUSES.QUOTATION_REVISION.PENDING_APPROVAL,
      createdBy: req.user._id
    });
    await revision.save();

    // Update parent quotation reference without overwriting past history
    parent.currentRevisionNumber = newRevisionNumber;
    parent.items = calculated.items;
    parent.subtotal = calculated.subtotal;
    parent.taxAmount = calculated.taxAmount;
    parent.grandTotal = calculated.grandTotal;
    parent.status = STATUSES.QUOTATION.PENDING_APPROVAL;
    await parent.save();

    await AuditService.log({
      entityType: 'QUOTATION',
      entityId: parent._id,
      action: 'QUOTATION_REVISION_CREATED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: parent.status,
      newStatus: STATUSES.QUOTATION.PENDING_APPROVAL,
      reason: `Created ${revisionCode}: ${changeReason}`
    });

    await NotificationService.notify({
      title: 'Quotation Revision Created',
      message: `Revision ${revisionCode} created for review. Reason: ${changeReason}`,
      targetRole: ROLES.SALES_MANAGER,
      entityType: 'QUOTATION',
      entityId: parent._id
    });

    return ApiResponse.created(res, `Revision ${revisionCode} created successfully`, { revision, quotation: parent });
  } catch (err) {
    next(err);
  }
};

exports.getRevisions = async (req, res, next) => {
  try {
    const revisions = await QuotationRevision.find({ parentQuotationId: req.params.id })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ revisionNumber: 1 });
    return ApiResponse.success(res, 'Quotation revisions', { revisions });
  } catch (err) {
    next(err);
  }
};
