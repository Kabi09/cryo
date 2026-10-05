const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

router.get('/tests', authorize(PERMISSIONS.QA_VIEW), qaController.getQATests);
router.get('/tests/:id', authorize(PERMISSIONS.QA_VIEW), qaController.getQATestById);

// Inspection results, retest, rework, scrap
router.post('/tests/:id/actions/record-result', authorize(PERMISSIONS.QA_TEST), qaController.recordTestResult);
router.post('/tests/:id/actions/retest', authorize(PERMISSIONS.QA_RETEST), qaController.retestQA);
router.post('/tests/:id/actions/rework', authorize(PERMISSIONS.QA_REWORK), qaController.reworkQA);
router.post('/tests/:id/actions/scrap', authorize(PERMISSIONS.QA_SCRAP), qaController.scrapQA);

module.exports = router;
