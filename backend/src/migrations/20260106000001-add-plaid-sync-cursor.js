'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('accounts', 'plaidSyncCursor', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Cursor for incremental Plaid transaction syncing'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('accounts', 'plaidSyncCursor');
  }
};
