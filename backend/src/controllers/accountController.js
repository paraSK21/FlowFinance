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
      where: { userId: req.userId, isActive: true }
    });

    let totalSynced = 0;
    for (const account of accounts) {
      const synced = await plaidService.syncTransactions(account);
      totalSynced += synced;
    }

    res.json({ synced: totalSynced });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
};
