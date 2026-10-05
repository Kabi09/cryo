const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const inventoryLedgerSchema = new mongoose.Schema({
  movementNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  movementType: {
    type: String,
    enum: Object.values(STATUSES.INVENTORY_MOVEMENT),
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockItem',
    required: true,
    index: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true
  },
  targetWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  quantity: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  referenceEntityType: {
    type: String, // e.g. 'GRN', 'MATERIAL_REQUEST', 'PRODUCTION_ORDER', 'SERVICE_TICKET', 'ADJUSTMENT'
    required: true,
    index: true
  },
  referenceEntityId: {
    type: String,
    required: true,
    index: true
  },
  batchNumber: String,
  unitCost: Number,
  totalValue: Number,
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryLedger', inventoryLedgerSchema);
