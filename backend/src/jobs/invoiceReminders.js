const { Op } = require('sequelize');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * Send automated invoice reminders
 * Runs daily at 9 AM
 */
async function sendInvoiceReminders() {
  console.log('Starting invoice reminder job...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find invoices that need reminders
    const invoices = await Invoice.findAll({
      where: {
        status: {
          [Op.in]: ['sent', 'overdue'],
        },
        autoChaseEnabled: true,
        dueDate: {
          [Op.lte]: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Due within 7 days
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'businessName', 'email'],
        },
      ],
    });

    console.log(`Found ${invoices.length} invoices needing reminders`);

    let sentCount = 0;
    let errorCount = 0;

    for (const invoice of invoices) {
      try {
        const dueDate = new Date(invoice.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const daysOverdue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;

        // Determine if we should send a reminder
        let shouldSend = false;
        
        if (daysOverdue > 0) {
          // Overdue: send reminder every 3 days
          const daysSinceLastChase = invoice.lastChaseDate
            ? Math.ceil((today - new Date(invoice.lastChaseDate)) / (1000 * 60 * 60 * 24))
            : 999;
          
          shouldSend = daysSinceLastChase >= 3;
        } else if (daysUntilDue === 3 || daysUntilDue === 1) {
          // Send reminder 3 days before and 1 day before due date
          shouldSend = true;
        } else if (daysUntilDue === 0) {
          // Send reminder on due date
          shouldSend = true;
        }

        if (shouldSend && invoice.clientEmail) {
          await emailService.sendInvoiceReminder(invoice, invoice.user, daysOverdue);
          
          await invoice.update({
            lastChaseDate: new Date(),
            chaseCount: (invoice.chaseCount || 0) + 1,
            status: daysOverdue > 0 ? 'overdue' : invoice.status,
          });

          console.log(`Sent reminder for invoice ${invoice.invoiceNumber}`);
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send reminder for invoice ${invoice.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Invoice reminders completed: ${sentCount} sent, ${errorCount} errors`);
    
    return {
      success: true,
      sent: sentCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error('Invoice reminder job error:', error);
    throw error;
  }
}

module.exports = { sendInvoiceReminders };
