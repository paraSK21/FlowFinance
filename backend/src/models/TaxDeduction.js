// ====================
// backend/src/models/TaxDeduction.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const TaxDeduction = sequelize.define('TaxDeduction', {
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
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    taxYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    aiSuggested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    aiConfidence: {
      type: DataTypes.FLOAT
    },
    notes: {
      type: DataTypes.TEXT
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    timestamps: true,
    tableName: 'tax_deductions'
  });

  TaxDeduction.associate = (models) => {
    TaxDeduction.belongsTo(models.User, { foreignKey: 'userId' });
    TaxDeduction.belongsTo(models.Transaction, { foreignKey: 'transactionId' });
  };

  return TaxDeduction;
};
