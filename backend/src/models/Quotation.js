const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const quotationItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: String,
  name: String,
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  taxPercent: {
    type: Number,
    default: 18
  },
  total: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  currentRevisionNumber: {
    type: Number,
    default: 0
  },
  items: [quotationItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    default: 0
  },
  paymentTerms: {
    type: String,
    default: '30% Advance, 70% against Proforma Invoice prior to dispatch'
  },
  deliveryTerms: {
    type: String,
    default: 'Ex-Works Chennai factory, freight & transit insurance extra'
  },
  warrantyTerms: {
    type: String,
    default: '12 Months comprehensive warranty from the date of Commissioning PASS'
  },
  validityDays: {
    type: Number,
    default: 30
  },
  validUntil: {
    type: Date
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.QUOTATION),
    default: STATUSES.QUOTATION.DRAFT,
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
  negotiationHistory: [{
    requestedDiscount: Number,
    clientNotes: String,
    internalNotes: String,
    date: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quotation', quotationSchema);
