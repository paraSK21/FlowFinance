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
        products: ['transactions'],
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
        console.log('Account balances from Plaid:', {
          current: account.balances.current,
          available: account.balances.available,
          currency: account.balances.iso_currency_code
        });
        
        // Ensure balances are properly converted to numbers
        const currentBalance = parseFloat(account.balances.current) || 0;
        const availableBalance = parseFloat(account.balances.available) || 0;
        
        console.log('Converted balances:', { currentBalance, availableBalance });
        
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
          currentBalance: currentBalance,
          availableBalance: availableBalance,
          currency: account.balances.iso_currency_code || 'USD',
          isActive: true,
        });

        savedAccounts.push(savedAccount);
      }

      console.log('Syncing initial transactions...');
      // Sync initial transactions using the new sync endpoint
      await this.syncTransactionsIncremental(accessToken, userId, savedAccounts[0].id);

      console.log('Bank account linked successfully');
      return savedAccounts;
    } catch (error) {
      console.error('Plaid exchange token error:', error.response?.data || error.message);
      console.error('Full error:', error);
      throw new Error(error.response?.data?.error_message || error.message || 'Failed to link bank account');
    }
  }

  /**
   * New incremental sync using /transactions/sync endpoint
   * More efficient - only fetches new/updated transactions using cursor
   */
  async syncTransactionsIncremental(accessToken, userId, accountId) {
    if (!this.client) throw new Error('Plaid not configured');

    try {
      const account = await Account.findOne({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      let cursor = account.plaidSyncCursor || null;
      let hasMore = true;
      let added = [];
      let modified = [];
      let removed = [];

      console.log(`Starting incremental sync for ${account.accountName}, cursor: ${cursor || 'initial'}`);

      // Keep calling /transactions/sync until hasMore is false
      while (hasMore) {
        const request = {
          access_token: accessToken,
        };

        if (cursor) {
          request.cursor = cursor;
        }

        const response = await this.client.transactionsSync(request);
        
        added = added.concat(response.data.added);
        modified = modified.concat(response.data.modified);
        removed = removed.concat(response.data.removed);
        
        hasMore = response.data.has_more;
        cursor = response.data.next_cursor;
      }

      console.log(`Sync complete: ${added.length} added, ${modified.length} modified, ${removed.length} removed`);

      // Process added transactions
      const savedTransactions = [];
      for (const txn of added) {
        // Check if transaction already exists to prevent duplicates
        const existingTransaction = await Transaction.findOne({
          where: { plaidTransactionId: txn.transaction_id }
        });

        if (existingTransaction) {
          console.log(`Transaction ${txn.transaction_id} already exists, skipping...`);
          savedTransactions.push(existingTransaction);
          continue;
        }

        const newTransaction = await Transaction.create({
          userId,
          accountId: account.id,
          plaidTransactionId: txn.transaction_id,
          amount: txn.amount,
          date: txn.date,
          description: txn.name,
          merchantName: txn.merchant_name,
          category: txn.category ? txn.category[0] : null,
          aiCategory: 'Pending',
          aiCategoryConfidence: 0,
          subcategory: txn.category ? txn.category[1] : null,
          type: txn.amount > 0 ? 'income' : 'expense',
          pending: txn.pending,
        });

        savedTransactions.push(newTransaction);
        
        // AI categorize asynchronously
        aiService.categorizeTransaction(
          txn.name,
          txn.merchant_name || '',
          txn.amount,
          userId,
          txn.amount > 0 ? 'income' : 'expense'
        ).then(aiResult => {
          newTransaction.update({
            aiCategory: aiResult.category,
            aiCategoryConfidence: aiResult.confidence,
            categorizationMethod: aiResult.method,
            needsReview: aiResult.confidence < 0.75
          });
        }).catch(aiError => {
          console.log('AI categorization failed:', aiError.message);
          newTransaction.update({
            aiCategory: 'Other',
            aiCategoryConfidence: 0.5,
            needsReview: true
          });
        });
      }

      // Process modified transactions
      for (const txn of modified) {
        const existing = await Transaction.findOne({
          where: { plaidTransactionId: txn.transaction_id },
        });

        if (existing) {
          await existing.update({
            amount: txn.amount,
            date: txn.date,
            description: txn.name,
            merchantName: txn.merchant_name,
            category: txn.category ? txn.category[0] : null,
            pending: txn.pending,
          });
          savedTransactions.push(existing);
        }
      }

      // Process removed transactions
      for (const txn of removed) {
        await Transaction.destroy({
          where: { plaidTransactionId: txn.transaction_id },
        });
      }

      // Update account with new cursor and balance
      const accountsResponse = await this.client.accountsGet({
        access_token: accessToken,
      });

      const accountData = accountsResponse.data.accounts.find(
        (a) => a.account_id === account.accountId
      );

      if (accountData) {
        await account.update({
          currentBalance: parseFloat(accountData.balances.current) || 0,
          availableBalance: parseFloat(accountData.balances.available) || 0,
          plaidSyncCursor: cursor,
          lastSynced: new Date(),
        });
      }

      return {
        added: added.length,
        modified: modified.length,
        removed: removed.length,
        transactions: savedTransactions,
      };
    } catch (error) {
      console.error('Plaid incremental sync error:', error);
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
          const result = await this.syncTransactionsIncremental(
            account.plaidAccessToken,
            userId,
            account.id
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
        // Sync transactions using incremental sync
        console.log(`Webhook triggered sync for account ${account.accountName}`);
        await this.syncTransactionsIncremental(account.plaidAccessToken, account.userId, account.id);
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
