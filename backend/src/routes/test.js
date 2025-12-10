/**
 * Test Routes - For testing categorization and forecasting with dummy data
 */

const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticate } = require('../middleware/auth');

// Test endpoints (require authentication)
router.use(authenticate);

// Load dummy data
router.post('/load-dummy-data', testController.loadDummyData);

// Test categorization
router.post('/categorize', testController.testCategorization);

// Test forecasting
router.post('/forecast', testController.testForecasting);

// Get test statistics
router.get('/stats', testController.getTestStats);

// Clear test data
router.delete('/clear', testController.clearTestData);

// Get AI service statistics (including API key status)
router.get('/ai-stats', testController.getAIStats);

// Reset API key statistics
router.post('/reset-api-keys', testController.resetAPIKeys);

// Get API quota usage
router.get('/quota-usage', testController.getQuotaUsage);

module.exports = router;
