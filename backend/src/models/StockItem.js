const mongoose = require('mongoose');

const stockItemSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    enum: ['RAW_MATERIAL', 'COMPRESSOR', 'CRYOGENIC_VALVE', 'SENSOR', 'COPPER_TUBE', 'REFRIGERANT_GAS', 'CONTROLLER', 'PACKING_MATERIAL', 'SPARE_PART'],
    required: true
  },
  uom: {
    type: String, // Unit of Measure: NOS, KGS, MTRS, CYLINDERS, SETS
    required: true,
    default: 'NOS'
  },
  primaryWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  availableQuantity: {
    type: Number,
    default: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0
  },
  issuedQuantity: {
    type: Number,
    default: 0
  },
  wipQuantity: {
    type: Number,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  unitCost: {
    type: Number,
    required: true,
    default: 0
  },
  specifications: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StockItem', stockItemSchema);
