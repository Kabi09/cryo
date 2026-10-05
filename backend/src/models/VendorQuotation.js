const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const vendorQuotationSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementRFQ',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  quotationRef: {
    type: String,
    required: true
  },
  quotationDate: {
    type: Date,
    default: Date.now
  },
  items: [{
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true
    },
    sku: String,
    name: String,
    quantity: Number,
    unitPrice: Number,
    taxPercent: Number,
    total: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryLeadDays: {
    type: Number,
    required: true
  },
  paymentTerms: String,
  warrantyMonths: Number,
  vendorRating: {
    type: Number,
    default: 4.5
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.VENDOR_QUOTATION),
    default: STATUSES.VENDOR_QUOTATION.SUBMITTED,
    index: true
  },
  remarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('VendorQuotation', vendorQuotationSchema);
