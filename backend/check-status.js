// Comprehensive status check for FlowFinance backend
require('dotenv').config();
const axios = require('axios');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                              ║');
console.log('║                    FlowFinance - System Status Check                         ║');
console.log('║                                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

async function checkStatus() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // 1. Check Environment Variables
  console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 1. ENVIRONMENT VARIABLES                                                      │');
  console.log('└──────────────────────────────────────────────────────────────────────────────┘\n');

  const requiredVars = {
    'Database': ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
    'Server': ['PORT', 'JWT_SECRET', 'FRONTEND_URL', 'BACKEND_URL'],
    'Setu': ['SETU_BASE_URL', 'SETU_CLIENT_ID', 'SETU_CLIENT_SECRET', 'SETU_ORG_ID'],
    'Plaid': ['PLAID_CLIENT_ID', 'PLAID_SECRET', 'PLAID_ENV'],
    'AI': ['HUGGINGFACE_API_KEY']
  };

  for (const [category, vars] of Object.entries(requiredVars)) {
    console.log(`  ${category}:`);
    for (const varName of vars) {
      const value = process.env[varName];
      if (value && value !== '' && !value.includes('your_') && !value.includes('_here')) {
        console.log(`    ✓ ${varName}`);
        results.passed++;
      } else {
        console.log(`    ✗ ${varName} - Not configured`);
        results.failed++;
      }
    }
    console.log('');
  }

  // 2. Check Backend Server
  console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 2. BACKEND SERVER                                                             │');
  console.log('└──────────────────────────────────────────────────────────────────────────────┘\n');

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
    console.log(`  ✓ Backend server is running at ${backendUrl}`);
    console.log(`    Status: ${response.data.status}`);
    console.log(`    Timestamp: ${response.data.timestamp}`);
    results.passed++;
  } catch (error) {
    console.log(`  ✗ Backend server is not responding`);
    console.log(`    Error: ${error.message}`);
    console.log(`    Make sure to run: npm start`);
    results.failed++;
  }
  console.log('');

  // 3. Check Database Connection
  console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 3. DATABASE CONNECTION                                                        │');
  console.log('└──────────────────────────────────────────────────────────────────────────────┘\n');

  try {
    const { sequelize } = require('./src/models');
    await sequelize.authenticate();
    console.log('  ✓ Database connection successful');
    console.log(`    Database: ${process.env.DB_NAME}`);
    console.log(`    Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    results.passed++;
  } catch (error) {
    console.log('  ✗ Database connection failed');
    console.log(`    Error: ${error.message}`);
    console.log('    Make sure PostgreSQL is running');
    results.failed++;
  }
  console.log('');

  // 4. Check Setu Configuration
  console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 4. SETU ACCOUNT AGGREGATOR                                                    │');
  console.log('└──────────────────────────────────────────────────────────────────────────────┘\n');

  const setuBaseUrl = process.env.SETU_BASE_URL;
  const setuClientId = process.env.SETU_CLIENT_ID;
  const setuClientSecret = process.env.SETU_CLIENT_SECRET;

  if (!setuClientId || !setuClientSecret) {
    console.log('  ⚠️  Setu credentials not configured');
    console.log('    Get credentials from: https://setu.co/');
    results.warnings++;
  } else {
    console.log('  Configuration:');
    console.log(`    Base URL: ${setuBaseUrl}`);
    console.log(`    Client ID: ${setuClientId}`);
    console.log(`    Client Secret: ${setuClientSecret.substring(0, 10)}...`);
    console.log(`    Org ID: ${process.env.SETU_ORG_ID}`);
    console.log('');

    // Try to authenticate
    console.log('  Testing authentication...');
    
    // Try different auth endpoints
    const authEndpoints = [
      { url: `${setuBaseUrl}/oauth/token`, method: 'oauth' },
      { url: 'https://accountservice.setu.co/v1/users/login', method: 'bridge' }
    ];

    let authenticated = false;
    for (const endpoint of authEndpoints) {
      try {
        console.log(`    Trying: ${endpoint.url}`);
        
        const payload = endpoint.method === 'oauth' 
          ? {
              client_id: setuClientId,
              client_secret: setuClientSecret,
              grant_type: 'client_credentials'
            }
          : {
              clientID: setuClientId,
              secret: setuClientSecret,
              grant_type: 'client_credentials'
            };

        const headers = endpoint.method === 'oauth'
          ? { 'Content-Type': 'application/json' }
          : { 'Content-Type': 'application/json', 'client': 'bridge' };

        const response = await axios.post(endpoint.url, payload, { 
          headers,
          timeout: 10000,
          validateStatus: () => true
        });

        if (response.status === 200 && (response.data.access_token || response.data.token)) {
          console.log(`    ✓ Authentication successful with ${endpoint.method} method`);
          console.log(`      Endpoint: ${endpoint.url}`);
          authenticated = true;
          results.passed++;
          break;
        } else {
          console.log(`    ✗ Failed (Status: ${response.status})`);
        }
      } catch (error) {
        console.log(`    ✗ Failed: ${error.message}`);
      }
    }

    if (!authenticated) {
      console.log('');
      console.log('  ⚠️  Could not authenticate with Setu');
      console.log('    This might be normal for sandbox credentials');
      console.log('    Check Setu dashboard for correct base URL');
      console.log('    Docs: https://docs.setu.co/data/account-aggregator');
      results.warnings++;
    }
  }
  console.log('');

  // 5. Check Plaid Configuration
  console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 5. PLAID (US/CA BANKS)                                                        │');
  console.log('└──────────────────────────────────────────────────────────────────────────────┘\n');

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    console.log('  ⚠️  Plaid credentials not configured');
    console.log('    Get credentials from: https://dashboard.plaid.com');
    results.warnings++;
  } else {
    console.log('  ✓ Plaid credentials configured');
    console.log(`    Client ID: ${process.env.PLAID_CLIENT_ID}`);
    console.log(`    Environment: ${process.env.PLAID_ENV}`);
    results.passed++;
  }
  console.log('');

  // Summary
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║                              SUMMARY                                         ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`  ✓ Passed:   ${results.passed}`);
  console.log(`  ✗ Failed:   ${results.failed}`);
  console.log(`  ⚠️  Warnings: ${results.warnings}`);
  console.log('');

  if (results.failed === 0 && results.warnings === 0) {
    console.log('  🎉 All systems operational!');
  } else if (results.failed === 0) {
    console.log('  ✅ Core systems operational (some optional features not configured)');
  } else {
    console.log('  ❌ Some critical systems need attention');
  }
  console.log('');

  console.log('Next steps:');
  if (results.failed > 0) {
    console.log('  1. Fix failed checks above');
    console.log('  2. Update backend/.env with correct credentials');
    console.log('  3. Restart the backend server');
  }
  if (results.warnings > 0) {
    console.log('  - Configure optional services (Setu, Plaid) for full functionality');
  }
  console.log('  - See STARTUP_GUIDE.md for detailed setup instructions');
  console.log('');

  process.exit(results.failed > 0 ? 1 : 0);
}

checkStatus().catch(error => {
  console.error('Status check failed:', error);
  process.exit(1);
});
