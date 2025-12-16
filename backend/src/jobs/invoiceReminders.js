const { Op } = require('sequelize');
const { Invoice, InvoiceReminder, User } = require('../models');
const emailService = require('../services/emailService');

/**
 * Process scheduled invoice reminders
 * Runs every hour to check for due reminders
 */
async function sendInvoiceReminders() {
  console.log('Starting invoice reminder job...');
  
  try {
    const now = new Date();

    // Find reminders that are due to be sent
    const dueReminders = await InvoiceReminder.findAll({
      where: {
        status: 'pending',
        scheduledDate: {
          [Op.lte]: now
        }
      },
      include: [
        {
          model: Invoice,
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName', 'businessName', 'email']
            }
          ]
        }
      ]
    });

    console.log(`Found ${dueReminders.length} reminders to send`);

    let sentCount = 0;
    let errorCount = 0;

    for (const reminder of dueReminders) {
      try {
        const invoice = reminder.Invoice;

        // Skip if invoice is already paid or cancelled
        if (invoice.status === 'paid' || invoice.status === 'cancelled') {
          await reminder.update({ status: 'cancelled' });
          continue;
        }

        // Skip if no client email
        if (!invoice.clientEmail) {
          await reminder.update({ 
            status: 'failed',
            errorMessage: 'No client email address'
          });
          continue;
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.max(0, Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)));

        // Send reminder email
        await emailService.sendInvoiceReminder(invoice, invoice.User, daysOverdue);

        // Update reminder status
        await reminder.update({
          status: 'sent',
          sentAt: new Date()
        });

        // Update invoice
        await invoice.update({
          lastChaseDate: new Date(),
          chaseCount: (invoice.chaseCount || 0) + 1,
          status: daysOverdue > 0 ? 'overdue' : invoice.status
        });

        console.log(`Sent ${reminder.reminderType} reminder for invoice ${invoice.invoiceNumber}`);
        sentCount++;

      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error.message);
        
        await reminder.update({
          status: 'failed',
          errorMessage: error.message
        });
        
        errorCount++;
      }
    }

    // Schedule overdue reminders (every 3 days for overdue invoices)
    await scheduleOverdueReminders();

    console.log(`Invoice reminders completed: ${sentCount} sent, ${errorCount} errors`);
    
    return {
      success: true,
      sent: sentCount,
      errors: errorCount
    };
  } catch (error) {
    console.error('Invoice reminder job error:', error);
    throw error;
  }
}

/**
 * Schedule reminders for overdue invoices (every 3 days)
 */
async function scheduleOverdueReminders() {
  try {
    const now = new Date();
    
    // Find overdue invoices
    const overdueInvoices = await Invoice.findAll({
      where: {
        status: 'overdue',
        autoChaseEnabled: true,
        dueDate: {
          [Op.lt]: now
        }
      }
    });

    for (const invoice of overdueInvoices) {
      // Check if there's already a pending overdue reminder
      const existingReminder = await InvoiceReminder.findOne({
        where: {
          invoiceId: invoice.id,
          reminderType: 'overdue',
          status: 'pending'
        }
      });

      if (!existingReminder) {
        // Check when last reminder was sent
        const lastReminder = await InvoiceReminder.findOne({
          where: {
            invoiceId: invoice.id,
            status: 'sent'
          },
          order: [['sentAt', 'DESC']]
        });

        const daysSinceLastReminder = lastReminder
          ? Math.ceil((now - new Date(lastReminder.sentAt)) / (1000 * 60 * 60 * 24))
          : 999;

        // Schedule next overdue reminder if 3 days have passed
        if (daysSinceLastReminder >= 3) {
          const nextReminderDate = new Date();
          nextReminderDate.setHours(9, 0, 0, 0);

          await InvoiceReminder.create({
            invoiceId: invoice.id,
            reminderType: 'overdue',
            scheduledDate: nextReminderDate,
            status: 'pending'
          });

          console.log(`Scheduled overdue reminder for invoice ${invoice.invoiceNumber}`);
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling overdue reminders:', error);
  }
}

module.exports = { sendInvoiceReminders };
