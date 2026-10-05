const QATest = require('../models/QATest');
const SerialNumber = require('../models/SerialNumber');
const SerialTraceService = require('../services/serialTraceService');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

exports.getQATests = async (req, res, next) => {
  try {
    const { overallResult, serialNumber } = req.query;
    const filter = {};
    if (overallResult) filter.overallResult = overallResult;
    if (serialNumber) filter.serialNumber = serialNumber;

    const tests = await QATest.find(filter)
      .populate('productId', 'name sku modelNumber')
      .populate('productionOrderId', 'productionOrderNumber')
      .populate('testerId', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'QA tests fetched', { tests });
  } catch (err) {
    next(err);
  }
};

exports.getQATestById = async (req, res, next) => {
  try {
    const test = await QATest.findById(req.params.id)
      .populate('productId')
      .populate('productionOrderId')
      .populate('testerId', 'name email');

    if (!test) throw new AppError('QA test not found', 404);

    return ApiResponse.success(res, 'QA test details', { test });
  } catch (err) {
    next(err);
  }
};

exports.recordTestResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parameters, remarks } = req.body;

    const test = await QATest.findById(id);
    if (!test) throw new AppError('QA test not found', 404);

    if (parameters && parameters.length > 0) {
      test.parameters = parameters;
    }

    const hasFailure = test.parameters.some(p => p.result === 'FAIL');
    test.overallResult = hasFailure ? STATUSES.QA_TEST.FAILED : STATUSES.QA_TEST.PASSED;
    test.testerId = req.user._id;
    test.testedAt = new Date();

    if (!hasFailure) {
      test.certificateNumber = `CERT-CRYO-${Date.now().toString().slice(-6)}`;
      test.certificateUrl = `/uploads/certificates/${test.certificateNumber}.pdf`;
    }

    await test.save();

    // Update serial number status and history
    const serial = await SerialNumber.findOne({ serialNumber: test.serialNumber });
    if (serial) {
      serial.currentStatus = hasFailure ? STATUSES.SERIAL_NUMBER.IN_PRODUCTION : STATUSES.SERIAL_NUMBER.QA_PASSED;
      await serial.save();

      await SerialTraceService.recordEvent({
        serialNumber: test.serialNumber,
        eventType: hasFailure ? 'QA_INSPECTION_FAILED' : 'QA_INSPECTION_PASSED',
        stage: 'QUALITY_ASSURANCE',
        description: hasFailure
          ? 'Unit deviated from cryogenic pressure / pulldown tolerance.'
          : `Inspection PASSED. Certificate ${test.certificateNumber} generated.`,
        referenceEntityType: 'QA_TEST',
        referenceEntityId: test._id,
        metadata: { certificateNumber: test.certificateNumber },
        userId: req.user._id
      });
    }

    await AuditService.log({
      entityType: 'QA_TEST',
      entityId: test._id,
      action: hasFailure ? 'QA_TEST_FAILED' : 'QA_TEST_PASSED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      newStatus: test.overallResult,
      reason: remarks || (hasFailure ? 'Parameter out of tolerance' : 'All parameters within specification')
    });

    if (hasFailure) {
      await NotificationService.notify({
        title: 'QA Inspection Failure Alert',
        message: `Serial ${test.serialNumber} failed QA parameters. Rectification required.`,
        targetRole: ROLES.PRODUCTION,
        entityType: 'QA_TEST',
        entityId: test._id
      });
    }

    return ApiResponse.success(res, `QA test recorded: ${test.overallResult}`, { test });
  } catch (err) {
    next(err);
  }
};

exports.retestQA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parameters, rectificationNotes } = req.body;

    const test = await QATest.findById(id);
    if (!test) throw new AppError('QA test not found', 404);

    test.attemptNumber += 1;
    if (parameters) test.parameters = parameters;
    test.rectificationNotes = rectificationNotes || 'Rectified vacuum seal and recalibrated sensor.';

    const hasFailure = test.parameters.some(p => p.result === 'FAIL');
    test.overallResult = hasFailure ? STATUSES.QA_TEST.FAILED : STATUSES.QA_TEST.PASSED;
    test.testedAt = new Date();

    if (!hasFailure) {
      test.certificateNumber = `CERT-CRYO-${Date.now().toString().slice(-6)}`;
      test.certificateUrl = `/uploads/certificates/${test.certificateNumber}.pdf`;
    }

    await test.save();

    const serial = await SerialNumber.findOne({ serialNumber: test.serialNumber });
    if (serial && !hasFailure) {
      serial.currentStatus = STATUSES.SERIAL_NUMBER.QA_PASSED;
      await serial.save();

      await SerialTraceService.recordEvent({
        serialNumber: test.serialNumber,
        eventType: 'QA_RETEST_PASSED',
        stage: 'QUALITY_ASSURANCE',
        description: `Retest attempt #${test.attemptNumber} PASSED after rectification.`,
        referenceEntityType: 'QA_TEST',
        referenceEntityId: test._id,
        userId: req.user._id
      });
    }

    return ApiResponse.success(res, `Retest recorded: ${test.overallResult}`, { test });
  } catch (err) {
    next(err);
  }
};

exports.reworkQA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reworkInstructions } = req.body;

    const test = await QATest.findById(id);
    if (!test) throw new AppError('QA test not found', 404);

    test.overallResult = STATUSES.QA_TEST.REWORK;
    test.reworkInstructions = reworkInstructions || 'Return to fabrication bay for chamber weld inspection.';
    await test.save();

    await SerialTraceService.recordEvent({
      serialNumber: test.serialNumber,
      eventType: 'ROUTED_FOR_REWORK',
      stage: 'SHOP_FLOOR_REWORK',
      description: test.reworkInstructions,
      referenceEntityType: 'QA_TEST',
      referenceEntityId: test._id,
      userId: req.user._id
    });

    return ApiResponse.success(res, 'Unit routed for rework', { test });
  } catch (err) {
    next(err);
  }
};

exports.scrapQA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scrapReason } = req.body;

    const test = await QATest.findById(id);
    if (!test) throw new AppError('QA test not found', 404);

    test.overallResult = STATUSES.QA_TEST.SCRAPPED;
    await test.save();

    const serial = await SerialNumber.findOne({ serialNumber: test.serialNumber });
    if (serial) {
      serial.currentStatus = STATUSES.SERIAL_NUMBER.DECOMMISSIONED;
      await serial.save();

      await SerialTraceService.recordEvent({
        serialNumber: test.serialNumber,
        eventType: 'UNIT_SCRAPPED',
        stage: 'DECOMMISSIONED',
        description: `Scrapped due to irrecoverable defect: ${scrapReason || 'Core vessel deformation'}`,
        referenceEntityType: 'QA_TEST',
        referenceEntityId: test._id,
        userId: req.user._id
      });
    }

    return ApiResponse.success(res, 'Unit written off as scrap', { test });
  } catch (err) {
    next(err);
  }
};
