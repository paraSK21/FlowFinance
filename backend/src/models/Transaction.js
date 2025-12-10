// ====================
// backend/src/models/Transaction.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
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
    accountId: {
      type: DataTypes.UUID,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    plaidTransactionId: {
      type: DataTypes.STRING
    },
    setuTransactionId: {
      type: DataTypes.STRING
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    },
    merchantName: {
      type: DataTypes.STRING
    },
    category: {
      type: DataTypes.STRING
    },
    aiCategory: {
      type: DataTypes.STRING
    },
    aiCategoryConfidence: {
      type: DataTypes.FLOAT
    },
    categorizationMethod: {
      type: DataTypes.STRING,
      comment: 'learned_pattern, rule_based, or ai_fallback'
    },
    needsReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'True if confidence is low and needs manual review'
    },
    subcategory: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false
    },
    pending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    timestamps: true,
    tableName: 'transactions'
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: 'userId' });
    Transaction.belongsTo(models.Account, { foreignKey: 'accountId' });
  };

  return Transaction;
};
