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

    let totalSynced = 0;
    const errors = [];

    for (const account of accounts) {
      try {
        if (!account.plaidAccessToken) {
          console.log(`Skipping account ${account.id} - no access token`);
          continue;
        }

        const result = await plaidService.syncTransactions(
          account.plaidAccessToken,
          req.userId
        );
        totalSynced += result.synced || 0;
        
        console.log(`Synced ${result.synced} transactions for account ${account.accountName}`);
      } catch (error) {
        console.error(`Error syncing account ${account.id}:`, error);
        errors.push({
          accountId: account.id,
          accountName: account.accountName,
          error: error.message
        });
      }
    }

    if (errors.length > 0 && totalSynced === 0) {
      return res.status(500).json({ 
        error: 'Failed to sync transactions',
        details: errors
      });
    }

    res.json({ 
      synced: totalSynced,
      accountsProcessed: accounts.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ error: 'Failed to sync transactions', message: error.message });
  }
};
