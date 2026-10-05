const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const salesOrderSchema = new mongoose.Schema({
  salesOrderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  customerPoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerPO',
    required: true,
    index: true
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  proformaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProformaInvoice'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
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
  advanceRequiredPercent: {
    type: Number,
    default: 30
  },
  advanceRequiredAmount: {
    type: Number,
    default: 0
  },
  advanceReceivedAmount: {
    type: Number,
    default: 0
  },
  balanceDueAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.SALES_ORDER),
    default: STATUSES.SALES_ORDER.DRAFT,
    index: true
  },
  deliveryCommittedDate: Date,
  confirmedAt: Date,
  productionReleasedAt: Date,
  productionReleasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  cancellationReason: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
