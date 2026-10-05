const StockItem = require('../models/StockItem');
const InventoryLedger = require('../models/InventoryLedger');
const InventoryService = require('../services/inventoryService');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const STATUSES = require('../constants/statuses');

exports.getStockItems = async (req, res, next) => {
  try {
    const { category, lowStock, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$availableQuantity', '$reorderLevel'] };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await StockItem.find(filter)
      .populate('primaryWarehouseId', 'name code location')
      .sort({ name: 1 });

    return ApiResponse.success(res, 'Stock items fetched', { items });
  } catch (err) {
    next(err);
  }
};

exports.createStockItem = async (req, res, next) => {
  try {
    const item = new StockItem(req.body);
    await item.save();

    if (item.availableQuantity > 0) {
      // Record opening stock
      await InventoryService.postMovement({
        movementType: STATUSES.INVENTORY_MOVEMENT.OPENING,
        itemId: item._id,
        warehouseId: item.primaryWarehouseId,
        quantity: item.availableQuantity,
        referenceEntityType: 'OPENING_STOCK',
        referenceEntityId: item._id,
        remarks: 'Opening inventory balance',
        userId: req.user._id
      });
    }

    return ApiResponse.created(res, 'Stock item created', { item });
  } catch (err) {
    next(err);
  }
};

exports.getLedgerMovements = async (req, res, next) => {
  try {
    const { itemId, movementType, warehouseId } = req.query;
    const filter = {};
    if (itemId) filter.itemId = itemId;
    if (movementType) filter.movementType = movementType;
    if (warehouseId) filter.warehouseId = warehouseId;

    const movements = await InventoryLedger.find(filter)
      .populate('itemId', 'sku name uom')
      .populate('warehouseId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);

    return ApiResponse.success(res, 'Inventory ledger movements', { movements });
  } catch (err) {
    next(err);
  }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { itemId, warehouseId, adjustmentQuantity, reason } = req.body;
    if (!itemId || adjustmentQuantity === undefined || !reason) {
      throw new AppError('Item, adjustment quantity and reason are required', 400);
    }

    const result = await InventoryService.postMovement({
      movementType: STATUSES.INVENTORY_MOVEMENT.ADJUSTMENT,
      itemId,
      warehouseId,
      quantity: Number(adjustmentQuantity),
      referenceEntityType: 'STOCK_ADJUSTMENT',
      referenceEntityId: `ADJ-${Date.now()}`,
      remarks: reason,
      userId: req.user._id
    });

    return ApiResponse.success(res, 'Stock adjusted successfully', result);
  } catch (err) {
    next(err);
  }
};

exports.transferStock = async (req, res, next) => {
  try {
    const { itemId, sourceWarehouseId, targetWarehouseId, quantity, remarks } = req.body;
    if (!itemId || !sourceWarehouseId || !targetWarehouseId || !quantity) {
      throw new AppError('Item, source, target and quantity are required', 400);
    }

    // Transfer out
    const transferRef = `TRF-${Date.now()}`;
    await InventoryService.postMovement({
      movementType: STATUSES.INVENTORY_MOVEMENT.TRANSFER_OUT,
      itemId,
      warehouseId: sourceWarehouseId,
      targetWarehouseId,
      quantity: -Math.abs(Number(quantity)),
      referenceEntityType: 'WAREHOUSE_TRANSFER',
      referenceEntityId: transferRef,
      remarks: `Transfer to target warehouse: ${remarks || ''}`,
      userId: req.user._id
    });

    // Transfer in
    await InventoryService.postMovement({
      movementType: STATUSES.INVENTORY_MOVEMENT.TRANSFER_IN,
      itemId,
      warehouseId: targetWarehouseId,
      targetWarehouseId: sourceWarehouseId,
      quantity: Math.abs(Number(quantity)),
      referenceEntityType: 'WAREHOUSE_TRANSFER',
      referenceEntityId: transferRef,
      remarks: `Transfer received from source warehouse: ${remarks || ''}`,
      userId: req.user._id
    });

    return ApiResponse.success(res, 'Warehouse transfer executed successfully', { transferRef });
  } catch (err) {
    next(err);
  }
};
