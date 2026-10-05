const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const errorHandler = require('./middlewares/errorHandler');
const { AppError } = require('./utils/apiResponse');

// Routes
const authRoutes = require('./routes/authRoutes');
const masterRoutes = require('./routes/masterRoutes');
const leadRoutes = require('./routes/leadRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const customerPoRoutes = require('./routes/customerPoRoutes');
const salesOrderRoutes = require('./routes/salesOrderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const productionRoutes = require('./routes/productionRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const qaRoutes = require('./routes/qaRoutes');
const serialRoutes = require('./routes/serialRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

// Security and utility middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(compression());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'CryoTech ERP Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount module routes
app.use('/api/auth', authRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/customer-pos', customerPoRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/serials', serialRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/system', systemRoutes);

// Catch unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404, 'ROUTE_NOT_FOUND'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
