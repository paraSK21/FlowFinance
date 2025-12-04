// ====================
// backend/src/controllers/invoiceController.js
// ====================
const { Invoice } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

exports.createInvoice = async (req, res) => {
  try {
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      amount, 
      dueDate, 
      description, 
      lineItems,
      autoChaseEnabled 
    } = req.body;

    // Generate invoice number
    const lastInvoice = await Invoice.findOne({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });

    const invoiceNumber = lastInvoice 
      ? `INV-${parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1}`
      : 'INV-1001';

    const invoice = await Invoice.create({
      userId: req.userId,
      invoiceNumber,
      clientName,
      clientEmail,
      clientPhone,
      amount,
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      status: 'sent',
      description,
      lineItems: lineItems || [],
      autoChaseEnabled: autoChaseEnabled !== false
    });

    // Send initial invoice notification
    if (clientEmail) {
      await notificationService.sendInvoiceEmail(invoice);
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const where = { userId: req.userId };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.dueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const invoices = await Invoice.findAll({
      where,
      order: [['dueDate', 'DESC']]
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const invoice = await Invoice.findOne({
      where: { id, userId: req.userId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await invoice.update(updates);
    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paidDate } = req.body;

    const invoice = await Invoice.findOne({
      where: { id, userId: req.userId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await invoice.update({
      status: 'paid',
      paidAmount: paidAmount || invoice.amount,
      paidDate: paidDate || new Date()
    });

    res.json(invoice);
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
};

exports.chaseInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findOne({
      where: { id, userId: req.userId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    // Send chase notification
    await notificationService.sendInvoiceChase(invoice);

    await invoice.update({
      lastChaseDate: new Date(),
      chaseCount: invoice.chaseCount + 1
    });

    res.json({ message: 'Chase notification sent', invoice });
  } catch (error) {
    console.error('Chase invoice error:', error);
    res.status(500).json({ error: 'Failed to chase invoice' });
  }
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const totalDue = await Invoice.sum('amount', {
      where: { 
        userId: req.userId, 
        status: { [Op.in]: ['sent', 'overdue'] }
      }
    });

    const overdue = await Invoice.count({
      where: { 
        userId: req.userId, 
        status: 'overdue'
      }
    });

    const paid = await Invoice.sum('paidAmount', {
      where: { 
        userId: req.userId, 
        status: 'paid'
      }
    });

    res.json({
      totalDue: totalDue || 0,
      overdueCount: overdue,
      totalPaid: paid || 0
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice stats' });
  }
};
