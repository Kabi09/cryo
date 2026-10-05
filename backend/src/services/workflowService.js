const STATUSES = require('../constants/statuses');
const PERMISSIONS = require('../constants/permissions');
const ROLES = require('../constants/roles');
const AuditService = require('./auditService');
const NotificationService = require('./notificationService');
const { AppError } = require('../utils/apiResponse');

// Model references
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const QuotationRevision = require('../models/QuotationRevision');
const CustomerPO = require('../models/CustomerPO');
const SalesOrder = require('../models/SalesOrder');
const Payment = require('../models/Payment');
const ProductionOrder = require('../models/ProductionOrder');
const MaterialRequest = require('../models/MaterialRequest');
const QATest = require('../models/QATest');
const SerialNumber = require('../models/SerialNumber');
const PackingList = require('../models/PackingList');
const FinalInvoice = require('../models/FinalInvoice');
const Dispatch = require('../models/Dispatch');
const Delivery = require('../models/Delivery');
const Installation = require('../models/Installation');
const Commissioning = require('../models/Commissioning');
const Warranty = require('../models/Warranty');
const ServiceTicket = require('../models/ServiceTicket');

const MODEL_MAP = {
  LEAD: Lead,
  QUOTATION: Quotation,
  QUOTATION_REVISION: QuotationRevision,
  CUSTOMER_PO: CustomerPO,
  SALES_ORDER: SalesOrder,
  PAYMENT: Payment,
  PRODUCTION_ORDER: ProductionOrder,
  MATERIAL_REQUEST: MaterialRequest,
  QA_TEST: QATest,
  SERIAL_NUMBER: SerialNumber,
  PACKING_LIST: PackingList,
  FINAL_INVOICE: FinalInvoice,
  DISPATCH: Dispatch,
  DELIVERY: Delivery,
  INSTALLATION: Installation,
  COMMISSIONING: Commissioning,
  WARRANTY: Warranty,
  SERVICE_TICKET: ServiceTicket
};

// Transition configuration table
const TRANSITIONS = {
  QUOTATION: {
    submit: {
      from: [STATUSES.QUOTATION.DRAFT],
      to: STATUSES.QUOTATION.PENDING_APPROVAL,
      permission: PERMISSIONS.QUOTATION_SUBMIT,
      validate: (doc) => {
        if (!doc.items || doc.items.length === 0) throw new AppError('Quotation must have at least one line item before submission', 422);
        if (doc.grandTotal <= 0) throw new AppError('Quotation total must be greater than zero', 422);
      },
      notification: { targetRole: ROLES.SALES_MANAGER, title: 'Quotation Approval Requested', message: (doc) => `Quotation ${doc.quotationNumber} has been submitted for management review.` }
    },
    approve: {
      from: [STATUSES.QUOTATION.PENDING_APPROVAL],
      to: STATUSES.QUOTATION.APPROVED,
      permission: PERMISSIONS.QUOTATION_APPROVE,
      notification: { targetRole: ROLES.SALES, title: 'Quotation Approved', message: (doc) => `Quotation ${doc.quotationNumber} has been approved by sales management.` }
    },
    reject: {
      from: [STATUSES.QUOTATION.PENDING_APPROVAL],
      to: STATUSES.QUOTATION.REJECTED,
      permission: PERMISSIONS.QUOTATION_REJECT,
      notification: { targetRole: ROLES.SALES, title: 'Quotation Rejected', message: (doc) => `Quotation ${doc.quotationNumber} has been rejected.` }
    },
    send: {
      from: [STATUSES.QUOTATION.APPROVED],
      to: STATUSES.QUOTATION.SENT,
      permission: PERMISSIONS.QUOTATION_SEND,
      notification: { targetRole: ROLES.SALES, title: 'Quotation Sent to Client', message: (doc) => `Quotation ${doc.quotationNumber} has been dispatched to client.` }
    },
    negotiate: {
      from: [STATUSES.QUOTATION.SENT],
      to: STATUSES.QUOTATION.NEGOTIATION,
      permission: PERMISSIONS.QUOTATION_NEGOTIATE,
      notification: { targetRole: ROLES.SALES_MANAGER, title: 'Customer Counter-Offer Received', message: (doc) => `Quotation ${doc.quotationNumber} is in commercial negotiation.` }
    },
    accept: {
      from: [STATUSES.QUOTATION.SENT, STATUSES.QUOTATION.NEGOTIATION],
      to: STATUSES.QUOTATION.ACCEPTED,
      permission: PERMISSIONS.QUOTATION_ACCEPT,
      notification: { targetRole: ROLES.ACCOUNTS, title: 'Quotation Accepted by Customer', message: (doc) => `Quotation ${doc.quotationNumber} accepted. Proforma Invoice required.` }
    },
    cancel: {
      from: [STATUSES.QUOTATION.DRAFT, STATUSES.QUOTATION.PENDING_APPROVAL, STATUSES.QUOTATION.APPROVED, STATUSES.QUOTATION.SENT, STATUSES.QUOTATION.NEGOTIATION],
      to: STATUSES.QUOTATION.CANCELLED,
      permission: PERMISSIONS.QUOTATION_CANCEL,
      notification: { targetRole: ROLES.SALES_MANAGER, title: 'Quotation Cancelled', message: (doc) => `Quotation ${doc.quotationNumber} has been cancelled.` }
    }
  },

  SALES_ORDER: {
    confirm: {
      from: [STATUSES.SALES_ORDER.DRAFT],
      to: STATUSES.SALES_ORDER.CONFIRMED,
      permission: PERMISSIONS.SALES_ORDER_CONFIRM,
      notification: { targetRole: ROLES.ACCOUNTS, title: 'Sales Order Confirmed', message: (doc) => `Sales Order ${doc.salesOrderNumber} confirmed. Awaiting advance payment.` }
    },
    releaseProduction: {
      from: [STATUSES.SALES_ORDER.CONFIRMED],
      to: STATUSES.SALES_ORDER.IN_PRODUCTION,
      permission: PERMISSIONS.SALES_ORDER_RELEASE_PRODUCTION,
      validate: (doc) => {
        // Must have received advance payment matching required amount
        if (doc.advanceReceivedAmount < doc.advanceRequiredAmount) {
          throw new AppError(`Cannot release to production. Verified advance received: ₹${doc.advanceReceivedAmount}, Required: ₹${doc.advanceRequiredAmount}`, 400, 'ADVANCE_PAYMENT_INSUFFICIENT');
        }
      },
      notification: { targetRole: ROLES.PRODUCTION, title: 'Production Release Authorized', message: (doc) => `Sales Order ${doc.salesOrderNumber} released for manufacturing.` }
    },
    cancel: {
      from: [STATUSES.SALES_ORDER.DRAFT, STATUSES.SALES_ORDER.CONFIRMED],
      to: STATUSES.SALES_ORDER.CANCELLED,
      permission: PERMISSIONS.SALES_ORDER_CANCEL,
      notification: { targetRole: ROLES.PRODUCTION, title: 'Sales Order Cancelled', message: (doc) => `Sales Order ${doc.salesOrderNumber} was cancelled.` }
    }
  },

  PRODUCTION_ORDER: {
    release: {
      from: [STATUSES.PRODUCTION_ORDER.DRAFT],
      to: STATUSES.PRODUCTION_ORDER.RELEASED,
      permission: PERMISSIONS.PRODUCTION_RELEASE,
      notification: { targetRole: ROLES.STORE, title: 'Production Order Released', message: (doc) => `Production Order ${doc.productionOrderNumber} released. Material staging required.` }
    },
    start: {
      from: [STATUSES.PRODUCTION_ORDER.RELEASED, STATUSES.PRODUCTION_ORDER.MATERIAL_READY],
      to: STATUSES.PRODUCTION_ORDER.IN_PROGRESS,
      permission: PERMISSIONS.PRODUCTION_START,
      notification: { targetRole: ROLES.PRODUCTION, title: 'Production Operations Started', message: (doc) => `Production Order ${doc.productionOrderNumber} started on shop floor.` }
    },
    hold: {
      from: [STATUSES.PRODUCTION_ORDER.IN_PROGRESS],
      to: STATUSES.PRODUCTION_ORDER.ON_HOLD,
      permission: PERMISSIONS.PRODUCTION_HOLD,
      notification: { targetRole: ROLES.PRODUCTION, title: 'Production Order Placed on Hold', message: (doc) => `Production Order ${doc.productionOrderNumber} paused.` }
    },
    resume: {
      from: [STATUSES.PRODUCTION_ORDER.ON_HOLD],
      to: STATUSES.PRODUCTION_ORDER.IN_PROGRESS,
      permission: PERMISSIONS.PRODUCTION_START,
      notification: { targetRole: ROLES.PRODUCTION, title: 'Production Resumed', message: (doc) => `Production Order ${doc.productionOrderNumber} resumed.` }
    },
    complete: {
      from: [STATUSES.PRODUCTION_ORDER.RELEASED, STATUSES.PRODUCTION_ORDER.MATERIAL_READY, STATUSES.PRODUCTION_ORDER.IN_PROGRESS],
      to: STATUSES.PRODUCTION_ORDER.COMPLETED,
      permission: PERMISSIONS.PRODUCTION_COMPLETE,
      notification: { targetRole: ROLES.QA, title: 'Assembly Complete - Ready for QA', message: (doc) => `Production Order ${doc.productionOrderNumber} ready for cryogenic inspection.` }
    }
  }
};

class WorkflowService {
  /**
   * Executes authoritative workflow state transition
   */
  static async transition({
    entityType,
    entityId,
    action,
    payload = {},
    user,
    req = null
  }) {
    const Model = MODEL_MAP[entityType];
    if (!Model) {
      throw new AppError(`Unknown entity type: ${entityType}`, 400, 'INVALID_ENTITY_TYPE');
    }

    const doc = await Model.findById(entityId);
    if (!doc) {
      throw new AppError(`${entityType} not found with ID ${entityId}`, 404, 'RESOURCE_NOT_FOUND');
    }

    const entityTransitions = TRANSITIONS[entityType];
    if (!entityTransitions || !entityTransitions[action]) {
      throw new AppError(`Action '${action}' is not defined for ${entityType}`, 400, 'UNDEFINED_ACTION');
    }

    const transitionConfig = entityTransitions[action];

    // 1. Permission check (unless admin)
    if (user.role !== ROLES.ADMIN && transitionConfig.permission) {
      const userPermissions = user.permissions || [];
      if (!userPermissions.includes(transitionConfig.permission)) {
        throw new AppError(`Permission denied: Action requires [${transitionConfig.permission}]`, 403, 'FORBIDDEN');
      }
    }

    // 2. Validate current status
    const currentStatus = doc.status || doc.currentStatus;
    if (!transitionConfig.from.includes(currentStatus)) {
      throw new AppError(
        `Invalid status transition: Cannot '${action}' while status is '${currentStatus}'. Allowed starting statuses: [${transitionConfig.from.join(', ')}]`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // 3. Domain Precondition Validation
    if (transitionConfig.validate) {
      await transitionConfig.validate(doc, payload);
    }

    const previousStatus = currentStatus;
    const newStatus = transitionConfig.to;

    // 4. Update status and relevant document fields
    if (doc.status !== undefined) doc.status = newStatus;
    if (doc.currentStatus !== undefined) doc.currentStatus = newStatus;

    if (payload.remarks) doc.remarks = payload.remarks;
    if (payload.approvalRemarks) doc.approvalRemarks = payload.approvalRemarks;
    if (payload.holdReason) doc.holdReason = payload.holdReason;
    if (payload.cancellationReason) doc.cancellationReason = payload.cancellationReason;

    if (action === 'approve') {
      doc.approvedBy = user._id;
      doc.approvedAt = new Date();
    } else if (action === 'send') {
      doc.sentAt = new Date();
    } else if (action === 'accept') {
      doc.acceptedAt = new Date();
    } else if (action === 'releaseProduction') {
      doc.productionReleasedAt = new Date();
      doc.productionReleasedBy = user._id;
    }

    await doc.save();

    // 5. Create immutable audit log
    await AuditService.log({
      entityType,
      entityId,
      action: `${entityType}_${action.toUpperCase()}`,
      actorUserId: user._id,
      actorName: user.name,
      actorRole: user.role,
      previousStatus,
      newStatus,
      changedFields: { status: { from: previousStatus, to: newStatus }, ...payload },
      reason: payload.remarks || payload.reason || '',
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : ''
    });

    // 6. Dispatch notification
    if (transitionConfig.notification) {
      const notifMsg = typeof transitionConfig.notification.message === 'function'
        ? transitionConfig.notification.message(doc)
        : transitionConfig.notification.message;

      await NotificationService.notify({
        title: transitionConfig.notification.title,
        message: notifMsg,
        targetRole: transitionConfig.notification.targetRole,
        entityType,
        entityId: doc._id
      });
    }

    return doc;
  }
}

module.exports = WorkflowService;
