const fs = require('fs');
const path = require('path');
const { Account, Transaction } = require('../models');
const aiService = require('./aiCategorizationService');

class MockDataService {
  constructor() {
    this.plaidData = null;
    this.setuData = null;
    this.loadSampleData();
  }

  loadSampleData() {
    try {
      const plaidPath = path.join(__dirname, '../../../plaid_sample_large.json');
      const setuPath = path.join(__dirname, '../../../setu_sample_large.json');

      console.log('Looking for Plaid data at:', plaidPath);
      console.log('Looking for Setu data at:', setuPath);

      if (fs.existsSync(plaidPath)) {
        this.plaidData = JSON.parse(fs.readFileSync(plaidPath, 'utf8'));
        console.log('✓ Loaded Plaid sample data:', this.plaidData.transactions?.length || 0, 'transactions');
        console.log('  Plaid accounts:', this.plaidData.accounts?.length || 0);
      } else {
        console.log('✗ Plaid sample file not found');
      }

      if (fs.existsSync(setuPath)) {
        this.setuData = JSON.parse(fs.readFileSync(setuPath, 'utf8'));
        const txnCount = this.setuData.fiData?.[0]?.transactions?.length || 0;
        console.log('✓ Loaded Setu sample data:', txnCount, 'transactions');
        console.log('  Setu accounts:', this.setuData.fiData?.length || 0);
      } else {
        console.log('✗ Setu sample file not found');
      }
    } catch (error) {
      console.error('Error loading sample data:', error.message);
    }
  }

  // Mock Plaid account linking
  async mockPlaidLink(userId) {
    console.log('\n=== Mock Plaid Account Linking ===');
    console.log('User ID:', userId);
    console.log('Plaid data loaded?', !!this.plaidData);
    console.log('Plaid accounts available:', this.plaidData?.accounts?.length || 0);
    console.log('Plaid transactions available:', this.plaidData?.transactions?.length || 0);

    if (!this.plaidData) {
      throw new Error('Plaid sample data not loaded');
    }

    const savedAccounts = [];

    // Create accounts from sample data
    for (const account of this.plaidData.accounts) {
      const savedAccount = await Account.create({
        userId,
        plaidAccessToken: `mock_access_token_${account.account_id}`,
        plaidItemId: `mock_item_${account.account_id}`,
        institutionId: 'mock_institution',
        institutionName: 'Mock Bank (Sample Data)',
        accountId: account.account_id,
        accountName: account.name,
        accountType: account.type,
        accountSubtype: account.subtype,
        currentBalance: account.balances.current,
        availableBalance: account.balances.available,
        currency: account.balances.iso_currency_code || 'INR',
        isActive: true,
        provider: 'plaid_mock',
        lastSynced: new Date()
      });

      savedAccounts.push(savedAccount);
      console.log('  ✓ Created account:', savedAccount.accountName);
    }

    // Import transactions
    await this.mockPlaidSync(userId, savedAccounts);

    console.log('✓ Mock Plaid linking complete');
    return savedAccounts;
  }

  // Mock Plaid transaction sync
  async mockPlaidSync(userId, accounts = null) {
    if (!this.plaidData) {
      throw new Error('Plaid sample data not loaded');
    }

    console.log('\n=== Mock Plaid Transaction Sync ===');

    // If no accounts provided, fetch them
    if (!accounts) {
      accounts = await Account.findAll({
        where: { userId, provider: 'plaid_mock', isActive: true }
      });
    }

    if (accounts.length === 0) {
      throw new Error('No mock Plaid accounts found');
    }

    const savedTransactions = [];

    for (const txn of this.plaidData.transactions) {
      // Find matching account
      const account = accounts.find(a => a.accountId === txn.account_id);
      if (!account) continue;

      // Check if transaction already exists
      const existing = await Transaction.findOne({
        where: { plaidTransactionId: txn.transaction_id }
      });

      if (existing) continue;

      // AI categorize the transaction
      let aiResult = { category: 'Other', confidence: 0.5, method: 'fallback' };
      try {
        aiResult = await aiService.categorizeTransaction(
          txn.name,
          txn.merchant_name || '',
          Math.abs(txn.amount),
          userId,
          txn.amount < 0 ? 'expense' : 'income'
        );
      } catch (error) {
        console.log('  AI categorization skipped:', error.message);
      }

      // Determine transaction type
      const type = txn.amount < 0 ? 'expense' : 'income';

      // Create transaction
      const newTransaction = await Transaction.create({
        userId,
        accountId: account.id,
        plaidTransactionId: txn.transaction_id,
        amount: Math.abs(txn.amount),
        date: new Date(txn.date),
        description: txn.name,
        merchantName: txn.merchant_name,
        category: aiResult.category,
        aiCategory: aiResult.category,
        aiCategoryConfidence: aiResult.confidence,
        categorizationMethod: aiResult.method,
        needsReview: aiResult.confidence < 0.75,
        subcategory: txn.category ? txn.category[1] : null,
        type: type,
        pending: txn.pending || false
      });

      savedTransactions.push(newTransaction);
    }

    console.log(`✓ Synced ${savedTransactions.length} transactions`);
    return {
      synced: savedTransactions.length,
      transactions: savedTransactions
    };
  }

  // Mock Setu account linking
  async mockSetuLink(userId) {
    console.log('\n=== Mock Setu Account Linking ===');
    console.log('User ID:', userId);
    console.log('Setu data loaded?', !!this.setuData);
    console.log('Setu accounts available:', this.setuData?.fiData?.length || 0);
    
    if (!this.setuData) {
      throw new Error('Setu sample data not loaded');
    }

    const savedAccounts = [];

    // Create accounts from sample data
    for (const fiAccount of this.setuData.fiData) {
      const savedAccount = await Account.create({
        userId,
        setuConsentId: `mock_consent_${Date.now()}`,
        setuAccountId: fiAccount.maskedAccNumber || `mock_${Date.now()}`,
        institutionId: 'DEPOSIT',
        institutionName: 'Mock Indian Bank (Sample Data)',
        accountId: fiAccount.maskedAccNumber || 'XXXX',
        accountName: fiAccount.profile?.type || 'Savings Account',
        accountType: 'depository',
        accountSubtype: 'savings',
        currentBalance: fiAccount.summary?.currentBalance?.amount || 0,
        availableBalance: fiAccount.summary?.currentBalance?.amount || 0,
        currency: 'INR',
        isActive: true,
        provider: 'setu_mock',
        lastSynced: new Date()
      });

      savedAccounts.push(savedAccount);
      console.log('  ✓ Created account:', savedAccount.accountName);
    }

    // Import transactions
    await this.mockSetuSync(userId, savedAccounts);

    console.log('✓ Mock Setu linking complete');
    return savedAccounts;
  }

  // Mock Setu transaction sync
  async mockSetuSync(userId, accounts = null) {
    if (!this.setuData) {
      throw new Error('Setu sample data not loaded');
    }

    console.log('\n=== Mock Setu Transaction Sync ===');

    // If no accounts provided, fetch them
    if (!accounts) {
      accounts = await Account.findAll({
        where: { userId, provider: 'setu_mock', isActive: true }
      });
    }

    if (accounts.length === 0) {
      throw new Error('No mock Setu accounts found');
    }

    const savedTransactions = [];

    for (const fiAccount of this.setuData.fiData) {
      const account = accounts.find(a => 
        a.setuAccountId === fiAccount.maskedAccNumber || 
        a.accountId === fiAccount.maskedAccNumber
      ) || accounts[0];

      if (!account || !fiAccount.transactions) continue;

      for (const txn of fiAccount.transactions) {
        // Check if transaction already exists
        const existing = await Transaction.findOne({
          where: { setuTransactionId: txn.txnId }
        });

        if (existing) continue;

        const amount = Math.abs(parseFloat(txn.txnAmount?.amount || 0));
        const description = txn.narration || 'Transaction';
        const txnType = txn.txnType === 'CREDIT' ? 'income' : 'expense';

        // AI categorize the transaction
        let aiResult = { category: 'Other', confidence: 0.5, method: 'fallback' };
        try {
          aiResult = await aiService.categorizeTransaction(
            description,
            txn.reference || '',
            amount,
            userId,
            txnType
          );
        } catch (error) {
          console.log('  AI categorization skipped:', error.message);
        }

        // Create transaction
        const newTransaction = await Transaction.create({
          userId,
          accountId: account.id,
          setuTransactionId: txn.txnId,
          amount,
          date: new Date(txn.txnDate || txn.valueDate),
          description,
          merchantName: txn.reference || null,
          category: aiResult.category,
          aiCategory: aiResult.category,
          aiCategoryConfidence: aiResult.confidence,
          categorizationMethod: aiResult.method,
          needsReview: aiResult.confidence < 0.75,
          type: txnType,
          pending: false
        });

        savedTransactions.push(newTransaction);
      }
    }

    console.log(`✓ Synced ${savedTransactions.length} transactions`);
    return {
      synced: savedTransactions.length,
      transactions: savedTransactions
    };
  }

  // Get mock account balances
  getMockPlaidAccounts() {
    return this.plaidData?.accounts || [];
  }

  getMockSetuAccounts() {
    return this.setuData?.fiData || [];
  }

  // Check if mock data is available
  isPlaidMockAvailable() {
    return this.plaidData !== null;
  }

  isSetuMockAvailable() {
    return this.setuData !== null;
  }
}

module.exports = new MockDataService();
