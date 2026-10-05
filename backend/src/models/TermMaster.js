const mongoose = require('mongoose');

const termMasterSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['TAX', 'PAYMENT', 'DELIVERY', 'WARRANTY'],
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  percentage: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TermMaster', termMasterSchema);
