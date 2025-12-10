/**
 * Test script to demonstrate Gemini API key fallback system
 * Run with: node backend/test-gemini-fallback.js
 */

const aiService = require('./src/services/aiCategorizationService');

// Test transactions
const testTransactions = [
  { description: 'UPI/34345345/ZOMATO@paytm/Food Order', merchantName: 'Zomato', amount: 450 },
  { description: 'UPI/12312312/OLA@icici/Cab Ride', merchantName: 'Ola Cabs', amount: 250 },
  { description: 'NEFT from ACME Corp/Salary Credit', merchantName: 'ACME Corp', amount: -50000 },
  { description: 'UPI/98798798/AMAZON@ybl/Shopping', merchantName: 'Amazon', amount: 2500 },
  { description: 'IMPS/45645645/JIO@paytm/Mobile Recharge', merchantName: 'Jio', amount: 399 },
  { description: 'UPI/78978978/SWIGGY@paytm/Food Delivery', merchantName: 'Swiggy', amount: 380 },
  { description: 'NEFT/Google Ads Payment', merchantName: 'Google Ads', amount: 5000 },
  { description: 'UPI/23423423/UBER@paytm/Ride', merchantName: 'Uber', amount: 180 },
  { description: 'Electricity Bill Payment', merchantName: 'Power Company', amount: 1200 },
  { description: 'Office Rent Payment', merchantName: 'Property Management', amount: 25000 }
];

async function testFallback() {
  console.log('🚀 Testing Gemini API Key Fallback System\n');
  console.log('=' .repeat(80));
  
  // Show initial stats
  console.log('\n📊 Initial API Key Status:');
  const initialStats = aiService.getStats();
  console.log(`Current Model: ${initialStats.currentModel}`);
  console.log(`Active API Key: #${initialStats.currentApiKey} of ${initialStats.totalApiKeys}`);
  console.log('\nAPI Key Details:');
  initialStats.apiKeyStats.forEach(key => {
    console.log(`  Key #${key.keyNumber}: ${key.status} | Requests: ${key.requestCount} | Last Used: ${key.lastUsed}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n🧪 Running Categorization Tests...\n');
  
  const results = [];
  
  // Test each transaction
  for (let i = 0; i < testTransactions.length; i++) {
    const txn = testTransactions[i];
    console.log(`\n[${i + 1}/${testTransactions.length}] Testing: "${txn.description}"`);
    
    try {
      const result = await aiService.categorizeTransaction(
        txn.description,
        txn.merchantName,
        txn.amount,
        null // No userId for test
      );
      
      console.log(`  ✓ Category: ${result.category}`);
      console.log(`  ✓ Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`  ✓ Method: ${result.method}`);
      if (result.apiKeyUsed) {
        console.log(`  ✓ API Key Used: #${result.apiKeyUsed}`);
        console.log(`  ✓ Model: ${result.modelUsed}`);
      }
      
      results.push({
        ...txn,
        category: result.category,
        confidence: result.confidence,
        method: result.method,
        success: true
      });
      
      // Small delay to avoid hammering the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      results.push({
        ...txn,
        error: error.message,
        success: false
      });
    }
  }
  
  // Show final stats
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Final API Key Status:');
  const finalStats = aiService.getStats();
  console.log(`Current Model: ${finalStats.currentModel}`);
  console.log(`Active API Key: #${finalStats.currentApiKey} of ${finalStats.totalApiKeys}`);
  console.log('\nAPI Key Details:');
  finalStats.apiKeyStats.forEach(key => {
    console.log(`  Key #${key.keyNumber}: ${key.status} | Requests: ${key.requestCount} | Last Used: ${key.timeSinceLastUse}`);
    if (key.cooldownRemaining !== '0s') {
      console.log(`    ⏳ Cooldown: ${key.cooldownRemaining}`);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 Test Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`  Total Tests: ${results.length}`);
  console.log(`  Successful: ${successful} (${(successful/results.length*100).toFixed(1)}%)`);
  console.log(`  Failed: ${failed}`);
  
  if (successful > 0) {
    const avgConfidence = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.confidence, 0) / successful;
    console.log(`  Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // Category distribution
    const categories = results
      .filter(r => r.success)
      .reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {});
    
    console.log('\n  Category Distribution:');
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`    ${cat}: ${count}`);
      });
    
    // Method distribution
    const methods = results
      .filter(r => r.success)
      .reduce((acc, r) => {
        acc[r.method] = (acc[r.method] || 0) + 1;
        return acc;
      }, {});
    
    console.log('\n  Method Distribution:');
    Object.entries(methods).forEach(([method, count]) => {
      console.log(`    ${method}: ${count}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Test Complete!\n');
}

// Run the test
testFallback().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
