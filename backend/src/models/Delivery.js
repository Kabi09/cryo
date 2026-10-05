const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const deliverySchema = new mongoose.Schema({
  deliveryNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  dispatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispatch',
    required: true,
    index: true
  },
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
  },
  currentStatus: {
    type: String,
    enum: Object.values(STATUSES.DELIVERY),
    default: STATUSES.DELIVERY.IN_TRANSIT,
    index: true
  },
  trackingHistory: [{
    status: String,
    location: String,
    notes: String,
    timestamp: { type: Date, default: Date.now }
  }],
  podDocumentPath: String,
  receiverName: String,
  receiverDesignation: String,
  receiverPhone: String,
  signatureUrl: String,
  deliveredAt: Date,
  failureReason: String,
  rescheduledDate: Date,
  returnReason: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
