const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

// Products
router.get('/products', masterController.getProducts);
router.post('/products', authorize(PERMISSIONS.MASTERS_MANAGE), masterController.createProduct);

// Customers
router.get('/customers', masterController.getCustomers);
router.post('/customers', authorize(PERMISSIONS.CUSTOMER_CREATE), masterController.createCustomer);

// Vendors
router.get('/vendors', masterController.getVendors);
router.post('/vendors', authorize(PERMISSIONS.MASTERS_MANAGE), masterController.createVendor);

// Warehouses
router.get('/warehouses', masterController.getWarehouses);
router.post('/warehouses', authorize(PERMISSIONS.MASTERS_MANAGE), masterController.createWarehouse);

// Work Centers
router.get('/work-centers', masterController.getWorkCenters);
router.post('/work-centers', authorize(PERMISSIONS.MASTERS_MANAGE), masterController.createWorkCenter);

// Terms
router.get('/terms', masterController.getTerms);
router.post('/terms', authorize(PERMISSIONS.MASTERS_MANAGE), masterController.createTerm);

module.exports = router;
