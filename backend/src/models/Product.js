const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  modelNumber: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['CRYOGENIC_FREEZER', 'ULT_FREEZER', 'LN2_STORAGE', 'CASCADE_CHILLER', 'VAPOR_SHIPPER', 'SPARE_PART'],
    default: 'CRYOGENIC_FREEZER'
  },
  tempRating: {
    type: String, // e.g. -150°C to -196°C
    default: '-150°C'
  },
  capacity: {
    type: String, // e.g. 500 Liters
    default: '500L'
  },
  refrigerantType: {
    type: String, // e.g. R508B / R404A / LN2
    default: 'R508B / R404A Dual Cascade'
  },
  electricalSpec: {
    type: String, // e.g. 415V 3-Phase 50Hz 3.5kW
    default: '415V 3-Phase 50Hz'
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  warrantyMonths: {
    type: Number,
    default: 12
  },
  dimensions: {
    type: String // e.g. 1200 x 900 x 1980 mm
  },
  weightKg: {
    type: Number,
    default: 320
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
