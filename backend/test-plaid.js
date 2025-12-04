// Quick test script to verify Plaid configuration
require('dotenv').config();

console.log('=== Plaid Configuration Test ===\n');

console.log('Environment Variables:');
console.log('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('PLAID_SECRET:', process.env.PLAID_SECRET ? '✓ Set' : '✗ Missing');
console.log('PLAID_ENV:', process.env.PLAID_ENV || 'Not set (will default to sandbox)');
console.log('BACKEND_URL:', process.env.BACKEND_URL || 'Not set');

console.log('\nDatabase Configuration:');
console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
console.log('DB_PORT:', process.env.DB_PORT || 'Not set');
console.log('DB_NAME:', process.env.DB_NAME || 'Not set');
console.log('DB_USER:', process.env.DB_USER || 'Not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ Set' : '✗ Missing');

console.log('\n=== Testing Plaid Client Initialization ===\n');

try {
  const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
  
  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });

  const client = new PlaidApi(configuration);
  console.log('✓ Plaid client initialized successfully');
  console.log('Environment:', process.env.PLAID_ENV || 'sandbox');
  
} catch (error) {
  console.error('✗ Failed to initialize Plaid client:', error.message);
}

console.log('\n=== Test Complete ===');
