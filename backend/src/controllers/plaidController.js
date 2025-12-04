const plaidService = require('../services/plaidService');

exports.createLinkToken = async (req, res) => {
  try {
    const userId = req.userId;
    const linkToken = await plaidService.createLinkToken(userId);

    res.json({ linkToken });
  } catch (error) {
    console.error('Create link token error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.exchangePublicToken = async (req, res) => {
  try {
    const { publicToken } = req.body;
    const userId = req.userId;

    if (!publicToken) {
      return res.status(400).json({ error: 'Public token required' });
    }

    const accounts = await plaidService.exchangePublicToken(publicToken, userId);

    res.json({
      success: true,
      accounts,
      message: 'Bank account linked successfully',
    });
  } catch (error) {
    console.error('Exchange public token error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.syncTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const results = await plaidService.syncAllAccounts(userId);

    res.json({
      success: true,
      results,
      message: 'Transactions synced successfully',
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.webhook = async (req, res) => {
  try {
    const { webhook_type, webhook_code, item_id } = req.body;

    // Process webhook asynchronously
    plaidService.handleWebhook(webhook_type, webhook_code, item_id)
      .catch(error => console.error('Webhook processing error:', error));

    // Respond immediately
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.removeAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.userId;

    await plaidService.removeAccount(accountId, userId);

    res.json({
      success: true,
      message: 'Account removed successfully',
    });
  } catch (error) {
    console.error('Remove account error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.userId;

    const balance = await plaidService.getBalance(accountId, userId);

    res.json({ balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: error.message });
  }
};
