const mockDataService = require('../services/mockDataService');
const { Account } = require('../models');

/**
 * Get mock data status
 */
exports.getMockStatus = async (req, res) => {
  try {
    let linkedAccounts = [];
    
    // If user is authenticated, check their mock accounts
    if (req.userId) {
      const mockAccounts = await Account.findAll({
        where: {
          userId: req.userId,
          provider: ['plaid_mock', 'setu_mock']
        }
      });

      linkedAccounts = mockAccounts.map(acc => ({
        id: acc.id,
        name: acc.accountName,
        provider: acc.provider,
        balance: acc.currentBalance
      }));
    }

    res.json({
      mockDataAvailable: {
        plaid: mockDataService.isPlaidMockAvailable(),
        setu: mockDataService.isSetuMockAvailable()
      },
      linkedAccounts,
      sampleData: {
        plaid: {
          accounts: mockDataService.getMockPlaidAccounts().length,
          transactions: mockDataService.plaidData?.transactions?.length || 0
        },
        setu: {
          accounts: mockDataService.getMockSetuAccounts().length,
          transactions: mockDataService.setuData?.fiData?.[0]?.transactions?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Get mock status error:', error);
    res.status(500).json({ error: 'Failed to get mock data status' });
  }
};

/**
 * Link mock Plaid account
 */
exports.linkMockPlaid = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mockDataService.isPlaidMockAvailable()) {
      return res.status(400).json({ error: 'Plaid sample data not available' });
    }

    const accounts = await mockDataService.mockPlaidLink(userId);

    res.json({
      success: true,
      message: `Successfully linked ${accounts.length} mock Plaid accounts`,
      accounts: accounts.map(acc => ({
        id: acc.id,
        name: acc.accountName,
        balance: acc.currentBalance
      }))
    });
  } catch (error) {
    console.error('Link mock Plaid error:', error);
    res.status(500).json({ error: error.message || 'Failed to link mock Plaid account' });
  }
};

/**
 * Sync mock Plaid transactions
 */
exports.syncMockPlaid = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mockDataService.isPlaidMockAvailable()) {
      return res.status(400).json({ error: 'Plaid sample data not available' });
    }

    const result = await mockDataService.mockPlaidSync(userId);

    res.json({
      success: true,
      message: `Synced ${result.synced} transactions`,
      synced: result.synced
    });
  } catch (error) {
    console.error('Sync mock Plaid error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync mock Plaid transactions' });
  }
};

/**
 * Link mock Setu account
 */
exports.linkMockSetu = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mockDataService.isSetuMockAvailable()) {
      return res.status(400).json({ error: 'Setu sample data not available' });
    }

    const accounts = await mockDataService.mockSetuLink(userId);

    res.json({
      success: true,
      message: `Successfully linked ${accounts.length} mock Setu accounts`,
      accounts: accounts.map(acc => ({
        id: acc.id,
        name: acc.accountName,
        balance: acc.currentBalance
      }))
    });
  } catch (error) {
    console.error('Link mock Setu error:', error);
    res.status(500).json({ error: error.message || 'Failed to link mock Setu account' });
  }
};

/**
 * Sync mock Setu transactions
 */
exports.syncMockSetu = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mockDataService.isSetuMockAvailable()) {
      return res.status(400).json({ error: 'Setu sample data not available' });
    }

    const result = await mockDataService.mockSetuSync(userId);

    res.json({
      success: true,
      message: `Synced ${result.synced} transactions`,
      synced: result.synced
    });
  } catch (error) {
    console.error('Sync mock Setu error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync mock Setu transactions' });
  }
};

/**
 * Remove all mock accounts
 */
exports.removeMockAccounts = async (req, res) => {
  try {
    const userId = req.userId;
    const { Op } = require('sequelize');

    // Find all mock accounts (by provider OR by institution name containing "Mock")
    const mockAccounts = await Account.findAll({
      where: {
        userId,
        [Op.or]: [
          { provider: ['plaid_mock', 'setu_mock'] },
          { institutionName: { [Op.like]: '%Mock%' } }
        ]
      }
    });

    console.log(`Found ${mockAccounts.length} mock accounts to remove for user ${userId}`);

    if (mockAccounts.length === 0) {
      return res.json({
        success: true,
        message: 'No mock accounts to remove'
      });
    }

    // Delete in correct order to avoid foreign key constraint errors
    const { Transaction, CategoryLearning } = require('../models');
    
    for (const account of mockAccounts) {
      console.log(`Deleting account: ${account.accountName} (${account.institutionName})`);
      
      // Get all transactions for this account
      const transactions = await Transaction.findAll({
        where: { accountId: account.id }
      });
      
      const transactionIds = transactions.map(t => t.id);
      
      // Step 1: Delete category learnings first (they reference transactions)
      if (transactionIds.length > 0) {
        await CategoryLearning.destroy({
          where: { transactionId: transactionIds }
        });
        console.log(`  Deleted category learnings for ${transactionIds.length} transactions`);
      }
      
      // Step 2: Delete transactions
      await Transaction.destroy({
        where: { accountId: account.id }
      });
      console.log(`  Deleted ${transactionIds.length} transactions`);
      
      // Step 3: Delete account
      await account.destroy();
      console.log(`  Deleted account`);
    }

    res.json({
      success: true,
      message: `Removed ${mockAccounts.length} mock accounts and their transactions`
    });
  } catch (error) {
    console.error('Remove mock accounts error:', error);
    res.status(500).json({ error: 'Failed to remove mock accounts' });
  }
};
