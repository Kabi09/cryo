const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.QUOTATION_VIEW), quotationController.getQuotations);
router.post('/', authorize(PERMISSIONS.QUOTATION_CREATE), quotationController.createQuotation);
router.get('/:id', authorize(PERMISSIONS.QUOTATION_VIEW), quotationController.getQuotationById);
router.get('/:id/revisions', authorize(PERMISSIONS.QUOTATION_VIEW), quotationController.getRevisions);

// Non-destructive revision creation
router.post('/:id/actions/revise', authorize(PERMISSIONS.QUOTATION_REVISION_CREATE), quotationController.createRevision);

// Action transitions: submit, approve, reject, send, negotiate, accept, cancel
router.post('/:id/actions/:action', quotationController.executeAction);

module.exports = router;
