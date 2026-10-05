const StockItem = require('../models/StockItem');
const InventoryLedger = require('../models/InventoryLedger');
const STATUSES = require('../constants/statuses');
const { AppError } = require('../utils/apiResponse');

class InventoryService {
  /**
   * Post inventory movement to ledger and update stock balances atomically
   */
  static async postMovement({
    movementType,
    itemId,
    warehouseId,
    targetWarehouseId = null,
    quantity,
    referenceEntityType,
    referenceEntityId,
    batchNumber = '',
    remarks = '',
    userId = null
  }) {
    const item = await StockItem.findById(itemId);
    if (!item) {
      throw new AppError(`Stock item not found: ${itemId}`, 404, 'ITEM_NOT_FOUND');
    }

    let balanceAfter = item.availableQuantity;

    switch (movementType) {
      case STATUSES.INVENTORY_MOVEMENT.OPENING:
      case STATUSES.INVENTORY_MOVEMENT.GRN_RECEIPT:
      case STATUSES.INVENTORY_MOVEMENT.RETURN:
      case STATUSES.INVENTORY_MOVEMENT.SERVICE_RETURN:
        item.availableQuantity += quantity;
        balanceAfter = item.availableQuantity;
        break;

      case STATUSES.INVENTORY_MOVEMENT.RESERVATION:
        if (item.availableQuantity < quantity) {
          throw new AppError(`Insufficient available stock to reserve. Available: ${item.availableQuantity}, Required: ${quantity}`, 400, 'INSUFFICIENT_STOCK');
        }
        item.availableQuantity -= quantity;
        item.reservedQuantity += quantity;
        balanceAfter = item.availableQuantity;
        break;

      case STATUSES.INVENTORY_MOVEMENT.ISSUE:
        // Issue from reserved stock or directly from available
        if (item.reservedQuantity >= quantity) {
          item.reservedQuantity -= quantity;
        } else {
          const shortageFromReserved = quantity - item.reservedQuantity;
          item.reservedQuantity = 0;
          if (item.availableQuantity < shortageFromReserved) {
            throw new AppError(`Insufficient stock to issue. Available: ${item.availableQuantity}, Required: ${shortageFromReserved}`, 400, 'INSUFFICIENT_STOCK');
          }
          item.availableQuantity -= shortageFromReserved;
        }
        item.issuedQuantity += quantity;
        balanceAfter = item.availableQuantity;
        break;

      case STATUSES.INVENTORY_MOVEMENT.CONSUMPTION:
        if (item.issuedQuantity < quantity) {
          item.issuedQuantity = 0;
        } else {
          item.issuedQuantity -= quantity;
        }
        balanceAfter = item.availableQuantity;
        break;

      case STATUSES.INVENTORY_MOVEMENT.SERVICE_ISSUE:
        if (item.availableQuantity < quantity) {
          throw new AppError(`Insufficient stock for spare service issue. Available: ${item.availableQuantity}, Requested: ${quantity}`, 400, 'INSUFFICIENT_STOCK');
        }
        item.availableQuantity -= quantity;
        balanceAfter = item.availableQuantity;
        break;

      case STATUSES.INVENTORY_MOVEMENT.ADJUSTMENT:
        // Quantity can be positive (found surplus) or negative (shrinkage/damaged)
        item.availableQuantity += quantity;
        if (item.availableQuantity < 0) {
          throw new AppError('Stock adjustment cannot result in negative quantity', 400, 'NEGATIVE_STOCK');
        }
        balanceAfter = item.availableQuantity;
        break;

      case STATUSES.INVENTORY_MOVEMENT.TRANSFER_OUT:
      case STATUSES.INVENTORY_MOVEMENT.TRANSFER_IN:
        balanceAfter = item.availableQuantity;
        break;

      default:
        throw new AppError(`Unknown inventory movement type: ${movementType}`, 400, 'INVALID_MOVEMENT_TYPE');
    }

    await item.save();

    const movementNumber = `MOV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ledgerEntry = new InventoryLedger({
      movementNumber,
      movementType,
      itemId,
      warehouseId,
      targetWarehouseId,
      quantity,
      balanceAfter,
      referenceEntityType,
      referenceEntityId: String(referenceEntityId),
      batchNumber,
      unitCost: item.unitCost,
      totalValue: Math.abs(quantity * item.unitCost),
      remarks,
      createdBy: userId
    });

    await ledgerEntry.save();
    return { ledgerEntry, item };
  }
}

module.exports = InventoryService;
