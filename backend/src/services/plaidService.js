const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');
const { Account, Transaction } = require('../models');
const aiService = require('./aiCategorizationService');

class PlaidService {
  constructor() {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      console.warn('Plaid credentials not configured');
      this.client = null;
      return;
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId) {
    if (!this.client) {
      console.error('Plaid client not initialized. Check PLAID_CLIENT_ID and PLAID_SECRET in .env');
      throw new Error('Plaid not configured. Please check server configuration.');
    }

    try {
      // Get country codes from env or default to US and CA
      const countryCodes = process.env.PLAID_COUNTRY_CODES 
        ? process.env.PLAID_COUNTRY_CODES.split(',').map(c => c.trim())
        : ['US', 'CA'];

      const response = await this.client.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'FlowFinance',
        products: ['transactions', 'auth'],
        country_codes: countryCodes,
        language: 'en',
        webhook: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/plaid/webhook`,
      });

      return response.data.link_token;
    } catch (error) {
      console.error('Plaid link token error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error_message || 'Failed to create link token');
    }
  }

  async exchangePublicToken(publicToken, userId) {
    if (!this.client) {
      console.error('Plaid client not initialized');
      throw new Error('Plaid not configured');
    }

    try {
      console.log('Exchanging public token for user:', userId);
      
      // Exchange public token for access token
      const exchangeResponse = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;
      console.log('Token exchanged successfully, item ID:', itemId);

      // Get account information
      const accountsResponse = await this.client.accountsGet({
        access_token: accessToken,
      });

      const accounts = accountsResponse.data.accounts;
      const institution = accountsResponse.data.item.institution_id;
      console.log(`Found ${accounts.length} accounts for institution:`, institution);

      // Get institution details
      const countryCodes = process.env.PLAID_COUNTRY_CODES 
        ? process.env.PLAID_COUNTRY_CODES.split(',').map(c => c.trim())
        : ['US', 'CA'];

      const institutionResponse = await this.client.institutionsGetById({
        institution_id: institution,
        country_codes: countryCodes,
      });

      const institutionName = institutionResponse.data.institution.name;
      console.log('Institution name:', institutionName);

      // Save accounts to database
      const savedAccounts = [];
      for (const account of accounts) {
        console.log('Saving account:', account.name);
        const savedAccount = await Account.create({
          userId,
          plaidAccessToken: accessToken,
          plaidItemId: itemId,
          institutionId: institution,
          institutionName,
          accountId: account.account_id,
          accountName: account.name,
          accountType: account.type,
          accountSubtype: account.subtype,
          currentBalance: account.balances.current || 0,
          availableBalance: account.balances.available || 0,
          currency: account.balances.iso_currency_code || 'USD',
          isActive: true,
        });

        savedAccounts.push(savedAccount);
      }

      console.log('Syncing initial transactions...');
      // Sync initial transactions
      await this.syncTransactions(accessToken, userId);

      console.log('Bank account linked successfully');
      return savedAccounts;
    } catch (error) {
      console.error('Plaid exchange token error:', error.response?.data || error.message);
      console.error('Full error:', error);
      throw new Error(error.response?.data?.error_message || error.message || 'Failed to link bank account');
    }
  }

  async syncTransactions(accessToken, userId, startDate = null, endDate = null) {
    if (!this.client) throw new Error('Plaid not configured');

    try {
      // Default to last 90 days if no dates provided
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
      }
      if (!endDate) {
        endDate = new Date();
      }

      const request = {
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      };

      const response = await this.client.transactionsGet(request);
      let transactions = response.data.transactions;

      // Handle pagination
      const totalTransactions = response.data.total_transactions;
      while (transactions.length < totalTransactions) {
        const paginatedRequest = {
          ...request,
          offset: transactions.length,
        };
        const paginatedResponse = await this.client.transactionsGet(paginatedRequest);
        transactions = transactions.concat(paginatedResponse.data.transactions);
      }

      // Get account for this access token
      const account = await Account.findOne({
        where: { plaidAccessToken: accessToken, userId },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Process and save transactions
      const savedTransactions = [];
      for (const txn of transactions) {
        // Check if transaction already exists
        const existing = await Transaction.findOne({
          where: { plaidTransactionId: txn.transaction_id },
        });

        if (existing) {
          // Update existing transaction
          await existing.update({
            amount: txn.amount,
            date: txn.date,
            description: txn.name,
            merchantName: txn.merchant_name,
            category: txn.category ? txn.category[0] : null,
            pending: txn.pending,
          });
          savedTransactions.push(existing);
        } else {
          // AI categorize the transaction (with fallback)
          let aiResult = { category: 'Other', confidence: 0.5 };
          try {
            aiResult = await aiService.categorizeTransaction(
              txn.name,
              txn.merchant_name || '',
              txn.amount,
              userId,
              txn.amount > 0 ? 'expense' : 'income'
            );
          } catch (aiError) {
            console.log('AI categorization failed, using fallback:', aiError.message);
          }

          // Create new transaction
          const newTransaction = await Transaction.create({
            userId,
            accountId: account.id,
            plaidTransactionId: txn.transaction_id,
            amount: txn.amount,
            date: txn.date,
            description: txn.name,
            merchantName: txn.merchant_name,
            category: txn.category ? txn.category[0] : null,
            aiCategory: aiResult.category,
            aiCategoryConfidence: aiResult.confidence,
            subcategory: txn.category ? txn.category[1] : null,
            type: txn.amount > 0 ? 'expense' : 'income',
            pending: txn.pending,
          });

          savedTransactions.push(newTransaction);
        }
      }

      // Update account balance
      const accountsResponse = await this.client.accountsGet({
        access_token: accessToken,
      });

      const accountData = accountsResponse.data.accounts.find(
        (a) => a.account_id === account.accountId
      );

      if (accountData) {
        await account.update({
          currentBalance: accountData.balances.current,
          availableBalance: accountData.balances.available,
          lastSynced: new Date(),
        });
      }

      return {
        synced: savedTransactions.length,
        transactions: savedTransactions,
      };
    } catch (error) {
      console.error('Plaid sync transactions error:', error);
      throw new Error('Failed to sync transactions');
    }
  }

  async syncAllAccounts(userId) {
    try {
      const accounts = await Account.findAll({
        where: { userId, isActive: true },
      });

      const results = [];
      for (const account of accounts) {
        try {
          const result = await this.syncTransactions(
            account.plaidAccessToken,
            userId
          );
          results.push({
            accountId: account.id,
            accountName: account.accountName,
            ...result,
          });
        } catch (error) {
          console.error(`Failed to sync account ${account.id}:`, error);
          results.push({
            accountId: account.id,
            accountName: account.accountName,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Sync all accounts error:', error);
      throw error;
    }
  }

  async handleWebhook(webhookType, webhookCode, itemId) {
    console.log(`Plaid webhook: ${webhookType} - ${webhookCode}`);

    try {
      switch (webhookType) {
        case 'TRANSACTIONS':
          await this.handleTransactionsWebhook(webhookCode, itemId);
          break;
        case 'ITEM':
          await this.handleItemWebhook(webhookCode, itemId);
          break;
        default:
          console.log(`Unhandled webhook type: ${webhookType}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
    }
  }

  async handleTransactionsWebhook(code, itemId) {
    const account = await Account.findOne({
      where: { plaidItemId: itemId },
    });

    if (!account) {
      console.error(`Account not found for item: ${itemId}`);
      return;
    }

    switch (code) {
      case 'INITIAL_UPDATE':
      case 'HISTORICAL_UPDATE':
      case 'DEFAULT_UPDATE':
        // Sync transactions
        await this.syncTransactions(account.plaidAccessToken, account.userId);
        break;
      case 'TRANSACTIONS_REMOVED':
        // Handle removed transactions
        console.log('Transactions removed webhook received');
        break;
      default:
        console.log(`Unhandled transaction webhook code: ${code}`);
    }
  }

  async handleItemWebhook(code, itemId) {
    const account = await Account.findOne({
      where: { plaidItemId: itemId },
    });

    if (!account) {
      console.error(`Account not found for item: ${itemId}`);
      return;
    }

    switch (code) {
      case 'ERROR':
        // Mark account as needing re-authentication
        await account.update({ isActive: false });
        console.log(`Account ${account.id} needs re-authentication`);
        break;
      case 'PENDING_EXPIRATION':
        // Notify user to re-authenticate
        console.log(`Account ${account.id} access expiring soon`);
        break;
      default:
        console.log(`Unhandled item webhook code: ${code}`);
    }
  }

  async removeAccount(accountId, userId) {
    try {
      const account = await Account.findOne({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Remove item from Plaid
      if (this.client) {
        await this.client.itemRemove({
          access_token: account.plaidAccessToken,
        });
      }

      // Soft delete account
      await account.update({ isActive: false });

      return { success: true };
    } catch (error) {
      console.error('Remove account error:', error);
      throw error;
    }
  }

  async getBalance(accountId, userId) {
    try {
      const account = await Account.findOne({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      if (!this.client) {
        return {
          current: account.currentBalance,
          available: account.availableBalance,
        };
      }

      const response = await this.client.accountsBalanceGet({
        access_token: account.plaidAccessToken,
      });

      const accountData = response.data.accounts.find(
        (a) => a.account_id === account.accountId
      );

      if (accountData) {
        await account.update({
          currentBalance: accountData.balances.current,
          availableBalance: accountData.balances.available,
        });

        return {
          current: accountData.balances.current,
          available: accountData.balances.available,
        };
      }

      return {
        current: account.currentBalance,
        available: account.availableBalance,
      };
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }
}

module.exports = new PlaidService();
