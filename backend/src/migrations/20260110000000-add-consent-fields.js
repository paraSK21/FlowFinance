'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding consent tracking fields to users table...');
    
    const tableDescription = await queryInterface.describeTable('users');
    
    // Add consentAccepted
    if (!tableDescription.consentAccepted) {
      await queryInterface.addColumn('users', 'consentAccepted', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'User accepted Terms of Service and Privacy Policy'
      });
      console.log('✓ Added column: consentAccepted');
    } else {
      console.log('⚠ Column consentAccepted already exists, skipping');
    }
    
    // Add consentAcceptedAt
    if (!tableDescription.consentAcceptedAt) {
      await queryInterface.addColumn('users', 'consentAcceptedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when user accepted consent'
      });
      console.log('✓ Added column: consentAcceptedAt');
    } else {
      console.log('⚠ Column consentAcceptedAt already exists, skipping');
    }
    
    // Add consentVersion
    if (!tableDescription.consentVersion) {
      await queryInterface.addColumn('users', 'consentVersion', {
        type: Sequelize.STRING,
        defaultValue: '1.0',
        allowNull: true,
        comment: 'Version of Terms/Privacy Policy accepted'
      });
      console.log('✓ Added column: consentVersion');
    } else {
      console.log('⚠ Column consentVersion already exists, skipping');
    }
    
    // Add consentIpAddress
    if (!tableDescription.consentIpAddress) {
      await queryInterface.addColumn('users', 'consentIpAddress', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'IP address when consent was given'
      });
      console.log('✓ Added column: consentIpAddress');
    } else {
      console.log('⚠ Column consentIpAddress already exists, skipping');
    }
    
    console.log('✓ Migration completed: Consent tracking fields added to users table');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing consent tracking fields from users table...');
    
    await queryInterface.removeColumn('users', 'consentAccepted');
    console.log('✓ Removed column: consentAccepted');
    
    await queryInterface.removeColumn('users', 'consentAcceptedAt');
    console.log('✓ Removed column: consentAcceptedAt');
    
    await queryInterface.removeColumn('users', 'consentVersion');
    console.log('✓ Removed column: consentVersion');
    
    await queryInterface.removeColumn('users', 'consentIpAddress');
    console.log('✓ Removed column: consentIpAddress');
    
    console.log('✓ Rollback completed: Consent tracking fields removed from users table');
  }
};
