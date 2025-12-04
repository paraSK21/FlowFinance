const plaidService = require('../services/plaidService');
const Account = require('../models/Account');

/**
 * Auto-sync transactions for all active accounts
 * Runs every 4 hours
 */
async function syncAllTransactions() {
  console.log('Starting auto-sync job...');
  
  try {
    // Get all active accounts
    const accounts = await Account.findAll({
      where: { isActive: true },
      attributes: ['id', 'userId', 'plaidAccessToken', 'accountName'],
    });

    console.log(`Found ${accounts.length} active accounts to sync`);

    let successCount = 0;
    let errorCount = 0;

    for (const account of accounts) {
      try {
        const result = await plaidService.syncTransactions(
          account.plaidAccessToken,
          account.userId
        );

        console.log(`Synced ${result.synced} transactions for account ${account.accountName}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Auto-sync completed: ${successCount} success, ${errorCount} errors`);
    
    return {
      success: true,
      synced: successCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error('Auto-sync job error:', error);
    throw error;
  }
}

module.exports = { syncAllTransactions };
