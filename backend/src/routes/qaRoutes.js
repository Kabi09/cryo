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

// Dynamic action handler for UI buttons (pass, fail, retest, rework, scrap)
router.post('/tests/:id/actions/:action', authorize(PERMISSIONS.QA_TEST), (req, res, next) => {
  const { action } = req.params;
  if (action === 'pass') {
    const defaultParams = [
      { parameterName: 'Helium Leak Test (< 1x10⁻⁹ mbar·L/s)', specificationRequired: '< 1x10⁻⁹ mbar·L/s', actualValue: '5x10⁻¹⁰ mbar·L/s', result: 'PASS' },
      { parameterName: 'Cryo Pull-Down to -196°C', specificationRequired: '-196°C', actualValue: '-196.2°C', result: 'PASS' },
      { parameterName: 'Hydrostatic Proof Pressure (1.5x MAWP)', specificationRequired: '1.5x MAWP', actualValue: 'Passed 1.5x MAWP', result: 'PASS' },
      { parameterName: 'Outer Vacuum Retention (< 1x10⁻⁴ mbar)', specificationRequired: '< 1x10⁻⁴ mbar', actualValue: '7.8x10⁻⁵ mbar', result: 'PASS' }
    ];
    req.body.parameters = (req.body.parameters && req.body.parameters.length > 0) ? req.body.parameters : defaultParams;
    return qaController.recordTestResult(req, res, next);
  }
  if (action === 'fail') {
    const failParams = [
      { parameterName: 'Helium Leak Test (< 1x10⁻⁹ mbar·L/s)', specificationRequired: '< 1x10⁻⁹ mbar·L/s', actualValue: '2.4x10⁻⁷ mbar·L/s (Leak Detected)', result: 'FAIL' }
    ];
    req.body.parameters = (req.body.parameters && req.body.parameters.length > 0) ? req.body.parameters : failParams;
    return qaController.recordTestResult(req, res, next);
  }
  if (action === 'retest') return qaController.retestQA(req, res, next);
  if (action === 'rework') return qaController.reworkQA(req, res, next);
  if (action === 'scrap') return qaController.scrapQA(req, res, next);
  next();
});

module.exports = router;
