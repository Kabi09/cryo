const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const qaParameterSchema = new mongoose.Schema({
  parameterName: {
    type: String,
    required: true
  },
  specificationRequired: {
    type: String,
    default: 'Standard tolerance'
  },
  actualValue: {
    type: String,
    default: 'Within tolerance'
  },
  result: {
    type: String,
    enum: ['PASS', 'FAIL'],
    default: 'PASS'
  },
  remarks: String
});

const qaTestSchema = new mongoose.Schema({
  testNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  productionOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  serialNumber: {
    type: String,
    required: true,
    index: true
  },
  testType: {
    type: String,
    default: 'CRYOGENIC_PERFORMANCE_AND_SAFETY'
  },
  parameters: [qaParameterSchema],
  overallResult: {
    type: String,
    enum: Object.values(STATUSES.QA_TEST),
    default: STATUSES.QA_TEST.PENDING,
    index: true
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  rectificationNotes: String,
  reworkInstructions: String,
  certificateUrl: String,
  certificateNumber: String,
  testerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  testedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('QATest', qaTestSchema);
