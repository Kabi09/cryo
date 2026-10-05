const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
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
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    index: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinalInvoice'
  },
  expectedAmount: {
    type: Number,
    required: true
  },
  receivedAmount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['ADVANCE', 'STAGE', 'BALANCE', 'SERVICE'],
    default: 'ADVANCE'
  },
  method: {
    type: String,
    enum: ['NEFT', 'RTGS', 'CHEQUE', 'CREDIT_CARD', 'UPI', 'WIRE_TRANSFER'],
    default: 'NEFT'
  },
  bankName: String,
  transactionReference: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  proofDocumentPath: String,
  status: {
    type: String,
    enum: Object.values(STATUSES.PAYMENT),
    default: STATUSES.PAYMENT.PENDING,
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  reversalReason: String,
  refundReason: String,
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
