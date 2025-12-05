// Test Setu Account Aggregator API with corrected implementation
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.SETU_BASE_URL || 'https://dg-sandbox.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_ORG_ID = process.env.SETU_ORG_ID;

async function testSetuAA() {
  console.log('=== Testing Setu Account Aggregator API ===\n');
  
  console.log('Configuration:');
  console.log('  Base URL:', BASE_URL);
  console.log('  Client ID:', SETU_CLIENT_ID);
  console.log('  Client Secret:', SETU_CLIENT_SECRET ? SETU_CLIENT_SECRET.substring(0, 10) + '...' : 'Not set');
  console.log('  Org ID:', SETU_ORG_ID);
  console.log('');

  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET) {
    console.error('❌ Setu credentials not configured in .env');
    console.log('\nPlease set the following in backend/.env:');
    console.log('  SETU_CLIENT_ID=your_client_id');
    console.log('  SETU_CLIENT_SECRET=your_client_secret');
    console.log('  SETU_ORG_ID=your_org_id');
    return;
  }

  // Test 1: OAuth Token (client_credentials grant)
  console.log('Test 1: Getting OAuth access token...');
  let accessToken;
  try {
    const tokenEndpoint = `${BASE_URL}/oauth/token`;
    console.log('  Token URL:', tokenEndpoint);
    
    const response = await axios.post(
      tokenEndpoint,
      {
        client_id: SETU_CLIENT_ID,
        client_secret: SETU_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    accessToken = response.data.access_token;
    console.log('✓ OAuth authentication successful');
    console.log('  Access Token:', accessToken.substring(0, 20) + '...');
    console.log('  Expires in:', response.data.expires_in || 'Not specified', 'seconds');
  } catch (error) {
    console.error('❌ OAuth authentication failed');
    console.error('  Status:', error.response?.status);
    console.error('  Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n⚠️  This might be expected if using sandbox credentials.');
    console.log('   Check Setu docs: https://docs.setu.co/data/account-aggregator');
    return;
  }

  // Test 2: List consents (should return empty or existing consents)
  console.log('\nTest 2: Testing API call - List consents...');
  try {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    
    if (SETU_ORG_ID) {
      headers['x-product-instance-id'] = SETU_ORG_ID;
    }
    
    const response = await axios.get(`${BASE_URL}/consents`, {
      headers,
      validateStatus: () => true,
    });
    
    console.log('  Response Status:', response.status);
    
    if (response.status === 200) {
      console.log('✓ API call successful');
      console.log('  Consents found:', response.data?.consents?.length || 0);
      if (response.data?.consents?.length > 0) {
        console.log('  Sample consent:', response.data.consents[0].id);
      }
    } else if (response.status === 404) {
      console.log('✓ API accessible (no consents found - this is normal for new accounts)');
    } else {
      console.log('⚠️  Unexpected response');
      console.log('  Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('❌ API call failed');
    console.error('  Error:', error.message);
  }

  // Test 3: Verify service initialization
  console.log('\nTest 3: Verifying SetuService initialization...');
  try {
    const setuService = require('./src/services/setuService');
    
    if (setuService.configured) {
      console.log('✓ SetuService is properly configured');
      console.log('  Base URL:', setuService.baseURL);
      console.log('  Notification URL:', setuService.notificationUrl);
      console.log('  Redirect URL:', setuService.redirectUrl);
    } else {
      console.log('❌ SetuService is not configured');
    }
  } catch (error) {
    console.error('❌ Error loading SetuService:', error.message);
  }

  console.log('\n=== Test Complete ===');
  console.log('\n✅ If all tests passed, your Setu AA integration is ready!');
  console.log('\nNext steps:');
  console.log('  1. Start the backend server: npm start');
  console.log('  2. Create a consent request via API');
  console.log('  3. Complete consent flow in browser/webview');
  console.log('  4. Fetch account data and transactions');
  console.log('\nSee SETU_INTEGRATION.md for detailed usage guide.');
}

testSetuAA();
