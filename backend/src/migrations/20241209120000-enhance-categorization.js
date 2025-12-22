module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding
    const tableDescription = await queryInterface.describeTable('transactions');
    
    if (!tableDescription.categorizationMethod) {
      await queryInterface.addColumn('transactions', 'categorizationMethod', {
        type: Sequelize.STRING,
        comment: 'learned_pattern, rule_based, or ai_fallback'
      });
    }

    if (!tableDescription.needsReview) {
      await queryInterface.addColumn('transactions', 'needsReview', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'True if confidence is low and needs manual review'
      });
    }

    // Skip category_learnings table - using in-memory learning only
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns from transactions
    await queryInterface.removeColumn('transactions', 'categorizationMethod');
    await queryInterface.removeColumn('transactions', 'needsReview');
  }
};
