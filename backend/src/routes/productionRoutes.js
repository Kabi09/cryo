const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

// Production Orders
router.get('/orders', authorize(PERMISSIONS.PRODUCTION_VIEW), productionController.getProductionOrders);
router.post('/orders', authorize(PERMISSIONS.PRODUCTION_CREATE), productionController.createProductionOrder);
router.get('/orders/:id', authorize(PERMISSIONS.PRODUCTION_VIEW), productionController.getProductionOrderById);
router.post('/orders/:id/actions/:action', productionController.executeAction);

// Workstation Operations
router.post('/operations/:operationId/actions/start', authorize(PERMISSIONS.PRODUCTION_START), productionController.startOperation);
router.post('/operations/:operationId/actions/complete', authorize(PERMISSIONS.PRODUCTION_COMPLETE), productionController.completeOperation);

// BOM
router.get('/boms', authorize(PERMISSIONS.BOM_VIEW), productionController.getBOMs);
router.post('/boms', authorize(PERMISSIONS.BOM_CREATE), productionController.createBOM);

// Material Requests
router.get('/material-requests', authorize(PERMISSIONS.PRODUCTION_VIEW), productionController.getMaterialRequests);
router.post('/material-requests/:id/actions/issue', authorize(PERMISSIONS.INVENTORY_ISSUE), productionController.issueMaterialRequest);

module.exports = router;
