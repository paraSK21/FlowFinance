const express = require('express');
const router = express.Router();
const plaidController = require('../controllers/plaidController');
const { authenticate } = require('../middleware/auth');

// Create link token for Plaid Link
router.post('/create-link-token', authenticate, plaidController.createLinkToken);

// Exchange public token for access token
router.post('/exchange-public-token', authenticate, plaidController.exchangePublicToken);

// Sync transactions
router.post('/sync', authenticate, plaidController.syncTransactions);

// Webhook endpoint (no auth required)
router.post('/webhook', plaidController.webhook);

// Remove account
router.delete('/accounts/:accountId', authenticate, plaidController.removeAccount);

// Get account balance
router.get('/accounts/:accountId/balance', authenticate, plaidController.getBalance);

module.exports = router;
