const plaidService = require('../services/plaidService');
const Account = require('../models/Account');

/**
 * Manual sync for all active accounts
 * Note: Automatic syncing is disabled - use webhooks instead
 * This is only for manual/on-demand syncing
 */
async function syncAllTransactions() {
  console.log('Starting manual sync job...');
  
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
        const result = await plaidService.syncTransactionsIncremental(
          account.plaidAccessToken,
          account.userId,
          account.id
        );

        console.log(`Synced account ${account.accountName}: ${result.added} added, ${result.modified} modified, ${result.removed} removed`);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Manual sync completed: ${successCount} success, ${errorCount} errors`);
    
    return {
      success: true,
      synced: successCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error('Manual sync job error:', error);
    throw error;
  }
}

module.exports = { syncAllTransactions };
