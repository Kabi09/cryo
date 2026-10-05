const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const installationSchema = new mongoose.Schema({
  installationNumber: {
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
  siteAddress: {
    street: String,
    city: String,
    state: String,
    contactPerson: String,
    phone: String
  },
  assignedEngineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  siteReadinessCheck: {
    threePhasePowerReady: { type: Boolean, default: true },
    dedicatedEarthingOk: { type: Boolean, default: true },
    unloadingClearanceOk: { type: Boolean, default: true },
    ambientVentilationOk: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.INSTALLATION),
    default: STATUSES.INSTALLATION.SCHEDULED,
    index: true
  },
  installationNotes: String,
  completionDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Installation', installationSchema);
