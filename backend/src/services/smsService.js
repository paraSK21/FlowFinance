const twilio = require('twilio');

class SMSService {
  constructor() {
    this.isConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );

    if (this.isConfigured) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
      console.log('SMS service initialized with Twilio');
    } else {
      console.warn('SMS service not configured');
    }
  }

  async sendSMS(to, message) {
    if (!this.isConfigured) {
      console.log('SMS not sent (service not configured):', { to, message });
      return { success: false, message: 'SMS service not configured' };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
      });

      console.log(`SMS sent to ${to}: ${result.sid}`);
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
      };
    } catch (error) {
      console.error('SMS send error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Invoice reminder SMS
  async sendInvoiceReminder(invoice, user) {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDue < 0;

    let message;
    if (isOverdue) {
      message = `Hi ${invoice.clientName}, this is a reminder that invoice ${invoice.invoiceNumber} for $${invoice.amount} is ${Math.abs(daysUntilDue)} days overdue. `;
    } else {
      message = `Hi ${invoice.clientName}, reminder: invoice ${invoice.invoiceNumber} for $${invoice.amount} is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} days`}. `;
    }

    if (invoice.paymentLink) {
      message += `Pay here: ${invoice.paymentLink}`;
    } else {
      message += `Please contact ${user.businessName || user.firstName} to arrange payment.`;
    }

    if (invoice.clientPhone) {
      return await this.sendSMS(invoice.clientPhone, message);
    }

    return { success: false, message: 'No phone number provided' };
  }

  // Payment confirmation SMS
  async sendPaymentConfirmation(invoice, user) {
    const message = `Thank you! Payment of $${invoice.paidAmount || invoice.amount} received for invoice ${invoice.invoiceNumber}. - ${user.businessName || user.firstName}`;

    if (invoice.clientPhone) {
      return await this.sendSMS(invoice.clientPhone, message);
    }

    return { success: false, message: 'No phone number provided' };
  }

  // Low stock alert SMS
  async sendLowStockAlert(items, user) {
    const itemNames = items.slice(0, 3).map(item => item.name).join(', ');
    const moreCount = items.length > 3 ? ` and ${items.length - 3} more` : '';
    
    const message = `Low Stock Alert: ${itemNames}${moreCount} need restocking. Check your FlowFinance dashboard for details.`;

    if (user.phone) {
      return await this.sendSMS(user.phone, message);
    }

    return { success: false, message: 'No phone number provided' };
  }

  // 2FA code SMS
  async send2FACode(phone, code) {
    const message = `Your FlowFinance verification code is: ${code}. This code expires in 10 minutes.`;
    return await this.sendSMS(phone, message);
  }

  // Generic notification SMS
  async sendNotification(phone, message) {
    return await this.sendSMS(phone, message);
  }
}

module.exports = new SMSService();
