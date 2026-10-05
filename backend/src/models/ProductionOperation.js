const mongoose = require('mongoose');
const STATUSES = require('../constants/statuses');

const productionOperationSchema = new mongoose.Schema({
  operationNumber: {
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
  operationType: {
    type: String,
    enum: ['FABRICATION', 'REFRIGERATION', 'ELECTRICAL', 'ASSEMBLY'],
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  workCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCenter',
    required: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: Date,
  endTime: Date,
  actualDurationHours: {
    type: Number,
    default: 0
  },
  yieldQuantity: {
    type: Number,
    default: 0
  },
  rejectedQuantity: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(STATUSES.PRODUCTION_OPERATION),
    default: STATUSES.PRODUCTION_OPERATION.PENDING,
    index: true
  },
  remarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductionOperation', productionOperationSchema);
