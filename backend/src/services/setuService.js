const axios = require('axios');
const { Account, Transaction } = require('../models');
const aiService = require('./aiService');

class SetuService {
  constructor() {
    // Setu API endpoints - Account Aggregator Sandbox
    this.authURL = 'https://accountservice.setu.co/v1/users/login';
    this.baseURL = 'https://fiu-sandbox.setu.co'; // Sandbox URL, not UAT
    
    // Credentials
    this.clientId = process.env.SETU_CLIENT_ID;
    this.clientSecret = process.env.SETU_CLIENT_SECRET;
    this.orgId = process.env.SETU_ORG_ID;
    this.redirectUrl = process.env.SETU_REDIRECT_URL || `${process.env.BACKEND_URL}/api/setu/callback`;

    // Token management
    this.accessToken = null;
    this.tokenExpiry = null;

    // Check configuration
    if (!this.clientId || !this.clientSecret || 
        this.clientId === 'your_setu_client_id_here' || 
        this.clientSecret === 'your_setu_client_secret_here') {
      console.warn('\n⚠️  ========================================');
      console.warn('⚠️  SETU NOT CONFIGURED');
      console.warn('⚠️  ========================================');
      console.warn('⚠️  Indian bank connections will not work.');
      console.warn('⚠️  Sign up at https://setu.co/ to get credentials');
      console.warn('⚠️  ========================================\n');
      this.configured = false;
      return;
    }

    this.configured = true;
    console.log('✓ Setu service initialized for Indian banks');
  }

  /**
   * Get access token from Setu using proper authentication flow
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('Using cached Setu access token');
      return this.accessToken;
    }

    try {
      console.log('\n=== Authenticating with Setu ===');
      console.log('Auth URL:', this.authURL);
      console.log('Client ID:', this.clientId);

      const response = await axios.post(
        this.authURL,
        {
          clientID: this.clientId,
          secret: this.clientSecret,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'client': 'bridge',
            'Content-Type': 'application/json',
          },
        }
      );

      this.accessToken = response.data.access_token || response.data.token;
      
      // Set token expiry (default 1 hour if not provided)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // Refresh 1 min before expiry

      console.log('✓ Setu authentication successful');
      console.log('Token expires in:', expiresIn, 'seconds');

      return this.accessToken;
    } catch (error) {
      console.error('❌ Setu authentication failed');
      console.error('Status:', error.response?.status);
      console.error('Error:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response?.data) {
        throw new Error(`Setu Auth Failed: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to authenticate with Setu');
    }
  }

  /**
   * Make authenticated API call to Setu AA
   */
  async makeAuthenticatedRequest(method, endpoint, data = null) {
    const token = await this.getAccessToken();
    
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-product-instance-id': this.orgId, // Required for AA API
      },
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`❌ Setu API call failed: ${method} ${endpoint}`);
      console.error('Status:', error.response?.status);
      console.error('Error:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  /**
   * Create consent request for user to link their bank account
   */
  async createConsentRequest(userId, userPhone, userEmail) {
    if (!this.configured) {
      throw new Error('Setu not configured. Please sign up at https://setu.co/ and add your credentials to backend/.env file');
    }

    try {
      console.log('\n=== Creating Setu Consent Request ===');
      console.log('User Phone:', userPhone);
      console.log('User Email:', userEmail);

      // Format phone number (remove +91 if present, Setu expects 10 digits)
      let phone = userPhone.replace(/\D/g, '');
      if (phone.startsWith('91') && phone.length === 12) {
        phone = phone.substring(2);
      }
      console.log('Formatted Phone:', phone);

      const consentRequest = {
        Detail: {
          consentStart: new Date().toISOString(),
          consentExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          Customer: {
            id: `${phone}@setu`,
            Identifiers: [
              {
                type: 'MOBILE',
                value: phone,
              },
            ],
          },
          FIDataRange: {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
          consentMode: 'STORE',
          consentTypes: ['TRANSACTIONS', 'PROFILE', 'SUMMARY'],
          fetchType: 'PERIODIC',
          Frequency: {
            unit: 'DAY',
            value: 1,
          },
          DataLife: {
            unit: 'MONTH',
            value: 12,
          },
          DataFilter: [
            {
              type: 'TRANSACTIONAMOUNT',
              operator: 'GREATER_THAN',
              value: '0',
            },
          ],
          Purpose: {
            Category: {
              type: 'PERSONAL_FINANCE',
            },
            code: '101',
            text: 'Wealth management service',
          },
        },
        redirectUrl: this.redirectUrl,
      };

      console.log('Request URL:', `${this.baseURL}/consents`);
      console.log('Request Body:', JSON.stringify(consentRequest, null, 2));

      const response = await this.makeAuthenticatedRequest('POST', '/consents', consentRequest);

      console.log('✓ Consent created successfully');
      console.log('Response:', response);

      return {
        consentId: response.id,
        consentUrl: response.url,
        status: response.status,
      };
    } catch (error) {
      console.error('\n❌ Setu Consent Request Failed');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Code:', error.code);
      console.error('Error Status:', error.response?.status);
      console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);
      
      // Check for network errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Setu API. Please check your internet connection or Setu service status.');
      }
      
      // More detailed error message
      if (error.response?.data) {
        const errorMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
        throw new Error(`Setu API Error: ${errorMsg}`);
      }
      
      throw new Error(error.message || 'Failed to create consent request for Indian bank');
    }
  }

  /**
   * Check consent status
   */
  async getConsentStatus(consentId) {
    if (!this.configured) throw new Error('Setu not configured');

    try {
      const response = await this.makeAuthenticatedRequest('GET', `/consents/${consentId}`);

      return {
        id: response.id,
        status: response.status,
        accounts: response.Accounts || [],
      };
    } catch (error) {
      console.error('Setu consent status error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch account data after consent is approved
   */
  async fetchAccountData(consentId, userId) {
    if (!this.configured) throw new Error('Setu not configured');

    try {
      console.log('Fetching account data for consent:', consentId);

      // Create data session
      const sessionData = {
        consentId: consentId,
        DataRange: {
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
      };

      const sessionResponse = await this.makeAuthenticatedRequest('POST', '/sessions', sessionData);
      const sessionId = sessionResponse.id;
      console.log('Data session created:', sessionId);

      // Wait for data to be ready
      await this.waitForData(sessionId);

      // Fetch the actual data
      const dataResponse = await this.makeAuthenticatedRequest('GET', `/sessions/${sessionId}`);
      const accountData = dataResponse;

      // Save accounts to database
      const savedAccounts = await this.saveAccounts(accountData, userId, consentId);

      // Sync transactions
      await this.syncTransactions(accountData, userId, savedAccounts);

      return savedAccounts;
    } catch (error) {
      console.error('Setu fetch account data error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Indian bank account data');
    }
  }

  /**
   * Wait for data to be ready (polling)
   */
  async waitForData(sessionId, maxAttempts = 15) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.makeAuthenticatedRequest('GET', `/sessions/${sessionId}`);

        if (response.status === 'COMPLETED') {
          return true;
        } else if (response.status === 'FAILED') {
          throw new Error('Data fetch failed');
        }

        // Wait 3 seconds before next attempt
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    throw new Error('Timeout waiting for account data');
  }

  /**
   * Save accounts to database
   */
  async saveAccounts(sessionData, userId, consentId) {
    const savedAccounts = [];

    for (const account of sessionData.Accounts || []) {
      try {
        const savedAccount = await Account.create({
          userId,
          setuConsentId: consentId,
          setuAccountId: account.linkRefNumber,
          institutionId: account.FIType,
          institutionName: account.fipName || 'Indian Bank',
          accountId: account.maskedAccNumber,
          accountName: account.accType,
          accountType: account.type,
          accountSubtype: account.FIType,
          currentBalance: parseFloat(account.currentBalance || 0),
          availableBalance: parseFloat(account.availableBalance || 0),
          currency: account.currency || 'INR',
          isActive: true,
          provider: 'setu',
        });

        savedAccounts.push(savedAccount);
        console.log('✓ Saved Indian bank account:', savedAccount.accountName);
      } catch (error) {
        console.error('Error saving account:', error.message);
      }
    }

    return savedAccounts;
  }

  /**
   * Sync transactions from Setu
   */
  async syncTransactions(sessionData, userId, accounts) {
    const savedTransactions = [];

    for (const accountInfo of sessionData.Accounts || []) {
      const account = accounts.find((a) => a.setuAccountId === accountInfo.linkRefNumber);
      if (!account) continue;

      for (const txn of accountInfo.Transactions || []) {
        try {
          // Check if transaction already exists
          const existing = await Transaction.findOne({
            where: {
              setuTransactionId: txn.txnId,
              accountId: account.id,
            },
          });

          if (existing) {
            await existing.update({
              amount: Math.abs(parseFloat(txn.amount)),
              date: txn.valueDate || txn.transactionTimestamp,
              description: txn.narration,
              type: txn.type === 'CREDIT' ? 'income' : 'expense',
            });
            savedTransactions.push(existing);
          } else {
            // AI categorize the transaction
            const aiResult = await aiService.categorizeTransaction(
              txn.narration,
              txn.reference || '',
              parseFloat(txn.amount)
            );

            const newTransaction = await Transaction.create({
              userId,
              accountId: account.id,
              setuTransactionId: txn.txnId,
              amount: Math.abs(parseFloat(txn.amount)),
              date: txn.valueDate || txn.transactionTimestamp,
              description: txn.narration,
              merchantName: txn.reference,
              category: txn.type === 'CREDIT' ? 'Revenue' : 'Operations',
              aiCategory: aiResult.category,
              aiCategoryConfidence: aiResult.confidence,
              type: txn.type === 'CREDIT' ? 'income' : 'expense',
              pending: false,
            });

            savedTransactions.push(newTransaction);
          }
        } catch (error) {
          console.error('Error saving transaction:', error.message);
        }
      }
    }

    console.log(`✓ Synced ${savedTransactions.length} transactions from Indian banks`);
    return savedTransactions;
  }

  /**
   * Remove account
   */
  async removeAccount(accountId, userId) {
    try {
      const account = await Account.findOne({
        where: { id: accountId, userId, provider: 'setu' },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Revoke consent if needed
      if (account.setuConsentId && this.configured) {
        try {
          await this.makeAuthenticatedRequest('DELETE', `/consents/${account.setuConsentId}`);
        } catch (error) {
          console.error('Error revoking consent:', error.message);
        }
      }

      // Soft delete account
      await account.update({ isActive: false });

      return { success: true };
    } catch (error) {
      console.error('Remove Setu account error:', error);
      throw error;
    }
  }
}

module.exports = new SetuService();
