const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');
const { authenticate } = require('../middleware/auth');

// Create subscription
router.post('/create-subscription', authenticate, paypalController.createSubscription);

// Handle subscription approval
router.post('/subscription-approved', authenticate, paypalController.handleSubscriptionApproval);

// Cancel subscription
router.post('/cancel-subscription', authenticate, paypalController.cancelSubscription);

// Get subscription status
router.get('/subscription', authenticate, paypalController.getSubscription);

// Webhook (no auth required, verified by PayPal)
router.post('/webhook', paypalController.webhook);

module.exports = router;
