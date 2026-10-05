const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const quotationRevisionSchema = new mongoose.Schema({
  revisionCode: {
    type: String, // e.g. QT-2026-0001-R1
    required: true,
    unique: true,
    index: true
  },
  revisionNumber: {
    type: Number,
    required: true
  },
  parentQuotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    required: true,
    index: true
  },
  previousRevisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuotationRevision'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    sku: String,
    name: String,
    description: String,
    quantity: Number,
    unitPrice: Number,
    discountPercent: Number,
    taxPercent: Number,
    total: Number
  }],
  oldTotal: {
    type: Number,
    default: 0
  },
  newTotal: {
    type: Number,
    required: true
  },
  subtotal: Number,
  discountAmount: Number,
  taxAmount: Number,
  grandTotal: Number,
  paymentTerms: String,
  deliveryTerms: String,
  warrantyTerms: String,
  changeReason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.QUOTATION_REVISION),
    default: STATUSES.QUOTATION_REVISION.DRAFT,
    index: true
  },
  approvalRemarks: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  sentAt: Date,
  acceptedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuotationRevision', quotationRevisionSchema);
