const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

// Installation
router.get('/installations', authorize(PERMISSIONS.INSTALLATION_VIEW), serviceController.getInstallations);
router.post('/installations', authorize(PERMISSIONS.INSTALLATION_UPDATE), serviceController.createInstallation);
router.post('/installations/:id/actions/complete', authorize(PERMISSIONS.INSTALLATION_UPDATE), serviceController.completeInstallation);

// Commissioning
router.get('/commissionings', authorize(PERMISSIONS.COMMISSIONING_VIEW), serviceController.getCommissionings);
router.post('/commissionings/:id/actions/execute-test', authorize(PERMISSIONS.COMMISSIONING_TEST), serviceController.executeCommissioningTest);

// Warranty
router.get('/warranties', authorize(PERMISSIONS.WARRANTY_VIEW), serviceController.getWarranties);

// Service Tickets
router.get('/tickets', authorize(PERMISSIONS.SERVICE_VIEW), serviceController.getServiceTickets);
router.post('/tickets', authorize(PERMISSIONS.SERVICE_CREATE), serviceController.createServiceTicket);
router.get('/tickets/:id', authorize(PERMISSIONS.SERVICE_VIEW), serviceController.getServiceTicketById);
router.post('/tickets/:id/actions/assign', authorize(PERMISSIONS.SERVICE_ASSIGN), serviceController.assignEngineer);
router.post('/tickets/:id/actions/diagnose', authorize(PERMISSIONS.SERVICE_DIAGNOSE), serviceController.recordDiagnosis);
router.post('/tickets/:id/actions/issue-spare', authorize(PERMISSIONS.SERVICE_REPAIR), serviceController.issueSpareParts);
router.post('/tickets/:id/actions/sign-off', authorize(PERMISSIONS.SERVICE_CLOSE), serviceController.signOffService);

// RMA
router.get('/rmas', authorize(PERMISSIONS.RMA_MANAGE), serviceController.getRMAs);
router.post('/rmas', authorize(PERMISSIONS.RMA_MANAGE), serviceController.createRMA);
router.post('/rmas/:id/actions/decide', authorize(PERMISSIONS.RMA_MANAGE), serviceController.decideRMA);

module.exports = router;
