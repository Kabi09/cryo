const SalesOrder = require('../models/SalesOrder');
const ProductionOrder = require('../models/ProductionOrder');
const BOM = require('../models/BOM');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const WorkflowService = require('../services/workflowService');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

exports.getSalesOrders = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    const orders = await SalesOrder.find(filter)
      .populate('customerId', 'companyName customerCode contactPerson phone')
      .populate('customerPoId', 'poNumber')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Sales Orders fetched', { orders });
  } catch (err) {
    next(err);
  }
};

exports.getSalesOrderById = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customerId')
      .populate('customerPoId')
      .populate('quotationId')
      .populate('items.productId')
      .populate('productionReleasedBy', 'name email');

    if (!order) throw new AppError('Sales Order not found', 404);

    return ApiResponse.success(res, 'Sales Order details', { order });
  } catch (err) {
    next(err);
  }
};

exports.executeAction = async (req, res, next) => {
  try {
    const { id, action } = req.params;
    const payload = req.body || {};

    const updatedDoc = await WorkflowService.transition({
      entityType: 'SALES_ORDER',
      entityId: id,
      action,
      payload,
      user: req.user,
      req
    });

    // When releasing to production: create Production Order automatically if not existing
    if (action === 'releaseProduction') {
      for (const item of updatedDoc.items) {
        let activeBOM = await BOM.findOne({ productId: item.productId, status: STATUSES.BOM.ACTIVE });
        if (!activeBOM) {
          activeBOM = await BOM.findOne({ status: STATUSES.BOM.ACTIVE });
        }

        const productionOrderNumber = `PRD-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
        const targetCompletionDate = new Date();
        targetCompletionDate.setDate(targetCompletionDate.getDate() + 30);

        const prodOrder = new ProductionOrder({
          productionOrderNumber,
          salesOrderId: updatedDoc._id,
          productId: item.productId,
          bomId: activeBOM ? activeBOM._id : null,
          plannedQuantity: item.quantity,
          producedQuantity: 0,
          rejectedQuantity: 0,
          targetCompletionDate,
          status: STATUSES.PRODUCTION_ORDER.DRAFT,
          releasedBy: req.user._id,
          releasedAt: new Date()
        });

        await prodOrder.save();

        await AuditService.log({
          entityType: 'PRODUCTION_ORDER',
          entityId: prodOrder._id,
          action: 'PRODUCTION_ORDER_GENERATED',
          actorUserId: req.user._id,
          actorName: req.user.name,
          actorRole: req.user.role,
          reason: `Initiated for Sales Order ${updatedDoc.salesOrderNumber}`
        });
      }
    }

    return ApiResponse.success(res, `Action '${action}' executed successfully on Sales Order`, { order: updatedDoc });
  } catch (err) {
    next(err);
  }
};
