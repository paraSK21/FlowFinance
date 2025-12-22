// Tax routes
const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const auth = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Deduction scanning
router.post('/scan-deductions', auth, taxController.scanDeductions);
router.post('/weekly-scan', auth, taxController.runWeeklyScan);
router.post('/scan-receipt', auth, upload.single('receipt'), taxController.scanReceipt);

// Deduction management
router.get('/deductions', auth, taxController.getDeductions);
router.put('/deductions/:id', auth, taxController.updateDeduction);
router.get('/deduction-rules', auth, taxController.getDeductionRules);

// Tax summary and reports
router.get('/summary', auth, taxController.getTaxSummary);
router.get('/report', auth, taxController.generateTaxReport);
router.get('/export', auth, taxController.exportDeductions);

// Tax settings
router.get('/settings', auth, taxController.getTaxSettings);
router.put('/settings', auth, taxController.updateTaxSettings);

// Invoice tax calculation
router.post('/calculate-invoice-tax', auth, taxController.calculateInvoiceTax);

module.exports = router;
