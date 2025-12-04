require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const db = require('./models');
const routes = require('./routes');
const { autoChaseInvoices, checkLowStock } = require('./services/cronService');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Cron jobs
// Auto-chase overdue invoices daily at 9 AM
cron.schedule('0 9 * * *', autoChaseInvoices);

// Check low stock daily at 8 AM
cron.schedule('0 8 * * *', checkLowStock);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Start job scheduler
const jobScheduler = require('./jobs/scheduler');
const socketService = require('./socket');

// Database sync and server start
db.sequelize.sync({ alter: false }).then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize WebSocket
    socketService.initialize(server);
    
    // Start background jobs
    jobScheduler.start();
  });
}).catch(err => {
  console.error('Database connection error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  jobScheduler.stop();
  process.exit(0);
});

module.exports = app;
