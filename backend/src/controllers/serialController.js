const SerialNumber = require('../models/SerialNumber');
const SerialTraceService = require('../services/serialTraceService');
const { ApiResponse, AppError } = require('../utils/apiResponse');

exports.getSerialNumbers = async (req, res, next) => {
  try {
    const { status, productId, search } = req.query;
    const filter = {};
    if (status) filter.currentStatus = status;
    if (productId) filter.productId = productId;
    if (search) {
      filter.serialNumber = { $regex: search, $options: 'i' };
    }

    const serials = await SerialNumber.find(filter)
      .populate('productId', 'name sku modelNumber capacity tempRating')
      .populate('salesOrderId', 'salesOrderNumber')
      .populate('customerId', 'companyName customerCode')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Serial numbers fetched', { serials });
  } catch (err) {
    next(err);
  }
};

exports.getSerial360Trace = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;
    const trace = await SerialTraceService.get360Trace(serialNumber);
    return ApiResponse.success(res, 'Serial 360-degree trace loaded', { trace });
  } catch (err) {
    next(err);
  }
};
