const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const rmaSchema = new mongoose.Schema({
  rmaNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  serialNumber: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  reasonForReturn: {
    type: String,
    required: true
  },
  plantReceivedDate: Date,
  inspectionFindings: String,
  decision: {
    type: String,
    enum: ['REPAIR', 'REPLACEMENT', 'CREDIT_NOTE', 'REFUND'],
    default: 'REPAIR'
  },
  replacementSerialNumber: String,
  creditNoteAmount: Number,
  status: {
    type: String,
    enum: Object.values(STATUSES.RMA),
    default: STATUSES.RMA.REQUESTED,
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('RMA', rmaSchema);
