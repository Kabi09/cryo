const SerialNumber = require('../models/SerialNumber');
const STATUSES = require('../constants/statuses');
const { AppError } = require('../utils/apiResponse');

class SerialTraceService {
  static async recordEvent({
    serialNumber,
    eventType,
    stage,
    description,
    referenceEntityType = null,
    referenceEntityId = null,
    metadata = {},
    userId = null
  }) {
    const serial = await SerialNumber.findOne({ serialNumber });
    if (!serial) {
      throw new AppError(`Serial number not found: ${serialNumber}`, 404, 'SERIAL_NOT_FOUND');
    }

    serial.history.push({
      eventType,
      stage,
      description,
      referenceEntityType,
      referenceEntityId: referenceEntityId ? String(referenceEntityId) : null,
      metadata,
      recordedBy: userId,
      timestamp: new Date()
    });

    await serial.save();
    return serial;
  }

  static async get360Trace(serialNumber) {
    const serial = await SerialNumber.findOne({ serialNumber })
      .populate('productId')
      .populate('productionOrderId')
      .populate('salesOrderId')
      .populate('customerId')
      .populate('qaTestId')
      .populate('packingId')
      .populate('invoiceId')
      .populate('dispatchId')
      .populate('deliveryId')
      .populate('installationId')
      .populate('commissioningId')
      .populate('warrantyId')
      .populate('serviceTickets');

    if (!serial) {
      throw new AppError(`Serial number not found: ${serialNumber}`, 404, 'SERIAL_NOT_FOUND');
    }

    return serial;
  }
}

module.exports = SerialTraceService;
