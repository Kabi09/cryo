const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const leadSchema = new mongoose.Schema({
  leadNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  source: {
    type: String,
    enum: ['EXHIBITION', 'WEBSITE', 'COLD_CALL', 'REFERRAL', 'GOVERNMENT_TENDER', 'DIRECT'],
    default: 'WEBSITE'
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  requirementDetails: {
    type: String,
    required: true
  },
  estimatedBudget: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.LEAD),
    default: STATUSES.LEAD.NEW,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lostReason: {
    type: String
  },
  qualifiedCustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  qualifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
