const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const STATUSES = require('../constants/statuses');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ROLES = require('../constants/roles');

exports.getLeads = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { leadNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const leads = await Lead.find(filter).populate('assignedTo', 'name email').sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Leads fetched', { leads });
  } catch (err) {
    next(err);
  }
};

exports.getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('qualifiedCustomerId');
    if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
    return ApiResponse.success(res, 'Lead details', { lead });
  } catch (err) {
    next(err);
  }
};

exports.createLead = async (req, res, next) => {
  try {
    const leadNumber = `LEAD-${Date.now().toString().slice(-6)}`;
    const lead = new Lead({
      ...req.body,
      leadNumber,
      assignedTo: req.body.assignedTo || req.user._id
    });
    await lead.save();

    await AuditService.log({
      entityType: 'LEAD',
      entityId: lead._id,
      action: 'LEAD_CREATED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus: null,
      newStatus: STATUSES.LEAD.NEW,
      reason: 'New enquiry logged'
    });

    return ApiResponse.created(res, 'Lead created successfully', { lead });
  } catch (err) {
    next(err);
  }
};

exports.updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
    return ApiResponse.success(res, 'Lead updated', { lead });
  } catch (err) {
    next(err);
  }
};

exports.qualifyLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');

    if (lead.status === STATUSES.LEAD.QUALIFIED) {
      throw new AppError('Lead is already qualified', 400, 'ALREADY_QUALIFIED');
    }

    // Create Customer record if not already present
    let customer = await Customer.findOne({ email: lead.email });
    if (!customer) {
      const customerCode = `CUST-${Date.now().toString().slice(-5)}`;
      customer = new Customer({
        customerCode,
        companyName: lead.companyName,
        contactPerson: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        status: STATUSES.CUSTOMER.ACTIVE
      });
      await customer.save();
    }

    const previousStatus = lead.status;
    lead.status = STATUSES.LEAD.QUALIFIED;
    lead.qualifiedCustomerId = customer._id;
    lead.qualifiedAt = new Date();
    await lead.save();

    await AuditService.log({
      entityType: 'LEAD',
      entityId: lead._id,
      action: 'LEAD_QUALIFIED',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus,
      newStatus: STATUSES.LEAD.QUALIFIED,
      reason: `Converted to Customer: ${customer.companyName}`
    });

    await NotificationService.notify({
      title: 'Lead Qualified',
      message: `Lead ${lead.leadNumber} (${lead.companyName}) has been qualified as customer ${customer.customerCode}.`,
      targetRole: ROLES.SALES,
      entityType: 'LEAD',
      entityId: lead._id
    });

    return ApiResponse.success(res, 'Lead qualified successfully', { lead, customer });
  } catch (err) {
    next(err);
  }
};

exports.loseLead = async (req, res, next) => {
  try {
    const { lostReason } = req.body;
    if (!lostReason) throw new AppError('Reason for lost lead is required', 400, 'MISSING_REASON');

    const lead = await Lead.findById(req.params.id);
    if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');

    const previousStatus = lead.status;
    lead.status = STATUSES.LEAD.LOST;
    lead.lostReason = lostReason;
    await lead.save();

    await AuditService.log({
      entityType: 'LEAD',
      entityId: lead._id,
      action: 'LEAD_LOST',
      actorUserId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      previousStatus,
      newStatus: STATUSES.LEAD.LOST,
      reason: lostReason
    });

    return ApiResponse.success(res, 'Lead marked as lost', { lead });
  } catch (err) {
    next(err);
  }
};
