const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

// RFQ
router.get('/rfqs', authorize(PERMISSIONS.PROCUREMENT_VIEW), procurementController.getRFQs);
router.post('/rfqs', authorize(PERMISSIONS.PROCUREMENT_RFQ), procurementController.createRFQ);
router.get('/rfqs/:rfqId/quotes', authorize(PERMISSIONS.PROCUREMENT_VIEW), procurementController.getVendorQuotesForRFQ);
router.post('/rfqs/quotes', authorize(PERMISSIONS.PROCUREMENT_RFQ), procurementController.submitVendorQuote);
router.post('/rfqs/:id/actions/select-winner', authorize(PERMISSIONS.PROCUREMENT_COMPARE), procurementController.selectWinningQuote);

// Vendor PO
router.get('/vendor-pos', authorize(PERMISSIONS.PROCUREMENT_VIEW), procurementController.getVendorPOs);

// GRN
router.get('/grns', authorize(PERMISSIONS.INVENTORY_VIEW), procurementController.getGRNs);
router.post('/grns', authorize(PERMISSIONS.GRN_CREATE), procurementController.createGRN);
router.post('/grns/:id/actions/inspect', authorize(PERMISSIONS.GRN_INSPECT), procurementController.inspectGRN);

module.exports = router;
