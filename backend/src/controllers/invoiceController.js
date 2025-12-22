// ====================
// backend/src/controllers/invoiceController.js
// ====================
const { Invoice, User } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const reminderScheduler = require('../services/reminderScheduler');

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

    // Send initial invoice email
    if (clientEmail) {
      const user = await User.findByPk(req.userId);
      await emailService.sendInvoiceCreated(invoice, user);
    }

    // Schedule automatic reminders
    await reminderScheduler.scheduleRemindersForInvoice(invoice);

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

    // Check if due date changed
    const dueDateChanged = updates.dueDate && 
      new Date(updates.dueDate).getTime() !== new Date(invoice.dueDate).getTime();

    await invoice.update(updates);

    // Reschedule reminders if due date changed
    if (dueDateChanged && invoice.status !== 'paid' && invoice.status !== 'cancelled') {
      await reminderScheduler.rescheduleRemindersForInvoice(invoice);
    }

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

    // Cancel all pending reminders
    await reminderScheduler.cancelRemindersForInvoice(invoice.id);

    // Send payment confirmation email
    if (invoice.clientEmail) {
      const user = await User.findByPk(req.userId);
      await emailService.sendPaymentConfirmation(invoice, user);
    }

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

exports.getInvoiceReminders = async (req, res) => {
  try {
    const { id } = req.params;
    const { InvoiceReminder } = require('../models');

    const invoice = await Invoice.findOne({
      where: { id, userId: req.userId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const reminders = await InvoiceReminder.findAll({
      where: { invoiceId: id },
      order: [['scheduledDate', 'ASC']]
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get invoice reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { InvoiceReminder } = require('../models');

    const invoice = await Invoice.findOne({
      where: { id, userId: req.userId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Only allow deletion of paid invoices
    if (invoice.status !== 'paid') {
      return res.status(400).json({ 
        error: 'Only paid invoices can be deleted. Cancel unpaid invoices instead.' 
      });
    }

    // Delete all associated invoice reminders first
    await InvoiceReminder.destroy({
      where: { invoiceId: id }
    });

    // Cancel any pending reminders in scheduler
    await reminderScheduler.cancelRemindersForInvoice(invoice.id);

    // Now delete the invoice
    await invoice.destroy();

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};
