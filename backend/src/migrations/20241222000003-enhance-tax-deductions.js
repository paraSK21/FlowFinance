// Migration to enhance tax deductions table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('tax_deductions');
    
    if (!tableDescription.deductionType) {
      await queryInterface.addColumn('tax_deductions', 'deductionType', {
        type: Sequelize.ENUM(
          'home_office', 'vehicle', 'meals', 'travel', 'supplies',
          'software', 'equipment', 'professional_fees', 'advertising',
          'insurance', 'utilities', 'rent', 'depreciation', 'other'
        ),
        allowNull: true
      });
    }
    
    if (!tableDescription.receiptUrl) {
      await queryInterface.addColumn('tax_deductions', 'receiptUrl', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableDescription.deductiblePercentage) {
      await queryInterface.addColumn('tax_deductions', 'deductiblePercentage', {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 100.00
      });
    }
    
    if (!tableDescription.actualDeductibleAmount) {
      await queryInterface.addColumn('tax_deductions', 'actualDeductibleAmount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      });
    }
    
    if (!tableDescription.scanSource) {
      await queryInterface.addColumn('tax_deductions', 'scanSource', {
        type: Sequelize.ENUM('manual', 'weekly_scan', 'transaction_sync', 'receipt_upload'),
        defaultValue: 'manual'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tax_deductions', 'deductionType');
    await queryInterface.removeColumn('tax_deductions', 'receiptUrl');
    await queryInterface.removeColumn('tax_deductions', 'deductiblePercentage');
    await queryInterface.removeColumn('tax_deductions', 'actualDeductibleAmount');
    await queryInterface.removeColumn('tax_deductions', 'scanSource');
  }
};
