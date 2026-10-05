const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const customerSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  contactPerson: {
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
  gstin: {
    type: String,
    trim: true
  },
  pan: {
    type: String,
    trim: true
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    zipCode: String
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    zipCode: String
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  creditDays: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.CUSTOMER),
    default: STATUSES.CUSTOMER.ACTIVE,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
