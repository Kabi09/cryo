require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP listener
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[CryoTech ERP] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[API Base] http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('[Startup Error]', err);
});
