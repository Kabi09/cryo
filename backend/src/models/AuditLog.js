const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  auditId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  entityType: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  actorName: {
    type: String
  },
  actorRole: {
    type: String
  },
  previousStatus: {
    type: String
  },
  newStatus: {
    type: String
  },
  changedFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  reason: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
