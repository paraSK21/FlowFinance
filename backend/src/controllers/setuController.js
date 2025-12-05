const setuService = require('../services/setuService');
const { User } = require('../models');

/**
 * Create consent request for Indian bank connection
 * Follows Setu AA consent flow with proper VUA and date range
 */
exports.createConsentRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { phone, vua, fromDate, toDate } = req.body;

    // Get user's phone if not provided
    const user = await User.findByPk(userId);
    const userPhone = phone || user.phone;

    if (!userPhone && !vua) {
      return res.status(400).json({
        error: 'Phone number or VUA required',
        message: 'Please add your phone number in Settings before connecting Indian banks',
        needsPhone: true,
      });
    }

    // Format VUA (Virtual User Address)
    const userVua = vua || userPhone;

    // Default date range: last 12 months to now
    const from = fromDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const to = toDate || new Date().toISOString();

    const consentData = await setuService.createConsentRequest(userId, userVua, from, to);

    res.json({
      success: true,
      consentId: consentData.consentId,
      consentUrl: consentData.consentUrl,
      status: consentData.status,
      message: 'Redirect user to consent URL to approve bank linking',
      instructions: 'User must complete consent flow in mobile/webview',
    });
  } catch (error) {
    console.error('Create Setu consent error:', error);
    
    // Check if it's a configuration error
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Setu not configured',
        message: 'Indian bank connections are not set up yet. Please contact support.',
        needsSetup: true,
      });
    }
    
    // Check if it's a credentials or authentication issue
    if (error.message.includes('Token issuer not allowed') || 
        error.message.includes('401') || 
        error.message.includes('Setu Auth Failed')) {
      return res.status(503).json({
        error: 'Setu authentication failed',
        message: 'Unable to authenticate with Setu. Please verify your credentials and base URL in .env file.',
        details: error.message,
        needsAACredentials: true,
        helpUrl: 'https://docs.setu.co/data/account-aggregator/quickstart',
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to create consent request. Please try again or contact support.',
      details: 'Check backend logs for more information'
    });
  }
};

/**
 * Check consent status
 */
exports.getConsentStatus = async (req, res) => {
  try {
    const { consentId } = req.params;
    const status = await setuService.getConsentStatus(consentId);

    res.json(status);
  } catch (error) {
    console.error('Get consent status error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Fetch account data and transactions after consent approval
 * Complete flow: create data session → fetch transactions → save to DB
 */
exports.fetchAccountData = async (req, res) => {
  try {
    const userId = req.userId;
    const { consentId, fromDate, toDate } = req.body;

    if (!consentId) {
      return res.status(400).json({ error: 'Consent ID required' });
    }

    // Check consent status first
    const consentStatus = await setuService.getConsentStatus(consentId);
    
    if (consentStatus.status !== 'ACTIVE' && consentStatus.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Consent not active',
        status: consentStatus.status,
        message: 'Please complete the consent approval process first',
      });
    }

    // Fetch account data (creates data session, fetches transactions, saves to DB)
    const accounts = await setuService.fetchAccountData(
      consentId, 
      userId, 
      fromDate, 
      toDate
    );

    res.json({
      success: true,
      accounts,
      count: accounts.length,
      message: 'Indian bank accounts and transactions synced successfully',
    });
  } catch (error) {
    console.error('Fetch Setu account data error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to fetch account data. Please try again.'
    });
  }
};

/**
 * Callback handler for consent approval
 */
exports.callback = async (req, res) => {
  try {
    const { consentId, status } = req.query;

    console.log('Setu callback received:', { consentId, status });

    if (status === 'ACTIVE') {
      // Redirect to frontend with success
      res.redirect(`${process.env.FRONTEND_URL}/accounts?consent=${consentId}&status=success`);
    } else {
      // Redirect to frontend with error
      res.redirect(`${process.env.FRONTEND_URL}/accounts?status=failed`);
    }
  } catch (error) {
    console.error('Setu callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/accounts?status=error`);
  }
};

/**
 * Webhook for consent status updates and data ready notifications
 * Verifies signature before processing
 */
exports.webhook = async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-setu-signature'] || req.headers['x-setu-signature-v1'];

    console.log('Setu webhook received:', {
      event: payload.event,
      consentId: payload.consentId,
      status: payload.status,
    });

    // Verify webhook signature
    if (!signature) {
      console.warn('⚠️  Webhook received without signature');
      // In production, you should reject unsigned webhooks
      // return res.status(401).json({ error: 'Missing signature' });
    }

    // Handle webhook
    const result = await setuService.handleWebhook(payload, signature);

    res.json({ 
      received: true,
      status: result.status,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Setu webhook error:', error);
    
    if (error.message.includes('Invalid webhook signature')) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove Indian bank account
 */
exports.removeAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.userId;

    await setuService.removeAccount(accountId, userId);

    res.json({
      success: true,
      message: 'Indian bank account removed successfully',
    });
  } catch (error) {
    console.error('Remove Setu account error:', error);
    res.status(500).json({ error: error.message });
  }
};
