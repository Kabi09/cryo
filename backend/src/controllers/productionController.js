const ProductionOrder = require('../models/ProductionOrder');
const BOM = require('../models/BOM');
const MaterialRequest = require('../models/MaterialRequest');
const ProductionOperation = require('../models/ProductionOperation');
const StockItem = require('../models/StockItem');
const QATest = require('../models/QATest');
const SerialNumber = require('../models/SerialNumber');
const WorkCenter = require('../models/WorkCenter');
const InventoryService = require('../services/inventoryService');
const WorkflowService = require('../services/workflowService');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

// --- Production Orders ---
exports.getProductionOrders = async (req, res, next) => {
  try {
    const { status, salesOrderId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (salesOrderId) filter.salesOrderId = salesOrderId;

    const orders = await ProductionOrder.find(filter)
      .populate('productId', 'name sku modelNumber capacity tempRating')
      .populate('salesOrderId', 'salesOrderNumber deliveryCommittedDate')
      .populate('bomId')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Production Orders fetched', { orders });
  } catch (err) {
    next(err);
  }
};

exports.getProductionOrderById = async (req, res, next) => {
  try {
    const order = await ProductionOrder.findById(req.params.id)
      .populate('productId')
      .populate('salesOrderId')
      .populate('bomId')
      .populate('releasedBy', 'name email');

    if (!order) throw new AppError('Production Order not found', 404);

    const operations = await ProductionOperation.find({ productionOrderId: order._id })
      .populate('workCenterId')
      .populate('operatorId', 'name email')
      .sort({ sequenceNumber: 1 });

    const materialRequest = await MaterialRequest.findOne({ productionOrderId: order._id });

    return ApiResponse.success(res, 'Production Order details', { order, operations, materialRequest });
  } catch (err) {
    next(err);
  }
};

exports.createProductionOrder = async (req, res, next) => {
  try {
    const { salesOrderId, productId, plannedQuantity, targetCompletionDate, bomId } = req.body;
    const productionOrderNumber = `PRD-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const order = new ProductionOrder({
      productionOrderNumber,
      salesOrderId,
      productId,
      bomId,
      plannedQuantity,
      targetCompletionDate: targetCompletionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: STATUSES.PRODUCTION_ORDER.DRAFT
    });

    await order.save();
    return ApiResponse.created(res, 'Production Order created', { order });
  } catch (err) {
    next(err);
  }
};

exports.executeAction = async (req, res, next) => {
  try {
    const { id, action } = req.params;
    const payload = req.body || {};

    const updatedDoc = await WorkflowService.transition({
      entityType: 'PRODUCTION_ORDER',
      entityId: id,
      action,
      payload,
      user: req.user,
      req
    });

    // When releasing order: automatically explode BOM and generate MaterialRequest & shop operations
    if (action === 'release') {
      const bom = await BOM.findById(updatedDoc.bomId);
      if (bom && bom.items && bom.items.length > 0) {
        const mrNumber = `MR-${Date.now().toString().slice(-6)}`;
        const mrItems = [];

        for (const bi of bom.items) {
          const reqQty = bi.quantityPerUnit * updatedDoc.plannedQuantity;
          const stockItem = await StockItem.findById(bi.stockItemId);
          const available = stockItem ? stockItem.availableQuantity : 0;

          let stockStatus = 'FULL_STOCK';
          let shortage = 0;
          if (available < reqQty) {
            shortage = reqQty - available;
            stockStatus = available > 0 ? 'PARTIAL_STOCK' : 'NO_STOCK';
          }

          mrItems.push({
            stockItemId: bi.stockItemId,
            sku: bi.sku,
            name: bi.name,
            requiredQty: reqQty,
            issuedQty: 0,
            shortageQty: shortage,
            uom: bi.uom,
            stockStatus
          });
        }

        const materialRequest = new MaterialRequest({
          requestNumber: mrNumber,
          productionOrderId: updatedDoc._id,
          items: mrItems,
          requiredDate: updatedDoc.startDate,
          status: STATUSES.MATERIAL_REQUEST.SUBMITTED,
          createdBy: req.user._id
        });
        await materialRequest.save();

        // Check if shortage exists
        const hasShortage = mrItems.some(i => i.shortageQty > 0);
        if (hasShortage) {
          await NotificationService.notify({
            title: 'Material Shortage Detected',
            message: `Material Request ${mrNumber} for Production Order ${updatedDoc.productionOrderNumber} has component shortages. Procurement required.`,
            targetRole: ROLES.PURCHASE,
            entityType: 'MATERIAL_REQUEST',
            entityId: materialRequest._id
          });
        }
      }

      // Initialize the 4 standard production operations: FABRICATION, REFRIGERATION, ELECTRICAL, ASSEMBLY
      const defaultOps = [
        { type: 'FABRICATION', stage: 'FABRICATION', seq: 1 },
        { type: 'REFRIGERATION', stage: 'REFRIGERATION', seq: 2 },
        { type: 'ELECTRICAL', stage: 'ELECTRICAL', seq: 3 },
        { type: 'ASSEMBLY', stage: 'ASSEMBLY', seq: 4 }
      ];

      for (const op of defaultOps) {
        let wc = await WorkCenter.findOne({ stage: op.stage });
        if (!wc) {
          wc = new WorkCenter({
            code: `WC-${op.type.slice(0, 3)}`,
            name: `${op.stage} Work Center`,
            stage: op.stage,
            hourlyRate: 1500
          });
          await wc.save();
        }

        const opDoc = new ProductionOperation({
          operationNumber: `OP-${updatedDoc.productionOrderNumber}-${op.seq}`,
          productionOrderId: updatedDoc._id,
          operationType: op.type,
          sequenceNumber: op.seq,
          workCenterId: wc._id,
          status: STATUSES.PRODUCTION_OPERATION.PENDING
        });
        await opDoc.save();
      }
    }

    // When completing production: create serial numbers and initiate QA testing record
    if (action === 'complete') {
      const serialNumberStr = `CRYO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

      const qaTest = new QATest({
        testNumber: `QA-${Date.now().toString().slice(-6)}`,
        productionOrderId: updatedDoc._id,
        productId: updatedDoc.productId,
        serialNumber: serialNumberStr,
        parameters: [
          { parameterName: 'Deep Cryo Pull-down Temp', specificationRequired: '-150°C within 5 hours', actualValue: '-152°C', result: 'PASS' },
          { parameterName: 'Vacuum Retention Level', specificationRequired: '< 1x10^-3 Torr', actualValue: '0.0001 Torr', result: 'PASS' },
          { parameterName: 'Cascade Pressure Hold Test', specificationRequired: '22 Bar Nitrogen Hold 24h', actualValue: '22.1 Bar', result: 'PASS' },
          { parameterName: 'Electrical Insulation Resistance', specificationRequired: '> 100 MOhm at 1000V DC', actualValue: '250 MOhm', result: 'PASS' },
          { parameterName: 'Safety Relief Valve Pop Test', specificationRequired: 'Opens at 25 Bar +/- 0.5', actualValue: '25.2 Bar', result: 'PASS' }
        ],
        overallResult: STATUSES.QA_TEST.PENDING,
        testedAt: new Date()
      });
      await qaTest.save();

      const serial = new SerialNumber({
        serialNumber: serialNumberStr,
        productId: updatedDoc.productId,
        productionOrderId: updatedDoc._id,
        salesOrderId: updatedDoc.salesOrderId,
        qaTestId: qaTest._id,
        currentStatus: STATUSES.SERIAL_NUMBER.IN_PRODUCTION,
        history: [{
          eventType: 'SERIAL_PRODUCED',
          stage: 'ASSEMBLY',
          description: `Produced under Production Order ${updatedDoc.productionOrderNumber}`,
          referenceEntityType: 'PRODUCTION_ORDER',
          referenceEntityId: updatedDoc._id,
          recordedBy: req.user._id,
          timestamp: new Date()
        }]
      });
      await serial.save();
    }

    return ApiResponse.success(res, `Action '${action}' executed successfully on Production Order`, { order: updatedDoc });
  } catch (err) {
    next(err);
  }
};

// --- Operations ---
exports.startOperation = async (req, res, next) => {
  try {
    const { operationId } = req.params;
    const op = await ProductionOperation.findById(operationId);
    if (!op) throw new AppError('Operation not found', 404);

    op.status = STATUSES.PRODUCTION_OPERATION.IN_PROGRESS;
    op.startTime = new Date();
    op.operatorId = req.user._id;
    await op.save();

    return ApiResponse.success(res, 'Workstation operation started', { operation: op });
  } catch (err) {
    next(err);
  }
};

exports.completeOperation = async (req, res, next) => {
  try {
    const { operationId } = req.params;
    const { remarks, yieldQuantity = 1, rejectedQuantity = 0 } = req.body;
    const op = await ProductionOperation.findById(operationId);
    if (!op) throw new AppError('Operation not found', 404);

    op.status = STATUSES.PRODUCTION_OPERATION.COMPLETED;
    op.endTime = new Date();
    op.yieldQuantity = yieldQuantity;
    op.rejectedQuantity = rejectedQuantity;
    op.remarks = remarks || '';
    if (op.startTime) {
      op.actualDurationHours = Math.round(((op.endTime - op.startTime) / (1000 * 60 * 60)) * 10) / 10;
    }
    await op.save();

    return ApiResponse.success(res, 'Workstation operation completed', { operation: op });
  } catch (err) {
    next(err);
  }
};

// --- BOM ---
exports.getBOMs = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const filter = { status: STATUSES.BOM.ACTIVE };
    if (productId) filter.productId = productId;
    const boms = await BOM.find(filter).populate('productId').populate('items.stockItemId');
    return ApiResponse.success(res, 'BOMs fetched', { boms });
  } catch (err) {
    next(err);
  }
};

exports.createBOM = async (req, res, next) => {
  try {
    const { productId, version = '1.0', items, remarks } = req.body;
    const bomNumber = `BOM-${Date.now().toString().slice(-6)}`;
    const totalEstimatedCost = items.reduce((acc, i) => acc + (i.quantityPerUnit * (i.estimatedUnitCost || 0)), 0);

    const bom = new BOM({
      bomNumber,
      productId,
      version,
      items,
      totalEstimatedCost,
      status: STATUSES.BOM.ACTIVE,
      remarks,
      createdBy: req.user._id
    });
    await bom.save();

    return ApiResponse.created(res, 'BOM created successfully', { bom });
  } catch (err) {
    next(err);
  }
};

// --- Material Requests & Issue ---
exports.getMaterialRequests = async (req, res, next) => {
  try {
    const requests = await MaterialRequest.find()
      .populate('productionOrderId')
      .populate('items.stockItemId')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Material requests fetched', { requests });
  } catch (err) {
    next(err);
  }
};

exports.issueMaterialRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mr = await MaterialRequest.findById(id);
    if (!mr) throw new AppError('Material request not found', 404);

    let allIssued = true;
    for (const item of mr.items) {
      const needed = item.requiredQty - item.issuedQty;
      if (needed > 0) {
        const stockItem = await StockItem.findById(item.stockItemId);
        if (stockItem && stockItem.availableQuantity > 0) {
          const toIssue = Math.min(needed, stockItem.availableQuantity);
          await InventoryService.postMovement({
            movementType: STATUSES.INVENTORY_MOVEMENT.ISSUE,
            itemId: item.stockItemId,
            warehouseId: stockItem.primaryWarehouseId,
            quantity: toIssue,
            referenceEntityType: 'MATERIAL_REQUEST',
            referenceEntityId: mr._id,
            remarks: `Issued for MR ${mr.requestNumber}`,
            userId: req.user._id
          });
          item.issuedQty += toIssue;
        }
      }
      if (item.issuedQty < item.requiredQty) {
        allIssued = false;
      }
    }

    mr.status = allIssued ? STATUSES.MATERIAL_REQUEST.ISSUED : STATUSES.MATERIAL_REQUEST.PARTIALLY_ISSUED;
    await mr.save();

    // If all materials issued, mark ProductionOrder as MATERIAL_READY
    if (allIssued) {
      await ProductionOrder.findByIdAndUpdate(mr.productionOrderId, { status: STATUSES.PRODUCTION_ORDER.MATERIAL_READY });
    }

    return ApiResponse.success(res, 'Materials issued successfully', { materialRequest: mr });
  } catch (err) {
    next(err);
  }
};
