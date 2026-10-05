const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SALES_ORDER_VIEW), salesOrderController.getSalesOrders);
router.get('/:id', authorize(PERMISSIONS.SALES_ORDER_VIEW), salesOrderController.getSalesOrderById);

// Actions: confirm, releaseProduction, cancel
router.post('/:id/actions/:action', salesOrderController.executeAction);

module.exports = router;
