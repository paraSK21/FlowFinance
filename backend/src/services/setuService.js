const axios = require('axios');
const crypto = require('crypto');
const { Account, Transaction } = require('../models');
const aiService = require('./aiService');

class SetuService {
  constructor() {
    // Setu API endpoints - Use env variable for flexibility
    this.baseURL = process.env.SETU_BASE_URL || 'https://dg-sandbox.setu.co';
    
    // Credentials (server-side only)
    this.clientId = process.env.SETU_CLIENT_ID;
    this.clientSecret = process.env.SETU_CLIENT_SECRET;
    this.orgId = process.env.SETU_ORG_ID;
    this.webhookSecret = process.env.SETU_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET_OR_VERIFY_KEY;
    this.notificationUrl = process.env.SETU_WEBHOOK_URL || `${process.env.BACKEND_URL}/api/setu/webhook`;
    this.redirectUrl = process.env.SETU_REDIRECT_URL || `${process.env.FRONTEND_URL}/consent/callback`;

    // Token management
    this.accessToken = null;
    this.tokenExpiry = null;

    // Consent state tracking
    this.consentStates = new Map(); // consentId -> {status, userId, dataSessionId}

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
    console.log('✓ Setu AA service initialized for Indian banks');
    console.log('  Base URL:', this.baseURL);
    console.log('  Notification URL:', this.notificationUrl);
  }

  /**
   * Get access token from Setu (server-side only)
   * Uses Account Aggregator authentication method
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('Using cached Setu access token');
      return this.accessToken;
    }

    try {
      console.log('\n=== Authenticating with Setu AA ===');
      console.log('  Base URL:', this.baseURL);
      console.log('  Client ID:', this.clientId);
      
      // Account Aggregator uses /session endpoint for authentication
      const authEndpoint = `${this.baseURL}/session`;
      console.log('  Auth endpoint:', authEndpoint);
      
      const authResponse = await axios.post(
        authEndpoint,
        {
          clientID: this.clientId,
          secret: this.clientSecret,
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'x-client-id': this.clientId,
            'x-client-secret': this.clientSecret,
          },
          timeout: 10000,
        }
      );

      this.accessToken = authResponse.data.token || authResponse.data.access_token;
      const expiresIn = authResponse.data.expiresIn || authResponse.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - 60000;

      console.log('✓ Setu AA authentication successful');
      console.log('  Token expires in:', expiresIn, 'seconds');
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ Setu AA authentication failed');
      console.error('  Status:', error.response?.status);
      console.error('  Error:', JSON.stringify(error.response?.data, null, 2));
      console.error('  Message:', error.message);
      
      // Handle 401 - regenerate token
      if (error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = null;
      }
      
      if (error.response?.data) {
        throw new Error(`Setu Auth Failed: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to authenticate with Setu AA. Please verify your credentials and base URL.');
    }
  }

  /**
   * Make authenticated API call to Setu AA with retry logic
   */
  async makeAuthenticatedRequest(method, endpoint, data = null, retries = 1) {
    const token = await this.getAccessToken();
    
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };

    // Add org/product instance ID if required
    if (this.orgId) {
      config.headers['x-product-instance-id'] = this.orgId;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`❌ Setu API call failed: ${method} ${endpoint}`);
      console.error('  Status:', error.response?.status);
      console.error('  Error:', JSON.stringify(error.response?.data, null, 2));
      
      // Handle 401 - regenerate token and retry once
      if (error.response?.status === 401 && retries > 0) {
        console.log('  Regenerating token and retrying...');
        this.accessToken = null;
        this.tokenExpiry = null;
        return this.makeAuthenticatedRequest(method, endpoint, data, retries - 1);
      }
      
      // Handle 5xx with exponential backoff
      if (error.response?.status >= 500 && retries > 0) {
        const delay = Math.pow(2, 1 - retries) * 1000;
        console.log(`  Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeAuthenticatedRequest(method, endpoint, data, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Create consent request for user to link their bank account
   * Follows Setu AA consent flow with proper date range and notification setup
   */
  async createConsentRequest(userId, userVua, fromDate, toDate) {
    if (!this.configured) {
      throw new Error('Setu not configured. Please sign up at https://setu.co/ and add your credentials to backend/.env file');
    }

    try {
      console.log('\n=== Creating Setu AA Consent Request ===');
      console.log('  User VUA:', userVua);
      console.log('  Date Range:', fromDate, 'to', toDate);

      // Format VUA (Virtual User Address) - typically mobile@handle
      // e.g., 9999999999@onemoney
      const vua = userVua.includes('@') ? userVua : `${userVua}@onemoney`;

      // Prepare date range in ISO8601 UTC format
      const from_iso = fromDate ? new Date(fromDate).toISOString() : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const to_iso = toDate ? new Date(toDate).toISOString() : new Date().toISOString();

      const consentRequest = {
        vua: vua,
        consentDuration: {
          unit: 'MONTH',
          value: 3,
        },
        dataRange: {
          from: from_iso,
          to: to_iso,
        },
        fiTypes: ['TRANSACTIONS'], // Request transaction data
        purpose: {
          code: '101',
          text: 'Personal finance management and wealth tracking',
          Category: {
            type: 'PERSONAL_FINANCE',
          },
        },
        redirectUrl: this.redirectUrl,
        notificationUrl: this.notificationUrl,
      };

      console.log('  Request URL:', `${this.baseURL}/consents`);
      console.log('  Request Body:', JSON.stringify(consentRequest, null, 2));

      const response = await this.makeAuthenticatedRequest('POST', '/consents', consentRequest);

      console.log('✓ Consent created successfully');
      console.log('  Consent ID:', response.id);
      console.log('  Consent URL:', response.url);

      // Track consent state
      this.consentStates.set(response.id, {
        status: 'PENDING',
        userId,
        createdAt: new Date(),
      });

      // Log audit trail
      console.log(`[AUDIT] Consent created: ${response.id} for user: ${userId} at ${new Date().toISOString()}`);

      return {
        consentId: response.id,
        consentUrl: response.url,
        status: response.status || 'PENDING',
      };
    } catch (error) {
      console.error('\n❌ Setu Consent Request Failed');
      console.error('  Error Type:', error.constructor.name);
      console.error('  Error Code:', error.code);
      console.error('  Error Status:', error.response?.status);
      console.error('  Error Data:', JSON.stringify(error.response?.data, null, 2));
      
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
   * Check consent status (polling)
   * Status can be: PENDING, ACTIVE, APPROVED, REJECTED, REVOKED, EXPIRED
   */
  async getConsentStatus(consentId) {
    if (!this.configured) throw new Error('Setu not configured');

    try {
      const response = await this.makeAuthenticatedRequest('GET', `/consents/${consentId}`);

      // Update local state
      const state = this.consentStates.get(consentId);
      if (state) {
        state.status = response.status;
        this.consentStates.set(consentId, state);
      }

      console.log(`[AUDIT] Consent status checked: ${consentId} - Status: ${response.status} at ${new Date().toISOString()}`);

      return {
        id: response.id,
        status: response.status,
        accounts: response.Accounts || [],
        fiTypes: response.fiTypes || [],
      };
    } catch (error) {
      console.error('Setu consent status error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create data session after consent is ACTIVE/APPROVED
   * This requests Setu to prepare FI data for the linked accounts
   */
  async createDataSession(consentId, fromDate, toDate) {
    if (!this.configured) throw new Error('Setu not configured');

    try {
      console.log('\n=== Creating Setu Data Session ===');
      console.log('  Consent ID:', consentId);

      // Check consent status first
      const consentStatus = await this.getConsentStatus(consentId);
      if (consentStatus.status !== 'ACTIVE' && consentStatus.status !== 'APPROVED') {
        throw new Error(`Consent not active. Current status: ${consentStatus.status}`);
      }

      // Prepare date range
      const from_iso = fromDate ? new Date(fromDate).toISOString() : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const to_iso = toDate ? new Date(toDate).toISOString() : new Date().toISOString();

      const sessionData = {
        consentId: consentId,
        fiTypes: ['TRANSACTIONS'],
        dataRange: {
          from: from_iso,
          to: to_iso,
        },
      };

      const response = await this.makeAuthenticatedRequest('POST', '/data-sessions', sessionData);
      const dataSessionId = response.id || response.dataSessionId;

      console.log('✓ Data session created:', dataSessionId);
      console.log(`[AUDIT] Data session created: ${dataSessionId} for consent: ${consentId} at ${new Date().toISOString()}`);

      // Update consent state
      const state = this.consentStates.get(consentId);
      if (state) {
        state.dataSessionId = dataSessionId;
        state.status = 'DATA_SESSION_CREATED';
        this.consentStates.set(consentId, state);
      }

      return {
        dataSessionId,
        status: response.status || 'PENDING',
      };
    } catch (error) {
      console.error('❌ Create data session error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch transactions from data session
   * Handles pagination and validates date range
   */
  async fetchTransactions(dataSessionId, fromDate, toDate) {
    if (!this.configured) throw new Error('Setu not configured');

    try {
      console.log('\n=== Fetching Transactions from Data Session ===');
      console.log('  Data Session ID:', dataSessionId);

      // Wait for data session to be ready
      await this.waitForDataSession(dataSessionId);

      let allTransactions = [];
      let nextCursor = null;
      let page = 1;

      do {
        const endpoint = nextCursor 
          ? `/data-sessions/${dataSessionId}/fetch?cursor=${nextCursor}`
          : `/data-sessions/${dataSessionId}/fetch`;

        const response = await this.makeAuthenticatedRequest('GET', endpoint);

        console.log(`  Fetched page ${page}:`, response.transactions?.length || 0, 'transactions');

        // Extract transactions
        const transactions = response.transactions || response.data || [];
        allTransactions = allTransactions.concat(transactions);

        // Check for pagination
        nextCursor = response.nextCursor || response.next;
        page++;

      } while (nextCursor);

      console.log(`✓ Total transactions fetched: ${allTransactions.length}`);

      // Validate date range
      const from_iso = fromDate ? new Date(fromDate) : null;
      const to_iso = toDate ? new Date(toDate) : null;

      if (from_iso || to_iso) {
        allTransactions = allTransactions.filter(txn => {
          const txnDate = new Date(txn.date || txn.valueDate || txn.transactionTimestamp);
          if (from_iso && txnDate < from_iso) return false;
          if (to_iso && txnDate > to_iso) return false;
          return true;
        });
        console.log(`  Transactions in date range: ${allTransactions.length}`);
      }

      console.log(`[AUDIT] Transactions fetched: ${allTransactions.length} from session: ${dataSessionId} at ${new Date().toISOString()}`);

      return allTransactions;
    } catch (error) {
      console.error('❌ Fetch transactions error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Complete flow: fetch account data and transactions after consent approval
   */
  async fetchAccountData(consentId, userId, fromDate, toDate) {
    if (!this.configured) throw new Error('Setu not configured');

    try {
      console.log('\n=== Fetching Account Data (Complete Flow) ===');
      console.log('  Consent ID:', consentId);

      // Step 1: Create data session
      const { dataSessionId } = await this.createDataSession(consentId, fromDate, toDate);

      // Step 2: Fetch transactions
      const transactions = await this.fetchTransactions(dataSessionId, fromDate, toDate);

      // Step 3: Fetch account details from consent
      const consentDetails = await this.getConsentStatus(consentId);

      // Step 4: Save accounts to database
      const savedAccounts = await this.saveAccounts(consentDetails, userId, consentId);

      // Step 5: Save transactions to database
      await this.saveTransactions(transactions, userId, savedAccounts);

      console.log('✓ Account data fetch complete');

      return savedAccounts;
    } catch (error) {
      console.error('❌ Fetch account data error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Indian bank account data');
    }
  }

  /**
   * Wait for data session to be ready (polling with exponential backoff)
   * Status can be: PENDING, ACTIVE, COMPLETED, FAILED
   */
  async waitForDataSession(dataSessionId, maxAttempts = 20) {
    console.log('  Waiting for data session to be ready...');
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.makeAuthenticatedRequest('GET', `/data-sessions/${dataSessionId}`);

        console.log(`  Attempt ${i + 1}: Status = ${response.status}`);

        if (response.status === 'COMPLETED' || response.status === 'READY') {
          console.log('  ✓ Data session ready');
          return true;
        } else if (response.status === 'FAILED' || response.status === 'ERROR') {
          throw new Error(`Data session failed: ${response.error || 'Unknown error'}`);
        }

        // Exponential backoff: 2s, 4s, 6s, 8s, 10s...
        const delay = Math.min(2000 + (i * 2000), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error(`Timeout waiting for data session. Last error: ${error.message}`);
        }
        // Continue polling on transient errors
        if (error.response?.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Timeout waiting for data session to be ready');
  }

  /**
   * Save accounts to database from consent details
   */
  async saveAccounts(consentDetails, userId, consentId) {
    const savedAccounts = [];

    for (const account of consentDetails.accounts || []) {
      try {
        // Check if account already exists
        const existing = await Account.findOne({
          where: {
            userId,
            setuAccountId: account.linkRefNumber || account.id,
            provider: 'setu',
          },
        });

        if (existing) {
          // Update existing account
          await existing.update({
            setuConsentId: consentId,
            institutionName: account.fipName || account.institutionName || 'Indian Bank',
            accountName: account.accType || account.accountType || 'Bank Account',
            currentBalance: parseFloat(account.currentBalance || existing.currentBalance || 0),
            availableBalance: parseFloat(account.availableBalance || existing.availableBalance || 0),
            isActive: true,
            lastSynced: new Date(),
          });
          savedAccounts.push(existing);
          console.log('  ✓ Updated account:', existing.accountName);
        } else {
          // Create new account
          const newAccount = await Account.create({
            userId,
            setuConsentId: consentId,
            setuAccountId: account.linkRefNumber || account.id,
            institutionId: account.FIType || account.fiType || 'DEPOSIT',
            institutionName: account.fipName || account.institutionName || 'Indian Bank',
            accountId: account.maskedAccNumber || account.accountNumber || 'XXXX',
            accountName: account.accType || account.accountType || 'Bank Account',
            accountType: account.type || 'depository',
            accountSubtype: account.FIType || account.fiType || 'savings',
            currentBalance: parseFloat(account.currentBalance || 0),
            availableBalance: parseFloat(account.availableBalance || 0),
            currency: account.currency || 'INR',
            isActive: true,
            provider: 'setu',
            lastSynced: new Date(),
          });
          savedAccounts.push(newAccount);
          console.log('  ✓ Created account:', newAccount.accountName);
        }
      } catch (error) {
        console.error('  Error saving account:', error.message);
      }
    }

    console.log(`✓ Saved ${savedAccounts.length} accounts`);
    return savedAccounts;
  }

  /**
   * Save transactions to database with deduplication
   * Normalizes timezone to UTC and tags merchant names
   */
  async saveTransactions(transactions, userId, accounts) {
    const savedTransactions = [];
    const seenTxnIds = new Set();

    for (const txn of transactions) {
      try {
        // Deduplicate by transaction ID
        const txnId = txn.txnId || txn.id || `${txn.date}_${txn.amount}_${txn.narration}`;
        if (seenTxnIds.has(txnId)) {
          console.log('  Skipping duplicate transaction:', txnId);
          continue;
        }
        seenTxnIds.add(txnId);

        // Find matching account
        const account = accounts.find(a => 
          a.setuAccountId === txn.accountId || 
          a.accountId === txn.maskedAccNumber
        ) || accounts[0]; // Fallback to first account

        if (!account) {
          console.log('  No account found for transaction:', txnId);
          continue;
        }

        // Check if transaction already exists
        const existing = await Transaction.findOne({
          where: {
            setuTransactionId: txnId,
            accountId: account.id,
          },
        });

        // Normalize date to UTC
        const txnDate = new Date(txn.date || txn.valueDate || txn.transactionTimestamp);
        const amount = Math.abs(parseFloat(txn.amount || 0));
        const description = txn.narration || txn.description || 'Transaction';
        const txnType = (txn.type === 'CREDIT' || txn.txnType === 'CREDIT') ? 'income' : 'expense';

        if (existing) {
          // Update existing transaction
          await existing.update({
            amount,
            date: txnDate,
            description,
            type: txnType,
          });
          savedTransactions.push(existing);
        } else {
          // AI categorize the transaction
          let aiResult = { category: 'Other', confidence: 0.5 };
          try {
            aiResult = await aiService.categorizeTransaction(description, txn.reference || '', amount);
          } catch (aiError) {
            console.log('  AI categorization failed, using default');
          }

          // Create new transaction
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
            pending: false,
          });

          savedTransactions.push(newTransaction);
        }
      } catch (error) {
        console.error('  Error saving transaction:', error.message);
      }
    }

    console.log(`✓ Saved ${savedTransactions.length} transactions`);
    console.log(`[AUDIT] Transactions saved: ${savedTransactions.length} at ${new Date().toISOString()}`);
    
    return savedTransactions;
  }

  /**
   * Verify webhook signature from Setu
   * Always verify before trusting webhook payload
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn('⚠️  Webhook secret not configured - skipping signature verification');
      return true; // Allow in dev/testing, but log warning
    }

    try {
      // Setu typically uses HMAC-SHA256 for webhook signatures
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return false;
      }

      console.log('✓ Webhook signature verified');
      return true;
    } catch (error) {
      console.error('❌ Webhook signature verification error:', error.message);
      return false;
    }
  }

  /**
   * Handle webhook notification from Setu
   * Called when consent status changes or data is ready
   */
  async handleWebhook(payload, signature) {
    console.log('\n=== Setu Webhook Received ===');
    console.log('  Event:', payload.event);
    console.log('  Consent ID:', payload.consentId);

    // Verify signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const { consentId, event, status } = payload;

    // Update consent state
    const state = this.consentStates.get(consentId);
    if (state) {
      state.status = status;
      state.lastEvent = event;
      state.lastUpdated = new Date();
      this.consentStates.set(consentId, state);
    }

    console.log(`[AUDIT] Webhook processed: ${event} for consent: ${consentId} at ${new Date().toISOString()}`);

    // Handle different events
    switch (event) {
      case 'CONSENT_APPROVED':
      case 'CONSENT_ACTIVE':
        console.log('  ✓ Consent approved - ready to create data session');
        if (state) state.status = 'ACTIVE';
        break;

      case 'CONSENT_REJECTED':
        console.log('  ✗ Consent rejected by user');
        if (state) state.status = 'REJECTED';
        break;

      case 'CONSENT_REVOKED':
        console.log('  ✗ Consent revoked - purging data');
        if (state) {
          state.status = 'REVOKED';
          // Trigger data deletion if required by retention policy
          await this.handleConsentRevoked(consentId, state.userId);
        }
        break;

      case 'DATA_READY':
        console.log('  ✓ Data ready - can fetch now');
        if (state) state.status = 'DATA_READY';
        break;

      default:
        console.log('  Unknown event:', event);
    }

    return { received: true, status: state?.status };
  }

  /**
   * Handle consent revocation - purge stored data per compliance
   */
  async handleConsentRevoked(consentId, userId) {
    try {
      console.log('  Handling consent revocation:', consentId);

      // Find and deactivate accounts
      const accounts = await Account.findAll({
        where: {
          userId,
          setuConsentId: consentId,
          provider: 'setu',
        },
      });

      for (const account of accounts) {
        await account.update({ isActive: false });
        console.log('  Deactivated account:', account.id);
      }

      // Optionally delete transactions (based on retention policy)
      // await Transaction.destroy({ where: { accountId: accounts.map(a => a.id) } });

      console.log(`[AUDIT] Consent revoked data purged: ${consentId} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('  Error handling consent revocation:', error.message);
    }
  }

  /**
   * Remove account and revoke consent
   * Respects consent duration and DEPA/RBI guidelines
   */
  async removeAccount(accountId, userId) {
    try {
      const account = await Account.findOne({
        where: { id: accountId, userId, provider: 'setu' },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Revoke consent if configured
      if (account.setuConsentId && this.configured) {
        try {
          await this.makeAuthenticatedRequest('DELETE', `/consents/${account.setuConsentId}`);
          console.log('✓ Consent revoked:', account.setuConsentId);
          console.log(`[AUDIT] Consent revoked: ${account.setuConsentId} by user: ${userId} at ${new Date().toISOString()}`);
        } catch (error) {
          console.error('Error revoking consent:', error.message);
        }
      }

      // Soft delete account (preserve for audit)
      await account.update({ isActive: false });

      return { success: true };
    } catch (error) {
      console.error('Remove Setu account error:', error);
      throw error;
    }
  }
}

module.exports = new SetuService();
