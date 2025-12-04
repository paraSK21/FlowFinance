const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Invoice = require('../models/Invoice');

class StripeService {
  constructor() {
    this.isConfigured = !!process.env.STRIPE_SECRET_KEY;
    if (!this.isConfigured) {
      console.warn('Stripe not configured');
    }
  }

  async createPaymentLink(invoice) {
    if (!this.isConfigured) {
      throw new Error('Stripe not configured');
    }

    try {
      // Create a product for this invoice
      const product = await stripe.products.create({
        name: `Invoice ${invoice.invoiceNumber}`,
        description: invoice.description || `Payment for invoice ${invoice.invoiceNumber}`,
      });

      // Create a price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(parseFloat(invoice.amount) * 100), // Convert to cents
        currency: 'usd',
      });

      // Create a payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${process.env.FRONTEND_URL}/invoices/${invoice.id}/success`,
          },
        },
        metadata: {
          invoiceId: invoice.id.toString(),
          invoiceNumber: invoice.invoiceNumber,
        },
      });

      // Update invoice with payment link
      await invoice.update({
        paymentLink: paymentLink.url,
        stripePaymentLinkId: paymentLink.id,
      });

      return {
        url: paymentLink.url,
        id: paymentLink.id,
      };
    } catch (error) {
      console.error('Stripe create payment link error:', error);
      throw new Error('Failed to create payment link');
    }
  }

  async createCheckoutSession(invoice) {
    if (!this.isConfigured) {
      throw new Error('Stripe not configured');
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: invoice.description || `Payment for invoice ${invoice.invoiceNumber}`,
              },
              unit_amount: Math.round(parseFloat(invoice.amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/invoices/${invoice.id}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/invoices/${invoice.id}`,
        metadata: {
          invoiceId: invoice.id.toString(),
          invoiceNumber: invoice.invoiceNumber,
        },
        customer_email: invoice.clientEmail,
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('Stripe create checkout session error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Stripe webhook handling error:', error);
      throw error;
    }
  }

  async handleCheckoutCompleted(session) {
    const invoiceId = session.metadata.invoiceId;

    if (!invoiceId) {
      console.error('No invoice ID in session metadata');
      return;
    }

    const invoice = await Invoice.findByPk(invoiceId);

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`);
      return;
    }

    // Mark invoice as paid
    await invoice.update({
      status: 'paid',
      paidDate: new Date(),
      paidAmount: session.amount_total / 100, // Convert from cents
      stripePaymentId: session.payment_intent,
    });

    console.log(`Invoice ${invoice.invoiceNumber} marked as paid via Stripe`);

    // TODO: Send payment confirmation email
  }

  async handlePaymentSucceeded(paymentIntent) {
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    // Additional handling if needed
  }

  async handlePaymentFailed(paymentIntent) {
    console.log(`Payment failed: ${paymentIntent.id}`);
    // TODO: Notify user of failed payment
  }

  async createRefund(paymentIntentId, amount = null) {
    if (!this.isConfigured) {
      throw new Error('Stripe not configured');
    }

    try {
      const refundData = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(parseFloat(amount) * 100);
      }

      const refund = await stripe.refunds.create(refundData);

      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw new Error('Failed to process refund');
    }
  }

  async getPaymentStatus(paymentIntentId) {
    if (!this.isConfigured) {
      throw new Error('Stripe not configured');
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000),
      };
    } catch (error) {
      console.error('Stripe get payment status error:', error);
      throw new Error('Failed to get payment status');
    }
  }

  verifyWebhookSignature(payload, signature) {
    if (!this.isConfigured) {
      throw new Error('Stripe not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      throw new Error('Invalid webhook signature');
    }
  }
}

module.exports = new StripeService();
