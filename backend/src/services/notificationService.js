const { User } = require('../models');
const twilio = require('twilio');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

class NotificationService {
  async sendLowStockAlert(item, userId) {
    try {
      const user = await User.findByPk(userId);
      
      const message = `Low Stock Alert: ${item.name} (SKU: ${item.sku}) is running low. Current quantity: ${item.quantity}. Threshold: ${item.lowStockThreshold}.`;

      // Send SMS if enabled
      if (user.notificationPreferences.sms && user.phone && twilioClient) {
        await this.sendSMS(user.phone, message);
      }

      // Send WhatsApp if enabled
      if (user.notificationPreferences.whatsapp && user.phone && twilioClient) {
        await this.sendWhatsApp(user.phone, message);
      }

      console.log('Low stock alert sent:', message);
    } catch (error) {
      console.error('Send low stock alert error:', error);
    }
  }

  async sendInvoiceEmail(invoice) {
    try {
      const message = `Invoice ${invoice.invoiceNumber} for $${invoice.amount} has been sent. Due date: ${invoice.dueDate}.`;
      console.log('Invoice email sent:', message);
      // Integrate with SendGrid or similar service
    } catch (error) {
      console.error('Send invoice email error:', error);
    }
  }

  async sendInvoiceChase(invoice) {
    try {
      const message = `Reminder: Invoice ${invoice.invoiceNumber} for $${invoice.amount} is ${invoice.status}. Please process payment.`;
      
      if (invoice.clientEmail) {
        console.log('Chase email sent:', message);
      }

      if (invoice.clientPhone && twilioClient) {
        await this.sendSMS(invoice.clientPhone, message);
      }
    } catch (error) {
      console.error('Send invoice chase error:', error);
    }
  }

  async sendSMS(phone, message) {
    if (!twilioClient) {
      console.log('SMS (simulated):', phone, message);
      return;
    }

    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
    } catch (error) {
      console.error('Send SMS error:', error);
    }
  }

  async sendWhatsApp(phone, message) {
    if (!twilioClient) {
      console.log('WhatsApp (simulated):', phone, message);
      return;
    }

    try {
      await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:${phone}`
      });
    } catch (error) {
      console.error('Send WhatsApp error:', error);
    }
  }
}

module.exports = new NotificationService();
