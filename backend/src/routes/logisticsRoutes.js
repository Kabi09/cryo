const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

// Packing
router.get('/packing', authorize(PERMISSIONS.PACKING_VIEW), logisticsController.getPackingLists);
router.post('/packing', authorize(PERMISSIONS.PACKING_CREATE), logisticsController.createPackingList);

// Final Invoicing
router.get('/invoices', authorize(PERMISSIONS.INVOICE_VIEW), logisticsController.getInvoices);
router.post('/invoices', authorize(PERMISSIONS.INVOICE_CREATE), logisticsController.createInvoice);

// Dispatch
router.get('/dispatches', authorize(PERMISSIONS.DISPATCH_VIEW), logisticsController.getDispatches);
router.post('/dispatches', authorize(PERMISSIONS.DISPATCH_CREATE), logisticsController.createDispatch);

// Delivery & POD
router.get('/deliveries', authorize(PERMISSIONS.DELIVERY_VIEW), logisticsController.getDeliveries);
router.post('/deliveries/:id/actions/complete', authorize(PERMISSIONS.DELIVERY_COMPLETE), upload.single('podDocument'), logisticsController.completeDelivery);
router.post('/deliveries/:id/actions/fail', authorize(PERMISSIONS.DELIVERY_FAIL), logisticsController.failDelivery);

module.exports = router;
