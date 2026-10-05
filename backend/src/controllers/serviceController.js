const Installation = require('../models/Installation');
const Commissioning = require('../models/Commissioning');
const Warranty = require('../models/Warranty');
const ServiceTicket = require('../models/ServiceTicket');
const ServiceQuotation = require('../models/ServiceQuotation');
const RMA = require('../models/RMA');
const SerialNumber = require('../models/SerialNumber');
const StockItem = require('../models/StockItem');
const InventoryService = require('../services/inventoryService');
const SerialTraceService = require('../services/serialTraceService');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const STATUSES = require('../constants/statuses');
const ROLES = require('../constants/roles');

// --- Installation ---
exports.getInstallations = async (req, res, next) => {
  try {
    const list = await Installation.find()
      .populate('customerId', 'companyName customerCode')
      .populate('assignedEngineerId', 'name email phone')
      .sort({ scheduledDate: -1 });
    return ApiResponse.success(res, 'Installations fetched', { installations: list });
  } catch (err) {
    next(err);
  }
};

exports.createInstallation = async (req, res, next) => {
  try {
    const { salesOrderId, serialNumber, customerId, siteAddress, assignedEngineerId, scheduledDate, siteReadinessCheck } = req.body;
    const installationNumber = `INS-${Date.now().toString().slice(-6)}`;

    const inst = new Installation({
      installationNumber,
      salesOrderId,
      serialNumber,
      customerId,
      siteAddress,
      assignedEngineerId,
      scheduledDate,
      siteReadinessCheck,
      status: STATUSES.INSTALLATION.SCHEDULED
    });
    await inst.save();

    return ApiResponse.created(res, 'Installation scheduled', { installation: inst });
  } catch (err) {
    next(err);
  }
};

exports.completeInstallation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { installationNotes } = req.body;

    const inst = await Installation.findById(id);
    if (!inst) throw new AppError('Installation not found', 404);

    inst.status = STATUSES.INSTALLATION.COMPLETED;
    inst.installationNotes = installationNotes;
    inst.completionDate = new Date();
    await inst.save();

    // Auto-create Commissioning record
    const commissioningNumber = `COMM-${Date.now().toString().slice(-6)}`;
    const comm = new Commissioning({
      commissioningNumber,
      installationId: inst._id,
      serialNumber: inst.serialNumber,
      status: STATUSES.COMMISSIONING.PENDING
    });
    await comm.save();

    await SerialTraceService.recordEvent({
      serialNumber: inst.serialNumber,
      eventType: 'INSTALLATION_COMPLETED',
      stage: 'SITE_INSTALLATION',
      description: `Physical positioning and electrical termination complete at client site.`,
      referenceEntityType: 'INSTALLATION',
      referenceEntityId: inst._id,
      userId: req.user._id
    });

    return ApiResponse.success(res, 'Installation completed. Commissioning initiated.', { installation: inst, commissioning: comm });
  } catch (err) {
    next(err);
  }
};

// --- Commissioning & Warranty Activation ---
exports.getCommissionings = async (req, res, next) => {
  try {
    const list = await Commissioning.find()
      .populate('installationId')
      .populate('conductedBy', 'name email')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Commissionings fetched', { commissionings: list });
  } catch (err) {
    next(err);
  }
};

exports.executeCommissioningTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checklist, clientSignOffName, failureNotes } = req.body;

    const comm = await Commissioning.findById(id).populate('installationId');
    if (!comm) throw new AppError('Commissioning record not found', 404);

    if (checklist) comm.checklist = { ...comm.checklist, ...checklist };
    comm.conductedBy = req.user._id;

    // Check if tests pass
    const isPass = comm.checklist.alarmSystemTest === 'PASS' &&
      comm.checklist.tempUniformityTest === 'PASS' &&
      comm.checklist.achievedTempDegC <= comm.checklist.pullDownTargetDegC;

    comm.status = isPass ? STATUSES.COMMISSIONING.PASSED : STATUSES.COMMISSIONING.FAILED;
    comm.commissionedAt = new Date();
    comm.clientSignOffName = clientSignOffName;
    comm.failureNotes = failureNotes;
    await comm.save();

    if (isPass) {
      // Activate Warranty!
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 12 months standard warranty

      const warrantyNumber = `WAR-${Date.now().toString().slice(-6)}`;
      const warranty = new Warranty({
        warrantyNumber,
        serialNumber: comm.serialNumber,
        customerId: comm.installationId.customerId,
        startDate,
        endDate,
        durationMonths: 12,
        coveredComponents: ['Dual Stage Cryo Compressor', 'Vacuum Insulated Vessel', 'Microprocessor Controller', 'PT-100 RTD Sensors'],
        excludedConditions: ['Customer site voltage surge (>460V)', 'Refrigerant line physical impact', 'Unauthorized third-party tampering'],
        status: STATUSES.WARRANTY.ACTIVE
      });
      await warranty.save();

      // Update SerialNumber status and attach warrantyId
      const serial = await SerialNumber.findOne({ serialNumber: comm.serialNumber });
      if (serial) {
        serial.warrantyId = warranty._id;
        serial.commissioningId = comm._id;
        serial.currentStatus = STATUSES.SERIAL_NUMBER.WARRANTY_ACTIVE;
        await serial.save();

        await SerialTraceService.recordEvent({
          serialNumber: comm.serialNumber,
          eventType: 'COMMISSIONING_PASSED_WARRANTY_ACTIVE',
          stage: 'WARRANTY_OPERATIONAL',
          description: `Commissioning test PASSED. Deep temp: ${comm.checklist.achievedTempDegC}°C. Warranty active until ${endDate.toDateString()}.`,
          referenceEntityType: 'WARRANTY',
          referenceEntityId: warranty._id,
          userId: req.user._id
        });
      }

      await NotificationService.notify({
        title: 'Equipment Commissioned & Warranty Active',
        message: `Serial ${comm.serialNumber} successfully commissioned. Warranty contract ${warrantyNumber} active.`,
        targetRole: ROLES.SERVICE_MANAGER,
        entityType: 'COMMISSIONING',
        entityId: comm._id
      });
    } else {
      await SerialTraceService.recordEvent({
        serialNumber: comm.serialNumber,
        eventType: 'COMMISSIONING_FAILED',
        stage: 'SITE_COMMISSIONING',
        description: `Commissioning failed: ${failureNotes || 'Pulldown temperature not reached'}. Revisit scheduled.`,
        referenceEntityType: 'COMMISSIONING',
        referenceEntityId: comm._id,
        userId: req.user._id
      });
    }

    return ApiResponse.success(res, `Commissioning execution recorded: ${comm.status}`, { commissioning: comm });
  } catch (err) {
    next(err);
  }
};

// --- Warranties ---
exports.getWarranties = async (req, res, next) => {
  try {
    const warranties = await Warranty.find()
      .populate('customerId', 'companyName customerCode')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Warranties fetched', { warranties });
  } catch (err) {
    next(err);
  }
};

// --- Service Tickets ---
exports.getServiceTickets = async (req, res, next) => {
  try {
    const { status, priority, serialNumber } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (serialNumber) filter.serialNumber = serialNumber;

    const tickets = await ServiceTicket.find(filter)
      .populate('customerId', 'companyName customerCode contactPerson phone')
      .populate('assignedEngineerId', 'name email phone')
      .populate('serviceQuotationId')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Service tickets fetched', { tickets });
  } catch (err) {
    next(err);
  }
};

exports.getServiceTicketById = async (req, res, next) => {
  try {
    const ticket = await ServiceTicket.findById(req.params.id)
      .populate('customerId')
      .populate('assignedEngineerId')
      .populate('serviceQuotationId')
      .populate('sparesRequested.stockItemId');

    if (!ticket) throw new AppError('Service ticket not found', 404);

    return ApiResponse.success(res, 'Service ticket details', { ticket });
  } catch (err) {
    next(err);
  }
};

exports.createServiceTicket = async (req, res, next) => {
  try {
    const { customerId, serialNumber, complaintDescription, priority, serviceType } = req.body;

    if (!customerId || !serialNumber || !complaintDescription) {
      throw new AppError('Missing required complaint details', 400);
    }

    // Automated Warranty Check
    const activeWarranty = await Warranty.findOne({
      serialNumber,
      status: STATUSES.WARRANTY.ACTIVE,
      endDate: { $gte: new Date() }
    });

    const isWarrantyValid = !!activeWarranty;
    const warrantyStatus = isWarrantyValid ? 'COVERED' : 'EXPIRED';
    const isChargeable = !isWarrantyValid;

    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

    const ticket = new ServiceTicket({
      ticketNumber,
      customerId,
      serialNumber,
      complaintDescription,
      priority: priority || 'MEDIUM',
      serviceType: serviceType || 'ON_SITE',
      warrantyStatus,
      isChargeable,
      status: STATUSES.SERVICE_TICKET.OPEN,
      createdBy: req.user._id
    });
    await ticket.save();

    await SerialTraceService.recordEvent({
      serialNumber,
      eventType: 'SERVICE_COMPLAINT_LOGGED',
      stage: 'FIELD_SERVICE',
      description: `Ticket ${ticketNumber} raised: ${complaintDescription}. Warranty: ${warrantyStatus}.`,
      referenceEntityType: 'SERVICE_TICKET',
      referenceEntityId: ticket._id,
      userId: req.user._id
    });

    await NotificationService.notify({
      title: 'New Service Ticket Logged',
      message: `Ticket ${ticketNumber} for serial ${serialNumber}. Priority: ${ticket.priority}.`,
      targetRole: ROLES.SERVICE_MANAGER,
      entityType: 'SERVICE_TICKET',
      entityId: ticket._id
    });

    return ApiResponse.created(res, 'Service ticket logged', { ticket, warrantyValid: isWarrantyValid });
  } catch (err) {
    next(err);
  }
};

exports.assignEngineer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { engineerId } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) throw new AppError('Ticket not found', 404);

    ticket.assignedEngineerId = engineerId;
    ticket.status = STATUSES.SERVICE_TICKET.ASSIGNED;
    await ticket.save();

    return ApiResponse.success(res, 'Engineer assigned to ticket', { ticket });
  } catch (err) {
    next(err);
  }
};

exports.recordDiagnosis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { findings, rootCause, sparesRequired, sparesList } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) throw new AppError('Ticket not found', 404);

    ticket.diagnosis = {
      findings,
      rootCause,
      sparesRequired: !!sparesRequired,
      diagnosedAt: new Date()
    };

    if (sparesList && sparesList.length > 0) {
      ticket.sparesRequested = sparesList.map(s => ({
        stockItemId: s.stockItemId,
        sku: s.sku,
        name: s.name,
        quantity: s.quantity,
        issued: false
      }));
      ticket.status = STATUSES.SERVICE_TICKET.AWAITING_SPARE;
    } else {
      ticket.status = STATUSES.SERVICE_TICKET.REPAIR;
    }

    await ticket.save();

    await SerialTraceService.recordEvent({
      serialNumber: ticket.serialNumber,
      eventType: 'SERVICE_DIAGNOSIS_LOGGED',
      stage: 'FIELD_SERVICE',
      description: `Diagnosis: ${findings}. Root cause: ${rootCause}`,
      referenceEntityType: 'SERVICE_TICKET',
      referenceEntityId: ticket._id,
      userId: req.user._id
    });

    return ApiResponse.success(res, 'Diagnosis recorded', { ticket });
  } catch (err) {
    next(err);
  }
};

exports.issueSpareParts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { warehouseId } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) throw new AppError('Ticket not found', 404);

    for (const spare of ticket.sparesRequested) {
      if (!spare.issued) {
        const item = await StockItem.findById(spare.stockItemId);
        if (item && item.availableQuantity >= spare.quantity) {
          await InventoryService.postMovement({
            movementType: STATUSES.INVENTORY_MOVEMENT.SERVICE_ISSUE,
            itemId: spare.stockItemId,
            warehouseId: warehouseId || item.primaryWarehouseId,
            quantity: spare.quantity,
            referenceEntityType: 'SERVICE_TICKET',
            referenceEntityId: ticket._id,
            remarks: `Issued spare for Service Ticket ${ticket.ticketNumber}`,
            userId: req.user._id
          });
          spare.issued = true;
        } else {
          throw new AppError(`Spare part ${spare.name} (${spare.sku}) is out of stock. Available: ${item ? item.availableQuantity : 0}`, 400, 'SPARE_SHORTAGE');
        }
      }
    }

    ticket.status = STATUSES.SERVICE_TICKET.REPAIR;
    await ticket.save();

    return ApiResponse.success(res, 'Spares issued from inventory', { ticket });
  } catch (err) {
    next(err);
  }
};

exports.signOffService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { signedBy, rating, feedback, repairWorkNotes } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) throw new AppError('Ticket not found', 404);

    ticket.repairWorkNotes = repairWorkNotes || 'Replacement of defective valve and recharge of cascade refrigerant.';
    ticket.testPassed = true;
    ticket.customerSignOff = {
      signedBy: signedBy || 'Client Site Authority',
      rating: rating || 5,
      feedback: feedback || 'Performance restored to -150°C baseline. Satisfactory work.',
      signedAt: new Date()
    };
    ticket.status = STATUSES.SERVICE_TICKET.CLOSED;
    ticket.closedAt = new Date();
    await ticket.save();

    await SerialTraceService.recordEvent({
      serialNumber: ticket.serialNumber,
      eventType: 'SERVICE_RESOLVED_AND_CLOSED',
      stage: 'FIELD_SERVICE',
      description: `Service completed and customer sign-off received. Rating: ${rating}/5`,
      referenceEntityType: 'SERVICE_TICKET',
      referenceEntityId: ticket._id,
      userId: req.user._id
    });

    return ApiResponse.success(res, 'Service ticket closed with customer sign-off', { ticket });
  } catch (err) {
    next(err);
  }
};

// --- RMA & Replacement ---
exports.getRMAs = async (req, res, next) => {
  try {
    const rmas = await RMA.find()
      .populate('customerId', 'companyName customerCode')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'RMAs fetched', { rmas });
  } catch (err) {
    next(err);
  }
};

exports.createRMA = async (req, res, next) => {
  try {
    const { serialNumber, customerId, reasonForReturn } = req.body;
    const rmaNumber = `RMA-${Date.now().toString().slice(-6)}`;

    const rma = new RMA({
      rmaNumber,
      serialNumber,
      customerId,
      reasonForReturn,
      status: STATUSES.RMA.REQUESTED
    });
    await rma.save();

    return ApiResponse.created(res, 'RMA request created', { rma });
  } catch (err) {
    next(err);
  }
};

exports.decideRMA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, inspectionFindings, replacementSerialNumber, creditNoteAmount } = req.body;

    const rma = await RMA.findById(id);
    if (!rma) throw new AppError('RMA not found', 404);

    rma.decision = decision;
    rma.inspectionFindings = inspectionFindings;
    rma.replacementSerialNumber = replacementSerialNumber;
    rma.creditNoteAmount = creditNoteAmount;
    rma.status = STATUSES.RMA.CLOSED;
    rma.approvedBy = req.user._id;
    rma.approvedAt = new Date();
    rma.closedAt = new Date();
    await rma.save();

    if (decision === 'REPLACEMENT' && replacementSerialNumber) {
      const oldSerial = await SerialNumber.findOne({ serialNumber: rma.serialNumber });
      if (oldSerial) {
        oldSerial.currentStatus = STATUSES.SERIAL_NUMBER.REPLACED;
        await oldSerial.save();

        await SerialTraceService.recordEvent({
          serialNumber: oldSerial.serialNumber,
          eventType: 'SERIAL_REPLACED_UNDER_RMA',
          stage: 'RMA_RESOLUTION',
          description: `Unit replaced under RMA ${rma.rmaNumber}. New replacement serial: ${replacementSerialNumber}.`,
          referenceEntityType: 'RMA',
          referenceEntityId: rma._id,
          userId: req.user._id
        });
      }
    }

    return ApiResponse.success(res, `RMA resolved with decision: ${decision}`, { rma });
  } catch (err) {
    next(err);
  }
};
