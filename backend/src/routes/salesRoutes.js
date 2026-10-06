const express = require('express');
const router = express.Router();

const masterController = require('../controllers/masterController');
const leadRoutes = require('./leadRoutes');
const quotationRoutes = require('./quotationRoutes');
const customerPoRoutes = require('./customerPoRoutes');
const salesOrderRoutes = require('./salesOrderRoutes');
const paymentRoutes = require('./paymentRoutes');
const { authenticate, authorize } = require('../middlewares/auth');
const PERMISSIONS = require('../constants/permissions');

router.use(authenticate);

// Customers alias under /api/sales/customers
router.get('/customers', masterController.getCustomers);
router.post('/customers', authorize(PERMISSIONS.CUSTOMER_CREATE), masterController.createCustomer);

// Submodules under /api/sales/*
router.use('/leads', leadRoutes);
router.use('/quotations', quotationRoutes);
router.use('/customer-pos', customerPoRoutes);
router.use('/orders', salesOrderRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
