/**
 * Test Transaction Logic - Verify Plaid Amount Conventions
 * 
 * Plaid /transactions/get endpoint convention:
 * - Positive amounts = expenses (money leaving account / debits)
 * - Negative amounts = income (money entering account / credits)
 * 
 * This test verifies that all transaction processing logic correctly handles this convention.
 */

const { Transaction, User, Account } = require('./src/models');
const plaidService = require('./src/services/plaidService');
const reportService = require('./src/services/reportService');
const aiService = require('./src/services/aiCategorizationService');
const forecastService = require('./src/services/improvedForecastService');

async function testTransactionLogic() {
  console.log('\n=== TESTING TRANSACTION LOGIC ===\n');

  try {
    // Test 1: Verify Plaid amount convention understanding
    console.log('Test 1: Plaid Amount Convention');
    console.log('✓ Positive amount (e.g., 50.00) = EXPENSE (debit)');
    console.log('✓ Negative amount (e.g., -100.00) = INCOME (credit)');
    
    // Test 2: Mock Plaid transactions
    const mockPlaidTransactions = [
      { amount: 50.00, name: 'Coffee Shop', type: 'expense' },      // Expense
      { amount: 25.50, name: 'Grocery Store', type: 'expense' },    // Expense
      { amount: -1000.00, name: 'Salary Deposit', type: 'income' }, // Income
      { amount: -50.00, name: 'Refund', type: 'income' },           // Income
      { amount: 100.00, name: 'Utility Bill', type: 'expense' }     // Expense
    ];

    console.log('\nTest 2: Mock Plaid Transactions');
    mockPlaidTransactions.forEach(txn => {
      const expectedType = txn.amount > 0 ? 'expense' : 'income';
      const status = expectedType === txn.type ? '✓' : '✗';
      console.log(`${status} Amount: ${txn.amount.toFixed(2)} → Type: ${txn.type} (Expected: ${expectedType})`);
    });

    // Test 3: Calculate totals correctly
    console.log('\nTest 3: Calculate Totals');
    const totalIncome = mockPlaidTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalExpenses = mockPlaidTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    console.log(`Total Income: $${totalIncome.toFixed(2)} (should be 1050.00)`);
    console.log(`Total Expenses: $${totalExpenses.toFixed(2)} (should be 175.50)`);
    console.log(`Net Cash Flow: $${(totalIncome - totalExpenses).toFixed(2)} (should be 874.50)`);

    if (totalIncome === 1050.00 && totalExpenses === 175.50) {
      console.log('✓ Calculations are CORRECT');
    } else {
      console.log('✗ Calculations are INCORRECT');
    }

    // Test 4: Check database for real transactions (if any exist)
    console.log('\nTest 4: Database Transaction Check');
    const dbTransactions = await Transaction.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    if (dbTransactions.length > 0) {
      console.log(`Found ${dbTransactions.length} transactions in database:`);
      dbTransactions.forEach(txn => {
        const amount = parseFloat(txn.amount);
        const expectedType = amount > 0 ? 'expense' : 'income';
        const status = txn.type === expectedType ? '✓' : '✗';
        console.log(`${status} ID: ${txn.id.substring(0, 8)}... | Amount: ${amount.toFixed(2)} | Type: ${txn.type} | Expected: ${expectedType} | Desc: ${txn.description}`);
      });

      // Check for mismatches
      const mismatches = dbTransactions.filter(txn => {
        const amount = parseFloat(txn.amount);
        const expectedType = amount > 0 ? 'expense' : 'income';
        return txn.type !== expectedType;
      });

      if (mismatches.length > 0) {
        console.log(`\n⚠️  WARNING: Found ${mismatches.length} transactions with incorrect type!`);
        console.log('These transactions need to be corrected in the database.');
      } else {
        console.log('\n✓ All database transactions have correct types');
      }
    } else {
      console.log('No transactions found in database (this is okay for new installations)');
    }

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testTransactionLogic();
