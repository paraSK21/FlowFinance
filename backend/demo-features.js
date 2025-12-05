/**
 * Interactive Demo - Categorization & Forecasting Features
 * Simple demonstration of key features with dummy data
 */

require('dotenv').config();
const aiCategorizationService = require('./src/services/aiCategorizationService');
const aiService = require('./src/services/aiService');

// Sample transactions for demo
const sampleTransactions = [
  { id: 1, description: 'Starbucks coffee meeting', merchantName: 'Starbucks', amount: 45.50, date: new Date('2024-11-15') },
  { id: 2, description: 'Google Ads campaign', merchantName: 'Google Ads', amount: 750.00, date: new Date('2024-11-10') },
  { id: 3, description: 'Client payment received', merchantName: 'Acme Corp', amount: -5000, date: new Date('2024-11-12') },
  { id: 4, description: 'Office supplies', merchantName: 'Amazon', amount: 250.00, date: new Date('2024-11-08') },
  { id: 5, description: 'Uber to meeting', merchantName: 'Uber', amount: 35.00, date: new Date('2024-11-14') }
];

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          FLOWFINANCE FEATURE DEMONSTRATION                 ║');
console.log('║          Categorization & Forecasting Demo                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function demo() {
  // Demo 1: Transaction Categorization
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DEMO 1: AI Transaction Categorization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const txn of sampleTransactions) {
    const result = await aiCategorizationService.categorizeTransaction(
      txn.description,
      txn.merchantName,
      txn.amount
    );

    console.log(`Transaction: ${txn.description}`);
    console.log(`  Merchant: ${txn.merchantName}`);
    console.log(`  Amount: $${Math.abs(txn.amount).toFixed(2)}`);
    console.log(`  ✓ Category: ${result.category}`);
    console.log(`  ✓ Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`  ✓ Method: ${result.method}\n`);
  }

  // Demo 2: Pattern Learning
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧠 DEMO 2: Pattern Learning');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Scenario: User corrects a categorization');
  console.log('  Merchant: "Custom Vendor"');
  console.log('  Old Category: "Other"');
  console.log('  New Category: "Marketing"\n');

  await aiCategorizationService.learnFromCorrection(
    999,
    'Other',
    'Marketing',
    'Custom Vendor',
    'demo-user'
  );

  console.log('✓ Pattern learned!\n');
  console.log('Testing learned pattern...');

  const learnedResult = await aiCategorizationService.categorizeTransaction(
    'Purchase from vendor',
    'Custom Vendor',
    100,
    'demo-user'
  );

  console.log(`  ✓ Now categorizes "Custom Vendor" as: ${learnedResult.category}`);
  console.log(`  ✓ Confidence: ${(learnedResult.confidence * 100).toFixed(0)}%`);
  console.log(`  ✓ Method: ${learnedResult.method}\n`);

  // Demo 3: Cash Flow Forecast
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 DEMO 3: Cash Flow Forecasting');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const currentBalance = 10000;
  console.log(`Current Balance: $${currentBalance.toFixed(2)}\n`);
  console.log('Generating 30-day forecast...\n');

  // Create more historical data for better forecast
  const historicalData = [];
  for (let i = 0; i < 60; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate income every 5 days
    if (i % 5 === 0) {
      historicalData.push({
        date,
        amount: -(2000 + Math.random() * 1000),
        type: 'income',
        description: 'Client payment',
        merchantName: 'Client'
      });
    }
    
    // Simulate daily expenses
    historicalData.push({
      date,
      amount: 50 + Math.random() * 200,
      type: 'expense',
      description: 'Business expense',
      merchantName: 'Vendor'
    });
  }

  const forecasts = await aiService.generateForecast(
    historicalData,
    currentBalance,
    30
  );

  console.log('Next 7 Days Forecast:\n');
  forecasts.slice(0, 7).forEach((forecast, index) => {
    const date = forecast.date.toISOString().split('T')[0];
    const balance = forecast.predictedBalance.toFixed(2);
    const income = forecast.projectedIncome.toFixed(2);
    const expenses = forecast.projectedExpenses.toFixed(2);

    console.log(`Day ${index + 1} (${date}):`);
    console.log(`  Balance: $${balance}`);
    console.log(`  Income: $${income}`);
    console.log(`  Expenses: $${expenses}`);
    console.log(`  Confidence: ${(forecast.confidence * 100).toFixed(0)}%\n`);
  });

  const finalBalance = forecasts[forecasts.length - 1].predictedBalance;
  const netChange = finalBalance - currentBalance;

  console.log('30-Day Summary:');
  console.log(`  Starting Balance: $${currentBalance.toFixed(2)}`);
  console.log(`  Ending Balance: $${finalBalance.toFixed(2)}`);
  console.log(`  Net Change: $${netChange.toFixed(2)} (${(netChange/currentBalance*100).toFixed(1)}%)\n`);

  // Demo 4: Tax Deductions
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 DEMO 4: Tax Deduction Finder');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Categorize sample transactions first
  const categorizedTxns = await aiCategorizationService.batchCategorize(
    sampleTransactions.map(txn => ({
      id: txn.id,
      description: txn.description,
      merchantName: txn.merchantName,
      amount: txn.amount
    }))
  );

  const txnsWithCategories = sampleTransactions.map(txn => {
    const catResult = categorizedTxns.find(c => c.transactionId === txn.id);
    return {
      ...txn,
      type: txn.amount > 0 ? 'expense' : 'income',
      aiCategory: catResult?.category,
      aiCategoryConfidence: catResult?.confidence
    };
  });

  const deductions = await aiService.findTaxDeductions(txnsWithCategories);

  console.log(`Found ${deductions.length} potential tax deductions:\n`);

  let totalDeductible = 0;
  deductions.forEach(ded => {
    console.log(`✓ ${ded.description.substring(0, 50)}`);
    console.log(`  Category: ${ded.category}`);
    console.log(`  Amount: $${ded.amount.toFixed(2)}`);
    console.log(`  Confidence: ${(ded.confidence * 100).toFixed(0)}%\n`);
    totalDeductible += ded.amount;
  });

  console.log('Tax Summary:');
  console.log(`  Total Deductible: $${totalDeductible.toFixed(2)}`);
  console.log(`  Estimated Tax Savings (25%): $${(totalDeductible * 0.25).toFixed(2)}\n`);

  // Demo 5: Service Stats
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DEMO 5: Service Statistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const stats = aiCategorizationService.getStats();
  console.log('Categorization Service:');
  console.log(`  ✓ Learned Patterns: ${stats.learnedPatterns}`);
  console.log(`  ✓ Available Categories: ${stats.categories}`);
  console.log(`  ✓ OpenAI: ${stats.hasOpenAI ? 'Configured' : 'Not configured'}`);
  console.log(`  ✓ Hugging Face: ${stats.hasHuggingFace ? 'Configured' : 'Not configured'}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Demo Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Key Features Demonstrated:');
  console.log('  ✓ AI-powered transaction categorization');
  console.log('  ✓ Pattern learning from user corrections');
  console.log('  ✓ 30-day cash flow forecasting');
  console.log('  ✓ Automatic tax deduction identification');
  console.log('  ✓ Batch processing capabilities\n');

  console.log('All features working without Setu/Plaid integration! 🎉\n');
}

// Run demo
demo().catch(error => {
  console.error('Demo error:', error);
  process.exit(1);
});
