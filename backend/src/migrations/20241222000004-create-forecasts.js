// Migration to create forecasts table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('forecasts', {
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
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      currentBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      projectedBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      forecastData: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('forecasts', ['userId']);
    await queryInterface.addIndex('forecasts', ['startDate', 'endDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('forecasts');
  }
};
