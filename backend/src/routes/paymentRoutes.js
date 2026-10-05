const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.PAYMENT_VIEW), paymentController.getPayments);
router.post('/', authorize(PERMISSIONS.PAYMENT_CREATE), upload.single('proofDocument'), paymentController.recordPayment);
router.get('/:id', authorize(PERMISSIONS.PAYMENT_VIEW), paymentController.getPaymentById);

// Commercial verification, reversal, refund
router.post('/:id/actions/verify', authorize(PERMISSIONS.PAYMENT_VERIFY), paymentController.verifyPayment);
router.post('/:id/actions/reverse', authorize(PERMISSIONS.PAYMENT_REVERSE), paymentController.reversePayment);
router.post('/:id/actions/refund', authorize(PERMISSIONS.PAYMENT_REFUND), paymentController.refundPayment);

module.exports = router;
