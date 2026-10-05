const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const productionOrderSchema = new mongoose.Schema({
  productionOrderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  bomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BOM'
  },
  plannedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  producedQuantity: {
    type: Number,
    default: 0
  },
  rejectedQuantity: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetCompletionDate: {
    type: Date,
    required: true
  },
  actualCompletionDate: Date,
  status: {
    type: String,
    enum: Object.values(STATUSES.PRODUCTION_ORDER),
    default: STATUSES.PRODUCTION_ORDER.DRAFT,
    index: true
  },
  releasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  releasedAt: Date,
  holdReason: String,
  cancellationReason: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductionOrder', productionOrderSchema);
