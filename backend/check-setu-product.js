require('dotenv').config({ path: '.env' });
const axios = require('axios');

async function checkSetuProduct() {
  console.log('\n=== Checking Setu Product Type ===\n');
  
  const clientId = process.env.SETU_CLIENT_ID;
  const clientSecret = process.env.SETU_CLIENT_SECRET;
  
  console.log('Testing various Setu endpoints to identify product type...\n');
  
  const tests = [
    {
      name: 'Account Aggregator (FIU UAT)',
      url: 'https://fiu-uat.setu.co/session',
      body: { clientID: clientId, secret: clientSecret },
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Account Aggregator (FIU Prod)',
      url: 'https://fiu.setu.co/session',
      body: { clientID: clientId, secret: clientSecret },
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Data Gateway Sandbox',
      url: 'https://dg-sandbox.setu.co/api/verify',
      body: { clientID: clientId, secret: clientSecret },
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Bridge API (Account Service)',
      url: 'https://accountservice.setu.co/v1/users/login',
      body: { clientID: clientId, secret: clientSecret, grant_type: 'client_credentials' },
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Bridge API (Sandbox)',
      url: 'https://sandbox.setu.co/api/verify',
      body: { clientID: clientId, secret: clientSecret },
      headers: { 'Content-Type': 'application/json' }
    }
  ];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    console.log(`  URL: ${test.url}`);
    try {
      const response = await axios.post(test.url, test.body, {
        headers: test.headers,
        timeout: 10000,
      });
      console.log('  ✓ SUCCESS!');
      console.log('  Response:', JSON.stringify(response.data, null, 2));
      console.log(`\n✅ Your credentials work with: ${test.name}`);
      console.log(`   Use this base URL: ${test.url.split('/api')[0].split('/session')[0]}`);
      return;
    } catch (error) {
      console.log(`  ✗ Failed (${error.response?.status || error.code})`);
      if (error.response?.data) {
        const errorMsg = typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 100) 
          : JSON.stringify(error.response.data);
        console.log(`  Error: ${errorMsg}`);
      }
    }
    console.log('');
  }
  
  console.log('❌ None of the endpoints worked with your credentials');
  console.log('\nPossible issues:');
  console.log('1. Credentials are incorrect or expired');
  console.log('2. Credentials are for a different Setu product not tested above');
  console.log('3. IP whitelisting is required');
  console.log('\nNext steps:');
  console.log('1. Log into your Setu dashboard: https://bridge.setu.co/');
  console.log('2. Check which product these credentials belong to');
  console.log('3. Verify the credentials are active and not expired');
  console.log('4. Check if you need to create NEW credentials for Account Aggregator');
}

checkSetuProduct().catch(console.error);
