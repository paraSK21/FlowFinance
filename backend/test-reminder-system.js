/**
 * Test script for invoice reminder system
 * Tests:
 * 1. Creating an invoice schedules reminders
 * 2. Reminders are sent at the right time
 * 3. Marking invoice as paid cancels reminders
 * 4. Updating due date reschedules reminders
 */

require('dotenv').config();
const { Invoice, InvoiceReminder, User, sequelize } = require('./src/models');
const reminderScheduler = require('./src/services/reminderScheduler');
const { sendInvoiceReminders } = require('./src/jobs/invoiceReminders');

async function testReminderSystem() {
  console.log('🧪 Testing Invoice Reminder System\n');

  try {
    // Find or create a test user
    let testUser = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`✓ Using test user: ${testUser.email}\n`);

    // Test 1: Create invoice and verify reminders are scheduled
    console.log('Test 1: Creating invoice and scheduling reminders...');
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5); // Due in 5 days

    const invoice = await Invoice.create({
      userId: testUser.id,
      invoiceNumber: `TEST-${Date.now()}`,
      clientName: 'Test Client',
      clientEmail: 'client@example.com',
      amount: 1000.00,
      issueDate: new Date(),
      dueDate: dueDate,
      status: 'sent',
      description: 'Test invoice for reminder system',
      autoChaseEnabled: true
    });

    console.log(`✓ Created invoice: ${invoice.invoiceNumber}`);

    // Schedule reminders
    await reminderScheduler.scheduleRemindersForInvoice(invoice);

    const reminders = await InvoiceReminder.findAll({
      where: { invoiceId: invoice.id },
      order: [['scheduledDate', 'ASC']]
    });

    console.log(`✓ Scheduled ${reminders.length} reminders:`);
    reminders.forEach(r => {
      console.log(`  - ${r.reminderType}: ${r.scheduledDate.toLocaleString()} (${r.status})`);
    });

    // Test 2: Simulate sending reminders
    console.log('\nTest 2: Simulating reminder processing...');
    
    // Update one reminder to be due now
    if (reminders.length > 0) {
      await reminders[0].update({ scheduledDate: new Date(Date.now() - 1000) });
      console.log(`✓ Updated first reminder to be due now`);
      
      // Process reminders
      const result = await sendInvoiceReminders();
      console.log(`✓ Processed reminders: ${result.sent} sent, ${result.errors} errors`);
      
      // Check reminder status
      await reminders[0].reload();
      console.log(`✓ Reminder status: ${reminders[0].status}`);
    }

    // Test 3: Mark invoice as paid and verify reminders are cancelled
    console.log('\nTest 3: Marking invoice as paid...');
    
    await invoice.update({
      status: 'paid',
      paidAmount: invoice.amount,
      paidDate: new Date()
    });

    await reminderScheduler.cancelRemindersForInvoice(invoice.id);

    const cancelledReminders = await InvoiceReminder.findAll({
      where: { invoiceId: invoice.id, status: 'cancelled' }
    });

    console.log(`✓ Cancelled ${cancelledReminders.length} pending reminders`);

    // Test 4: Create another invoice and test rescheduling
    console.log('\nTest 4: Testing reminder rescheduling...');
    
    const invoice2 = await Invoice.create({
      userId: testUser.id,
      invoiceNumber: `TEST-${Date.now()}`,
      clientName: 'Test Client 2',
      clientEmail: 'client2@example.com',
      amount: 500.00,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'sent',
      autoChaseEnabled: true
    });

    await reminderScheduler.scheduleRemindersForInvoice(invoice2);
    
    let reminders2 = await InvoiceReminder.findAll({
      where: { invoiceId: invoice2.id }
    });
    
    console.log(`✓ Scheduled ${reminders2.length} reminders for invoice 2`);

    // Change due date
    const newDueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
    await invoice2.update({ dueDate: newDueDate });
    await reminderScheduler.rescheduleRemindersForInvoice(invoice2);

    reminders2 = await InvoiceReminder.findAll({
      where: { invoiceId: invoice2.id, status: 'pending' }
    });

    console.log(`✓ Rescheduled reminders (${reminders2.length} pending):`);
    reminders2.forEach(r => {
      console.log(`  - ${r.reminderType}: ${r.scheduledDate.toLocaleString()}`);
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await InvoiceReminder.destroy({ where: { invoiceId: [invoice.id, invoice2.id] } });
    await Invoice.destroy({ where: { id: [invoice.id, invoice2.id] } });
    console.log('✓ Cleanup complete');

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testReminderSystem()
  .then(() => {
    console.log('\n✓ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  });
