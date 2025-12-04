// Test Setu API connectivity with proper authentication
require('dotenv').config();
const axios = require('axios');

const AUTH_URL = 'https://accountservice.setu.co/v1/users/login';
const BASE_URL = 'https://fiu-sandbox.setu.co'; // Sandbox URL
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_ORG_ID = process.env.SETU_ORG_ID;

async function testSetu() {
  console.log('=== Testing Setu API with Proper Authentication ===\n');
  
  console.log('Configuration:');
  console.log('Auth URL:', AUTH_URL);
  console.log('Base URL:', BASE_URL);
  console.log('Client ID:', SETU_CLIENT_ID);
  console.log('Client Secret:', SETU_CLIENT_SECRET ? SETU_CLIENT_SECRET.substring(0, 10) + '...' : 'Not set');
  console.log('Org ID:', SETU_ORG_ID);
  console.log('');

  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET) {
    console.error('❌ Setu credentials not configured in .env');
    return;
  }

  // Test 1: Authenticate and get access token
  console.log('Test 1: Getting access token...');
  let accessToken;
  try {
    const response = await axios.post(
      AUTH_URL,
      {
        clientID: SETU_CLIENT_ID,
        secret: SETU_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'client': 'bridge',
          'Content-Type': 'application/json',
        },
      }
    );
    
    accessToken = response.data.access_token || response.data.token;
    console.log('✓ Authentication successful');
    console.log('  Access Token:', accessToken.substring(0, 20) + '...');
    console.log('  Expires in:', response.data.expires_in || 'Not specified', 'seconds');
  } catch (error) {
    console.error('❌ Authentication failed');
    console.error('  Status:', error.response?.status);
    console.error('  Error:', JSON.stringify(error.response?.data, null, 2));
    return;
  }

  // Test 2: Try to list consents with the token and product instance ID
  console.log('\nTest 2: Testing API call with access token and product instance ID...');
  try {
    const response = await axios.get(`${BASE_URL}/consents`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-product-instance-id': SETU_ORG_ID,
      },
      validateStatus: () => true,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✓ API call successful');
    } else if (response.status === 404) {
      console.log('✓ API accessible (no consents found - this is normal)');
    } else {
      console.log('⚠️  Unexpected response');
    }
  } catch (error) {
    console.error('❌ API call failed');
    console.error('  Error:', error.message);
  }

  console.log('\n=== Test Complete ===');
  console.log('\n✅ If you see "Authentication successful" above, your Setu integration is ready!');
}

testSetu();
