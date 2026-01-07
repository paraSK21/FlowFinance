const { Account, Transaction } = require('../models');
const plaidService = require('../services/plaidService');

exports.createLinkToken = async (req, res) => {
  try {
    const linkToken = await plaidService.createLinkToken(req.userId);
    res.json({ linkToken });
  } catch (error) {
    console.error('Create link token error:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
};

exports.exchangeToken = async (req, res) => {
  try {
    const { publicToken } = req.body;
    const accountData = await plaidService.exchangePublicToken(publicToken, req.userId);
    res.json(accountData);
  } catch (error) {
    console.error('Exchange token error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true }
    });
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

exports.syncTransactions = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true, provider: 'plaid' }
    });

    if (accounts.length === 0) {
      return res.status(400).json({ error: 'No accounts found to sync' });
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    const errors = [];

    for (const account of accounts) {
      try {
        if (!account.plaidAccessToken) {
          console.log(`Skipping account ${account.id} - no access token`);
          continue;
        }

        const result = await plaidService.syncTransactionsIncremental(
          account.plaidAccessToken,
          req.userId,
          account.id
        );
        totalAdded += result.added || 0;
        totalModified += result.modified || 0;
        totalRemoved += result.removed || 0;
        
        console.log(`Synced account ${account.accountName}: ${result.added} added, ${result.modified} modified, ${result.removed} removed`);
      } catch (error) {
        console.error(`Error syncing account ${account.id}:`, error);
        errors.push({
          accountId: account.id,
          accountName: account.accountName,
          error: error.message
        });
      }
    }

    if (errors.length > 0 && totalAdded === 0 && totalModified === 0) {
      return res.status(500).json({ 
        error: 'Failed to sync transactions',
        details: errors
      });
    }

    res.json({ 
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
      accountsProcessed: accounts.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ error: 'Failed to sync transactions', message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const account = await Account.findOne({
      where: { id: accountId, userId: req.userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Delete associated transactions first
    await Transaction.destroy({
      where: { accountId: account.id }
    });

    // Delete the account
    await account.destroy();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
