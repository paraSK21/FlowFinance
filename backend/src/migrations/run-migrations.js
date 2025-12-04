// ====================
// backend/src/migrations/run-migrations.js
// ====================
const { sequelize } = require('../models');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    await sequelize.sync({ alter: true });
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
