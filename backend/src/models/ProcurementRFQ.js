const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const rfqSchema = new mongoose.Schema({
  rfqNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  materialRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialRequest',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  items: [{
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    sku: String,
    name: String,
    requestedQuantity: {
      type: Number,
      required: true
    },
    uom: String,
    requiredByDate: Date
  }],
  vendorIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  deadlineDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.PROCUREMENT_RFQ),
    default: STATUSES.PROCUREMENT_RFQ.DRAFT,
    index: true
  },
  selectedVendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  selectionJustification: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProcurementRFQ', rfqSchema);
