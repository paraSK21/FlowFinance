// Migration to add unique constraint on plaidTransactionId to prevent duplicates
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, remove any existing duplicates
    await queryInterface.sequelize.query(`
      DELETE FROM transactions a USING transactions b
      WHERE a.id > b.id 
      AND a."plaidTransactionId" = b."plaidTransactionId"
      AND a."plaidTransactionId" IS NOT NULL;
    `);

    // Add unique index on plaidTransactionId (only for non-null values)
    await queryInterface.addIndex('transactions', ['plaidTransactionId'], {
      unique: true,
      where: {
        plaidTransactionId: {
          [Sequelize.Op.ne]: null
        }
      },
      name: 'transactions_plaid_transaction_id_unique'
    });

    console.log('✅ Added unique constraint on plaidTransactionId');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('transactions', 'transactions_plaid_transaction_id_unique');
    console.log('✅ Removed unique constraint on plaidTransactionId');
  }
};
