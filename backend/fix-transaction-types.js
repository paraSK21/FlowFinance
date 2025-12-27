/**
 * Fix Transaction Types - Correct any transactions with wrong type based on amount
 * 
 * Plaid convention:
 * - Positive amounts = expenses (debits)
 * - Negative amounts = income (credits)
 * 
 * This script will:
 * 1. Find all transactions where type doesn't match amount sign
 * 2. Correct the type field
 * 3. Report the changes
 */

require('dotenv').config();
const { Transaction, sequelize } = require('./src/models');

async function fixTransactionTypes() {
  console.log('\n=== FIXING TRANSACTION TYPES ===\n');

  try {
    // Get all transactions
    const allTransactions = await Transaction.findAll();
    console.log(`Found ${allTransactions.length} total transactions\n`);

    let fixedCount = 0;
    const fixes = [];

    for (const txn of allTransactions) {
      const amount = parseFloat(txn.amount);
      const currentType = txn.type;
      const correctType = amount > 0 ? 'expense' : 'income';

      if (currentType !== correctType) {
        fixes.push({
          id: txn.id,
          description: txn.description,
          amount: amount,
          oldType: currentType,
          newType: correctType
        });

        await txn.update({ type: correctType });
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      console.log(`✓ Fixed ${fixedCount} transactions:\n`);
      fixes.forEach(fix => {
        console.log(`  • ${fix.description}`);
        console.log(`    Amount: $${fix.amount.toFixed(2)}`);
        console.log(`    Changed: ${fix.oldType} → ${fix.newType}\n`);
      });
    } else {
      console.log('✓ All transactions already have correct types!\n');
    }

    // Verify the fix
    console.log('Verifying...');
    const verifyTransactions = await Transaction.findAll();
    const stillWrong = verifyTransactions.filter(txn => {
      const amount = parseFloat(txn.amount);
      const correctType = amount > 0 ? 'expense' : 'income';
      return txn.type !== correctType;
    });

    if (stillWrong.length === 0) {
      console.log('✓ Verification passed! All transactions now have correct types.\n');
    } else {
      console.log(`✗ Verification failed! ${stillWrong.length} transactions still have wrong types.\n`);
    }

    console.log('=== FIX COMPLETE ===\n');

  } catch (error) {
    console.error('Error fixing transaction types:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the fix
fixTransactionTypes();
