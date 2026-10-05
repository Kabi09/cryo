const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const grnItemSchema = new mongoose.Schema({
  stockItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockItem',
    required: true
  },
  sku: String,
  name: String,
  orderedQty: {
    type: Number,
    required: true
  },
  receivedQty: {
    type: Number,
    required: true
  },
  acceptedQty: {
    type: Number,
    default: 0
  },
  rejectedQty: {
    type: Number,
    default: 0
  },
  rejectionReason: String,
  batchNumber: String
});

const grnSchema = new mongoose.Schema({
  grnNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  vpoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorPO',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  vendorInvoiceNumber: {
    type: String,
    required: true
  },
  vendorInvoiceDate: {
    type: Date,
    required: true
  },
  receivedDate: {
    type: Date,
    default: Date.now
  },
  items: [grnItemSchema],
  status: {
    type: String,
    enum: Object.values(STATUSES.GRN),
    default: STATUSES.GRN.PENDING_INSPECTION,
    index: true
  },
  inspectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  inspectedAt: Date,
  inspectionNotes: String,
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GRN', grnSchema);
