const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const poVerificationSchema = new mongoose.Schema({
  verificationNumber: {
    type: String,
    required: true,
    unique: true,
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
    ref: 'Quotation',
    required: true
  },
  revisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuotationRevision'
  },
  proformaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProformaInvoice'
  },
  itemComparisons: [{
    sku: String,
    name: String,
    quotationQty: Number,
    poQty: Number,
    quotationUnitPrice: Number,
    poUnitPrice: Number,
    quotationTotal: Number,
    poTotal: Number,
    status: {
      type: String,
      enum: ['MATCH', 'MISMATCH', 'NOT_PROVIDED'],
      default: 'MATCH'
    },
    diffNotes: String
  }],
  commercialComparisons: [{
    parameter: String, // 'SUBTOTAL', 'TAX', 'GRAND_TOTAL'
    quotationValue: Number,
    poValue: Number,
    status: {
      type: String,
      enum: ['MATCH', 'MISMATCH', 'NOT_PROVIDED'],
      default: 'MATCH'
    },
    diffNotes: String
  }],
  termComparisons: [{
    termType: String, // 'PAYMENT_TERMS', 'DELIVERY_TERMS', 'WARRANTY_TERMS'
    quotationTerm: String,
    poTerm: String,
    status: {
      type: String,
      enum: ['MATCH', 'MISMATCH', 'NOT_PROVIDED'],
      default: 'MATCH'
    },
    diffNotes: String
  }],
  overallStatus: {
    type: String,
    enum: Object.values(STATUSES.PO_VERIFICATION),
    default: STATUSES.PO_VERIFICATION.PENDING,
    index: true
  },
  mismatchSummary: [String],
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  managerOverrideReason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('POVerification', poVerificationSchema);
