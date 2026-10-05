const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const bomItemSchema = new mongoose.Schema({
  stockItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockItem',
    required: true
  },
  sku: String,
  name: String,
  quantityPerUnit: {
    type: Number,
    required: true,
    min: 0.001
  },
  uom: String,
  scrapFactorPercent: {
    type: Number,
    default: 0
  },
  estimatedUnitCost: {
    type: Number,
    default: 0
  },
  totalEstimatedCost: {
    type: Number,
    default: 0
  }
});

const bomSchema = new mongoose.Schema({
  bomNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  items: [bomItemSchema],
  totalEstimatedCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.BOM),
    default: STATUSES.BOM.ACTIVE,
    index: true
  },
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BOM', bomSchema);
