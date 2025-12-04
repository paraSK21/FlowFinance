const Razorpay = require('razorpay');
const Invoice = require('../models/Invoice');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    this.isConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    
    if (this.isConfigured) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      console.warn('Razorpay not configured');
    }
  }

  async createPaymentLink(invoice) {
    if (!this.isConfigured) {
      throw new Error('Razorpay not configured');
    }

    try {
      const paymentLink = await this.razorpay.paymentLink.create({
        amount: Math.round(parseFloat(invoice.amount) * 100), // Convert to paise
        currency: 'INR',
        description: invoice.description || `Payment for invoice ${invoice.invoiceNumber}`,
        customer: {
          name: invoice.clientName,
          email: invoice.clientEmail,
          contact: invoice.clientPhone,
        },
        notify: {
          sms: !!invoice.clientPhone,
          email: !!invoice.clientEmail,
        },
        reminder_enable: true,
        notes: {
          invoiceId: invoice.id.toString(),
          invoiceNumber: invoice.invoiceNumber,
        },
        callback_url: `${process.env.FRONTEND_URL}/invoices/${invoice.id}/success`,
        callback_method: 'get',
      });

      // Update invoice with payment link
      await invoice.update({
        paymentLink: paymentLink.short_url,
        razorpayPaymentLinkId: paymentLink.id,
      });

      return {
        url: paymentLink.short_url,
        id: paymentLink.id,
      };
    } catch (error) {
      console.error('Razorpay create payment link error:', error);
      throw new Error('Failed to create payment link');
    }
  }

  async createOrder(invoice) {
    if (!this.isConfigured) {
      throw new Error('Razorpay not configured');
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(parseFloat(invoice.amount) * 100),
        currency: 'INR',
        receipt: invoice.invoiceNumber,
        notes: {
          invoiceId: invoice.id.toString(),
          invoiceNumber: invoice.invoiceNumber,
        },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new Error('Failed to create order');
    }
  }

  async verifyPaymentSignature(orderId, paymentId, signature) {
    if (!this.isConfigured) {
      throw new Error('Razorpay not configured');
    }

    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Razorpay verify signature error:', error);
      return false;
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;
        case 'payment_link.paid':
          await this.handlePaymentLinkPaid(event.payload.payment_link.entity);
          break;
        default:
          console.log(`Unhandled Razorpay event: ${event.event}`);
      }
    } catch (error) {
      console.error('Razorpay webhook handling error:', error);
      throw error;
    }
  }

  async handlePaymentCaptured(payment) {
    const invoiceId = payment.notes?.invoiceId;

    if (!invoiceId) {
      console.error('No invoice ID in payment notes');
      return;
    }

    const invoice = await Invoice.findByPk(invoiceId);

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`);
      return;
    }

    await invoice.update({
      status: 'paid',
      paidDate: new Date(),
      paidAmount: payment.amount / 100,
      razorpayPaymentId: payment.id,
    });

    console.log(`Invoice ${invoice.invoiceNumber} marked as paid via Razorpay`);
  }

  async handlePaymentFailed(payment) {
    console.log(`Razorpay payment failed: ${payment.id}`);
    // TODO: Notify user of failed payment
  }

  async handlePaymentLinkPaid(paymentLink) {
    const invoiceId = paymentLink.notes?.invoiceId;

    if (!invoiceId) {
      console.error('No invoice ID in payment link notes');
      return;
    }

    const invoice = await Invoice.findByPk(invoiceId);

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`);
      return;
    }

    await invoice.update({
      status: 'paid',
      paidDate: new Date(),
      paidAmount: paymentLink.amount_paid / 100,
    });

    console.log(`Invoice ${invoice.invoiceNumber} marked as paid via Razorpay payment link`);
  }

  async createRefund(paymentId, amount = null) {
    if (!this.isConfigured) {
      throw new Error('Razorpay not configured');
    }

    try {
      const refundData = {
        payment_id: paymentId,
      };

      if (amount) {
        refundData.amount = Math.round(parseFloat(amount) * 100);
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundData);

      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      console.error('Razorpay refund error:', error);
      throw new Error('Failed to process refund');
    }
  }

  async getPaymentStatus(paymentId) {
    if (!this.isConfigured) {
      throw new Error('Razorpay not configured');
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        status: payment.status,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        created: new Date(payment.created_at * 1000),
      };
    } catch (error) {
      console.error('Razorpay get payment status error:', error);
      throw new Error('Failed to get payment status');
    }
  }

  verifyWebhookSignature(payload, signature) {
    if (!this.isConfigured) {
      throw new Error('Razorpay not configured');
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Razorpay webhook verification error:', error);
      return false;
    }
  }
}

module.exports = new RazorpayService();
