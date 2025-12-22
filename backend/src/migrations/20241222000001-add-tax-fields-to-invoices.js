// Migration to add tax fields to invoices
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('invoices');
    
    if (!tableDescription.subtotal) {
      await queryInterface.addColumn('invoices', 'subtotal', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      });
    }
    
    if (!tableDescription.taxRate) {
      await queryInterface.addColumn('invoices', 'taxRate', {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
        defaultValue: 0
      });
    }
    
    if (!tableDescription.taxAmount) {
      await queryInterface.addColumn('invoices', 'taxAmount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
      });
    }
    
    if (!tableDescription.taxType) {
      await queryInterface.addColumn('invoices', 'taxType', {
        type: Sequelize.ENUM('none', 'sales_tax', 'gst', 'hst', 'pst', 'qst'),
        defaultValue: 'none'
      });
    }
    
    if (!tableDescription.taxJurisdiction) {
      await queryInterface.addColumn('invoices', 'taxJurisdiction', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('invoices', 'subtotal');
    await queryInterface.removeColumn('invoices', 'taxRate');
    await queryInterface.removeColumn('invoices', 'taxAmount');
    await queryInterface.removeColumn('invoices', 'taxType');
    await queryInterface.removeColumn('invoices', 'taxJurisdiction');
  }
};
