const express = require('express');
const multer = require('multer');
const router = express.Router();

// Middleware
const { authenticate } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const invoiceController = require('../controllers/invoiceController');
const inventoryController = require('../controllers/inventoryController');
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

// Account routes
router.post('/accounts/link-token', authenticate, accountController.createLinkToken);
router.post('/accounts/exchange-token', authenticate, accountController.exchangeToken);
router.get('/accounts', authenticate, accountController.getAccounts);
router.post('/accounts/sync', authenticate, accountController.syncTransactions);

// Transaction routes
router.get('/transactions', authenticate, transactionController.getTransactions);
router.get('/transactions/stats/summary', authenticate, transactionController.getStats);
router.get('/transactions/needs-review', authenticate, transactionController.getLowConfidenceTransactions);
router.get('/transactions/learned-patterns', authenticate, transactionController.getLearnedPatterns);
router.post('/transactions/bulk-recategorize', authenticate, transactionController.bulkRecategorize);
router.get('/transactions/:id', authenticate, transactionController.getTransaction);
router.put('/transactions/:id', authenticate, transactionController.updateTransaction);
router.put('/transactions/:id/correct-category', authenticate, transactionController.correctCategory);
router.delete('/transactions/learned-patterns/:merchantToken', authenticate, transactionController.deleteLearnedPattern);

// Invoice routes
router.post('/invoices', authenticate, invoiceController.createInvoice);
router.get('/invoices', authenticate, invoiceController.getInvoices);
router.get('/invoices/stats/summary', authenticate, invoiceController.getInvoiceStats);
router.get('/invoices/:id', authenticate, invoiceController.getInvoices);
router.put('/invoices/:id', authenticate, invoiceController.updateInvoice);
router.post('/invoices/:id/mark-paid', authenticate, invoiceController.markAsPaid);
router.post('/invoices/:id/chase', authenticate, invoiceController.chaseInvoice);

// Inventory routes
router.post('/inventory', authenticate, inventoryController.createItem);
router.get('/inventory', authenticate, inventoryController.getItems);
router.get('/inventory/low-stock', authenticate, inventoryController.getLowStockItems);
router.get('/inventory/stats', authenticate, inventoryController.getInventoryStats);
router.get('/inventory/:id', authenticate, inventoryController.getItems);
router.put('/inventory/:id', authenticate, inventoryController.updateItem);
router.post('/inventory/:id/adjust', authenticate, inventoryController.adjustStock);
router.delete('/inventory/:id', authenticate, inventoryController.deleteItem);

// Tax routes
router.get('/tax/scan', authenticate, taxController.scanDeductions);
router.get('/tax/deductions', authenticate, taxController.getDeductions);
router.put('/tax/deductions/:id', authenticate, taxController.updateDeduction);
router.get('/tax/summary', authenticate, taxController.getTaxSummary);
router.get('/tax/export', authenticate, taxController.exportDeductions);
router.post('/tax/scan-receipt', authenticate, upload.single('receipt'), taxController.scanReceipt);

// Profit First routes
router.get('/profit-first/settings', authenticate, profitFirstController.getSettings);
router.put('/profit-first/settings', authenticate, profitFirstController.updateSettings);
router.get('/profit-first/calculate', authenticate, profitFirstController.calculateSplits);
router.get('/profit-first/balances', authenticate, profitFirstController.getAccountBalances);
router.get('/profit-first/simulate', authenticate, profitFirstController.simulateSplit);

// Financing routes
router.get('/financing/options', authenticate, financingController.getFinancingOptions);
router.post('/financing/apply', authenticate, financingController.applyForFinancing);
router.get('/financing/applications/:applicationId', authenticate, financingController.getApplicationStatus);

// Forecast routes
router.post('/forecasts/generate', authenticate, forecastController.generateForecast);
router.get('/forecasts', authenticate, forecastController.getForecasts);

// Plaid routes (US/CA banks)
const plaidRoutes = require('./plaid');
router.use('/plaid', plaidRoutes);

// Setu routes (Indian banks)
const setuRoutes = require('./setu');
router.use('/setu', setuRoutes);

// Report routes
const reportRoutes = require('./reports');
router.use('/reports', reportRoutes);

// Test routes (for testing dashboard)
const testRoutes = require('./test');
router.use('/test', testRoutes);

// Mock data routes (for development with sample data)
const mockDataRoutes = require('./mockData');
router.use('/mock', mockDataRoutes);

module.exports = router;
