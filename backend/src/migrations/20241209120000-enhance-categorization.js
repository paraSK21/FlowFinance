module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to transactions table
    await queryInterface.addColumn('transactions', 'categorizationMethod', {
      type: Sequelize.STRING,
      comment: 'learned_pattern, rule_based, or ai_fallback'
    });

    await queryInterface.addColumn('transactions', 'needsReview', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'True if confidence is low and needs manual review'
    });

    // Create category_learnings table
    await queryInterface.createTable('category_learnings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      transactionId: {
        type: Sequelize.UUID,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      merchantToken: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Normalized merchant identifier or token extracted from narration'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'User-corrected category'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Transaction amount for pattern matching'
      },
      correctedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique index on userId + merchantToken
    await queryInterface.addIndex('category_learnings', ['userId', 'merchantToken'], {
      unique: true,
      name: 'category_learnings_user_merchant_unique'
    });

    // Add index on userId + category
    await queryInterface.addIndex('category_learnings', ['userId', 'category'], {
      name: 'category_learnings_user_category_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns from transactions
    await queryInterface.removeColumn('transactions', 'categorizationMethod');
    await queryInterface.removeColumn('transactions', 'needsReview');

    // Drop category_learnings table
    await queryInterface.dropTable('category_learnings');
  }
};
