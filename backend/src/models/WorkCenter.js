const mongoose = require('mongoose');

const workCenterSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  stage: {
    type: String,
    enum: ['FABRICATION', 'REFRIGERATION', 'ELECTRICAL', 'ASSEMBLY', 'QA_TESTING'],
    required: true
  },
  capacityPerDay: {
    type: Number,
    default: 5
  },
  hourlyRate: {
    type: Number,
    default: 1200
  },
  supervisorName: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkCenter', workCenterSchema);
