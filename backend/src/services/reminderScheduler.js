const { InvoiceReminder } = require('../models');

class ReminderScheduler {
  /**
   * Schedule reminders for an invoice
   * Creates reminder records for: 3 days before, 1 day before, and on due date
   */
  async scheduleRemindersForInvoice(invoice) {
    try {
      if (!invoice.autoChaseEnabled) {
        console.log(`Auto-chase disabled for invoice ${invoice.invoiceNumber}`);
        return;
      }

      const dueDate = new Date(invoice.dueDate);
      const reminders = [];

      // 3 days before due date
      const threeDaysBefore = new Date(dueDate);
      threeDaysBefore.setDate(dueDate.getDate() - 3);
      threeDaysBefore.setHours(9, 0, 0, 0); // 9 AM

      if (threeDaysBefore > new Date()) {
        reminders.push({
          invoiceId: invoice.id,
          reminderType: 'before_due_3days',
          scheduledDate: threeDaysBefore,
          status: 'pending'
        });
      }

      // 1 day before due date
      const oneDayBefore = new Date(dueDate);
      oneDayBefore.setDate(dueDate.getDate() - 1);
      oneDayBefore.setHours(9, 0, 0, 0); // 9 AM

      if (oneDayBefore > new Date()) {
        reminders.push({
          invoiceId: invoice.id,
          reminderType: 'before_due_1day',
          scheduledDate: oneDayBefore,
          status: 'pending'
        });
      }

      // On due date
      const onDueDate = new Date(dueDate);
      onDueDate.setHours(9, 0, 0, 0); // 9 AM

      if (onDueDate > new Date()) {
        reminders.push({
          invoiceId: invoice.id,
          reminderType: 'on_due_date',
          scheduledDate: onDueDate,
          status: 'pending'
        });
      }

      if (reminders.length > 0) {
        await InvoiceReminder.bulkCreate(reminders);
        console.log(`Scheduled ${reminders.length} reminders for invoice ${invoice.invoiceNumber}`);
      }

      return reminders;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  }

  /**
   * Cancel all pending reminders for an invoice
   * Used when invoice is paid or cancelled
   */
  async cancelRemindersForInvoice(invoiceId) {
    try {
      const result = await InvoiceReminder.update(
        { status: 'cancelled' },
        {
          where: {
            invoiceId,
            status: 'pending'
          }
        }
      );

      console.log(`Cancelled ${result[0]} pending reminders for invoice ${invoiceId}`);
      return result[0];
    } catch (error) {
      console.error('Error cancelling reminders:', error);
      throw error;
    }
  }

  /**
   * Reschedule reminders when invoice due date changes
   */
  async rescheduleRemindersForInvoice(invoice) {
    try {
      // Cancel existing pending reminders
      await this.cancelRemindersForInvoice(invoice.id);

      // Schedule new reminders
      await this.scheduleRemindersForInvoice(invoice);

      console.log(`Rescheduled reminders for invoice ${invoice.invoiceNumber}`);
    } catch (error) {
      console.error('Error rescheduling reminders:', error);
      throw error;
    }
  }
}

module.exports = new ReminderScheduler();
