const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const PERMISSIONS = require('../constants/permissions');
const { ApiResponse } = require('../utils/apiResponse');

router.use(authenticate);

// Packing (support both /packing and /packing-lists)
router.get('/packing', authorize(PERMISSIONS.PACKING_VIEW), logisticsController.getPackingLists);
router.get('/packing-lists', authorize(PERMISSIONS.PACKING_VIEW), logisticsController.getPackingLists);
router.post('/packing', authorize(PERMISSIONS.PACKING_CREATE), logisticsController.createPackingList);
router.post('/packing-lists', authorize(PERMISSIONS.PACKING_CREATE), logisticsController.createPackingList);
router.post(['/packing/:id/actions/:action', '/packing-lists/:id/actions/:action'], authorize(PERMISSIONS.PACKING_CREATE), async (req, res, next) => {
  try {
    const PackingList = require('../models/PackingList');
    const { id, action } = req.params;
    const list = await PackingList.findById(id);
    if (list) {
      list.status = action === 'complete' ? 'COMPLETED' : action.toUpperCase();
      await list.save();
    }
    return ApiResponse.success(res, `Packing list ${action} marked`, { packing: list });
  } catch (err) {
    next(err);
  }
});

// Final Invoicing
router.get('/invoices', authorize(PERMISSIONS.INVOICE_VIEW), logisticsController.getInvoices);
router.post('/invoices', authorize(PERMISSIONS.INVOICE_CREATE), logisticsController.createInvoice);
router.post('/invoices/:id/actions/:action', authorize(PERMISSIONS.INVOICE_CREATE), async (req, res, next) => {
  try {
    const FinalInvoice = require('../models/FinalInvoice');
    const { id, action } = req.params;
    const inv = await FinalInvoice.findById(id);
    if (inv) {
      if (action === 'post') inv.status = 'POSTED';
      if (action === 'pay') inv.status = 'PAID';
      if (action === 'cancel') inv.status = 'CANCELLED';
      await inv.save();
    }
    return ApiResponse.success(res, `Invoice ${action} marked`, { invoice: inv });
  } catch (err) {
    next(err);
  }
});

// Dispatch
router.get('/dispatches', authorize(PERMISSIONS.DISPATCH_VIEW), logisticsController.getDispatches);
router.post('/dispatches', authorize(PERMISSIONS.DISPATCH_CREATE), logisticsController.createDispatch);
router.post('/dispatches/:id/actions/:action', authorize(PERMISSIONS.DISPATCH_CREATE), async (req, res, next) => {
  try {
    const Dispatch = require('../models/Dispatch');
    const { id, action } = req.params;
    const disp = await Dispatch.findById(id);
    if (disp) {
      disp.status = action === 'dispatch' ? 'DISPATCHED' : action === 'intransit' ? 'IN_TRANSIT' : action.toUpperCase();
      await disp.save();
    }
    return ApiResponse.success(res, `Dispatch ${action} marked`, { dispatch: disp });
  } catch (err) {
    next(err);
  }
});

// Delivery & POD
router.get('/deliveries', authorize(PERMISSIONS.DELIVERY_VIEW), logisticsController.getDeliveries);
router.post(['/deliveries/:id/actions/complete', '/deliveries/:id/actions/deliver'], authorize(PERMISSIONS.DELIVERY_COMPLETE), upload.single('podDocument'), logisticsController.completeDelivery);
router.post('/deliveries/:id/actions/fail', authorize(PERMISSIONS.DELIVERY_FAIL), logisticsController.failDelivery);
router.post('/deliveries/:id/actions/reschedule', authorize(PERMISSIONS.DELIVERY_COMPLETE), (req, res) => {
  req.body.action = 'RESCHEDULE';
  logisticsController.failDelivery(req, res);
});

module.exports = router;
