const PackingList = require('../models/PackingList');
const FinalInvoice = require('../models/FinalInvoice');
const Dispatch = require('../models/Dispatch');
const Delivery = require('../models/Delivery');
const SalesOrder = require('../models/SalesOrder');
const SerialNumber = require('../models/SerialNumber');
const SerialTraceService = require('../services/serialTraceService');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

// --- Packing ---
exports.getPackingLists = async (req, res, next) => {
  try {
    const lists = await PackingList.find()
      .populate('salesOrderId', 'salesOrderNumber customerId')
      .populate('inspectedBy', 'name email')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Packing lists fetched', { lists, packingLists: lists });
  } catch (err) {
    next(err);
  }
};

exports.createPackingList = async (req, res, next) => {
  try {
    const { salesOrderId, serialNumbers, packageDimensions, grossWeightKg, netWeightKg, boxCount, checklist } = req.body;
    const packingNumber = `PKG-${Date.now().toString().slice(-6)}`;

    const packing = new PackingList({
      packingNumber,
      salesOrderId,
      serialNumbers,
      packageDimensions,
      grossWeightKg,
      netWeightKg,
      boxCount: boxCount || 1,
      checklist: checklist || {},
      status: STATUSES.PACKING_LIST.PACKED,
      inspectedBy: req.user._id,
      inspectedAt: new Date()
    });
    await packing.save();

    // Update serial numbers
    for (const sn of serialNumbers) {
      const serial = await SerialNumber.findOne({ serialNumber: sn });
      if (serial) {
        serial.packingId = packing._id;
        serial.currentStatus = STATUSES.SERIAL_NUMBER.PACKED;
        await serial.save();

        await SerialTraceService.recordEvent({
          serialNumber: sn,
          eventType: 'UNIT_PACKED',
          stage: 'LOGISTICS_PACKING',
          description: `Crated and labeled under Packing List ${packing.packingNumber}. Gross weight: ${grossWeightKg}kg.`,
          referenceEntityType: 'PACKING_LIST',
          referenceEntityId: packing._id,
          userId: req.user._id
        });
      }
    }

    return ApiResponse.created(res, 'Packing list generated and inspected', { packing });
  } catch (err) {
    next(err);
  }
};

// --- Invoicing ---
exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await FinalInvoice.find()
      .populate('customerId', 'companyName customerCode gstin')
      .populate('salesOrderId', 'salesOrderNumber')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Final invoices fetched', { invoices });
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const { salesOrderId, paymentDueDate } = req.body;
    const so = await SalesOrder.findById(salesOrderId).populate('customerId');
    if (!so) throw new AppError('Sales order not found', 404);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const subtotal = so.grandTotal / 1.18;
    const taxAmount = so.grandTotal - subtotal;

    const invoice = new FinalInvoice({
      invoiceNumber,
      salesOrderId: so._id,
      customerId: so.customerId._id,
      items: so.items.map(i => ({
        productId: i.productId,
        sku: i.sku,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxPercent: 18,
        cgstAmount: (i.total * 0.09),
        sgstAmount: (i.total * 0.09),
        total: i.total
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      grandTotal: so.grandTotal,
      paidAmount: so.advanceReceivedAmount || 0,
      balanceDue: Math.max(0, so.grandTotal - (so.advanceReceivedAmount || 0)),
      paymentDueDate: paymentDueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: STATUSES.FINAL_INVOICE.POSTED,
      postedAt: new Date(),
      createdBy: req.user._id
    });
    await invoice.save();

    so.status = STATUSES.SALES_ORDER.READY_FOR_DISPATCH;
    await so.save();

    return ApiResponse.created(res, 'Final Tax Invoice generated', { invoice });
  } catch (err) {
    next(err);
  }
};

// --- Dispatch ---
exports.getDispatches = async (req, res, next) => {
  try {
    const dispatches = await Dispatch.find()
      .populate('salesOrderId', 'salesOrderNumber customerId')
      .populate('invoiceId', 'invoiceNumber grandTotal')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Dispatches fetched', { dispatches });
  } catch (err) {
    next(err);
  }
};

exports.createDispatch = async (req, res, next) => {
  try {
    const {
      salesOrderId,
      invoiceId,
      packingId,
      transporterName,
      vehicleNumber,
      driverName,
      driverPhone,
      lrNumber,
      eWayBillNumber
    } = req.body;

    const dispatchNumber = `DSP-${Date.now().toString().slice(-6)}`;
    const gatePassNumber = `GP-${Date.now().toString().slice(-5)}`;

    const dispatch = new Dispatch({
      dispatchNumber,
      salesOrderId,
      invoiceId,
      packingId,
      transporterName,
      vehicleNumber,
      driverName,
      driverPhone,
      lrNumber,
      eWayBillNumber,
      gatePassNumber,
      status: STATUSES.DISPATCH.DISPATCHED,
      dispatchedAt: new Date(),
      createdBy: req.user._id
    });
    await dispatch.save();

    // Create tracking delivery record automatically
    const deliveryNumber = `DEL-${Date.now().toString().slice(-6)}`;
    const delivery = new Delivery({
      deliveryNumber,
      dispatchId: dispatch._id,
      salesOrderId,
      currentStatus: STATUSES.DELIVERY.IN_TRANSIT,
      trackingHistory: [{
        status: 'IN_TRANSIT',
        location: 'Factory Gate, Ambattur Chennai',
        notes: `Dispatched via ${transporterName}, Vehicle: ${vehicleNumber}, LR: ${lrNumber}`
      }]
    });
    await delivery.save();

    // Update SalesOrder status
    await SalesOrder.findByIdAndUpdate(salesOrderId, { status: STATUSES.SALES_ORDER.DISPATCHED });

    // Update serial numbers
    const packing = await PackingList.findById(packingId);
    if (packing && packing.serialNumbers) {
      for (const sn of packing.serialNumbers) {
        const serial = await SerialNumber.findOne({ serialNumber: sn });
        if (serial) {
          serial.dispatchId = dispatch._id;
          serial.deliveryId = delivery._id;
          serial.currentStatus = STATUSES.SERIAL_NUMBER.DISPATCHED;
          await serial.save();

          await SerialTraceService.recordEvent({
            serialNumber: sn,
            eventType: 'DISPATCHED_FROM_FACTORY',
            stage: 'TRANSIT_LOGISTICS',
            description: `Left factory dock via ${transporterName}. LR: ${lrNumber}, Gate Pass: ${gatePassNumber}`,
            referenceEntityType: 'DISPATCH',
            referenceEntityId: dispatch._id,
            userId: req.user._id
          });
        }
      }
    }

    return ApiResponse.created(res, 'Consignment dispatched and delivery tracking initiated', { dispatch, delivery });
  } catch (err) {
    next(err);
  }
};

// --- Deliveries & POD ---
exports.getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find()
      .populate('dispatchId')
      .populate('salesOrderId', 'salesOrderNumber customerId')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Deliveries fetched', { deliveries });
  } catch (err) {
    next(err);
  }
};

exports.completeDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { receiverName, receiverDesignation, receiverPhone, notes } = req.body;
    const podDocumentPath = req.file ? req.file.path : null;

    const delivery = await Delivery.findById(id).populate('dispatchId');
    if (!delivery) throw new AppError('Delivery not found', 404);

    delivery.currentStatus = STATUSES.DELIVERY.DELIVERED;
    delivery.receiverName = receiverName;
    delivery.receiverDesignation = receiverDesignation;
    delivery.receiverPhone = receiverPhone;
    delivery.podDocumentPath = podDocumentPath;
    delivery.deliveredAt = new Date();
    delivery.notes = notes;
    delivery.trackingHistory.push({
      status: 'DELIVERED',
      location: 'Customer Consignee Site',
      notes: `Delivered to ${receiverName} (${receiverDesignation}). POD signed.`
    });
    await delivery.save();

    await SalesOrder.findByIdAndUpdate(delivery.salesOrderId, { status: STATUSES.SALES_ORDER.DELIVERED });

    // Update serials to DELIVERED
    const packing = delivery.dispatchId ? await PackingList.findById(delivery.dispatchId.packingId) : null;
    if (packing && packing.serialNumbers) {
      for (const sn of packing.serialNumbers) {
        const serial = await SerialNumber.findOne({ serialNumber: sn });
        if (serial) {
          serial.currentStatus = STATUSES.SERIAL_NUMBER.DELIVERED;
          await serial.save();

          await SerialTraceService.recordEvent({
            serialNumber: sn,
            eventType: 'DELIVERY_POD_CONFIRMED',
            stage: 'CUSTOMER_SITE_DELIVERY',
            description: `Equipment delivered to client premises. Received by ${receiverName}.`,
            referenceEntityType: 'DELIVERY',
            referenceEntityId: delivery._id,
            userId: req.user._id
          });
        }
      }
    }

    await NotificationService.notify({
      title: 'Consignment Delivered (POD Confirmed)',
      message: `Consignment for Sales Order delivered. Site installation can now be scheduled.`,
      targetRole: ROLES.SERVICE_MANAGER,
      entityType: 'DELIVERY',
      entityId: delivery._id
    });

    return ApiResponse.success(res, 'Delivery confirmed with POD', { delivery });
  } catch (err) {
    next(err);
  }
};

exports.failDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { failureReason, rescheduledDate, action } = req.body; // action: 'RESCHEDULE' or 'RETURN'

    const delivery = await Delivery.findById(id);
    if (!delivery) throw new AppError('Delivery not found', 404);

    delivery.currentStatus = action === 'RETURN' ? STATUSES.DELIVERY.RETURNED : STATUSES.DELIVERY.FAILED;
    delivery.failureReason = failureReason;
    if (rescheduledDate) delivery.rescheduledDate = new Date(rescheduledDate);
    delivery.trackingHistory.push({
      status: delivery.currentStatus,
      location: 'Consignee Delivery Point',
      notes: `Delivery attempt failed: ${failureReason}. Action: ${action}`
    });
    await delivery.save();

    return ApiResponse.success(res, `Delivery exception recorded: ${delivery.currentStatus}`, { delivery });
  } catch (err) {
    next(err);
  }
};
