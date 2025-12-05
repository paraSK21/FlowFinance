require('dotenv').config({ path: '.env' });
const axios = require('axios');

async function testSetuBridge() {
  console.log('\n=== Testing Setu BRIDGE Authentication ===\n');
  
  const clientId = process.env.SETU_CLIENT_ID;
  const clientSecret = process.env.SETU_CLIENT_SECRET;
  
  console.log('Client ID:', clientId);
  console.log('Client Secret:', clientSecret ? '***' + clientSecret.slice(-4) : 'NOT SET');
  console.log('');
  
  // Test Bridge API authentication
  console.log('Test: Bridge API Login');
  try {
    const response = await axios.post(
      'https://bridge.setu.co/api/verify',
      {
        clientID: clientId,
        secret: clientSecret,
      },
      {
        headers: { 
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    console.log('✓ SUCCESS! These ARE Bridge API credentials');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n⚠️  You need to get Account Aggregator credentials from Setu dashboard');
    console.log('   Bridge API ≠ Account Aggregator API');
    console.log('   Visit: https://setu.co/ and create an AA product');
    return;
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
  
  console.log('');
  
  // Test alternative Bridge endpoint
  console.log('Test: Alternative Bridge endpoint');
  try {
    const response = await axios.post(
      'https://accountservice.setu.co/v1/users/login',
      {
        clientID: clientId,
        secret: clientSecret,
      },
      {
        headers: { 
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    console.log('✓ SUCCESS! These ARE Bridge API credentials');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n⚠️  You need to get Account Aggregator credentials from Setu dashboard');
    return;
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testSetuBridge().catch(console.error);
