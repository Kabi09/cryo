const Payment = require('../models/Payment');
const SalesOrder = require('../models/SalesOrder');
const FinalInvoice = require('../models/FinalInvoice');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

exports.getPayments = async (req, res, next) => {
  try {
    const { status, customerId, salesOrderId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (salesOrderId) filter.salesOrderId = salesOrderId;

    const payments = await Payment.find(filter)
      .populate('customerId', 'companyName customerCode')
      .populate('salesOrderId', 'salesOrderNumber grandTotal advanceReceivedAmount balanceDueAmount')
      .populate('verifiedBy', 'name email')
      .sort({ paymentDate: -1 });

    return ApiResponse.success(res, 'Payments fetched', { payments });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customerId')
      .populate('salesOrderId')
      .populate('invoiceId')
      .populate('verifiedBy', 'name email');

    if (!payment) throw new AppError('Payment not found', 404);

    return ApiResponse.success(res, 'Payment details', { payment });
  } catch (err) {
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const {
      customerId,
      salesOrderId,
      invoiceId,
      expectedAmount,
      receivedAmount,
      paymentType,
      method,
      bankName,
      transactionReference,
      paymentDate,
      notes
    } = req.body;

    const receivedAmt = receivedAmount || req.body.amount;
    const txnRef = transactionReference || req.body.transactionRef;

    if (!customerId || !receivedAmt || !txnRef) {
      throw new AppError('Missing required payment fields (customerId, receivedAmount/amount, transactionReference/transactionRef)', 400, 'VALIDATION_ERROR');
    }

    const proofDocumentPath = req.file ? req.file.path : null;
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;

    const payment = new Payment({
      paymentNumber,
      customerId,
      salesOrderId,
      invoiceId,
      expectedAmount: expectedAmount || receivedAmt,
      receivedAmount: receivedAmt,
      paymentType: paymentType || 'ADVANCE',
      method: method || 'NEFT',
      bankName,
      transactionReference: txnRef,
      paymentDate: paymentDate || new Date(),
      proofDocumentPath,
      status: STATUSES.PAYMENT.PENDING,
      notes,
      recordedBy: req.user._id
    });

    await payment.save();

    await AuditService.log({
      entityType: 'PAYMENT',
      entityId: payment._id,
      action: 'PAYMENT_RECORDED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: null,
      newStatus: STATUSES.PAYMENT.PENDING,
      reason: `Recorded ${payment.method} payment of ₹${payment.receivedAmount}. Ref: ${payment.transactionReference}`
    });

    await NotificationService.notify({
      title: 'Payment Received Awaiting Verification',
      message: `Payment ${payment.paymentNumber} of ₹${payment.receivedAmount} logged. Accounts verification required.`,
      targetRole: ROLES.ACCOUNTS,
      entityType: 'PAYMENT',
      entityId: payment._id
    });

    return ApiResponse.created(res, 'Payment recorded successfully', { payment });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError('Payment not found', 404);

    if (payment.status === STATUSES.PAYMENT.VERIFIED) {
      throw new AppError('Payment is already verified', 400, 'ALREADY_VERIFIED');
    }

    const previousStatus = payment.status;
    payment.status = STATUSES.PAYMENT.VERIFIED;
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    await payment.save();

    // Update SalesOrder balance and advance received
    if (payment.salesOrderId) {
      const salesOrder = await SalesOrder.findById(payment.salesOrderId);
      if (salesOrder) {
        salesOrder.advanceReceivedAmount = (salesOrder.advanceReceivedAmount || 0) + payment.receivedAmount;
        salesOrder.balanceDueAmount = Math.max(0, salesOrder.grandTotal - salesOrder.advanceReceivedAmount);
        await salesOrder.save();
      }
    }

    // Update FinalInvoice if linked
    if (payment.invoiceId) {
      const invoice = await FinalInvoice.findById(payment.invoiceId);
      if (invoice) {
        invoice.paidAmount = (invoice.paidAmount || 0) + payment.receivedAmount;
        invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.paidAmount);
        if (invoice.balanceDue <= 0) {
          invoice.status = STATUSES.FINAL_INVOICE.PAID;
        } else {
          invoice.status = STATUSES.FINAL_INVOICE.PARTIALLY_PAID;
        }
        await invoice.save();
      }
    }

    await AuditService.log({
      entityType: 'PAYMENT',
      entityId: payment._id,
      action: 'PAYMENT_VERIFIED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus,
      newStatus: STATUSES.PAYMENT.VERIFIED,
      reason: `Bank credit confirmed for ₹${payment.receivedAmount}`
    });

    await NotificationService.notify({
      title: 'Payment Verified',
      message: `Payment ${payment.paymentNumber} of ₹${payment.receivedAmount} confirmed. Ready for next workflow stage.`,
      targetRole: ROLES.PRODUCTION,
      entityType: 'PAYMENT',
      entityId: payment._id
    });

    return ApiResponse.success(res, 'Payment verified successfully', { payment });
  } catch (err) {
    next(err);
  }
};

exports.reversePayment = async (req, res, next) => {
  try {
    const { reversalReason } = req.body;
    if (!reversalReason) throw new AppError('Reason for reversal is required', 400);

    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError('Payment not found', 404);

    if (payment.status !== STATUSES.PAYMENT.VERIFIED) {
      throw new AppError('Only verified payments can be reversed', 400);
    }

    const previousStatus = payment.status;
    payment.status = STATUSES.PAYMENT.REVERSED;
    payment.reversalReason = reversalReason;
    await payment.save();

    // Revert Sales Order balance
    if (payment.salesOrderId) {
      const salesOrder = await SalesOrder.findById(payment.salesOrderId);
      if (salesOrder) {
        salesOrder.advanceReceivedAmount = Math.max(0, (salesOrder.advanceReceivedAmount || 0) - payment.receivedAmount);
        salesOrder.balanceDueAmount = Math.min(salesOrder.grandTotal, (salesOrder.balanceDueAmount || 0) + payment.receivedAmount);
        await salesOrder.save();
      }
    }

    await AuditService.log({
      entityType: 'PAYMENT',
      entityId: payment._id,
      action: 'PAYMENT_REVERSED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus,
      newStatus: STATUSES.PAYMENT.REVERSED,
      reason: reversalReason
    });

    return ApiResponse.success(res, 'Payment reversed successfully', { payment });
  } catch (err) {
    next(err);
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const { refundReason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError('Payment not found', 404);

    payment.status = STATUSES.PAYMENT.REFUNDED;
    payment.refundReason = refundReason || 'Customer refund processed';
    await payment.save();

    await AuditService.log({
      entityType: 'PAYMENT',
      entityId: payment._id,
      action: 'PAYMENT_REFUNDED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: payment.status,
      newStatus: STATUSES.PAYMENT.REFUNDED,
      reason: payment.refundReason
    });

    return ApiResponse.success(res, 'Payment refunded successfully', { payment });
  } catch (err) {
    next(err);
  }
};
