/**
 * Generate Recurring Invoices Job
 * Runs daily to generate invoices from recurring templates
 */

const recurringInvoiceService = require('../services/recurringInvoiceService');

async function generateRecurringInvoices() {
  console.log('Starting recurring invoice generation...');
  
  try {
    const result = await recurringInvoiceService.generateRecurringInvoices();
    
    console.log(`✅ Generated ${result.generated} recurring invoices`);
    
    return result;
  } catch (error) {
    console.error('❌ Error generating recurring invoices:', error);
    throw error;
  }
}

module.exports = generateRecurringInvoices;
