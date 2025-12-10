module.exports = (sequelize, DataTypes) => {
  const CategoryLearning = sequelize.define('CategoryLearning', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    transactionId: {
      type: DataTypes.UUID,
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    merchantToken: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Normalized merchant identifier or token extracted from narration'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User-corrected category'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Transaction amount for pattern matching'
    },
    correctedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'category_learnings',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'merchantToken']
      },
      {
        fields: ['userId', 'category']
      }
    ]
  });

  CategoryLearning.associate = (models) => {
    CategoryLearning.belongsTo(models.User, { foreignKey: 'userId' });
    CategoryLearning.belongsTo(models.Transaction, { foreignKey: 'transactionId' });
  };

  return CategoryLearning;
};
