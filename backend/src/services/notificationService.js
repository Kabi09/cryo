const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  static async notify({
    title,
    message,
    recipientUserId = null,
    targetRole = null,
    entityType,
    entityId
  }) {
    try {
      if (recipientUserId) {
        const notif = new Notification({
          title,
          message,
          recipientUserId,
          targetRole,
          entityType,
          entityId: String(entityId)
        });
        await notif.save();
        return [notif];
      }

      if (targetRole) {
        const users = await User.find({ role: targetRole, isActive: true }).select('_id');
        const notifications = users.map(user => ({
          title,
          message,
          recipientUserId: user._id,
          targetRole,
          entityType,
          entityId: String(entityId)
        }));
        if (notifications.length > 0) {
          return await Notification.insertMany(notifications);
        }
      }

      return [];
    } catch (err) {
      console.error('[NotificationService Error]', err.message);
      return [];
    }
  }
}

module.exports = NotificationService;
