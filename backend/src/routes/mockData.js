const express = require('express');
const router = express.Router();
const mockDataController = require('../controllers/mockDataController');
const { authenticate } = require('../middleware/auth');

// Get mock data status (no auth required - just checks if files exist)
router.get('/status', mockDataController.getMockStatus);

// All other routes require authentication
router.post('/plaid/link', authenticate, mockDataController.linkMockPlaid);
router.post('/plaid/sync', authenticate, mockDataController.syncMockPlaid);
router.post('/setu/link', authenticate, mockDataController.linkMockSetu);
router.post('/setu/sync', authenticate, mockDataController.syncMockSetu);
router.delete('/accounts', authenticate, mockDataController.removeMockAccounts);

module.exports = router;
