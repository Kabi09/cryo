const AuditLog = require('../models/AuditLog');

class AuditService {
  static async log({
    entityType,
    entityId,
    action,
    actorUserId,
    actorName,
    actorRole,
    previousStatus,
    newStatus,
    changedFields = {},
    reason = '',
    ipAddress = ''
  }) {
    try {
      const auditId = `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const logEntry = new AuditLog({
        auditId,
        entityType,
        entityId: String(entityId),
        action,
        actorUserId,
        actorName,
        actorRole,
        previousStatus,
        newStatus,
        changedFields,
        reason,
        ipAddress
      });
      await logEntry.save();
      return logEntry;
    } catch (err) {
      console.error('[AuditService Error]', err.message);
      // Audit log failures should not crash user operations, but be logged
      return null;
    }
  }
}

module.exports = AuditService;
