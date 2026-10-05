const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const serialEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true
  },
  stage: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceEntityType: String,
  referenceEntityId: String,
  metadata: mongoose.Schema.Types.Mixed,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const serialNumberSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productionOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    required: true,
    index: true
  },
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  qaTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QATest'
  },
  packingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackingList'
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinalInvoice'
  },
  dispatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispatch'
  },
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  installationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installation'
  },
  commissioningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commissioning'
  },
  warrantyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warranty'
  },
  serviceTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceTicket'
  }],
  currentStatus: {
    type: String,
    enum: Object.values(STATUSES.SERIAL_NUMBER),
    default: STATUSES.SERIAL_NUMBER.CREATED,
    index: true
  },
  history: [serialEventSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SerialNumber', serialNumberSchema);
