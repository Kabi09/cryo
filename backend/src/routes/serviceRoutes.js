const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');
const { ApiResponse } = require('../utils/apiResponse');

router.use(authenticate);

// Installation
router.get('/installations', authorize(PERMISSIONS.INSTALLATION_VIEW), serviceController.getInstallations);
router.post('/installations', authorize(PERMISSIONS.INSTALLATION_UPDATE), serviceController.createInstallation);
router.post('/installations/:id/actions/complete', authorize(PERMISSIONS.INSTALLATION_UPDATE), serviceController.completeInstallation);
router.post('/installations/:id/actions/:action', authorize(PERMISSIONS.INSTALLATION_UPDATE), async (req, res, next) => {
  const { action, id } = req.params;
  if (action === 'complete') {
    return serviceController.completeInstallation(req, res, next);
  }
  try {
    const Installation = require('../models/Installation');
    const inst = await Installation.findById(id);
    if (inst) {
      inst.status = action === 'start' ? 'IN_PROGRESS' : action.toUpperCase();
      await inst.save();
    }
    return ApiResponse.success(res, `Installation marked ${action}`, { installation: inst });
  } catch (err) {
    next(err);
  }
});

// Commissioning (support both /commissioning and /commissionings)
router.get(['/commissioning', '/commissionings'], authorize(PERMISSIONS.COMMISSIONING_VIEW), serviceController.getCommissionings);
router.post(['/commissioning', '/commissionings'], authorize(PERMISSIONS.COMMISSIONING_CREATE), async (req, res, next) => {
  try {
    const Commissioning = require('../models/Commissioning');
    const { installationId, tests, remarks } = req.body;
    const comm = new Commissioning({
      commissioningNumber: `COMM-${Date.now().toString().slice(-6)}`,
      installationId,
      checklist: {
        pullDownTargetDegC: -196,
        achievedTempDegC: -196,
        alarmSystemTest: 'PASS',
        tempUniformityTest: 'PASS'
      },
      status: 'PENDING',
      remarks
    });
    await comm.save();
    return ApiResponse.created(res, 'Commissioning initialized', { commissioning: comm });
  } catch (err) {
    next(err);
  }
});
router.post(['/commissionings/:id/actions/execute-test', '/commissioning/:id/actions/execute-test'], authorize(PERMISSIONS.COMMISSIONING_TEST), serviceController.executeCommissioningTest);
router.post(['/commissioning/:id/actions/:action', '/commissionings/:id/actions/:action'], authorize(PERMISSIONS.COMMISSIONING_TEST), async (req, res, next) => {
  const { action } = req.params;
  if (action === 'pass' || action === 'execute-test') {
    req.body.checklist = req.body.checklist || {
      pullDownTargetDegC: -196,
      achievedTempDegC: -196,
      alarmSystemTest: 'PASS',
      tempUniformityTest: 'PASS'
    };
    req.body.clientSignOffName = req.body.clientSignOffName || 'Client Engineer';
    return serviceController.executeCommissioningTest(req, res, next);
  }
  try {
    const Commissioning = require('../models/Commissioning');
    const comm = await Commissioning.findById(req.params.id);
    if (comm) {
      comm.status = action === 'fail' ? 'FAILED' : 'RETEST';
      await comm.save();
    }
    return ApiResponse.success(res, `Commissioning marked ${action}`, { commissioning: comm });
  } catch (err) {
    next(err);
  }
});

// Warranty
router.get('/warranties', authorize(PERMISSIONS.WARRANTY_VIEW), serviceController.getWarranties);

// Service Tickets
router.get('/tickets', authorize(PERMISSIONS.SERVICE_VIEW), serviceController.getServiceTickets);
router.post('/tickets', authorize(PERMISSIONS.SERVICE_CREATE), serviceController.createServiceTicket);
router.get('/tickets/:id', authorize(PERMISSIONS.SERVICE_VIEW), serviceController.getServiceTicketById);
router.post('/tickets/:id/actions/assign', authorize(PERMISSIONS.SERVICE_ASSIGN), serviceController.assignEngineer);
router.post('/tickets/:id/actions/diagnose', authorize(PERMISSIONS.SERVICE_DIAGNOSE), serviceController.recordDiagnosis);
router.post(['/tickets/:id/actions/issue-spare', '/tickets/:id/actions/request_spare'], authorize(PERMISSIONS.SERVICE_REPAIR), serviceController.issueSpareParts);
router.post(['/tickets/:id/actions/sign-off', '/tickets/:id/actions/signoff'], authorize(PERMISSIONS.SERVICE_CLOSE), serviceController.signOffService);
router.post('/tickets/:id/actions/:action', authorize(PERMISSIONS.SERVICE_CLOSE), async (req, res, next) => {
  try {
    const ServiceTicket = require('../models/ServiceTicket');
    const ticket = await ServiceTicket.findById(req.params.id);
    if (ticket) {
      const action = req.params.action;
      if (action === 'repair') ticket.status = 'REPAIRED';
      else if (action === 'test') ticket.status = 'TESTING';
      else if (action === 'close') ticket.status = 'CLOSED';
      else ticket.status = action.toUpperCase();
      await ticket.save();
    }
    return ApiResponse.success(res, `Ticket ${req.params.action} marked`, { ticket });
  } catch (err) {
    next(err);
  }
});

// RMA
router.get('/rmas', authorize(PERMISSIONS.RMA_MANAGE), serviceController.getRMAs);
router.post('/rmas', authorize(PERMISSIONS.RMA_MANAGE), serviceController.createRMA);
router.post('/rmas/:id/actions/decide', authorize(PERMISSIONS.RMA_MANAGE), serviceController.decideRMA);
router.post('/rmas/:id/actions/:action', authorize(PERMISSIONS.RMA_MANAGE), async (req, res, next) => {
  const { action, id } = req.params;
  if (action === 'decide') return serviceController.decideRMA(req, res, next);
  try {
    const RMA = require('../models/RMA');
    const rma = await RMA.findById(id);
    if (rma) {
      if (action === 'approve') rma.status = 'APPROVED';
      else if (action === 'receive') rma.status = 'RECEIVED';
      else if (action === 'inspect') rma.status = 'INSPECTED';
      else if (action === 'close') rma.status = 'CLOSED';
      else rma.status = action.toUpperCase();
      await rma.save();
    }
    return ApiResponse.success(res, `RMA marked ${action}`, { rma });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
