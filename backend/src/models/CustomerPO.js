const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const customerPOSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  poDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
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
  proformaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProformaInvoice'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
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
    taxPercent: {
      type: Number,
      default: 18
    },
    total: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentTerms: {
    type: String,
    required: true
  },
  deliveryTerms: {
    type: String,
    required: true
  },
  warrantyTerms: {
    type: String,
    required: true
  },
  deliveryRequestedDate: Date,
  documentPath: String,
  status: {
    type: String,
    enum: Object.values(STATUSES.CUSTOMER_PO),
    default: STATUSES.CUSTOMER_PO.RECEIVED,
    index: true
  },
  holdReason: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerPO', customerPOSchema);
