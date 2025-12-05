require('dotenv').config({ path: '.env' });
const axios = require('axios');

async function testSetuAuth() {
  console.log('\n=== Testing Setu AA Authentication ===\n');
  
  const baseURL = process.env.SETU_BASE_URL;
  const clientId = process.env.SETU_CLIENT_ID;
  const clientSecret = process.env.SETU_CLIENT_SECRET;
  
  console.log('Base URL:', baseURL);
  console.log('Client ID:', clientId);
  console.log('Client Secret:', clientSecret ? '***' + clientSecret.slice(-4) : 'NOT SET');
  console.log('');
  
  // Test 1: /session endpoint (AA standard)
  console.log('Test 1: POST /session (AA standard)');
  try {
    const response = await axios.post(
      `${baseURL}/session`,
      {
        clientID: clientId,
        secret: clientSecret,
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
        },
        timeout: 10000,
      }
    );
    console.log('✓ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
  
  console.log('');
  
  // Test 2: /oauth/token endpoint
  console.log('Test 2: POST /oauth/token');
  try {
    const response = await axios.post(
      `${baseURL}/oauth/token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    console.log('✓ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
  
  console.log('');
  
  // Test 3: Try with x-client-id and x-client-secret headers only
  console.log('Test 3: POST /session (headers only)');
  try {
    const response = await axios.post(
      `${baseURL}/session`,
      {},
      {
        headers: { 
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
        },
        timeout: 10000,
      }
    );
    console.log('✓ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
  
  console.log('\n=== All authentication methods failed ===');
  console.log('Please check:');
  console.log('1. Your credentials are correct');
  console.log('2. Your base URL is correct (should be https://fiu-uat.setu.co for UAT)');
  console.log('3. Your credentials are for Account Aggregator (not Bridge)');
  console.log('4. Visit https://docs.setu.co/data/account-aggregator/quickstart for help');
}

testSetuAuth().catch(console.error);
