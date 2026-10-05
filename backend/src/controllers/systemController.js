const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Document = require('../models/Document');
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const SalesOrder = require('../models/SalesOrder');
const Payment = require('../models/Payment');
const ProductionOrder = require('../models/ProductionOrder');
const StockItem = require('../models/StockItem');
const QATest = require('../models/QATest');
const ServiceTicket = require('../models/ServiceTicket');
const FinalInvoice = require('../models/FinalInvoice');
const STATUSES = require('../constants/statuses');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const path = require('path');
const fs = require('fs');

// --- Audit Logs ---
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { entityType, entityId, action, limit = 100 } = req.query;
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .populate('actorUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return ApiResponse.success(res, 'Audit logs fetched', { logs });
  } catch (err) {
    next(err);
  }
};

// --- Notifications ---
exports.getNotifications = async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { recipientUserId: req.user._id },
        { targetRole: req.user.role }
      ]
    };
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    return ApiResponse.success(res, 'Notifications fetched', { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return ApiResponse.success(res, 'Notification marked as read', { notification: notif });
  } catch (err) {
    next(err);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipientUserId: req.user._id },
          { targetRole: req.user.role }
        ],
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );
    return ApiResponse.success(res, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

// --- Documents ---
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No document file uploaded', 400);

    const { entityType, entityId, documentType, notes } = req.body;
    const documentId = `DOC-${Date.now().toString().slice(-6)}`;

    const doc = new Document({
      documentId,
      entityType: entityType || 'GENERAL',
      entityId: entityId || '0',
      documentType: documentType || 'ATTACHMENT',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      notes
    });
    await doc.save();

    return ApiResponse.created(res, 'Document uploaded successfully', { document: doc });
  } catch (err) {
    next(err);
  }
};

exports.getDocumentsForEntity = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.query;
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;

    const docs = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Documents fetched', { documents: docs });
  } catch (err) {
    next(err);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) throw new AppError('Document not found', 404);

    const absPath = path.resolve(doc.filePath);
    if (!fs.existsSync(absPath)) {
      throw new AppError('Physical file not found on server', 404);
    }

    res.download(absPath, doc.originalName);
  } catch (err) {
    next(err);
  }
};

// --- Role-Aware Dashboards & Reports ---
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Sales metrics
    const totalLeads = await Lead.countDocuments();
    const openQuotations = await Quotation.countDocuments({ status: { $in: [STATUSES.QUOTATION.DRAFT, STATUSES.QUOTATION.PENDING_APPROVAL, STATUSES.QUOTATION.APPROVED, STATUSES.QUOTATION.SENT] } });
    const totalOrders = await SalesOrder.countDocuments();
    const confirmedOrders = await SalesOrder.countDocuments({ status: STATUSES.SALES_ORDER.CONFIRMED });

    // 2. Financial metrics
    const payments = await Payment.find({ status: STATUSES.PAYMENT.VERIFIED });
    const totalRevenue = payments.reduce((acc, p) => acc + p.receivedAmount, 0);
    const invoices = await FinalInvoice.find({ status: STATUSES.FINAL_INVOICE.POSTED });
    const totalReceivables = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);

    // 3. Manufacturing metrics
    const activeProduction = await ProductionOrder.countDocuments({ status: { $in: [STATUSES.PRODUCTION_ORDER.RELEASED, STATUSES.PRODUCTION_ORDER.IN_PROGRESS] } });
    const pendingQA = await QATest.countDocuments({ overallResult: STATUSES.QA_TEST.PENDING });
    const passedQA = await QATest.countDocuments({ overallResult: STATUSES.QA_TEST.PASSED });

    // 4. Inventory metrics
    const lowStockItems = await StockItem.countDocuments({ $expr: { $lte: ['$availableQuantity', '$reorderLevel'] } });

    // 5. Service metrics
    const openTickets = await ServiceTicket.countDocuments({ status: { $ne: STATUSES.SERVICE_TICKET.CLOSED } });

    return ApiResponse.success(res, 'Dashboard analytics fetched', {
      stats: {
        totalLeads,
        openQuotations,
        totalOrders,
        confirmedOrders,
        totalRevenue,
        totalReceivables,
        activeProduction,
        pendingQA,
        passedQA,
        lowStockItems,
        openTickets
      }
    });
  } catch (err) {
    next(err);
  }
};
