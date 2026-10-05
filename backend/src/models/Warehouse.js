const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['RAW_MATERIALS', 'SUB_ASSEMBLY', 'FINISHED_GOODS', 'QUARANTINE', 'SPARES_DEPOT'],
    default: 'RAW_MATERIALS'
  },
  location: {
    type: String,
    required: true
  },
  capacityUnits: {
    type: Number,
    default: 1000
  },
  managerName: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
