// ====================
// backend/src/controllers/taxController.js
// ====================
const { TaxDeduction, Transaction } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');

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

    // Save new deductions
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
        const newDeduction = await TaxDeduction.create({
          userId: req.userId,
          transactionId: deduction.transactionId,
          category: deduction.category,
          amount: deduction.amount,
          description: deduction.description,
          date: deduction.date,
          taxYear: year,
          status: 'pending',
          aiSuggested: true,
          aiConfidence: deduction.confidence
        });
        savedDeductions.push(newDeduction);
      }
    }

    res.json({
      scanned: transactions.length,
      found: savedDeductions.length,
      deductions: savedDeductions
    });
  } catch (error) {
    console.error('Scan deductions error:', error);
    res.status(500).json({ error: 'Failed to scan deductions' });
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
      sum + parseFloat(d.amount || 0), 0
    );

    const approved = deductions.filter(d => d.status === 'approved');
    const approvedTotal = approved.reduce((sum, d) => 
      sum + parseFloat(d.amount || 0), 0
    );

    const pending = deductions.filter(d => d.status === 'pending').length;

    const byCategory = {};
    deductions.forEach(d => {
      if (!byCategory[d.category]) {
        byCategory[d.category] = 0;
      }
      byCategory[d.category] += parseFloat(d.amount || 0);
    });

    res.json({
      taxYear: year,
      totalDeductions,
      approvedTotal,
      pendingCount: pending,
      byCategory,
      estimatedSavings: approvedTotal * 0.25 // Assuming 25% tax rate
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
      notes: `Scanned from receipt: ${scannedData.merchant}`
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
