const { Invoice, InventoryItem, User } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('./notificationService');

// Auto-chase overdue invoices
async function autoChaseInvoices() {
  try {
    console.log('Running auto-chase job...');
    
    const today = new Date();
    const overdueInvoices = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['sent', 'overdue'] },
        dueDate: { [Op.lt]: today },
        autoChaseEnabled: true,
        [Op.or]: [
          { lastChaseDate: null },
          { lastChaseDate: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      }
    });

    for (const invoice of overdueInvoices) {
      // Update status to overdue if not already
      if (invoice.status !== 'overdue') {
        await invoice.update({ status: 'overdue' });
      }

      // Send chase notification
      await notificationService.sendInvoiceChase(invoice);

      // Update chase tracking
      await invoice.update({
        lastChaseDate: new Date(),
        chaseCount: invoice.chaseCount + 1
      });

      console.log(`Chased invoice ${invoice.invoiceNumber}`);
    }

    console.log(`Auto-chase completed: ${overdueInvoices.length} invoices chased`);
  } catch (error) {
    console.error('Auto-chase job error:', error);
  }
}

// Check low stock and send alerts
async function checkLowStock() {
  try {
    console.log('Running low stock check...');
    
    const items = await InventoryItem.findAll({
      where: { isActive: true }
    });

    const lowStockItems = items.filter(item => 
      item.quantity <= item.lowStockThreshold
    );

    // Group by user
    const userItems = {};
    for (const item of lowStockItems) {
      if (!userItems[item.userId]) {
        userItems[item.userId] = [];
      }
      userItems[item.userId].push(item);
    }

    // Send alerts per user
    for (const [userId, items] of Object.entries(userItems)) {
      const user = await User.findByPk(userId);
      
      const message = `Low Stock Alert: ${items.length} item(s) need restocking:\n${
        items.map(i => `- ${i.name} (${i.quantity} left)`).join('\n')
      }`;

      if (user.notificationPreferences.sms && user.phone) {
        await notificationService.sendSMS(user.phone, message);
      }

      if (user.notificationPreferences.whatsapp && user.phone) {
        await notificationService.sendWhatsApp(user.phone, message);
      }

      console.log(`Low stock alert sent to user ${userId}`);
    }

    console.log(`Low stock check completed: ${lowStockItems.length} items low`);
  } catch (error) {
    console.error('Low stock check error:', error);
  }
}

module.exports = {
  autoChaseInvoices,
  checkLowStock
};
