/**
 * Reports Routes
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Report endpoints
router.get('/profit-loss', reportController.getProfitLoss);
router.get('/cash-flow', reportController.getCashFlow);
router.get('/sales', reportController.getSales);
router.get('/expenses', reportController.getExpenses);
router.get('/tax-summary', reportController.getTaxSummary);
router.get('/dashboard', reportController.getDashboardSummary);

// Export endpoints
router.get('/export/pdf', reportController.exportPDF);
router.get('/export/csv', reportController.exportCSV);

module.exports = router;
