const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const proformaInvoiceSchema = new mongoose.Schema({
  piNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    required: true,
    index: true
  },
  revisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuotationRevision'
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
    quantity: Number,
    unitPrice: Number,
    taxPercent: Number,
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
  requiredAdvancePercentage: {
    type: Number,
    default: 30
  },
  advanceAmountDue: {
    type: Number,
    required: true
  },
  paymentTerms: String,
  deliveryTerms: String,
  bankDetails: {
    accountName: { type: String, default: 'CryoTech Industrial Systems Pvt Ltd' },
    bankName: { type: String, default: 'HDFC Bank Ltd' },
    accountNumber: { type: String, default: '50200088991122' },
    ifscCode: { type: String, default: 'HDFC0001234' },
    branch: { type: String, default: 'Ambattur Industrial Estate, Chennai' }
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.PROFORMA_INVOICE),
    default: STATUSES.PROFORMA_INVOICE.ISSUED,
    index: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProformaInvoice', proformaInvoiceSchema);
