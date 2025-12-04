// Test API endpoint
require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api`;

async function testAPI() {
  console.log('=== Testing API Endpoints ===\n');
  
  // Test health check
  try {
    const health = await axios.get(`http://localhost:${PORT}/health`);
    console.log('✓ Health check:', health.data);
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    console.log('\n⚠️  Backend server is not running!');
    console.log('Start it with: npm start\n');
    return;
  }

  // Test with a dummy token (will fail auth but shows endpoint exists)
  try {
    const response = await axios.post(
      `${API_URL}/plaid/create-link-token`,
      {},
      { headers: { Authorization: 'Bearer dummy-token' } }
    );
    console.log('✓ Plaid endpoint exists');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Plaid endpoint exists (auth required)');
    } else {
      console.error('✗ Plaid endpoint error:', error.response?.data || error.message);
    }
  }

  console.log('\n=== Test Complete ===');
}

testAPI();
