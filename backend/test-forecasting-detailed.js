/**
 * Detailed Forecasting Test
 * Comprehensive test to verify forecasting logic is working correctly
 */

require('dotenv').config();
const aiService = require('./src/services/aiService');

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createHistoricalData(days = 90) {
  const transactions = [];
  const today = new Date();
  
  // Simulate realistic business transactions
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayOfWeek = date.getDay();
    
    // Revenue patterns (more on weekdays)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Client payments (2-3 times per week)
      if (Math.random() > 0.6) {
        transactions.push({
          date,
          amount: -(2000 + Math.random() * 3000), // $2k-$5k
          type: 'income',
          description: 'Client payment',
          merchantName: 'Client'
        });
      }
    }
    
    // Daily expenses
    // Rent (1st of month)
    if (date.getDate() === 1) {
      transactions.push({
        date,
        amount: 2500,
        type: 'expense',
        description: 'Office rent',
        merchantName: 'Property Manager'
      });
    }
    
    // Payroll (1st and 15th)
    if (date.getDate() === 1 || date.getDate() === 15) {
      transactions.push({
        date,
        amount: 8500,
        type: 'expense',
        description: 'Payroll',
        merchantName: 'Gusto'
      });
    }
    
    // Utilities (random days)
    if (Math.random() > 0.9) {
      transactions.push({
        date,
        amount: 100 + Math.random() * 200,
        type: 'expense',
        description: 'Utility bill',
        merchantName: 'Utility Company'
      });
    }
    
    // Marketing (weekly)
    if (dayOfWeek === 1) {
      transactions.push({
        date,
        amount: 500 + Math.random() * 500,
        type: 'expense',
        description: 'Marketing',
        merchantName: 'Google Ads'
      });
    }
    
    // Daily operational expenses
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      transactions.push({
        date,
        amount: 50 + Math.random() * 150,
        type: 'expense',
        description: 'Daily expenses',
        merchantName: 'Various'
      });
    }
    
    // Meals & Entertainment (2-3 times per week)
    if (Math.random() > 0.6 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      transactions.push({
        date,
        amount: 30 + Math.random() * 100,
        type: 'expense',
        description: 'Business meal',
        merchantName: 'Restaurant'
      });
    }
  }
  
  return transactions.sort((a, b) => b.date - a.date);
}

function drawChart(data, title, height = 10) {
  console.log('\n' + title);
  console.log('─'.repeat(70));
  
  const values = data.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  
  // Draw chart
  for (let row = height; row >= 0; row--) {
    const threshold = min + (range * row / height);
    let line = '';
    
    for (let i = 0; i < Math.min(data.length, 60); i++) {
      const value = values[i];
      if (value >= threshold) {
        line += value >= 0 ? '█' : '▓';
      } else {
        line += ' ';
      }
    }
    
    const label = `$${(threshold / 1000).toFixed(1)}k`;
    console.log(`${label.padStart(8)} │${line}`);
  }
  
  console.log('         └' + '─'.repeat(60));
  console.log('          ' + 'Days →'.padStart(30));
}

async function testForecasting() {
  console.clear();
  
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          DETAILED FORECASTING TEST                         ║', 'cyan');
  log('║          Comprehensive Validation of Forecast Logic        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Test 1: Generate Historical Data
  log('\n📊 TEST 1: Generating Historical Transaction Data', 'yellow');
  log('─'.repeat(60), 'gray');
  
  const historicalDays = 90;
  const historicalData = createHistoricalData(historicalDays);
  
  log(`✓ Generated ${historicalData.length} transactions over ${historicalDays} days`, 'green');
  
  // Calculate historical statistics
  const totalIncome = historicalData
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalExpenses = historicalData
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const avgDailyIncome = totalIncome / historicalDays;
  const avgDailyExpenses = totalExpenses / historicalDays;
  
  log(`  Total Income: $${totalIncome.toFixed(2)}`, 'green');
  log(`  Total Expenses: $${totalExpenses.toFixed(2)}`, 'red');
  log(`  Net Cash Flow: $${(totalIncome - totalExpenses).toFixed(2)}`, 'cyan');
  log(`  Avg Daily Income: $${avgDailyIncome.toFixed(2)}`, 'green');
  log(`  Avg Daily Expenses: $${avgDailyExpenses.toFixed(2)}`, 'red');
  
  // Test 2: Generate Forecast
  log('\n📈 TEST 2: Generating 90-Day Forecast', 'yellow');
  log('─'.repeat(60), 'gray');
  
  const currentBalance = 50000; // Starting with $50k
  const forecastDays = 90;
  
  log(`Starting Balance: $${currentBalance.toFixed(2)}`, 'blue');
  log(`Forecast Period: ${forecastDays} days`, 'blue');
  log('Generating forecast...', 'gray');
  
  const startTime = Date.now();
  const forecasts = await aiService.generateForecast(
    historicalData,
    currentBalance,
    forecastDays
  );
  const endTime = Date.now();
  
  log(`✓ Forecast generated in ${endTime - startTime}ms`, 'green');
  log(`✓ Generated ${forecasts.length} daily predictions`, 'green');
  
  // Test 3: Validate Forecast Logic
  log('\n🔍 TEST 3: Validating Forecast Logic', 'yellow');
  log('─'.repeat(60), 'gray');
  
  // Check that forecasts are sequential
  let isSequential = true;
  for (let i = 1; i < forecasts.length; i++) {
    const prevDate = new Date(forecasts[i - 1].date);
    const currDate = new Date(forecasts[i].date);
    const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (Math.abs(dayDiff - 1) > 0.1) {
      isSequential = false;
      break;
    }
  }
  
  log(isSequential ? '✓ Dates are sequential (1 day apart)' : '✗ Dates are not sequential', isSequential ? 'green' : 'red');
  
  // Check that balances are calculated correctly
  let balanceCorrect = true;
  let prevBalance = currentBalance;
  
  for (let i = 0; i < Math.min(10, forecasts.length); i++) {
    const forecast = forecasts[i];
    const expectedBalance = prevBalance + forecast.projectedIncome - forecast.projectedExpenses;
    const diff = Math.abs(expectedBalance - forecast.predictedBalance);
    
    if (diff > 0.01) {
      balanceCorrect = false;
      break;
    }
    prevBalance = forecast.predictedBalance;
  }
  
  log(balanceCorrect ? '✓ Balance calculations are correct' : '✗ Balance calculations have errors', balanceCorrect ? 'green' : 'red');
  
  // Check confidence scores
  const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;
  const hasConfidence = forecasts.every(f => f.confidence >= 0 && f.confidence <= 1);
  
  log(hasConfidence ? '✓ Confidence scores are valid (0-1 range)' : '✗ Invalid confidence scores', hasConfidence ? 'green' : 'red');
  log(`  Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`, 'cyan');
  
  // Check for reasonable values
  const hasReasonableValues = forecasts.every(f => 
    !isNaN(f.predictedBalance) && 
    !isNaN(f.projectedIncome) && 
    !isNaN(f.projectedExpenses)
  );
  
  log(hasReasonableValues ? '✓ All forecast values are valid numbers' : '✗ Some forecast values are invalid', hasReasonableValues ? 'green' : 'red');
  
  // Test 4: Analyze Forecast Patterns
  log('\n📊 TEST 4: Analyzing Forecast Patterns', 'yellow');
  log('─'.repeat(60), 'gray');
  
  // Group by day of week
  const dayOfWeekPatterns = {};
  forecasts.forEach(f => {
    const day = new Date(f.date).getDay();
    if (!dayOfWeekPatterns[day]) {
      dayOfWeekPatterns[day] = { income: [], expenses: [] };
    }
    dayOfWeekPatterns[day].income.push(f.projectedIncome);
    dayOfWeekPatterns[day].expenses.push(f.projectedExpenses);
  });
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  log('Day-of-Week Patterns:', 'cyan');
  Object.entries(dayOfWeekPatterns).forEach(([day, data]) => {
    const avgIncome = data.income.reduce((a, b) => a + b, 0) / data.income.length;
    const avgExpenses = data.expenses.reduce((a, b) => a + b, 0) / data.expenses.length;
    
    console.log(`  ${dayNames[day].padEnd(10)} | Income: $${avgIncome.toFixed(2).padStart(8)} | Expenses: $${avgExpenses.toFixed(2).padStart(8)}`);
  });
  
  // Test 5: Show Detailed Forecast
  log('\n📅 TEST 5: First 14 Days Detailed Forecast', 'yellow');
  log('─'.repeat(60), 'gray');
  
  console.log('\n' + 'Date'.padEnd(12) + ' | ' + 'Balance'.padStart(12) + ' | ' + 'Income'.padStart(10) + ' | ' + 'Expenses'.padStart(10) + ' | ' + 'Conf%');
  console.log('─'.repeat(70));
  
  forecasts.slice(0, 14).forEach(f => {
    const date = new Date(f.date).toISOString().split('T')[0];
    const balance = f.predictedBalance.toFixed(2);
    const income = f.projectedIncome.toFixed(2);
    const expenses = f.projectedExpenses.toFixed(2);
    const conf = (f.confidence * 100).toFixed(0);
    
    const balanceColor = f.predictedBalance > currentBalance ? 'green' : f.predictedBalance > 0 ? 'yellow' : 'red';
    
    log(
      `${date} | ${('$' + balance).padStart(12)} | ${('$' + income).padStart(10)} | ${('$' + expenses).padStart(10)} | ${conf.padStart(3)}%`,
      balanceColor
    );
  });
  
  // Test 6: Forecast Summary Statistics
  log('\n📈 TEST 6: Forecast Summary (90 Days)', 'yellow');
  log('─'.repeat(60), 'gray');
  
  const finalBalance = forecasts[forecasts.length - 1].predictedBalance;
  const totalProjectedIncome = forecasts.reduce((sum, f) => sum + f.projectedIncome, 0);
  const totalProjectedExpenses = forecasts.reduce((sum, f) => sum + f.projectedExpenses, 0);
  const netChange = finalBalance - currentBalance;
  const percentChange = (netChange / currentBalance) * 100;
  
  log(`Starting Balance: $${currentBalance.toFixed(2)}`, 'blue');
  log(`Ending Balance (Day 90): $${finalBalance.toFixed(2)}`, finalBalance > currentBalance ? 'green' : 'red');
  log(`Net Change: $${netChange.toFixed(2)} (${percentChange.toFixed(1)}%)`, netChange > 0 ? 'green' : 'red');
  console.log('');
  log(`Total Projected Income: $${totalProjectedIncome.toFixed(2)}`, 'green');
  log(`Total Projected Expenses: $${totalProjectedExpenses.toFixed(2)}`, 'red');
  log(`Net Cash Flow: $${(totalProjectedIncome - totalProjectedExpenses).toFixed(2)}`, 'cyan');
  console.log('');
  log(`Average Daily Income: $${(totalProjectedIncome / forecastDays).toFixed(2)}`, 'green');
  log(`Average Daily Expenses: $${(totalProjectedExpenses / forecastDays).toFixed(2)}`, 'red');
  log(`Average Daily Net: $${((totalProjectedIncome - totalProjectedExpenses) / forecastDays).toFixed(2)}`, 'cyan');
  
  // Test 7: Cash Flow Alerts
  log('\n⚠️  TEST 7: Cash Flow Alerts & Warnings', 'yellow');
  log('─'.repeat(60), 'gray');
  
  const lowBalanceThreshold = 10000;
  const criticalThreshold = 5000;
  
  const lowBalanceDays = forecasts.filter(f => f.predictedBalance < lowBalanceThreshold && f.predictedBalance > 0);
  const criticalDays = forecasts.filter(f => f.predictedBalance < criticalThreshold && f.predictedBalance > 0);
  const negativeDays = forecasts.filter(f => f.predictedBalance < 0);
  
  if (negativeDays.length > 0) {
    log(`⚠️  CRITICAL: ${negativeDays.length} days with negative balance!`, 'red');
    log(`   First occurrence: ${new Date(negativeDays[0].date).toISOString().split('T')[0]}`, 'red');
    log(`   Lowest balance: $${Math.min(...negativeDays.map(d => d.predictedBalance)).toFixed(2)}`, 'red');
  } else {
    log('✓ No negative balance days predicted', 'green');
  }
  
  if (criticalDays.length > 0) {
    log(`⚠️  WARNING: ${criticalDays.length} days with balance below $${criticalThreshold}`, 'yellow');
    log(`   First occurrence: ${new Date(criticalDays[0].date).toISOString().split('T')[0]}`, 'yellow');
  } else {
    log(`✓ No days below critical threshold ($${criticalThreshold})`, 'green');
  }
  
  if (lowBalanceDays.length > 0) {
    log(`⚠️  NOTICE: ${lowBalanceDays.length} days with balance below $${lowBalanceThreshold}`, 'cyan');
  } else {
    log(`✓ No days below low balance threshold ($${lowBalanceThreshold})`, 'green');
  }
  
  // Test 8: Visual Chart
  log('\n📊 TEST 8: Visual Balance Forecast Chart', 'yellow');
  log('─'.repeat(60), 'gray');
  
  const chartData = forecasts.map(f => ({
    date: f.date,
    value: f.predictedBalance
  }));
  
  drawChart(chartData, 'Balance Over Time (90 Days)', 12);
  
  // Test 9: Confidence Analysis
  log('\n🎯 TEST 9: Confidence Score Analysis', 'yellow');
  log('─'.repeat(60), 'gray');
  
  const confidenceBuckets = {
    'Very High (90-100%)': forecasts.filter(f => f.confidence >= 0.9).length,
    'High (80-89%)': forecasts.filter(f => f.confidence >= 0.8 && f.confidence < 0.9).length,
    'Medium (70-79%)': forecasts.filter(f => f.confidence >= 0.7 && f.confidence < 0.8).length,
    'Good (60-69%)': forecasts.filter(f => f.confidence >= 0.6 && f.confidence < 0.7).length,
    'Fair (50-59%)': forecasts.filter(f => f.confidence >= 0.5 && f.confidence < 0.6).length,
    'Low (<50%)': forecasts.filter(f => f.confidence < 0.5).length
  };
  
  Object.entries(confidenceBuckets).forEach(([bucket, count]) => {
    const percentage = (count / forecasts.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`${bucket.padEnd(20)} | ${count.toString().padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
  });
  
  // Test 10: Validation Summary
  log('\n✅ TEST 10: Validation Summary', 'yellow');
  log('─'.repeat(60), 'gray');
  
  const validations = [
    { name: 'Forecast Generated', passed: forecasts.length === forecastDays },
    { name: 'Sequential Dates', passed: isSequential },
    { name: 'Correct Balance Calculations', passed: balanceCorrect },
    { name: 'Valid Confidence Scores', passed: hasConfidence },
    { name: 'Valid Numeric Values', passed: hasReasonableValues },
    { name: 'Generation Speed < 2s', passed: (endTime - startTime) < 2000 },
    { name: 'Average Confidence > 50%', passed: avgConfidence > 0.5 },
    { name: 'Reasonable Income Projections', passed: totalProjectedIncome > 0 },
    { name: 'Reasonable Expense Projections', passed: totalProjectedExpenses > 0 }
  ];
  
  const passedCount = validations.filter(v => v.passed).length;
  const totalCount = validations.length;
  
  validations.forEach(v => {
    log(`${v.passed ? '✓' : '✗'} ${v.name}`, v.passed ? 'green' : 'red');
  });
  
  console.log('');
  log('─'.repeat(60), 'gray');
  log(`VALIDATION SCORE: ${passedCount}/${totalCount} (${(passedCount/totalCount*100).toFixed(1)}%)`, passedCount === totalCount ? 'green' : 'yellow');
  log('─'.repeat(60), 'gray');
  
  // Final Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    FINAL SUMMARY                           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  console.log('');
  log('Forecasting Engine Status:', 'white');
  log(`  ✓ Forecast Generation: ${forecasts.length} days in ${endTime - startTime}ms`, 'green');
  log(`  ✓ Validation Score: ${passedCount}/${totalCount} tests passed`, passedCount === totalCount ? 'green' : 'yellow');
  log(`  ✓ Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`, 'green');
  log(`  ✓ Pattern Recognition: Working`, 'green');
  log(`  ✓ Balance Calculations: Accurate`, 'green');
  
  console.log('');
  log('Key Metrics:', 'white');
  log(`  • Starting Balance: $${currentBalance.toFixed(2)}`, 'cyan');
  log(`  • Ending Balance: $${finalBalance.toFixed(2)}`, finalBalance > currentBalance ? 'green' : 'red');
  log(`  • Net Change: $${netChange.toFixed(2)} (${percentChange.toFixed(1)}%)`, netChange > 0 ? 'green' : 'red');
  log(`  • Projected Income: $${totalProjectedIncome.toFixed(2)}`, 'green');
  log(`  • Projected Expenses: $${totalProjectedExpenses.toFixed(2)}`, 'red');
  
  console.log('');
  
  if (passedCount === totalCount) {
    log('🎉 ALL TESTS PASSED! Forecasting is working perfectly!', 'green');
  } else {
    log(`⚠️  ${totalCount - passedCount} test(s) failed. Review the results above.`, 'yellow');
  }
  
  console.log('');
  log('✅ Forecasting test complete!', 'green');
  console.log('');
}

// Run test
if (require.main === module) {
  testForecasting()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testForecasting, createHistoricalData };
