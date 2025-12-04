const stripeService = require('../services/stripeService');
const razorpayService = require('../services/razorpayService');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const whatsappService = require('../services/whatsappService');
const socketService = require('../socket');

exports.createPaymentLink = async (req, res) => {
  try {
    const { invoiceId, provider = 'stripe' } = req.body;
    const userId = req.userId;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId },
      include: [{ model: User, as: 'user' }],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    let paymentLink;
    if (provider === 'razorpay') {
      paymentLink = await razorpayService.createPaymentLink(invoice);
    } else {
      paymentLink = await stripeService.createPaymentLink(invoice);
    }

    // Send invoice with payment link
    if (invoice.clientEmail) {
      await emailService.sendInvoiceCreated(invoice, invoice.user);
    }

    // Emit real-time update
    socketService.emitInvoiceUpdated(userId, invoice);

    res.json({
      success: true,
      paymentLink,
      message: 'Payment link created successfully',
    });
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    await stripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = razorpayService.verifyWebhookSignature(
      JSON.stringify(req.body),
      signature
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    await razorpayService.handleWebhook(req.body);

    res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { invoiceId, paymentId, provider = 'stripe' } = req.body;
    const userId = req.userId;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId },
      include: [{ model: User, as: 'user' }],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    let paymentStatus;
    if (provider === 'razorpay') {
      paymentStatus = await razorpayService.getPaymentStatus(paymentId);
    } else {
      paymentStatus = await stripeService.getPaymentStatus(paymentId);
    }

    res.json({
      success: true,
      paymentStatus,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { invoiceId, amount, provider = 'stripe' } = req.body;
    const userId = req.userId;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'paid') {
      return res.status(400).json({ error: 'Invoice is not paid' });
    }

    const paymentId = provider === 'razorpay' 
      ? invoice.razorpayPaymentId 
      : invoice.stripePaymentId;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID not found' });
    }

    let refund;
    if (provider === 'razorpay') {
      refund = await razorpayService.createRefund(paymentId, amount);
    } else {
      refund = await stripeService.createRefund(paymentId, amount);
    }

    // Update invoice status
    await invoice.update({
      status: 'refunded',
      refundAmount: refund.amount,
      refundDate: new Date(),
    });

    // Emit real-time update
    socketService.emitInvoiceUpdated(userId, invoice);

    res.json({
      success: true,
      refund,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.sendPaymentReminder = async (req, res) => {
  try {
    const { invoiceId, channels = ['email'] } = req.body;
    const userId = req.userId;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId },
      include: [{ model: User, as: 'user' }],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));

    const results = {};

    // Send via requested channels
    if (channels.includes('email') && invoice.clientEmail) {
      try {
        await emailService.sendInvoiceReminder(invoice, invoice.user, daysOverdue);
        results.email = { success: true };
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    if (channels.includes('sms') && invoice.clientPhone) {
      try {
        await smsService.sendInvoiceReminder(invoice, invoice.user);
        results.sms = { success: true };
      } catch (error) {
        results.sms = { success: false, error: error.message };
      }
    }

    if (channels.includes('whatsapp') && invoice.clientPhone) {
      try {
        await whatsappService.sendInvoiceReminder(invoice, invoice.user, daysOverdue);
        results.whatsapp = { success: true };
      } catch (error) {
        results.whatsapp = { success: false, error: error.message };
      }
    }

    // Update chase tracking
    await invoice.update({
      lastChaseDate: new Date(),
      chaseCount: (invoice.chaseCount || 0) + 1,
    });

    res.json({
      success: true,
      results,
      message: 'Payment reminder sent',
    });
  } catch (error) {
    console.error('Send payment reminder error:', error);
    res.status(500).json({ error: error.message });
  }
};
