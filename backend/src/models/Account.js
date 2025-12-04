// ====================
// backend/src/models/Account.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
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
    plaidAccessToken: {
      type: DataTypes.STRING
    },
    plaidItemId: {
      type: DataTypes.STRING
    },
    setuConsentId: {
      type: DataTypes.STRING
    },
    setuAccountId: {
      type: DataTypes.STRING
    },
    provider: {
      type: DataTypes.STRING,
      defaultValue: 'plaid',
      comment: 'plaid for US/CA banks, setu for Indian banks'
    },
    institutionId: {
      type: DataTypes.STRING
    },
    institutionName: {
      type: DataTypes.STRING
    },
    accountId: {
      type: DataTypes.STRING
    },
    accountName: {
      type: DataTypes.STRING
    },
    accountType: {
      type: DataTypes.STRING
    },
    accountSubtype: {
      type: DataTypes.STRING
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    availableBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastSynced: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    tableName: 'accounts'
  });

  Account.associate = (models) => {
    Account.belongsTo(models.User, { foreignKey: 'userId' });
    Account.hasMany(models.Transaction, { foreignKey: 'accountId' });
  };

  return Account;
};
