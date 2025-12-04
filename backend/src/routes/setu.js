const express = require('express');
const router = express.Router();
const setuController = require('../controllers/setuController');
const { authenticate } = require('../middleware/auth');

// Create consent request for Indian bank
router.post('/consent/create', authenticate, setuController.createConsentRequest);

// Check consent status
router.get('/consent/:consentId/status', authenticate, setuController.getConsentStatus);

// Fetch account data after consent approval
router.post('/accounts/fetch', authenticate, setuController.fetchAccountData);

// Callback endpoint (no auth required - comes from Setu)
router.get('/callback', setuController.callback);

// Webhook endpoint (no auth required - comes from Setu)
router.post('/webhook', setuController.webhook);

// Remove account
router.delete('/accounts/:accountId', authenticate, setuController.removeAccount);

module.exports = router;
