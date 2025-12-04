const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    this.isConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
    );

    if (this.isConfigured) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      console.log('WhatsApp service initialized with Twilio');
    } else {
      console.warn('WhatsApp service not configured');
    }
  }

  async sendWhatsApp(to, message) {
    if (!this.isConfigured) {
      console.log('WhatsApp not sent (service not configured):', { to, message });
      return { success: false, message: 'WhatsApp service not configured' };
    }

    try {
      // Ensure phone number has whatsapp: prefix
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber,
      });

      console.log(`WhatsApp sent to ${to}: ${result.sid}`);
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
  }

  // Invoice created WhatsApp
  async sendInvoiceCreated(invoice, user) {
    let message = `*New Invoice from ${user.businessName || user.firstName}*\n\n`;
    message += `Invoice: ${invoice.invoiceNumber}\n`;
    message += `Amount: $${invoice.amount}\n`;
    message += `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n`;
    
    if (invoice.description) {
      message += `\nDescription: ${invoice.description}\n`;
    }

    if (invoice.paymentLink) {
      message += `\n💳 Pay Now: ${invoice.paymentLink}`;
    }

    if (invoice.clientPhone) {
      return await this.sendWhatsApp(invoice.clientPhone, message);
    }

    return { success: false, message: 'No phone number provided' };
  }

  // Invoice reminder WhatsApp
  async sendInvoiceReminder(invoice, user, daysOverdue = 0) {
    const isOverdue = daysOverdue > 0;
    
    let message = `*${isOverdue ? '⚠️ Payment Overdue' : '🔔 Payment Reminder'}*\n\n`;
    message += `Hi ${invoice.clientName},\n\n`;
    
    if (isOverdue) {
      message += `Invoice ${invoice.invoiceNumber} for *$${invoice.amount}* is now *${daysOverdue} days overdue*.\n\n`;
    } else {
      message += `Friendly reminder about invoice ${invoice.invoiceNumber} for *$${invoice.amount}*.\n\n`;
    }

    message += `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n`;

    if (invoice.paymentLink) {
      message += `\n💳 Pay Now: ${invoice.paymentLink}`;
    }

    message += `\n\nThank you!\n${user.businessName || user.firstName}`;

    if (invoice.clientPhone) {
      return await this.sendWhatsApp(invoice.clientPhone, message);
    }

    return { success: false, message: 'No phone number provided' };
  }

  // Payment confirmation WhatsApp
  async sendPaymentConfirmation(invoice, user) {
    let message = `*✅ Payment Received*\n\n`;
    message += `Thank you ${invoice.clientName}!\n\n`;
    message += `We've received your payment of *$${invoice.paidAmount || invoice.amount}* for invoice ${invoice.invoiceNumber}.\n\n`;
    message += `Payment Date: ${new Date(invoice.paidDate).toLocaleDateString()}\n\n`;
    message += `A receipt has been generated for your records.\n\n`;
    message += `Thank you for your business!\n${user.businessName || user.firstName}`;

    if (invoice.clientPhone) {
      return await this.sendWhatsApp(invoice.clientPhone, message);
    }

    return { success: false, message: 'No phone number provided' };
  }

  // Low stock alert WhatsApp
  async sendLowStockAlert(items, user) {
    let message = `*⚠️ Low Stock Alert*\n\n`;
    message += `The following items are running low:\n\n`;

    items.slice(0, 5).forEach(item => {
      message += `• ${item.name}: ${item.quantity} units (threshold: ${item.lowStockThreshold})\n`;
    });

    if (items.length > 5) {
      message += `\n...and ${items.length - 5} more items\n`;
    }

    message += `\nConsider restocking soon to avoid running out.`;

    if (user.phone) {
      return await this.sendWhatsApp(user.phone, message);
    }

    return { success: false, message: 'No phone number provided' };
  }

  // Generic notification WhatsApp
  async sendNotification(phone, title, message) {
    const fullMessage = `*${title}*\n\n${message}`;
    return await this.sendWhatsApp(phone, fullMessage);
  }

  // Send with media (image, PDF, etc.)
  async sendWithMedia(to, message, mediaUrl) {
    if (!this.isConfigured) {
      console.log('WhatsApp not sent (service not configured)');
      return { success: false, message: 'WhatsApp service not configured' };
    }

    try {
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber,
        mediaUrl: [mediaUrl],
      });

      console.log(`WhatsApp with media sent to ${to}: ${result.sid}`);
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
      };
    } catch (error) {
      console.error('WhatsApp send with media error:', error);
      throw new Error(`Failed to send WhatsApp with media: ${error.message}`);
    }
  }
}

module.exports = new WhatsAppService();
