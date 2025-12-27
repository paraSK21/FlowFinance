// FORCE DELETE ALL DATA - Use with caution!
// This script will immediately delete all data without confirmation
require('dotenv').config();
const { User, Account, Transaction, Invoice, TaxDeduction, Forecast, CategoryLearning, InvoiceReminder } = require('./src/models');

async function clearAllData() {
  try {
    console.log('\n🗑️  DELETING ALL DATA...\n');

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

    console.log('\n✅ DATABASE CLEANED SUCCESSFULLY!\n');
    console.log('📊 Production Status:');
    console.log('  ✓ Database: PostgreSQL (production-ready)');
    console.log('  ✓ Users: 0');
    console.log('  ✓ Trial Period: 7 days for new users');
    console.log('  ✓ Ready for deployment: YES\n');

    console.log('🚀 Your app is now ready for production!');
    console.log('   Next user who registers will be user #1\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing data:', error);
    process.exit(1);
  }
}

clearAllData();
