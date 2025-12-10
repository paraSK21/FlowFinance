/**
 * Test Controller - Handle test data and feature testing
 */

const { Transaction, Account } = require('../models');
const aiService = require('../services/aiCategorizationService');

// Dummy transaction data
const dummyTransactions = [
  // Revenue transactions
  { description: 'Client payment for web development', merchantName: 'Acme Corp', amount: -5000, type: 'income', date: new Date('2024-11-01') },
  { description: 'Invoice payment received', merchantName: 'Tech Solutions Inc', amount: -3500, type: 'income', date: new Date('2024-11-05') },
  { description: 'Consulting services payment', merchantName: 'StartupXYZ', amount: -2800, type: 'income', date: new Date('2024-11-10') },
  { description: 'Monthly retainer payment', merchantName: 'BigCorp Ltd', amount: -4200, type: 'income', date: new Date('2024-11-15') },
  
  // Meals & Entertainment
  { description: 'Business lunch meeting', merchantName: 'Starbucks', amount: 45.50, type: 'expense', date: new Date('2024-11-02') },
  { description: 'Client dinner', merchantName: 'The Italian Restaurant', amount: 180.00, type: 'expense', date: new Date('2024-11-08') },
  { description: 'Coffee meeting', merchantName: 'Local Cafe', amount: 25.00, type: 'expense', date: new Date('2024-11-12') },
  
  // Operations
  { description: 'Office supplies purchase', merchantName: 'Amazon Business', amount: 250.00, type: 'expense', date: new Date('2024-11-03') },
  { description: 'Equipment maintenance', merchantName: 'Tech Repair Co', amount: 450.00, type: 'expense', date: new Date('2024-11-14') },
  { description: 'Office supplies', merchantName: 'Staples', amount: 120.00, type: 'expense', date: new Date('2024-11-20') },
  
  // Marketing
  { description: 'Facebook advertising campaign', merchantName: 'Facebook Ads', amount: 500.00, type: 'expense', date: new Date('2024-11-04') },
  { description: 'Google AdWords', merchantName: 'Google Ads', amount: 750.00, type: 'expense', date: new Date('2024-11-11') },
  { description: 'Social media promotion', merchantName: 'LinkedIn Marketing', amount: 300.00, type: 'expense', date: new Date('2024-11-18') },
  
  // Utilities
  { description: 'Internet service', merchantName: 'Comcast', amount: 89.99, type: 'expense', date: new Date('2024-11-01') },
  { description: 'Phone bill', merchantName: 'Verizon', amount: 120.00, type: 'expense', date: new Date('2024-11-05') },
  { description: 'Electric bill', merchantName: 'Power Company', amount: 150.00, type: 'expense', date: new Date('2024-11-10') },
  
  // Travel
  { description: 'Business trip flight', merchantName: 'United Airlines', amount: 450.00, type: 'expense', date: new Date('2024-11-06') },
  { description: 'Hotel accommodation', merchantName: 'Marriott Hotel', amount: 320.00, type: 'expense', date: new Date('2024-11-07') },
  { description: 'Uber to client meeting', merchantName: 'Uber', amount: 35.00, type: 'expense', date: new Date('2024-11-09') },
  { description: 'Gas for business trip', merchantName: 'Shell Gas Station', amount: 60.00, type: 'expense', date: new Date('2024-11-13') },
  
  // Professional Services
  { description: 'Legal consultation', merchantName: 'Smith & Associates Law', amount: 800.00, type: 'expense', date: new Date('2024-11-16') },
  { description: 'Accounting services', merchantName: 'CPA Firm', amount: 500.00, type: 'expense', date: new Date('2024-11-17') },
  
  // Payroll
  { description: 'Employee salaries', merchantName: 'Gusto Payroll', amount: 8500.00, type: 'expense', date: new Date('2024-11-01') },
  { description: 'Contractor payment', merchantName: 'Freelancer', amount: 2000.00, type: 'expense', date: new Date('2024-11-15') },
  
  // Rent
  { description: 'Office rent', merchantName: 'Property Management Co', amount: 2500.00, type: 'expense', date: new Date('2024-11-01') },
  
  // Insurance
  { description: 'Business insurance premium', merchantName: 'Insurance Company', amount: 450.00, type: 'expense', date: new Date('2024-11-01') },
  
  // Taxes
  { description: 'Quarterly tax payment', merchantName: 'IRS', amount: 3500.00, type: 'expense', date: new Date('2024-11-15') },
  
  // Inventory
  { description: 'Product inventory purchase', merchantName: 'Wholesale Supplier', amount: 5000.00, type: 'expense', date: new Date('2024-11-05') },
  
  // Other
  { description: 'Miscellaneous expense', merchantName: 'Unknown Vendor', amount: 75.00, type: 'expense', date: new Date('2024-11-19') },
  { description: 'Bank fee', merchantName: 'Chase Bank', amount: 15.00, type: 'expense', date: new Date('2024-11-20') }
];

/**
 * Load dummy data into database
 */
exports.loadDummyData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Create or get test account
    let account = await Account.findOne({
      where: { userId, accountName: 'Test Account (Dummy Data)' }
    });

    if (!account) {
      account = await Account.create({
        userId,
        accountName: 'Test Account (Dummy Data)',
        accountType: 'checking',
        balance: 25000.00,
        currency: 'USD',
        institution: 'Test Bank',
        isActive: true
      });
    }

    // Delete existing test transactions
    await Transaction.destroy({
      where: { 
        userId,
        accountId: account.id
      }
    });

    // Create dummy transactions
    const transactions = await Promise.all(
      dummyTransactions.map(txn => 
        Transaction.create({
          userId,
          accountId: account.id,
          description: txn.description,
          merchantName: txn.merchantName,
          amount: txn.amount,
          type: txn.type,
          date: txn.date,
          status: 'completed',
          category: null, // Will be categorized
          aiCategory: null,
          aiCategoryConfidence: null
        })
      )
    );

    res.json({
      success: true,
      message: 'Dummy data loaded successfully',
      data: {
        accountId: account.id,
        accountName: account.accountName,
        transactionCount: transactions.length,
        balance: account.balance
      }
    });
  } catch (error) {
    console.error('Error loading dummy data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dummy data',
      message: error.message
    });
  }
};

/**
 * Test categorization on transactions
 */
exports.testCategorization = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionIds } = req.body;

    // Get transactions
    let transactions;
    if (transactionIds && transactionIds.length > 0) {
      transactions = await Transaction.findAll({
        where: { 
          userId,
          id: transactionIds
        }
      });
    } else {
      // Get all uncategorized test transactions
      transactions = await Transaction.findAll({
        where: { 
          userId,
          aiCategory: null
        },
        limit: 30
      });
    }

    if (transactions.length === 0) {
      return res.json({
        success: true,
        message: 'No transactions to categorize',
        data: {
          categorized: 0,
          results: []
        }
      });
    }

    // Categorize transactions
    const results = [];
    for (const txn of transactions) {
      try {
        const result = await aiCategorizationService.categorizeTransaction(
          txn.description,
          txn.merchantName,
          txn.amount,
          userId
        );

        // Update transaction with AI category
        await txn.update({
          aiCategory: result.category,
          aiCategoryConfidence: result.confidence,
          category: result.category // Also set as main category
        });

        results.push({
          id: txn.id,
          description: txn.description,
          merchantName: txn.merchantName,
          amount: txn.amount,
          category: result.category,
          confidence: result.confidence,
          method: result.method
        });
      } catch (error) {
        console.error(`Error categorizing transaction ${txn.id}:`, error);
        results.push({
          id: txn.id,
          description: txn.description,
          error: error.message
        });
      }
    }

    // Calculate statistics
    const stats = {
      total: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      averageConfidence: results
        .filter(r => r.confidence)
        .reduce((sum, r) => sum + r.confidence, 0) / results.filter(r => r.confidence).length,
      methods: results.reduce((acc, r) => {
        if (r.method) {
          acc[r.method] = (acc[r.method] || 0) + 1;
        }
        return acc;
      }, {}),
      categories: results.reduce((acc, r) => {
        if (r.category) {
          acc[r.category] = (acc[r.category] || 0) + 1;
        }
        return acc;
      }, {})
    };

    res.json({
      success: true,
      message: `Categorized ${stats.successful} transactions`,
      data: {
        results,
        stats
      }
    });
  } catch (error) {
    console.error('Error testing categorization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test categorization',
      message: error.message
    });
  }
};

/**
 * Test forecasting
 */
exports.testForecasting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 90 } = req.body;

    // Get account balance
    const account = await Account.findOne({
      where: { userId, accountName: 'Test Account (Dummy Data)' }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Test account not found. Please load dummy data first.'
      });
    }

    // Get historical transactions
    const transactions = await Transaction.findAll({
      where: { userId, accountId: account.id },
      order: [['date', 'DESC']],
      limit: 100
    });

    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No transactions found. Please load dummy data first.'
      });
    }

    // Generate forecast with ML enhancement
    const forecasts = await aiService.generateForecast(
      transactions,
      parseFloat(account.balance),
      days,
      true // Enable ML
    );

    // Calculate summary statistics
    const summary = {
      startingBalance: parseFloat(account.balance),
      endingBalance: forecasts[forecasts.length - 1].predictedBalance,
      netChange: forecasts[forecasts.length - 1].predictedBalance - parseFloat(account.balance),
      totalIncome: forecasts.reduce((sum, f) => sum + f.projectedIncome, 0),
      totalExpenses: forecasts.reduce((sum, f) => sum + f.projectedExpenses, 0),
      averageConfidence: forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length,
      lowBalanceDays: forecasts.filter(f => f.predictedBalance < 5000).length,
      negativeDays: forecasts.filter(f => f.predictedBalance < 0).length
    };

    res.json({
      success: true,
      message: `Generated ${days}-day forecast`,
      data: {
        forecasts: forecasts.slice(0, 30), // Return first 30 days for display
        summary,
        totalDays: forecasts.length
      }
    });
  } catch (error) {
    console.error('Error testing forecasting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test forecasting',
      message: error.message
    });
  }
};

/**
 * Get test statistics
 */
exports.getTestStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get test account
    const account = await Account.findOne({
      where: { userId, accountName: 'Test Account (Dummy Data)' }
    });

    if (!account) {
      return res.json({
        success: true,
        data: {
          hasTestData: false,
          message: 'No test data loaded'
        }
      });
    }

    // Get transactions
    const transactions = await Transaction.findAll({
      where: { userId, accountId: account.id }
    });

    const categorized = transactions.filter(t => t.aiCategory).length;
    const uncategorized = transactions.length - categorized;

    const categoryDistribution = transactions
      .filter(t => t.aiCategory)
      .reduce((acc, t) => {
        acc[t.aiCategory] = (acc[t.aiCategory] || 0) + 1;
        return acc;
      }, {});

    const avgConfidence = transactions
      .filter(t => t.aiCategoryConfidence)
      .reduce((sum, t) => sum + t.aiCategoryConfidence, 0) / 
      transactions.filter(t => t.aiCategoryConfidence).length || 0;

    res.json({
      success: true,
      data: {
        hasTestData: true,
        account: {
          id: account.id,
          name: account.accountName,
          balance: account.balance
        },
        transactions: {
          total: transactions.length,
          categorized,
          uncategorized,
          averageConfidence: avgConfidence
        },
        categoryDistribution
      }
    });
  } catch (error) {
    console.error('Error getting test stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test statistics',
      message: error.message
    });
  }
};

/**
 * Clear test data
 */
exports.clearTestData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find and delete test account and transactions
    const account = await Account.findOne({
      where: { userId, accountName: 'Test Account (Dummy Data)' }
    });

    if (account) {
      await Transaction.destroy({
        where: { userId, accountId: account.id }
      });

      await account.destroy();
    }

    res.json({
      success: true,
      message: 'Test data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing test data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear test data',
      message: error.message
    });
  }
};

/**
 * Get AI service statistics including API key status
 */
exports.getAIStats = async (req, res) => {
  try {
    const stats = aiService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting AI stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI statistics',
      message: error.message
    });
  }
};

/**
 * Reset API key statistics and failed status
 */
exports.resetAPIKeys = async (req, res) => {
  try {
    const result = aiService.resetApiKeyStats();
    
    res.json({
      success: true,
      message: result.message,
      data: aiService.getStats()
    });
  } catch (error) {
    console.error('Error resetting API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset API keys',
      message: error.message
    });
  }
};

/**
 * Get API quota usage
 */
exports.getQuotaUsage = async (req, res) => {
  try {
    const quotaUsage = aiService.getQuotaUsage();
    
    res.json({
      success: true,
      data: quotaUsage
    });
  } catch (error) {
    console.error('Error getting quota usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quota usage',
      message: error.message
    });
  }
};
