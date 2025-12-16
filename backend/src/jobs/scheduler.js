const cron = require('node-cron');
const { syncAllTransactions } = require('./syncTransactions');
const { sendInvoiceReminders } = require('./invoiceReminders');
const { sendLowStockAlerts } = require('./lowStockAlerts');
const generateRecurringInvoices = require('./generateRecurringInvoices');

class JobScheduler {
  constructor() {
    this.jobs = [];
  }

  start() {
    console.log('Starting job scheduler...');

    // Sync transactions every 4 hours
    const syncJob = cron.schedule('0 */4 * * *', async () => {
      console.log('Running scheduled transaction sync...');
      try {
        await syncAllTransactions();
      } catch (error) {
        console.error('Scheduled sync error:', error);
      }
    });
    this.jobs.push({ name: 'Transaction Sync', schedule: 'Every 4 hours', job: syncJob });

    // Process invoice reminders every hour
    const reminderJob = cron.schedule('0 * * * *', async () => {
      console.log('Running scheduled invoice reminders...');
      try {
        await sendInvoiceReminders();
      } catch (error) {
        console.error('Scheduled reminder error:', error);
      }
    });
    this.jobs.push({ name: 'Invoice Reminders', schedule: 'Every hour', job: reminderJob });

    // Send low stock alerts daily at 8 AM
    const lowStockJob = cron.schedule('0 8 * * *', async () => {
      console.log('Running scheduled low stock alerts...');
      try {
        await sendLowStockAlerts();
      } catch (error) {
        console.error('Scheduled low stock alert error:', error);
      }
    });
    this.jobs.push({ name: 'Low Stock Alerts', schedule: 'Daily at 8 AM', job: lowStockJob });

    // Generate recurring invoices daily at 6 AM
    const recurringJob = cron.schedule('0 6 * * *', async () => {
      console.log('Running scheduled recurring invoice generation...');
      try {
        await generateRecurringInvoices();
      } catch (error) {
        console.error('Scheduled recurring invoice error:', error);
      }
    });
    this.jobs.push({ name: 'Recurring Invoices', schedule: 'Daily at 6 AM', job: recurringJob });

    console.log(`Started ${this.jobs.length} scheduled jobs:`);
    this.jobs.forEach(({ name, schedule }) => {
      console.log(`  - ${name}: ${schedule}`);
    });
  }

  stop() {
    console.log('Stopping all scheduled jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`  - Stopped: ${name}`);
    });
    this.jobs = [];
  }

  // Manual job triggers (for testing)
  async runSyncNow() {
    console.log('Manually triggering transaction sync...');
    return await syncAllTransactions();
  }

  async runRemindersNow() {
    console.log('Manually triggering invoice reminders...');
    return await sendInvoiceReminders();
  }

  async runLowStockAlertsNow() {
    console.log('Manually triggering low stock alerts...');
    return await sendLowStockAlerts();
  }

  async runRecurringInvoicesNow() {
    console.log('Manually triggering recurring invoice generation...');
    return await generateRecurringInvoices();
  }
}

module.exports = new JobScheduler();
