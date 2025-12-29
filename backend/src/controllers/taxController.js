// ====================
// backend/src/controllers/taxController.js
// ====================
const { TaxDeduction, Transaction, User } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiCategorizationService');
const taxDeductionService = require('../services/taxDeductionService');
const taxCalculationService = require('../services/taxCalculationService');

exports.scanDeductions = async (req, res) => {
  try {
    const { taxYear } = req.query;
    const year = taxYear || new Date().getFullYear();

    // Get transactions for the tax year
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const transactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        date: { [Op.between]: [startDate, endDate] },
        type: 'expense'
      }
    });

    // Use AI service to find potential deductions
    const potentialDeductions = await aiService.findTaxDeductions(transactions);

    // Get user for country-specific rules
    const user = await User.findByPk(req.userId);
    const country = user?.taxSettings?.country || 'US';
    const deductionRules = taxDeductionService.getDeductionRules(country);

    // Save new deductions with proper validation
    const savedDeductions = [];
    for (const deduction of potentialDeductions) {
      const existing = await TaxDeduction.findOne({
        where: {
          userId: req.userId,
          transactionId: deduction.transactionId,
          taxYear: year
        }
      });

      if (!existing) {
        // Get the rule for this deduction type
        const rule = deductionRules[deduction.deductionType];
        if (!rule) continue;

        const newDeduction = await TaxDeduction.create({
          userId: req.userId,
          transactionId: deduction.transactionId,
          category: deduction.category,
          deductionType: deduction.deductionType,
          amount: parseFloat(deduction.originalAmount) || 0,
          deductiblePercentage: rule.maxPercentage,
          actualDeductibleAmount: parseFloat(deduction.amount) || 0,
          description: deduction.description,
          date: deduction.date,
          taxYear: year,
          status: 'pending',
          aiSuggested: true,
          aiConfidence: parseFloat(deduction.confidence) || 0.7,
          notes: rule.notes
        });
        savedDeductions.push(newDeduction);
      }
    }

    // Calculate estimated savings using progressive tax rates
    const yearIncome = await Transaction.sum('amount', {
      where: {
        userId: req.userId,
        type: 'income',
        date: { [Op.between]: [startDate, endDate] }
      }
    });

    const savings = taxDeductionService.calculateEstimatedSavings(
      savedDeductions, 
      country, 
      parseFloat(yearIncome) || 75000
    );

    res.json({
      scanned: transactions.length,
      found: savedDeductions.length,
      deductions: savedDeductions,
      estimatedSavings: savings
    });
  } catch (error) {
    console.error('Scan deductions error:', error);
    res.status(500).json({ error: 'Failed to scan deductions', message: error.message });
  }
};

exports.getDeductions = async (req, res) => {
  try {
    const { taxYear, status } = req.query;
    const where = { userId: req.userId };

    if (taxYear) {
      where.taxYear = parseInt(taxYear);
    }

    if (status) {
      where.status = status;
    }

    const deductions = await TaxDeduction.findAll({
      where,
      include: [{ model: Transaction, attributes: ['description', 'merchantName'] }],
      order: [['date', 'DESC']]
    });

    res.json(deductions);
  } catch (error) {
    console.error('Get deductions error:', error);
    res.status(500).json({ error: 'Failed to fetch deductions' });
  }
};

exports.updateDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, amount } = req.body;

    const deduction = await TaxDeduction.findOne({
      where: { id, userId: req.userId }
    });

    if (!deduction) {
      return res.status(404).json({ error: 'Deduction not found' });
    }

    await deduction.update({
      status: status || deduction.status,
      notes: notes !== undefined ? notes : deduction.notes,
      amount: amount !== undefined ? amount : deduction.amount
    });

    res.json(deduction);
  } catch (error) {
    console.error('Update deduction error:', error);
    res.status(500).json({ error: 'Failed to update deduction' });
  }
};

exports.getTaxSummary = async (req, res) => {
  try {
    const { taxYear } = req.query;
    const year = taxYear || new Date().getFullYear();

    const deductions = await TaxDeduction.findAll({
      where: { 
        userId: req.userId,
        taxYear: year
      }
    });

    const totalDeductions = deductions.reduce((sum, d) => 
      sum + (parseFloat(d.actualDeductibleAmount) || parseFloat(d.amount) || 0), 0
    );

    const approved = deductions.filter(d => d.status === 'approved');
    const approvedTotal = approved.reduce((sum, d) => 
      sum + (parseFloat(d.actualDeductibleAmount) || parseFloat(d.amount) || 0), 0
    );

    const pending = deductions.filter(d => d.status === 'pending').length;

    const byCategory = {};
    deductions.forEach(d => {
      const category = d.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = 0;
      }
      byCategory[category] += parseFloat(d.actualDeductibleAmount) || parseFloat(d.amount) || 0;
    });

    // Get user country for progressive tax calculation
    const user = await User.findByPk(req.userId);
    const country = user?.taxSettings?.country || 'US';

    // Get year income for accurate tax calculation
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    const yearIncome = await Transaction.sum('amount', {
      where: {
        userId: req.userId,
        type: 'income',
        date: { [Op.between]: [startDate, endDate] }
      }
    });

    // Calculate savings using progressive tax rates
    const savings = taxDeductionService.calculateEstimatedSavings(
      approved,
      country,
      parseFloat(yearIncome) || 75000
    );

    res.json({
      taxYear: year,
      totalDeductions,
      approvedTotal,
      pendingCount: pending,
      byCategory,
      ...savings
    });
  } catch (error) {
    console.error('Get tax summary error:', error);
    res.status(500).json({ error: 'Failed to fetch tax summary' });
  }
};

exports.exportDeductions = async (req, res) => {
  try {
    const { taxYear } = req.query;
    const year = taxYear || new Date().getFullYear();

    const deductions = await TaxDeduction.findAll({
      where: { 
        userId: req.userId,
        taxYear: year,
        status: 'approved'
      },
      include: [{ model: Transaction }],
      order: [['date', 'ASC']]
    });

    // Format for CSV export
    const csvData = deductions.map(d => ({
      Date: d.date,
      Category: d.category,
      Description: d.description,
      Amount: d.amount,
      Confidence: d.aiConfidence
    }));

    res.json(csvData);
  } catch (error) {
    console.error('Export deductions error:', error);
    res.status(500).json({ error: 'Failed to export deductions' });
  }
};

exports.scanReceipt = async (req, res) => {
  try {
    const receiptScannerService = require('../services/receiptScannerService');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt image provided' });
    }

    const scannedData = await receiptScannerService.scanReceipt(req.file.buffer);

    // Create tax deduction from scanned receipt
    const deduction = await TaxDeduction.create({
      userId: req.userId,
      category: scannedData.category,
      amount: scannedData.total,
      description: scannedData.description,
      date: scannedData.date,
      taxYear: new Date(scannedData.date).getFullYear(),
      status: 'pending',
      aiSuggested: true,
      aiConfidence: scannedData.confidence,
      notes: `Scanned from receipt: ${scannedData.merchant}`,
      scanSource: 'receipt_upload'
    });

    res.json({
      deduction,
      scannedData
    });
  } catch (error) {
    console.error('Scan receipt error:', error);
    res.status(500).json({ error: 'Failed to scan receipt' });
  }
};

// Run weekly deduction scan manually
exports.runWeeklyScan = async (req, res) => {
  try {
    const result = await taxDeductionService.weeklyDeductionScan(req.userId);
    res.json(result);
  } catch (error) {
    console.error('Weekly scan error:', error);
    res.status(500).json({ error: 'Failed to run weekly scan' });
  }
};

// Get deduction rules
exports.getDeductionRules = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    const country = user.taxSettings?.country || 'US';
    const rules = taxDeductionService.getDeductionRules(country);
    res.json(rules);
  } catch (error) {
    console.error('Get deduction rules error:', error);
    res.status(500).json({ error: 'Failed to fetch deduction rules' });
  }
};

// Generate tax report
exports.generateTaxReport = async (req, res) => {
  try {
    const { taxYear } = req.query;
    const year = taxYear || new Date().getFullYear();
    const report = await taxDeductionService.generateTaxReport(req.userId, year);
    res.json(report);
  } catch (error) {
    console.error('Generate tax report error:', error);
    res.status(500).json({ error: 'Failed to generate tax report' });
  }
};

// Update tax settings
exports.updateTaxSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    const currentSettings = user.taxSettings || {};
    
    await user.update({
      taxSettings: {
        ...currentSettings,
        ...req.body
      }
    });

    res.json(user.taxSettings);
  } catch (error) {
    console.error('Update tax settings error:', error);
    res.status(500).json({ error: 'Failed to update tax settings' });
  }
};

// Get tax settings
exports.getTaxSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    res.json(user.taxSettings || {});
  } catch (error) {
    console.error('Get tax settings error:', error);
    res.status(500).json({ error: 'Failed to fetch tax settings' });
  }
};

// Calculate tax for invoice
exports.calculateInvoiceTax = async (req, res) => {
  try {
    const { subtotal, country, stateOrProvince } = req.body;
    
    if (!subtotal || !country || !stateOrProvince) {
      return res.status(400).json({ 
        error: 'Missing required fields: subtotal, country, stateOrProvince' 
      });
    }

    const taxCalc = taxCalculationService.calculateInvoiceTax(
      parseFloat(subtotal),
      country,
      stateOrProvince
    );

    // Check for validation errors
    if (taxCalc.error) {
      return res.status(400).json(taxCalc);
    }

    res.json(taxCalc);
  } catch (error) {
    console.error('Calculate invoice tax error:', error);
    res.status(500).json({ error: 'Failed to calculate tax', message: error.message });
  }
};

// Get valid jurisdictions for a country
exports.getValidJurisdictions = async (req, res) => {
  try {
    const { country } = req.query;
    
    if (!country) {
      return res.status(400).json({ error: 'Country parameter required' });
    }

    const jurisdictions = taxCalculationService.getValidJurisdictions(country);
    
    if (jurisdictions.error) {
      return res.status(400).json(jurisdictions);
    }

    res.json(jurisdictions);
  } catch (error) {
    console.error('Get valid jurisdictions error:', error);
    res.status(500).json({ error: 'Failed to fetch jurisdictions' });
  }
};
