// Test Setu consent creation with detailed debugging
require('dotenv').config();
const setuService = require('./src/services/setuService');

async function testConsentCreation() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║                    Setu Consent Creation - Debug Test                        ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  // Check if Setu is configured
  if (!setuService.configured) {
    console.error('❌ Setu service is not configured');
    console.log('\nPlease check backend/.env:');
    console.log('  - SETU_CLIENT_ID');
    console.log('  - SETU_CLIENT_SECRET');
    console.log('  - SETU_ORG_ID');
    return;
  }

  console.log('✓ Setu service is configured\n');
  console.log('Configuration:');
  console.log('  Base URL:', setuService.baseURL);
  console.log('  Client ID:', setuService.clientId);
  console.log('  Org ID:', setuService.orgId);
  console.log('  Redirect URL:', setuService.redirectUrl);
  console.log('  Notification URL:', setuService.notificationUrl);
  console.log('');

  // Test parameters
  const testUserId = 'test-user-123';
  const testPhone = '9999999999';
  const fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ago
  const toDate = new Date().toISOString(); // Now

  console.log('Test Parameters:');
  console.log('  User ID:', testUserId);
  console.log('  Phone:', testPhone);
  console.log('  From Date:', fromDate);
  console.log('  To Date:', toDate);
  console.log('');

  try {
    console.log('Step 1: Testing authentication...');
    const token = await setuService.getAccessToken();
    console.log('✓ Authentication successful');
    console.log('  Token:', token.substring(0, 20) + '...');
    console.log('');

    console.log('Step 2: Creating consent request...');
    const result = await setuService.createConsentRequest(
      testUserId,
      testPhone,
      fromDate,
      toDate
    );

    console.log('\n✓ Consent created successfully!');
    console.log('');
    console.log('Result:');
    console.log('  Consent ID:', result.consentId);
    console.log('  Consent URL:', result.consentUrl);
    console.log('  Status:', result.status);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Open the consent URL in a browser');
    console.log('  2. Complete the consent approval flow');
    console.log('  3. Check consent status using the consent ID');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed');
    console.error('');
    console.error('Error Details:');
    console.error('  Message:', error.message);
    console.error('  Type:', error.constructor.name);
    
    if (error.response) {
      console.error('  HTTP Status:', error.response.status);
      console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('');
    console.error('Troubleshooting:');
    
    if (error.message.includes('not configured')) {
      console.error('  → Check SETU_CLIENT_ID and SETU_CLIENT_SECRET in backend/.env');
    } else if (error.message.includes('Cannot connect')) {
      console.error('  → Check internet connection');
      console.error('  → Verify SETU_BASE_URL is correct');
    } else if (error.response?.status === 401) {
      console.error('  → Authentication failed - check credentials');
      console.error('  → Verify SETU_CLIENT_ID and SETU_CLIENT_SECRET are correct');
    } else if (error.response?.status === 404) {
      console.error('  → API endpoint not found');
      console.error('  → Check SETU_BASE_URL in backend/.env');
      console.error('  → Current URL:', setuService.baseURL);
      console.error('  → Try: https://fiu-uat.setu.co or https://fiu-sandbox.setu.co');
    } else if (error.response?.status === 400) {
      console.error('  → Bad request - check request payload');
      console.error('  → Verify phone number format');
      console.error('  → Check date range format');
    } else {
      console.error('  → Check backend logs for more details');
      console.error('  → See backend/SETU_INTEGRATION.md for troubleshooting');
    }
    
    console.error('');
    process.exit(1);
  }
}

testConsentCreation();
