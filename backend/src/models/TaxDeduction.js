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
    deductionType: {
      type: DataTypes.ENUM(
        'home_office', 'vehicle', 'meals', 'travel', 'supplies',
        'software', 'equipment', 'professional_fees', 'advertising',
        'insurance', 'utilities', 'rent', 'depreciation', 'other'
      ),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    deductiblePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100.00
    },
    actualDeductibleAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
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
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    scanSource: {
      type: DataTypes.ENUM('manual', 'weekly_scan', 'transaction_sync', 'receipt_upload'),
      defaultValue: 'manual'
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
