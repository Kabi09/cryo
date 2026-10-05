const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const finalInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    sku: String,
    name: String,
    serialNumbers: [String],
    quantity: Number,
    unitPrice: Number,
    taxPercent: Number,
    cgstAmount: Number,
    sgstAmount: Number,
    igstAmount: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  grandTotal: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0
  },
  paymentDueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.FINAL_INVOICE),
    default: STATUSES.FINAL_INVOICE.DRAFT,
    index: true
  },
  postedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FinalInvoice', finalInvoiceSchema);
