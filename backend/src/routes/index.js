const express = require('express');
const multer = require('multer');
const router = express.Router();

// Middleware
const { authenticate } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/checkSubscription');

// Controllers
const authController = require('../controllers/authController');
const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const invoiceController = require('../controllers/invoiceController');
const taxController = require('../controllers/taxController');
const profitFirstController = require('../controllers/profitFirstController');
const financingController = require('../controllers/financingController');
const forecastController = require('../controllers/forecastController');

// Multer setup for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', authenticate, authController.getProfile);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.get('/auth/me', authenticate, authController.getMe);

// Google OAuth routes
const googleAuthRoutes = require('./googleAuth');
router.use('/auth', googleAuthRoutes);

// PayPal payment routes
const paypalRoutes = require('./paypal');
router.use('/paypal', paypalRoutes);

// Account routes
router.post('/accounts/link-token', authenticate, checkSubscription, accountController.createLinkToken);
router.post('/accounts/exchange-token', authenticate, checkSubscription, accountController.exchangeToken);
router.get('/accounts', authenticate, checkSubscription, accountController.getAccounts);
router.post('/accounts/sync', authenticate, checkSubscription, accountController.syncTransactions);
router.delete('/accounts/:accountId', authenticate, checkSubscription, accountController.deleteAccount);

// Transaction routes
router.get('/transactions', authenticate, checkSubscription, transactionController.getTransactions);
router.get('/transactions/stats/summary', authenticate, checkSubscription, transactionController.getStats);
router.get('/transactions/needs-review', authenticate, checkSubscription, transactionController.getLowConfidenceTransactions);
router.get('/transactions/learned-patterns', authenticate, checkSubscription, transactionController.getLearnedPatterns);
router.post('/transactions/bulk-recategorize', authenticate, checkSubscription, transactionController.bulkRecategorize);
router.get('/transactions/:id', authenticate, checkSubscription, transactionController.getTransaction);
router.put('/transactions/:id', authenticate, checkSubscription, transactionController.updateTransaction);
router.put('/transactions/:id/correct-category', authenticate, checkSubscription, transactionController.correctCategory);
router.delete('/transactions/learned-patterns/:merchantToken', authenticate, checkSubscription, transactionController.deleteLearnedPattern);

// Invoice routes
router.post('/invoices', authenticate, checkSubscription, invoiceController.createInvoice);
router.get('/invoices', authenticate, checkSubscription, invoiceController.getInvoices);
router.get('/invoices/stats/summary', authenticate, checkSubscription, invoiceController.getInvoiceStats);
router.get('/invoices/:id', authenticate, checkSubscription, invoiceController.getInvoices);
router.get('/invoices/:id/reminders', authenticate, checkSubscription, invoiceController.getInvoiceReminders);
router.put('/invoices/:id', authenticate, checkSubscription, invoiceController.updateInvoice);
router.post('/invoices/:id/mark-paid', authenticate, checkSubscription, invoiceController.markAsPaid);
router.post('/invoices/:id/chase', authenticate, checkSubscription, invoiceController.chaseInvoice);
router.delete('/invoices/:id', authenticate, checkSubscription, invoiceController.deleteInvoice);

// Tax routes
router.get('/tax/scan', authenticate, checkSubscription, taxController.scanDeductions);
router.post('/tax/weekly-scan', authenticate, checkSubscription, taxController.runWeeklyScan);
router.get('/tax/deductions', authenticate, checkSubscription, taxController.getDeductions);
router.put('/tax/deductions/:id', authenticate, checkSubscription, taxController.updateDeduction);
router.get('/tax/summary', authenticate, checkSubscription, taxController.getTaxSummary);
router.get('/tax/export', authenticate, checkSubscription, taxController.exportDeductions);
router.get('/tax/report', authenticate, checkSubscription, taxController.generateTaxReport);
router.get('/tax/deduction-rules', authenticate, checkSubscription, taxController.getDeductionRules);
router.get('/tax/settings', authenticate, checkSubscription, taxController.getTaxSettings);
router.put('/tax/settings', authenticate, checkSubscription, taxController.updateTaxSettings);
router.post('/tax/calculate-invoice-tax', authenticate, checkSubscription, taxController.calculateInvoiceTax);
router.get('/tax/jurisdictions', authenticate, checkSubscription, taxController.getValidJurisdictions);
router.post('/tax/scan-receipt', authenticate, checkSubscription, upload.single('receipt'), taxController.scanReceipt);

// Profit First routes
router.get('/profit-first/settings', authenticate, checkSubscription, profitFirstController.getSettings);
router.put('/profit-first/settings', authenticate, checkSubscription, profitFirstController.updateSettings);
router.get('/profit-first/calculate', authenticate, checkSubscription, profitFirstController.calculateSplits);
router.get('/profit-first/balances', authenticate, checkSubscription, profitFirstController.getAccountBalances);
router.get('/profit-first/simulate', authenticate, checkSubscription, profitFirstController.simulateSplit);

// Financing routes
router.get('/financing/options', authenticate, checkSubscription, financingController.getFinancingOptions);
router.post('/financing/apply', authenticate, checkSubscription, financingController.applyForFinancing);
router.get('/financing/applications/:applicationId', authenticate, checkSubscription, financingController.getApplicationStatus);

// Forecast routes
router.post('/forecasts/generate', authenticate, checkSubscription, forecastController.generateForecast);
router.get('/forecasts', authenticate, checkSubscription, forecastController.getForecasts);

// Plaid routes (US/CA banks)
const plaidRoutes = require('./plaid');
router.use('/plaid', plaidRoutes);

// Report routes
const reportRoutes = require('./reports');
router.use('/reports', reportRoutes);

module.exports = router;
