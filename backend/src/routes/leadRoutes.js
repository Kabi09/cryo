const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.LEAD_VIEW), leadController.getLeads);
router.post('/', authorize(PERMISSIONS.LEAD_CREATE), leadController.createLead);
router.get('/:id', authorize(PERMISSIONS.LEAD_VIEW), leadController.getLeadById);
router.put('/:id', authorize(PERMISSIONS.LEAD_EDIT), leadController.updateLead);

// Action endpoints
router.post('/:id/actions/qualify', authorize(PERMISSIONS.LEAD_QUALIFY), leadController.qualifyLead);
router.post('/:id/actions/lose', authorize(PERMISSIONS.LEAD_LOSE), leadController.loseLead);

module.exports = router;
