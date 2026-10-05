const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const vendorPOSchema = new mongoose.Schema({
  vpoNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementRFQ'
  },
  items: [{
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    sku: String,
    name: String,
    quantity: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    taxPercent: Number,
    total: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  grandTotal: {
    type: Number,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  paymentTerms: {
    type: String,
    default: '30 Days Net'
  },
  shippingAddress: String,
  status: {
    type: String,
    enum: Object.values(STATUSES.VENDOR_PO),
    default: STATUSES.VENDOR_PO.DRAFT,
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VendorPO', vendorPOSchema);
