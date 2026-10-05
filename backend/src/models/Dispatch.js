const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const dispatchSchema = new mongoose.Schema({
  dispatchNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true,
    index: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinalInvoice',
    required: true,
    index: true
  },
  packingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackingList'
  },
  transporterName: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  driverName: String,
  driverPhone: String,
  lrNumber: {
    type: String,
    required: true
  },
  eWayBillNumber: {
    type: String,
    required: true
  },
  gatePassNumber: {
    type: String,
    required: true
  },
  dispatchDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.DISPATCH),
    default: STATUSES.DISPATCH.DRAFT,
    index: true
  },
  dispatchedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dispatch', dispatchSchema);
