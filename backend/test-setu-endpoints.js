// Test different Setu endpoints to find the correct one
require('dotenv').config();
const axios = require('axios');

const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_ORG_ID = process.env.SETU_ORG_ID;

async function testEndpoints() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║                    Setu Endpoint Discovery Test                              ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  console.log('Credentials:');
  console.log('  Client ID:', SETU_CLIENT_ID);
  console.log('  Org ID:', SETU_ORG_ID);
  console.log('');

  // Different base URLs to try
  const baseUrls = [
    'https://fiu-uat.setu.co',
    'https://fiu-sandbox.setu.co',
    'https://dg-sandbox.setu.co',
    'https://bridge-sandbox.setu.co',
  ];

  // Different auth endpoints to try
  const authEndpoints = [
    {
      name: 'Bridge Auth',
      url: 'https://accountservice.setu.co/v1/users/login',
      payload: {
        clientID: SETU_CLIENT_ID,
        secret: SETU_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      headers: {
        'Content-Type': 'application/json',
        'client': 'bridge',
      },
    },
  ];

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('STEP 1: Testing Authentication Endpoints');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  let validToken = null;
  let validAuthMethod = null;

  for (const auth of authEndpoints) {
    console.log(`Testing: ${auth.name}`);
    console.log(`  URL: ${auth.url}`);
    
    try {
      const response = await axios.post(auth.url, auth.payload, {
        headers: auth.headers,
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status === 200 && (response.data.access_token || response.data.token)) {
        validToken = response.data.access_token || response.data.token;
        validAuthMethod = auth.name;
        console.log(`  ✓ SUCCESS`);
        console.log(`    Token: ${validToken.substring(0, 30)}...`);
        console.log(`    Expires: ${response.data.expires_in || 'N/A'} seconds`);
        break;
      } else {
        console.log(`  ✗ FAILED (Status: ${response.status})`);
        console.log(`    Response:`, JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
    }
    console.log('');
  }

  if (!validToken) {
    console.log('❌ Could not authenticate with any method');
    return;
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('STEP 2: Testing Base URLs with Valid Token');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  console.log(`Using token from: ${validAuthMethod}\n`);

  for (const baseUrl of baseUrls) {
    console.log(`Testing: ${baseUrl}`);
    
    // Try to list consents
    try {
      const headers = {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      };
      
      if (SETU_ORG_ID) {
        headers['x-product-instance-id'] = SETU_ORG_ID;
      }

      const response = await axios.get(`${baseUrl}/consents`, {
        headers,
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`  ✓ SUCCESS - This base URL works!`);
        console.log(`    Response:`, JSON.stringify(response.data, null, 2).substring(0, 200));
      } else if (response.status === 404) {
        console.log(`  ⚠️  Endpoint not found (might not be the right product)`);
      } else if (response.status === 401) {
        console.log(`  ✗ Unauthorized - Token not valid for this base URL`);
        console.log(`    Error:`, response.data.message || JSON.stringify(response.data));
      } else {
        console.log(`  ⚠️  Unexpected response`);
        console.log(`    Response:`, JSON.stringify(response.data, null, 2).substring(0, 200));
      }
    } catch (error) {
      console.log(`  ✗ ERROR: ${error.message}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('STEP 3: Checking Bridge API Endpoints');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const bridgeBaseUrl = 'https://bridge-sandbox.setu.co';
  
  console.log(`Testing Bridge API at: ${bridgeBaseUrl}`);
  
  try {
    const headers = {
      'Authorization': `Bearer ${validToken}`,
      'Content-Type': 'application/json',
    };
    
    if (SETU_ORG_ID) {
      headers['x-product-instance-id'] = SETU_ORG_ID;
    }

    // Try different Bridge endpoints
    const endpoints = ['/accounts', '/consents', '/sessions'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${bridgeBaseUrl}${endpoint}`, {
          headers,
          timeout: 10000,
          validateStatus: () => true,
        });

        console.log(`  ${endpoint}: Status ${response.status}`);
        if (response.status === 200) {
          console.log(`    ✓ Works!`);
        }
      } catch (error) {
        console.log(`  ${endpoint}: Error - ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  console.log('Based on the test results:');
  console.log('');
  console.log('1. Your credentials authenticate with: Bridge Auth');
  console.log('2. This suggests you have Setu Bridge credentials, not FIU AA credentials');
  console.log('');
  console.log('Options:');
  console.log('  A. Get FIU Account Aggregator credentials from Setu dashboard');
  console.log('     → Sign up for AA product at https://setu.co/');
  console.log('     → Update SETU_CLIENT_ID and SETU_CLIENT_SECRET in .env');
  console.log('');
  console.log('  B. Use Bridge API instead (different product)');
  console.log('     → Update SETU_BASE_URL to bridge-sandbox.setu.co');
  console.log('     → Note: Bridge API has different endpoints than AA');
  console.log('');
  console.log('For Account Aggregator (AA) integration:');
  console.log('  → You need AA-specific credentials');
  console.log('  → Contact Setu support or check your dashboard');
  console.log('  → Docs: https://docs.setu.co/data/account-aggregator');
  console.log('');
}

testEndpoints().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
