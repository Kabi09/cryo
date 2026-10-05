const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const materialRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  productionOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    required: true,
    index: true
  },
  items: [{
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    sku: String,
    name: String,
    requiredQty: {
      type: Number,
      required: true
    },
    issuedQty: {
      type: Number,
      default: 0
    },
    shortageQty: {
      type: Number,
      default: 0
    },
    uom: String,
    stockStatus: {
      type: String,
      enum: ['FULL_STOCK', 'PARTIAL_STOCK', 'NO_STOCK'],
      default: 'FULL_STOCK'
    }
  }],
  status: {
    type: String,
    enum: Object.values(STATUSES.MATERIAL_REQUEST),
    default: STATUSES.MATERIAL_REQUEST.DRAFT,
    index: true
  },
  requiredDate: {
    type: Date,
    required: true
  },
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
