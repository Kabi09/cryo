const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const warrantySchema = new mongoose.Schema({
  warrantyNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  serialNumber: {
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  durationMonths: {
    type: Number,
    default: 12
  },
  coveredComponents: [{
    type: String
  }],
  excludedConditions: [{
    type: String
  }],
  status: {
    type: String,
    enum: Object.values(STATUSES.WARRANTY),
    default: STATUSES.WARRANTY.ACTIVE,
    index: true
  },
  voidReason: String,
  termsDetails: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Warranty', warrantySchema);
