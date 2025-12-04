const setuService = require('../services/setuService');
const { User } = require('../models');

/**
 * Create consent request for Indian bank connection
 */
exports.createConsentRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { phone, email } = req.body;

    // Get user's phone and email if not provided
    const user = await User.findByPk(userId);
    const userPhone = phone || user.phone;
    const userEmail = email || user.email;

    if (!userPhone) {
      return res.status(400).json({
        error: 'Phone number required',
        message: 'Please add your phone number in Settings before connecting Indian banks',
        needsPhone: true,
      });
    }

    const consentData = await setuService.createConsentRequest(userId, userPhone, userEmail);

    res.json({
      success: true,
      consentId: consentData.consentId,
      consentUrl: consentData.consentUrl,
      status: consentData.status,
      message: 'Redirect user to complete consent',
    });
  } catch (error) {
    console.error('Create Setu consent error:', error);
    
    // Check if it's a configuration error
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Setu not configured',
        message: 'Indian bank connections are not set up yet. Please contact support or sign up at https://setu.co/ to get credentials.',
        needsSetup: true,
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to create consent request. Please try again or contact support.'
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
 * Fetch account data after consent approval
 */
exports.fetchAccountData = async (req, res) => {
  try {
    const userId = req.userId;
    const { consentId } = req.body;

    if (!consentId) {
      return res.status(400).json({ error: 'Consent ID required' });
    }

    const accounts = await setuService.fetchAccountData(consentId, userId);

    res.json({
      success: true,
      accounts,
      message: 'Indian bank accounts linked successfully',
    });
  } catch (error) {
    console.error('Fetch Setu account data error:', error);
    res.status(500).json({ error: error.message });
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
 * Webhook for consent status updates
 */
exports.webhook = async (req, res) => {
  try {
    const { consentId, status, event } = req.body;

    console.log('Setu webhook received:', { consentId, status, event });

    // Handle consent approval
    if (status === 'ACTIVE' && event === 'CONSENT_APPROVED') {
      console.log('Consent approved:', consentId);
      // You can trigger account data fetch here or wait for user to do it
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Setu webhook error:', error);
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
