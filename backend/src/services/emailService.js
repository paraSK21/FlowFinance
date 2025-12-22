const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.useSendGrid = !!process.env.SENDGRID_API_KEY;
    
    if (this.useSendGrid) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('Email service initialized with SendGrid');
    } else if (process.env.SMTP_HOST) {
      // Fallback to SMTP
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('Email service initialized with SMTP');
    } else {
      console.warn('Email service not configured');
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (this.useSendGrid) {
        return await this.sendWithSendGrid(to, subject, html, text);
      } else if (this.transporter) {
        return await this.sendWithSMTP(to, subject, html, text);
      } else {
        console.log('Email not sent (service not configured):', { to, subject });
        return { success: false, message: 'Email service not configured' };
      }
    } catch (error) {
      console.error('Send email error:', error);
      throw error;
    }
  }

  async sendWithSendGrid(to, subject, html, text) {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@flowfinance.com',
        name: process.env.SENDGRID_FROM_NAME || 'FlowFinance'
      },
      subject,
      text: text || this.stripHtml(html),
      html,
    };

    try {
      const result = await sgMail.send(msg);
      console.log(`✓ Email sent successfully to ${to}: ${subject}`);
      console.log('SendGrid Response:', result[0].statusCode);
      return { success: true };
    } catch (error) {
      console.error('❌ SendGrid error:', error.response?.body || error.message);
      
      // If sender not verified (403), log helpful message
      if (error.code === 403 || error.response?.statusCode === 403) {
        console.error('⚠️  SendGrid sender verification required!');
        console.error('   Visit: https://app.sendgrid.com/settings/sender_auth/senders');
        console.error(`   Verify: ${process.env.SENDGRID_FROM_EMAIL}`);
        console.error('   OR use Single Sender Verification at: https://app.sendgrid.com/settings/sender_auth/senders/new');
      }
      
      // Log full error details for debugging
      if (error.response?.body?.errors) {
        console.error('SendGrid Error Details:', JSON.stringify(error.response.body.errors, null, 2));
      }
      
      // Throw error so it's visible in logs
      throw new Error(`Email failed: ${error.message}`);
    }
  }

  async sendWithSMTP(to, subject, html, text) {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@flowfinance.com',
      to,
      subject,
      text: text || this.stripHtml(html),
      html,
    };

    await this.transporter.sendMail(mailOptions);
    return { success: true };
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Invoice Templates
  async sendInvoiceCreated(invoice, user) {
    const subject = `Invoice ${invoice.invoiceNumber} Created`;
    const html = this.getInvoiceCreatedTemplate(invoice, user);
    
    return await this.sendEmail(invoice.clientEmail, subject, html);
  }

  async sendInvoiceReminder(invoice, user, daysOverdue = 0) {
    const subject = daysOverdue > 0 
      ? `Reminder: Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue`
      : `Reminder: Invoice ${invoice.invoiceNumber} due soon`;
    
    const html = this.getInvoiceReminderTemplate(invoice, user, daysOverdue);
    
    return await this.sendEmail(invoice.clientEmail, subject, html);
  }

  async sendPaymentConfirmation(invoice, user) {
    const subject = `Payment Received - Invoice ${invoice.invoiceNumber}`;
    const html = this.getPaymentConfirmationTemplate(invoice, user);
    
    return await this.sendEmail(invoice.clientEmail, subject, html);
  }

  // Low Stock Alert
  async sendLowStockAlert(items, user) {
    const subject = `Low Stock Alert - ${items.length} items need attention`;
    const html = this.getLowStockAlertTemplate(items, user);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Welcome Email
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to FlowFinance!';
    const html = this.getWelcomeTemplate(user);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Password Reset
  async sendPasswordReset(user, resetToken) {
    const subject = 'Reset Your Password';
    const html = this.getPasswordResetTemplate(user, resetToken);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Email Templates
  getInvoiceCreatedTemplate(invoice, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Invoice</h1>
          </div>
          <div class="content">
            <p>Hello ${invoice.clientName},</p>
            <p>${user.businessName || user.firstName + ' ' + user.lastName} has sent you an invoice.</p>
            
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Amount:</strong> $${invoice.amount}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              ${invoice.description ? `<p><strong>Description:</strong> ${invoice.description}</p>` : ''}
            </div>

            ${invoice.paymentLink ? `
              <a href="${invoice.paymentLink}" class="button">Pay Invoice</a>
            ` : ''}

            <p>If you have any questions, please don't hesitate to reach out.</p>
            <p>Best regards,<br>${user.businessName || user.firstName + ' ' + user.lastName}</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getInvoiceReminderTemplate(invoice, user, daysOverdue) {
    const isOverdue = daysOverdue > 0;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isOverdue ? '#ef4444' : '#f59e0b'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}</h1>
          </div>
          <div class="content">
            <p>Hello ${invoice.clientName},</p>
            <p>${isOverdue 
              ? `This is a friendly reminder that invoice ${invoice.invoiceNumber} is now ${daysOverdue} days overdue.`
              : `This is a friendly reminder about invoice ${invoice.invoiceNumber}.`
            }</p>
            
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Amount:</strong> $${invoice.amount}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              ${isOverdue ? `<p style="color: #ef4444;"><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
            </div>

            ${invoice.paymentLink ? `
              <a href="${invoice.paymentLink}" class="button">Pay Now</a>
            ` : ''}

            <p>If you've already made this payment, please disregard this reminder.</p>
            <p>Best regards,<br>${user.businessName || user.firstName + ' ' + user.lastName}</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentConfirmationTemplate(invoice, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Received</h1>
          </div>
          <div class="content">
            <p>Hello ${invoice.clientName},</p>
            <p>Thank you! We've received your payment for invoice ${invoice.invoiceNumber}.</p>
            
            <div class="invoice-details">
              <h3>Payment Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Amount Paid:</strong> $${invoice.paidAmount || invoice.amount}</p>
              <p><strong>Payment Date:</strong> ${new Date(invoice.paidDate).toLocaleDateString()}</p>
            </div>

            <p>A receipt has been generated for your records.</p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>${user.businessName || user.firstName + ' ' + user.lastName}</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getLowStockAlertTemplate(items, user) {
    const itemsList = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.lowStockThreshold}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          table { width: 100%; background: white; border-radius: 8px; margin: 20px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>The following items are running low on stock:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>

            <p>Consider restocking these items soon to avoid running out.</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FlowFinance!</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>Welcome to FlowFinance! We're excited to help you manage your business finances with ease.</p>
            
            <h3>Get Started:</h3>
            <ul>
              <li>Connect your bank account for automatic transaction sync</li>
              <li>Create your first invoice with payment links</li>
              <li>Enable Profit First for automatic savings</li>
              <li>Scan for tax deductions</li>
            </ul>

            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>

            <p>If you have any questions, we're here to help!</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>

            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Tax Deduction Email Templates
  async sendWeeklyTaxSummary(user, scanResult) {
    const subject = `Weekly Tax Scan: ${scanResult.found} New Deductions Found`;
    const html = this.getWeeklyTaxSummaryTemplate(user, scanResult);
    
    return await this.sendEmail(user.email, subject, html);
  }

  async sendTaxReportReady(user, taxYear, report) {
    const subject = `Your ${taxYear} Tax Report is Ready`;
    const html = this.getTaxReportTemplate(user, taxYear, report);
    
    return await this.sendEmail(user.email, subject, html);
  }

  getWeeklyTaxSummaryTemplate(user, scanResult) {
    const deductionsList = scanResult.deductions.slice(0, 10).map(d => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(d.date).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${d.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">$${parseFloat(d.amount).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${Math.round(d.aiConfidence * 100)}%</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-box { background: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; }
          .stat-number { font-size: 32px; font-weight: bold; color: #10b981; }
          .stat-label { color: #6b7280; font-size: 14px; }
          table { width: 100%; background: white; border-radius: 8px; margin: 20px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Weekly Tax Deduction Scan</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>Great news! We found ${scanResult.found} potential tax deductions from your recent transactions.</p>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-number">${scanResult.found}</div>
                <div class="stat-label">Deductions Found</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">$${scanResult.estimatedSavings.totalDeductions.toFixed(0)}</div>
                <div class="stat-label">Total Amount</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">$${scanResult.estimatedSavings.estimatedSavings.toFixed(0)}</div>
                <div class="stat-label">Est. Tax Savings</div>
              </div>
            </div>

            ${scanResult.found > 0 ? `
              <h3>Top Deductions Found:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  ${deductionsList}
                </tbody>
              </table>
              ${scanResult.found > 10 ? `<p style="text-align: center; color: #6b7280;">+ ${scanResult.found - 10} more deductions</p>` : ''}
            ` : ''}

            <a href="${process.env.FRONTEND_URL}/tax-deductions" class="button">Review Deductions</a>

            <p><strong>Action Required:</strong> Please review and approve these deductions in your dashboard.</p>
            <p>Remember to keep receipts for all approved deductions!</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getTaxReportTemplate(user, taxYear, report) {
    const categoryList = Object.entries(report.byCategory).map(([type, data]) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.items.length}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${data.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .summary-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          table { width: 100%; background: white; border-radius: 8px; margin: 20px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; }
          .total-row { font-weight: bold; background: #f3f4f6; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${taxYear} Tax Report</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>Your tax report for ${taxYear} is ready!</p>
            
            <div class="summary-box">
              <h3>Summary</h3>
              <p><strong>Total Deductions:</strong> $${report.totalDeductions.toFixed(2)}</p>
              <p><strong>Number of Deductions:</strong> ${report.deductionCount}</p>
              <p><strong>Estimated Tax Savings:</strong> $${report.estimatedSavings.toFixed(2)}</p>
            </div>

            <h3>Deductions by Category:</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Count</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${categoryList}
                <tr class="total-row">
                  <td style="padding: 10px;">TOTAL</td>
                  <td style="padding: 10px;">${report.deductionCount}</td>
                  <td style="padding: 10px; text-align: right;">$${report.totalDeductions.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <a href="${process.env.FRONTEND_URL}/tax-report/${taxYear}" class="button">View Full Report</a>

            <p><strong>Important:</strong> This report is for informational purposes. Please consult with a tax professional for filing.</p>
          </div>
          <div class="footer">
            <p>Powered by FlowFinance</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
