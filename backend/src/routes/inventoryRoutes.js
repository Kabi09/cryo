const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/stock', authorize(PERMISSIONS.INVENTORY_VIEW), inventoryController.getStockItems);
router.post('/stock', authorize(PERMISSIONS.INVENTORY_ADJUST), inventoryController.createStockItem);
router.get('/ledger', authorize(PERMISSIONS.INVENTORY_VIEW), inventoryController.getLedgerMovements);
router.post('/adjust', authorize(PERMISSIONS.INVENTORY_ADJUST), inventoryController.adjustStock);
router.post('/transfer', authorize(PERMISSIONS.INVENTORY_TRANSFER), inventoryController.transferStock);

module.exports = router;
