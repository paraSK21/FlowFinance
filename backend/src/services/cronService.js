const { Invoice, User } = require('../models');
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

module.exports = {
  autoChaseInvoices
};
