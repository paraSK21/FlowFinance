// Debug script to check forecast calculations
require('dotenv').config();
const { Transaction, Account, User } = require('./src/models');
const improvedForecastService = require('./src/services/improvedForecastService');

async function debugForecast() {
  try {
    console.log('=== FORECAST DEBUG SCRIPT ===\n');
    
    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }
    
    console.log(`User: ${user.email} (ID: ${user.id})\n`);
    
    // Get accounts
    const accounts = await Account.findAll({
      where: { userId: user.id, isActive: true }
    });
    
    console.log(`Accounts: ${accounts.length}`);
    accounts.forEach(acc => {
      console.log(`  - ${acc.name}: $${acc.currentBalance}`);
    });
    
    const currentBalance = accounts.reduce((sum, acc) => 
      sum + parseFloat(acc.currentBalance || 0), 0
    );
    console.log(`Total Balance: $${currentBalance}\n`);
    
    // Get transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const transactions = await Transaction.findAll({
      where: {
        userId: user.id,
        date: { [require('sequelize').Op.gte]: sixMonthsAgo }
      },
      order: [['date', 'DESC']],
      limit: 20
    });
    
    console.log(`Recent Transactions (last 20):`);
    console.log('Date       | Type    | Amount  | Description');
    console.log('-----------|---------|---------|------------------');
    transactions.forEach(txn => {
      const date = new Date(txn.date).toISOString().split('T')[0];
      const type = txn.type.padEnd(7);
      const amount = `$${parseFloat(txn.amount).toFixed(2)}`.padEnd(8);
      const desc = (txn.description || txn.merchantName || '').substring(0, 30);
      console.log(`${date} | ${type} | ${amount} | ${desc}`);
    });
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    console.log(`\nTransaction Summary (last 6 months):`);
    console.log(`  Total Income: $${totalIncome.toFixed(2)}`);
    console.log(`  Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`  Net: $${(totalIncome - totalExpenses).toFixed(2)}`);
    
    // Generate forecast
    console.log('\n=== GENERATING 90-DAY FORECAST ===\n');
    const result = await improvedForecastService.generateForecast(user.id, 90);
    
    console.log('\n=== FORECAST COMPLETE ===');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugForecast();
