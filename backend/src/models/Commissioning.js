const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const commissioningSchema = new mongoose.Schema({
  commissioningNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  installationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installation',
    required: true,
    index: true
  },
  serialNumber: {
    type: String,
    required: true,
    index: true
  },
  checklist: {
    inputVoltageV: { type: Number, default: 415 },
    ambientTempDegC: { type: Number, default: 24 },
    pullDownTargetDegC: { type: Number, default: -150 },
    achievedTempDegC: { type: Number, default: -152 },
    pullDownTimeHours: { type: Number, default: 4.5 },
    vacuumLevelTorr: { type: Number, default: 0.0001 },
    safetyReliefPressureBar: { type: Number, default: 22 },
    alarmSystemTest: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' },
    tempUniformityTest: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' },
    compressorCurrentAmps: { type: Number, default: 12.5 }
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.COMMISSIONING),
    default: STATUSES.COMMISSIONING.PENDING,
    index: true
  },
  commissionedAt: Date,
  failureNotes: String,
  rectificationPlan: String,
  engineerSignature: String,
  clientSignOffName: String,
  clientSignature: String,
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Commissioning', commissioningSchema);
