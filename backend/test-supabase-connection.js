// Test Supabase Connection
require('dotenv').config();
const { sequelize } = require('./src/models');

async function testConnection() {
  console.log('\n🔍 Testing Supabase Connection...\n');
  
  try {
    // Test authentication
    await sequelize.authenticate();
    console.log('✅ Successfully connected to Supabase!');
    
    // Get database info
    const [results] = await sequelize.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version,
        pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    console.log('\n📊 Database Information:');
    console.log('  Database:', results[0].database);
    console.log('  User:', results[0].user);
    console.log('  Size:', results[0].size);
    console.log('  Version:', results[0].version.split(',')[0]);
    
    // Check if tables exist
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.length > 0) {
      console.log('\n📋 Existing Tables:');
      tables.forEach(table => {
        console.log('  ✓', table.table_name);
      });
    } else {
      console.log('\n📋 No tables found yet.');
      console.log('   Tables will be created when you start the server.');
    }
    
    // Test connection pool
    console.log('\n🔌 Connection Pool Status:');
    console.log('  Max connections:', sequelize.config.pool.max);
    console.log('  Min connections:', sequelize.config.pool.min);
    console.log('  Acquire timeout:', sequelize.config.pool.acquire + 'ms');
    
    console.log('\n✅ All checks passed! Your Supabase database is ready.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('\nError details:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Fix: Check your database password in .env file');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Fix: Check your DB_HOST in .env file');
      console.error('   Should be: db.xxxxxxxxxxxxx.supabase.co');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 Fix: SSL connection issue. Make sure dialectOptions.ssl is configured');
    }
    
    console.error('\n📚 See SUPABASE_SETUP.md for detailed setup instructions\n');
    
    process.exit(1);
  }
}

testConnection();
