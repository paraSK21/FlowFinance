// Migration to add tax settings to users
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.taxSettings) {
      await queryInterface.addColumn('users', 'taxSettings', {
        type: Sequelize.JSONB,
        defaultValue: {
          country: 'US',
          state: null,
          province: null,
          defaultTaxRate: 0,
          taxId: null,
          businessType: 'sole_proprietor',
          fiscalYearEnd: '12-31',
          weeklyDeductionScan: true,
          deductionCategories: []
        }
      });
    }
    
    if (!tableDescription.lastDeductionScan) {
      await queryInterface.addColumn('users', 'lastDeductionScan', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'taxSettings');
    await queryInterface.removeColumn('users', 'lastDeductionScan');
  }
};
