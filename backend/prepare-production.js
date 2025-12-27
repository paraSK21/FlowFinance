// Production Preparation Script
// This will clear all test data and prepare the database for production
require('dotenv').config();
const { User, Account, Transaction, Invoice, TaxDeduction, Forecast, CategoryLearning, InvoiceReminder } = require('./src/models');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function prepareProduction() {
  try {
    console.log('\n🚨 PRODUCTION PREPARATION SCRIPT 🚨\n');
    console.log('This will DELETE ALL DATA from your database:');
    console.log('  - All users');
    console.log('  - All bank accounts');
    console.log('  - All transactions');
    console.log('  - All invoices');
    console.log('  - All tax deductions');
    console.log('  - All forecasts');
    console.log('  - All learned patterns');
    console.log('  - All invoice reminders\n');

    const confirm1 = await question('Are you sure you want to continue? (type "YES" to confirm): ');
    
    if (confirm1 !== 'YES') {
      console.log('❌ Cancelled. No changes made.');
      rl.close();
      process.exit(0);
    }

    const confirm2 = await question('\n⚠️  FINAL WARNING: This action CANNOT be undone!\nType "DELETE ALL DATA" to proceed: ');
    
    if (confirm2 !== 'DELETE ALL DATA') {
      console.log('❌ Cancelled. No changes made.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🗑️  Deleting all data...\n');

    // Delete in correct order (respecting foreign key constraints)
    const invoiceRemindersCount = await InvoiceReminder.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${invoiceRemindersCount} invoice reminders`);

    const categoryLearningCount = await CategoryLearning.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${categoryLearningCount} learned patterns`);

    const forecastsCount = await Forecast.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${forecastsCount} forecasts`);

    const taxDeductionsCount = await TaxDeduction.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${taxDeductionsCount} tax deductions`);

    const invoicesCount = await Invoice.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${invoicesCount} invoices`);

    const transactionsCount = await Transaction.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${transactionsCount} transactions`);

    const accountsCount = await Account.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${accountsCount} accounts`);

    const usersCount = await User.destroy({ where: {}, truncate: false });
    console.log(`✓ Deleted ${usersCount} users`);

    console.log('\n✅ Database cleaned successfully!\n');
    console.log('📊 Production Status:');
    console.log('  - Database: PostgreSQL (production-ready)');
    console.log('  - Users: 0');
    console.log('  - Trial Period: 7 days for new users');
    console.log('  - Ready for deployment: YES\n');

    console.log('🚀 Next Steps:');
    console.log('  1. Deploy your backend to a hosting service (Heroku, Railway, Render, etc.)');
    console.log('  2. Deploy your frontend to Vercel/Netlify');
    console.log('  3. Update environment variables for production');
    console.log('  4. Set up production PostgreSQL database (e.g., Supabase, Neon, Railway)');
    console.log('  5. Run migrations on production database');
    console.log('  6. Test the production deployment\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error preparing production:', error);
    rl.close();
    process.exit(1);
  }
}

prepareProduction();
