/**
 * Script to recategorize all transactions with the updated rules
 * Run this after fixing categorization logic to update existing transactions
 * 
 * Usage: node recategorize-transactions.js
 */

require('dotenv').config();
const { Transaction, User } = require('./src/models');
const aiService = require('./src/services/aiCategorizationService');

async function recategorizeAllTransactions() {
  try {
    console.log('🔄 Starting transaction recategorization...\n');

    // Get all users
    const users = await User.findAll();
    console.log(`Found ${users.length} user(s)\n`);

    let totalUpdated = 0;
    let totalFixed = 0;

    for (const user of users) {
      console.log(`\n📊 Processing user: ${user.email || user.id}`);
      
      // Get all transactions for this user
      const transactions = await Transaction.findAll({
        where: { userId: user.id },
        order: [['date', 'DESC']]
      });

      console.log(`   Found ${transactions.length} transactions`);

      let userUpdated = 0;
      let userFixed = 0;

      for (const txn of transactions) {
        const oldCategory = txn.aiCategory || txn.category;
        
        // Check for the specific issues we're fixing:
        // 1. Negative amounts (expenses) categorized as Revenue
        // 2. Uber categorized as Meals & Entertainment
        const needsRecategorization = 
          (txn.type === 'expense' && oldCategory === 'Revenue') ||
          (txn.description?.toLowerCase().includes('uber') && oldCategory === 'Meals & Entertainment');

        if (needsRecategorization) {
          userFixed++;
        }

        // Recategorize
        const result = await aiService.categorizeTransaction(
          txn.description,
          txn.merchantName,
          txn.amount,
          user.id,
          txn.type
        );

        // Update transaction
        await txn.update({
          aiCategory: result.category,
          aiCategoryConfidence: result.confidence,
          categorizationMethod: result.method,
          needsReview: result.confidence < 0.75
        });

        userUpdated++;

        // Log significant changes
        if (oldCategory !== result.category) {
          console.log(`   ✓ ${txn.description?.substring(0, 30).padEnd(30)} | ${oldCategory?.padEnd(20)} → ${result.category}`);
        }
      }

      totalUpdated += userUpdated;
      totalFixed += userFixed;
      
      console.log(`   ✅ Updated ${userUpdated} transactions (${userFixed} fixed critical issues)`);
    }

    console.log(`\n✅ Recategorization complete!`);
    console.log(`   Total transactions updated: ${totalUpdated}`);
    console.log(`   Critical issues fixed: ${totalFixed}`);
    console.log(`      - Expenses incorrectly marked as Revenue`);
    console.log(`      - Uber trips marked as Meals & Entertainment\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during recategorization:', error);
    process.exit(1);
  }
}

// Run the script
recategorizeAllTransactions();
