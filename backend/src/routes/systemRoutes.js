const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

// Audit
router.get('/audit-logs', authorize(PERMISSIONS.AUDIT_VIEW), systemController.getAuditLogs);

// Notifications
router.get('/notifications', systemController.getNotifications);
router.put('/notifications/:id/read', systemController.markNotificationRead);
router.put('/notifications/read-all', systemController.markAllNotificationsRead);

// Documents
router.post('/documents/upload', authorize(PERMISSIONS.DOCUMENTS_UPLOAD), upload.single('file'), systemController.uploadDocument);
router.get('/documents', authorize(PERMISSIONS.DOCUMENTS_VIEW), systemController.getDocumentsForEntity);
router.get('/documents/:id/download', authorize(PERMISSIONS.DOCUMENTS_VIEW), systemController.downloadDocument);

// Dashboard
router.get('/dashboard/stats', authorize(PERMISSIONS.DASHBOARD_VIEW), systemController.getDashboardStats);

module.exports = router;
