const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const serviceTicketSchema = new mongoose.Schema({
  ticketNumber: {
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
  serialNumber: {
    type: String,
    required: true,
    index: true
  },
  complaintDescription: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true
  },
  warrantyStatus: {
    type: String,
    enum: ['COVERED', 'EXPIRED', 'VOIDED', 'UNVERIFIED'],
    default: 'UNVERIFIED'
  },
  isChargeable: {
    type: Boolean,
    default: false
  },
  serviceQuotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceQuotation'
  },
  assignedEngineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  serviceType: {
    type: String,
    enum: ['ON_SITE', 'FACTORY_RETURN'],
    default: 'ON_SITE'
  },
  diagnosis: {
    findings: String,
    rootCause: String,
    diagnosedAt: Date,
    sparesRequired: { type: Boolean, default: false }
  },
  sparesRequested: [{
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem'
    },
    sku: String,
    name: String,
    quantity: Number,
    issued: { type: Boolean, default: false }
  }],
  repairWorkNotes: String,
  testNotes: String,
  testPassed: Boolean,
  customerSignOff: {
    signedBy: String,
    signatureUrl: String,
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    signedAt: Date
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.SERVICE_TICKET),
    default: STATUSES.SERVICE_TICKET.OPEN,
    index: true
  },
  closedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceTicket', serviceTicketSchema);
