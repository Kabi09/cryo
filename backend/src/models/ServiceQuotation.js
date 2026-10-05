const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const serviceQuotationSchema = new mongoose.Schema({
  serviceQuoteNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  serviceTicketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceTicket',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    description: String,
    itemType: {
      type: String,
      enum: ['SPARE_PART', 'LABOR_CHARGES', 'TRAVEL_CHARGES'],
      default: 'SPARE_PART'
    },
    quantity: {
      type: Number,
      default: 1
    },
    unitRate: {
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
  subtotal: Number,
  taxAmount: Number,
  grandTotal: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.SERVICE_QUOTATION),
    default: STATUSES.SERVICE_QUOTATION.DRAFT,
    index: true
  },
  customerApprovalNotes: String,
  approvedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceQuotation', serviceQuotationSchema);
