const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');
const cron = require('node-cron');
const db = require('./models');
const routes = require('./routes');
const { autoChaseInvoices } = require('./services/cronService');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true 
}));

// Session configuration for passport
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Body parsing - IMPORTANT: Stripe webhook needs raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check (both paths for convenience)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api', routes);

// Cron jobs - only run when not on Vercel (serverless doesn't support cron)
if (process.env.VERCEL !== '1') {
  cron.schedule('0 9 * * *', autoChaseInvoices);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Check if running on Vercel (serverless)
const isVercel = process.env.VERCEL === '1';

// Only run server startup logic when NOT on Vercel
if (!isVercel) {
  const jobScheduler = require('./jobs/scheduler');
  const socketService = require('./socket');

  // Database sync and server start
  const syncOptions = process.env.NODE_ENV === 'production'
    ? { alter: false } // Never alter in production - use migrations
    : { alter: false };  // Changed to false for faster startup

  db.sequelize.sync(syncOptions).then(async () => {
    console.log('Database connection established');

    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Backend URL: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);

      // Initialize WebSocket
      socketService.initialize(server);

      // Start background jobs
      jobScheduler.start();
    });
  }).catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    jobScheduler.stop();
    process.exit(0);
  });
}

// Export app for Vercel serverless functions
module.exports = app;
