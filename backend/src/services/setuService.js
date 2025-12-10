const axios = require('axios');
const crypto = require('crypto');
const { Account, Transaction } = require('../models');
const aiService = require('./aiService');

class SetuService {
  constructor() {
    // Setu AA FIU Configuration
    this.baseURL = process.env.SETU_BASE_URL || 'https://fiu-sandbox.setu.co';
    this.authURL = process.env.SETU_AUTH_URL || 'https://auth-v2.setu.co/realms/setu/protocol/openid-connect/token';
    this.clientId = process.env.SETU_CLIENT_ID;
    this.clientSecret = process.env.SETU_CLIENT_SECRET;
    this.productInstanceId = process.env.SETU_PRODUCT_INSTANCE_ID;
    this.redirectUrl = process.env.SETU_REDIRECT_URL || 'http://localhost:3001/consent/callback';
    this.webhookUrl = process.env.SETU_WEBHOOK_URL || 'http://localhost:5000/api/setu/webhook';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.consentStates = new Map();

    if (!this.clientId || !this.clientSecret || !this.productInstanceId) {
      console.warn('\n⚠️  SETU AA NOT CONFIGURED - Indian bank connections disabled');
      this.configured = false;
      return;
    }

    this.configured = true;
    console.log('✓ Setu AA service initialized');
    console.log('  Base URL:', this.baseURL);
    console.log('  Product Instance ID:', this.productInstanceId);
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('\n=== Authenticating with Setu AA ===');
      console.log('  Auth URL:', this.authURL);
      
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'TEST'
      });

      const response = await axios.post(this.authURL, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });

      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid auth response: missing access_token');
      }

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 1800;
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - 60000;

      console.log('✓ Authentication successful');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Setu AA authentication failed');
      console.error('  URL:', this.authURL);
      console.error('  Status:', error.response?.status);
      console.error('  Message:', error.message);
      
      if (error.code === 'ENOTFOUND') {
        throw new Error(`Cannot connect to Setu Auth: ${this.authURL}`);
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Invalid Setu credentials - Check SETU_CLIENT_ID and SETU_CLIENT_SECRET');
      }
      throw new Error(`Setu auth failed: ${error.message}`);
    }
  }

  async makeAuthenticatedRequest(method, endpoint, data = null, retries = 2) {
    const token = await this.getAccessToken();
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-product-instance-id': this.productInstanceId,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };
    if (data) config.data = data;

    try {
      console.log(`  API: ${method} ${endpoint}`);
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`❌ API failed: ${method} ${endpoint}`);
      console.error('  Status:', error.response?.status);
      if (error.response?.data) {
        console.error('  Error:', JSON.stringify(error.response.data));
      }
      
      if (error.response?.status === 401 && retries > 0) {
        this.accessToken = null;
        this.tokenExpiry = null;
        return this.makeAuthenticatedRequest(method, endpoint, data, retries - 1);
      }
      if (error.response?.status >= 500 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.makeAuthenticatedRequest(method, endpoint, data, retries - 1);
      }
      throw error;
    }
  }

  async createConsentRequest(userId, userVua, fromDate, toDate) {
    if (!this.configured) {
      throw new Error('Setu AA not configured. Add SETU_CLIENT_ID, SETU_CLIENT_SECRET, and SETU_PRODUCT_INSTANCE_ID to .env');
    }

    try {
      console.log('\n=== Creating Setu AA Consent ===');
      const vua = userVua.includes('@') ? userVua : `${userVua}@onemoney`;
      const from = fromDate || new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
      const to = toDate || new Date().toISOString();

      const consentPayload = {
        consentDuration: {
          unit: 'MONTH',
          value: '24'
        },
        vua: vua,
        dataRange: {
          from: from,
          to: to
        },
        consentTypes: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
        context: []
      };

      console.log('  VUA:', vua);
      console.log('  Date range:', from, 'to', to);

      const response = await this.makeAuthenticatedRequest('POST', '/v2/consents', consentPayload);
      if (!response || !response.id) {
        throw new Error('Invalid consent response');
      }

      console.log('✓ Consent created:', response.id);
      console.log('  URL:', response.url);
      this.consentStates.set(response.id, { status: 'PENDING', userId, createdAt: new Date() });

      return {
        consentId: response.id,
        consentUrl: response.url,
        status: response.status || 'PENDING'
      };
    } catch (error) {
      console.error('❌ Create consent failed:', error.message);
      if (error.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to Setu AA. Check SETU_BASE_URL');
      }
      if (error.response?.data) {
        const errMsg = error.response.data.message || JSON.stringify(error.response.data);
        throw new Error(`Setu AA Error: ${errMsg}`);
      }
      throw new Error(`Failed to create consent: ${error.message}`);
    }
  }

  async getConsentStatus(consentId) {
    if (!this.configured) throw new Error('Setu AA not configured');

    try {
      const response = await this.makeAuthenticatedRequest('GET', `/v2/consents/${consentId}`);
      const state = this.consentStates.get(consentId);
      if (state) {
        state.status = response.status;
        this.consentStates.set(consentId, state);
      }
      console.log(`  Consent ${consentId}: ${response.status}`);
      return {
        id: response.id,
        status: response.status,
        accounts: response.accountsLinked || [],
        detail: response.detail || {}
      };
    } catch (error) {
      console.error('Get consent status error:', error.message);
      throw error;
    }
  }

  async fetchAccounts(consentId) {
    if (!this.configured) throw new Error('Setu AA not configured');

    try {
      console.log('\n=== Fetching Accounts ===');
      const consentStatus = await this.getConsentStatus(consentId);
      const accounts = consentStatus.accounts || [];
      console.log(`✓ Found ${accounts.length} linked accounts`);
      return accounts;
    } catch (error) {
      console.error('Fetch accounts error:', error.message);
      throw error;
    }
  }

  async fetchFIData(consentId, fromDate, toDate) {
    if (!this.configured) throw new Error('Setu AA not configured');

    try {
      console.log('\n=== Fetching FI Data ===');
      const from = fromDate || new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
      const to = toDate || new Date().toISOString();

      const payload = {
        consentId: consentId,
        dataRange: { from: from, to: to }
      };

      const response = await this.makeAuthenticatedRequest('POST', '/v2/sessions', payload);
      if (!response || !response.id) {
        throw new Error('Invalid FI session response');
      }

      console.log('✓ FI session created:', response.id);
      await this.waitForFIData(response.id);
      const fiData = await this.makeAuthenticatedRequest('GET', `/v2/sessions/${response.id}`);
      console.log('✓ FI data fetched');
      return fiData;
    } catch (error) {
      console.error('Fetch FI data error:', error.message);
      throw error;
    }
  }

  async waitForFIData(sessionId, maxAttempts = 15) {
    console.log('  Waiting for FI data...');
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.makeAuthenticatedRequest('GET', `/v2/sessions/${sessionId}`);
        console.log(`  Attempt ${i + 1}: ${response.status}`);
        if (response.status === 'COMPLETED' || response.status === 'ACTIVE') {
          console.log('  ✓ FI data ready');
          return true;
        }
        if (response.status === 'FAILED' || response.status === 'EXPIRED') {
          throw new Error(`FI data fetch ${response.status.toLowerCase()}`);
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    throw new Error('Timeout waiting for FI data');
  }

  async fetchAccountData(consentId, userId, fromDate, toDate) {
    if (!this.configured) throw new Error('Setu AA not configured');

    try {
      console.log('\n=== Fetching Complete Account Data ===');
      const consentStatus = await this.getConsentStatus(consentId);
      if (consentStatus.status !== 'ACTIVE' && consentStatus.status !== 'APPROVED') {
        throw new Error(`Consent not active: ${consentStatus.status}`);
      }

      const accounts = await this.fetchAccounts(consentId);
      const savedAccounts = await this.saveAccounts(accounts, userId, consentId);
      const fiData = await this.fetchFIData(consentId, fromDate, toDate);
      await this.saveTransactions(fiData, userId, savedAccounts);

      console.log('✓ Complete account data fetched');
      return savedAccounts;
    } catch (error) {
      console.error('Fetch account data error:', error.message);
      throw error;
    }
  }

  async saveAccounts(accounts, userId, consentId) {
    const savedAccounts = [];
    for (const account of accounts) {
      try {
        const existing = await Account.findOne({
          where: { userId, setuAccountId: account.linkRefNumber || account.id, provider: 'setu' }
        });

        if (existing) {
          await existing.update({
            setuConsentId: consentId,
            institutionName: account.fipName || 'Indian Bank',
            accountName: account.accType || 'Bank Account',
            currentBalance: parseFloat(account.currentBalance || existing.currentBalance || 0),
            currency: 'INR',
            isActive: true,
            lastSynced: new Date()
          });
          savedAccounts.push(existing);
          console.log('  ✓ Updated:', existing.accountName);
        } else {
          const newAccount = await Account.create({
            userId,
            setuConsentId: consentId,
            setuAccountId: account.linkRefNumber || account.id,
            institutionId: account.FIType || 'DEPOSIT',
            institutionName: account.fipName || 'Indian Bank',
            accountId: account.maskedAccNumber || 'XXXX',
            accountName: account.accType || 'Bank Account',
            accountType: 'depository',
            accountSubtype: 'savings',
            currentBalance: parseFloat(account.currentBalance || 0),
            availableBalance: parseFloat(account.availableBalance || 0),
            currency: 'INR',
            isActive: true,
            provider: 'setu',
            lastSynced: new Date()
          });
          savedAccounts.push(newAccount);
          console.log('  ✓ Created:', newAccount.accountName);
        }
      } catch (error) {
        console.error('  Error saving account:', error.message);
      }
    }
    console.log(`✓ Saved ${savedAccounts.length} accounts`);
    return savedAccounts;
  }

  async saveTransactions(fiData, userId, accounts) {
    if (!fiData || !fiData.transactions) {
      console.log('  No transactions to save');
      return [];
    }

    const savedTransactions = [];
    const transactions = fiData.transactions || [];

    for (const txn of transactions) {
      try {
        const txnId = txn.txnId || txn.id || `${txn.date}_${txn.amount}_${txn.narration}`;
        const account = accounts.find(a => 
          a.setuAccountId === txn.accountId || a.accountId === txn.maskedAccNumber
        ) || accounts[0];
        if (!account) continue;

        const existing = await Transaction.findOne({
          where: { setuTransactionId: txnId, accountId: account.id }
        });
        if (existing) continue;

        const txnDate = new Date(txn.date || txn.valueDate || txn.transactionTimestamp);
        const amount = Math.abs(parseFloat(txn.amount || 0));
        const description = txn.narration || txn.description || 'Transaction';
        const txnType = (txn.type === 'CREDIT' || txn.txnType === 'CREDIT') ? 'income' : 'expense';

        let aiResult = { category: 'Other', confidence: 0.5 };
        try {
          aiResult = await aiService.categorizeTransaction(description, txn.reference || '', amount);
        } catch (aiError) {
          console.log('  AI categorization failed');
        }

        const newTransaction = await Transaction.create({
          userId,
          accountId: account.id,
          setuTransactionId: txnId,
          amount,
          date: txnDate,
          description,
          merchantName: txn.reference || txn.merchant || null,
          category: txnType === 'income' ? 'Revenue' : aiResult.category,
          aiCategory: aiResult.category,
          aiCategoryConfidence: aiResult.confidence,
          type: txnType,
          pending: false
        });
        savedTransactions.push(newTransaction);
      } catch (error) {
        console.error('  Error saving transaction:', error.message);
      }
    }
    console.log(`✓ Saved ${savedTransactions.length} transactions`);
    return savedTransactions;
  }

  async handleWebhook(payload, signature) {
    console.log('\n=== Setu Webhook ===');
    console.log('  Event:', payload.event);

    if (signature && this.webhookSecret) {
      const isValid = this.verifyWebhookSignature(payload, signature);
      if (!isValid) throw new Error('Invalid webhook signature');
    }

    const { consentId, event, status } = payload;
    const state = this.consentStates.get(consentId);
    if (state) {
      state.status = status;
      state.lastEvent = event;
      this.consentStates.set(consentId, state);
    }

    switch (event) {
      case 'CONSENT_APPROVED':
      case 'CONSENT_ACTIVE':
        console.log('  ✓ Consent approved');
        break;
      case 'CONSENT_REJECTED':
        console.log('  ✗ Consent rejected');
        break;
      case 'CONSENT_REVOKED':
        console.log('  ✗ Consent revoked');
        await this.handleConsentRevoked(consentId, state?.userId);
        break;
      case 'DATA_READY':
        console.log('  ✓ Data ready');
        break;
    }

    return { received: true, status: state?.status };
  }

  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) return true;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      console.error('❌ Webhook verification error:', error.message);
      return false;
    }
  }

  async handleConsentRevoked(consentId, userId) {
    try {
      const accounts = await Account.findAll({
        where: { userId, setuConsentId: consentId, provider: 'setu' }
      });
      for (const account of accounts) {
        await account.update({ isActive: false });
      }
    } catch (error) {
      console.error('  Error handling revocation:', error.message);
    }
  }

  async removeAccount(accountId, userId) {
    try {
      const account = await Account.findOne({
        where: { id: accountId, userId, provider: 'setu' }
      });
      if (!account) throw new Error('Account not found');

      if (account.setuConsentId && this.configured) {
        try {
          await this.makeAuthenticatedRequest('DELETE', `/v2/consents/${account.setuConsentId}`);
          console.log('✓ Consent revoked');
        } catch (error) {
          console.error('Error revoking consent:', error.message);
        }
      }

      await account.update({ isActive: false });
      return { success: true };
    } catch (error) {
      console.error('Remove account error:', error);
      throw error;
    }
  }
}

module.exports = new SetuService();
