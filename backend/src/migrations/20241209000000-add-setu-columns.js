'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('accounts');
    
    if (!tableDescription.setuConsentId) {
      await queryInterface.addColumn('accounts', 'setuConsentId', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Setu Account Aggregator consent ID for Indian banks'
      });
      console.log('✓ Added column: setuConsentId');
    } else {
      console.log('⚠ Column setuConsentId already exists, skipping');
    }

    if (!tableDescription.setuAccountId) {
      await queryInterface.addColumn('accounts', 'setuAccountId', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Setu Account Aggregator account ID (linkRefNumber)'
      });
      console.log('✓ Added column: setuAccountId');
    } else {
      console.log('⚠ Column setuAccountId already exists, skipping');
    }

    // Add index for faster lookups
    try {
      await queryInterface.addIndex('accounts', ['setuConsentId'], {
        name: 'accounts_setu_consent_id_idx'
      });
      console.log('✓ Added index on setuConsentId');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠ Index on setuConsentId already exists, skipping');
      } else {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex('accounts', ['setuAccountId'], {
        name: 'accounts_setu_account_id_idx'
      });
      console.log('✓ Added index on setuAccountId');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠ Index on setuAccountId already exists, skipping');
      } else {
        throw error;
      }
    }

    console.log('✓ Migration completed: Setu AA columns added to accounts table');
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    try {
      await queryInterface.removeIndex('accounts', 'accounts_setu_account_id_idx');
      console.log('✓ Removed index on setuAccountId');
    } catch (error) {
      console.log('⚠ Index on setuAccountId does not exist, skipping');
    }

    try {
      await queryInterface.removeIndex('accounts', 'accounts_setu_consent_id_idx');
      console.log('✓ Removed index on setuConsentId');
    } catch (error) {
      console.log('⚠ Index on setuConsentId does not exist, skipping');
    }

    // Remove columns
    await queryInterface.removeColumn('accounts', 'setuAccountId');
    console.log('✓ Removed column: setuAccountId');
    
    await queryInterface.removeColumn('accounts', 'setuConsentId');
    console.log('✓ Removed column: setuConsentId');

    console.log('✓ Rollback completed: Setu AA columns removed from accounts table');
  }
};
