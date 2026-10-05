const express = require('express');
const router = express.Router();
const customerPoController = require('../controllers/customerPoController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.CUSTOMER_PO_VIEW), customerPoController.getCustomerPOs);
router.post('/', authorize(PERMISSIONS.CUSTOMER_PO_CREATE), upload.single('poDocument'), customerPoController.createCustomerPO);
router.get('/:id', authorize(PERMISSIONS.CUSTOMER_PO_VIEW), customerPoController.getCustomerPOById);

// 4-Way Verification and Sales Order creation
router.post('/:id/actions/verify', authorize(PERMISSIONS.CUSTOMER_PO_VERIFY), customerPoController.runPOVerification);
router.post('/:id/actions/confirm-so', authorize(PERMISSIONS.SALES_ORDER_CREATE), customerPoController.confirmSalesOrderFromPO);

module.exports = router;
