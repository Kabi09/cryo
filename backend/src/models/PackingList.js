const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const packingListSchema = new mongoose.Schema({
  packingNumber: {
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
  serialNumbers: [{
    type: String,
    required: true
  }],
  packageDimensions: {
    lengthMm: Number,
    widthMm: Number,
    heightMm: Number
  },
  grossWeightKg: {
    type: Number,
    required: true
  },
  netWeightKg: {
    type: Number,
    required: true
  },
  boxCount: {
    type: Number,
    default: 1
  },
  checklist: {
    desiccantPlaced: { type: Boolean, default: true },
    valvesSecured: { type: Boolean, default: true },
    shockWatchAffixed: { type: Boolean, default: true },
    manualEnclosed: { type: Boolean, default: true },
    vacuumPortCapped: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.PACKING_LIST),
    default: STATUSES.PACKING_LIST.PENDING,
    index: true
  },
  inspectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  inspectedAt: Date,
  remarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('PackingList', packingListSchema);
