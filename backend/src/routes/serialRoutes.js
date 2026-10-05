const express = require('express');
const router = express.Router();
const serialController = require('../controllers/serialController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SERIAL_VIEW), serialController.getSerialNumbers);
router.get('/:serialNumber/trace', authorize(PERMISSIONS.SERIAL_TRACK), serialController.getSerial360Trace);

module.exports = router;
