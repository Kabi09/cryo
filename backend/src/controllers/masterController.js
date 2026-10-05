const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const Warehouse = require('../models/Warehouse');
const WorkCenter = require('../models/WorkCenter');
const TermMaster = require('../models/TermMaster');
const { ApiResponse, AppError } = require('../utils/apiResponse');

// --- Products ---
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    const products = await Product.find(filter).sort({ name: 1 });
    return ApiResponse.success(res, 'Products fetched', { products });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();
    return ApiResponse.created(res, 'Product created', { product });
  } catch (err) {
    next(err);
  }
};

// --- Customers ---
exports.getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(filter).sort({ companyName: 1 });
    return ApiResponse.success(res, 'Customers fetched', { customers });
  } catch (err) {
    next(err);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    return ApiResponse.created(res, 'Customer created', { customer });
  } catch (err) {
    next(err);
  }
};

// --- Vendors ---
exports.getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).sort({ companyName: 1 });
    return ApiResponse.success(res, 'Vendors fetched', { vendors });
  } catch (err) {
    next(err);
  }
};

exports.createVendor = async (req, res, next) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    return ApiResponse.created(res, 'Vendor created', { vendor });
  } catch (err) {
    next(err);
  }
};

// --- Warehouses ---
exports.getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    return ApiResponse.success(res, 'Warehouses fetched', { warehouses });
  } catch (err) {
    next(err);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();
    return ApiResponse.created(res, 'Warehouse created', { warehouse });
  } catch (err) {
    next(err);
  }
};

// --- Work Centers ---
exports.getWorkCenters = async (req, res, next) => {
  try {
    const workCenters = await WorkCenter.find({ isActive: true }).sort({ name: 1 });
    return ApiResponse.success(res, 'Work centers fetched', { workCenters });
  } catch (err) {
    next(err);
  }
};

exports.createWorkCenter = async (req, res, next) => {
  try {
    const workCenter = new WorkCenter(req.body);
    await workCenter.save();
    return ApiResponse.created(res, 'Work center created', { workCenter });
  } catch (err) {
    next(err);
  }
};

// --- Terms ---
exports.getTerms = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const terms = await TermMaster.find(filter).sort({ title: 1 });
    return ApiResponse.success(res, 'Terms fetched', { terms });
  } catch (err) {
    next(err);
  }
};

exports.createTerm = async (req, res, next) => {
  try {
    const term = new TermMaster(req.body);
    await term.save();
    return ApiResponse.created(res, 'Term created', { term });
  } catch (err) {
    next(err);
  }
};
