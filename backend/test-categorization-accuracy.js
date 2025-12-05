/**
 * Detailed Categorization Accuracy Test
 * Tests categorization with various transaction types
 */

require('dotenv').config();
const aiCategorizationService = require('./src/services/aiCategorizationService');

// Comprehensive test dataset
const testDataset = [
  // Revenue - should be categorized as Revenue
  { desc: 'Client payment for services', merchant: 'ABC Corp', amount: -5000, expected: 'Revenue' },
  { desc: 'Invoice payment received', merchant: 'XYZ Ltd', amount: -3500, expected: 'Revenue' },
  { desc: 'Deposit from sale', merchant: 'Customer', amount: -2000, expected: 'Revenue' },
  { desc: 'Income from consulting', merchant: 'Tech Co', amount: -4200, expected: 'Revenue' },
  
  // Meals & Entertainment - 50% deductible
  { desc: 'Business lunch', merchant: 'Starbucks', amount: 45, expected: 'Meals & Entertainment' },
  { desc: 'Client dinner meeting', merchant: 'Restaurant', amount: 180, expected: 'Meals & Entertainment' },
  { desc: 'Coffee with partner', merchant: 'Cafe', amount: 25, expected: 'Meals & Entertainment' },
  { desc: 'Team lunch', merchant: 'Food Place', amount: 120, expected: 'Meals & Entertainment' },
  
  // Operations - 100% deductible
  { desc: 'Office supplies', merchant: 'Amazon', amount: 250, expected: 'Operations' },
  { desc: 'Equipment purchase', merchant: 'Best Buy', amount: 800, expected: 'Operations' },
  { desc: 'Maintenance service', merchant: 'Tech Repair', amount: 450, expected: 'Operations' },
  { desc: 'Office furniture', merchant: 'IKEA', amount: 600, expected: 'Operations' },
  
  // Marketing - 100% deductible
  { desc: 'Facebook ads', merchant: 'Facebook', amount: 500, expected: 'Marketing' },
  { desc: 'Google advertising', merchant: 'Google Ads', amount: 750, expected: 'Marketing' },
  { desc: 'Social media promotion', merchant: 'LinkedIn', amount: 300, expected: 'Marketing' },
  { desc: 'SEO services', merchant: 'Marketing Agency', amount: 1200, expected: 'Marketing' },
  
  // Utilities - 100% deductible
  { desc: 'Internet bill', merchant: 'Comcast', amount: 90, expected: 'Utilities' },
  { desc: 'Phone service', merchant: 'Verizon', amount: 120, expected: 'Utilities' },
  { desc: 'Electricity', merchant: 'Power Company', amount: 150, expected: 'Utilities' },
  { desc: 'Water bill', merchant: 'Water Utility', amount: 60, expected: 'Utilities' },
  
  // Travel - 100% deductible
  { desc: 'Flight to conference', merchant: 'United Airlines', amount: 450, expected: 'Travel' },
  { desc: 'Hotel stay', merchant: 'Marriott', amount: 320, expected: 'Travel' },
  { desc: 'Uber ride', merchant: 'Uber', amount: 35, expected: 'Travel' },
  { desc: 'Gas for trip', merchant: 'Shell', amount: 60, expected: 'Travel' },
  { desc: 'Parking fee', merchant: 'Parking Lot', amount: 25, expected: 'Travel' },
  
  // Professional Services - 100% deductible
  { desc: 'Legal consultation', merchant: 'Law Firm', amount: 800, expected: 'Professional Services' },
  { desc: 'Accounting services', merchant: 'CPA', amount: 500, expected: 'Professional Services' },
  { desc: 'Consulting fee', merchant: 'Consultant', amount: 1500, expected: 'Professional Services' },
  
  // Payroll - 100% deductible
  { desc: 'Employee salaries', merchant: 'Gusto', amount: 8500, expected: 'Payroll' },
  { desc: 'Payroll processing', merchant: 'ADP', amount: 200, expected: 'Payroll' },
  { desc: 'Contractor payment', merchant: 'Freelancer', amount: 2000, expected: 'Payroll' },
  
  // Rent - 100% deductible
  { desc: 'Office rent', merchant: 'Property Manager', amount: 2500, expected: 'Rent' },
  { desc: 'Lease payment', merchant: 'Landlord', amount: 3000, expected: 'Rent' },
  
  // Insurance - 100% deductible
  { desc: 'Business insurance', merchant: 'Insurance Co', amount: 450, expected: 'Insurance' },
  { desc: 'Liability insurance', merchant: 'State Farm', amount: 300, expected: 'Insurance' },
  
  // Taxes
  { desc: 'Quarterly tax', merchant: 'IRS', amount: 3500, expected: 'Taxes' },
  { desc: 'State tax payment', merchant: 'State Revenue', amount: 1200, expected: 'Taxes' },
  
  // Inventory
  { desc: 'Product inventory', merchant: 'Wholesale Supplier', amount: 5000, expected: 'Inventory' },
  { desc: 'Stock purchase', merchant: 'Vendor', amount: 3000, expected: 'Inventory' },
  
  // Office Supplies
  { desc: 'Paper and pens', merchant: 'Staples', amount: 120, expected: 'Office Supplies' },
  { desc: 'Printer supplies', merchant: 'Office Depot', amount: 85, expected: 'Office Supplies' }
];

async function runAccuracyTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        CATEGORIZATION ACCURACY TEST                        ║');
  console.log('║        Testing with ' + testDataset.length + ' diverse transactions                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results = [];
  let correct = 0;
  let total = 0;

  console.log('Testing categorization...\n');

  for (let i = 0; i < testDataset.length; i++) {
    const test = testDataset[i];
    
    try {
      const result = await aiCategorizationService.categorizeTransaction(
        test.desc,
        test.merchant,
        test.amount
      );

      const isCorrect = result.category === test.expected ||
                       (result.category === 'Operations' && test.expected === 'Office Supplies') ||
                       (result.category === 'Office Supplies' && test.expected === 'Operations');

      if (isCorrect) correct++;
      total++;

      results.push({
        test,
        result,
        isCorrect
      });

      const symbol = isCorrect ? '✓' : '✗';
      const color = isCorrect ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(`${color}${symbol}${reset} ${test.desc.padEnd(30)} | Expected: ${test.expected.padEnd(25)} | Got: ${result.category.padEnd(25)} | ${(result.confidence * 100).toFixed(0)}%`);

    } catch (error) {
      console.log(`\x1b[31m✗\x1b[0m ${test.desc.padEnd(30)} | Error: ${error.message}`);
      total++;
    }
  }

  // Calculate statistics
  const accuracy = (correct / total * 100).toFixed(2);

  console.log('\n' + '═'.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('═'.repeat(60) + '\n');

  console.log(`Total Tests: ${total}`);
  console.log(`\x1b[32mCorrect: ${correct}\x1b[0m`);
  console.log(`\x1b[31mIncorrect: ${total - correct}\x1b[0m`);
  console.log(`\x1b[36mAccuracy: ${accuracy}%\x1b[0m\n`);

  // Category breakdown
  const categoryStats = {};
  results.forEach(r => {
    const expected = r.test.expected;
    if (!categoryStats[expected]) {
      categoryStats[expected] = { correct: 0, total: 0 };
    }
    categoryStats[expected].total++;
    if (r.isCorrect) categoryStats[expected].correct++;
  });

  console.log('Category-wise Accuracy:\n');
  Object.entries(categoryStats)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([category, stats]) => {
      const catAccuracy = ((stats.correct / stats.total) * 100).toFixed(0);
      const bar = '█'.repeat(Math.floor(catAccuracy / 5));
      console.log(`${category.padEnd(25)} | ${stats.correct}/${stats.total} | ${catAccuracy}% ${bar}`);
    });

  console.log('\n' + '═'.repeat(60));

  // Confidence analysis
  const avgConfidence = results.reduce((sum, r) => sum + r.result.confidence, 0) / results.length;
  console.log(`\nAverage Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

  const highConfidence = results.filter(r => r.result.confidence >= 0.8).length;
  const mediumConfidence = results.filter(r => r.result.confidence >= 0.6 && r.result.confidence < 0.8).length;
  const lowConfidence = results.filter(r => r.result.confidence < 0.6).length;

  console.log(`High Confidence (≥80%): ${highConfidence} (${(highConfidence/total*100).toFixed(1)}%)`);
  console.log(`Medium Confidence (60-79%): ${mediumConfidence} (${(mediumConfidence/total*100).toFixed(1)}%)`);
  console.log(`Low Confidence (<60%): ${lowConfidence} (${(lowConfidence/total*100).toFixed(1)}%)`);

  // Show misclassifications
  const errors = results.filter(r => !r.isCorrect);
  if (errors.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('MISCLASSIFICATIONS:\n');
    errors.forEach(e => {
      console.log(`\x1b[31m✗\x1b[0m ${e.test.desc}`);
      console.log(`  Expected: ${e.test.expected}`);
      console.log(`  Got: ${e.result.category} (${(e.result.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`  Merchant: ${e.test.merchant}\n`);
    });
  }

  console.log('═'.repeat(60));
  
  if (accuracy >= 90) {
    console.log('\n\x1b[32m✓ EXCELLENT! Categorization accuracy is above 90%\x1b[0m');
  } else if (accuracy >= 80) {
    console.log('\n\x1b[33m✓ GOOD! Categorization accuracy is above 80%\x1b[0m');
  } else if (accuracy >= 70) {
    console.log('\n\x1b[33m⚠ FAIR! Categorization accuracy needs improvement\x1b[0m');
  } else {
    console.log('\n\x1b[31m✗ POOR! Categorization accuracy is below 70%\x1b[0m');
  }

  console.log('\n✅ Test Complete!\n');
}

// Run test
runAccuracyTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
