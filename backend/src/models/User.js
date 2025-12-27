// ====================
// backend/src/models/User.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Allow null for Google OAuth users
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paypalSubscriptionId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    subscriptionPlan: {
      type: DataTypes.STRING,
      defaultValue: 'free' // free, pro, enterprise
    },
    subscriptionStatus: {
      type: DataTypes.STRING,
      allowNull: true // active, cancelled, past_due, etc.
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    trialStartedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    businessName: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    profitFirstEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    profitFirstSettings: {
      type: DataTypes.JSONB,
      defaultValue: {
        profit: 10,
        tax: 15,
        opex: 75
      }
    },
    taxSettings: {
      type: DataTypes.JSONB,
      defaultValue: {
        country: 'US',
        state: null,
        province: null,
        defaultTaxRate: 0,
        taxId: null,
        businessType: 'sole_proprietor',
        fiscalYearEnd: '12-31',
        weeklyDeductionScan: true,
        deductionCategories: []
      }
    },
    lastDeductionScan: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        sms: false,
        whatsapp: false
      }
    },
    onboardingCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    tableName: 'users'
  });

  User.associate = (models) => {
    User.hasMany(models.Account, { foreignKey: 'userId', as: 'accounts' });
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    User.hasMany(models.Invoice, { foreignKey: 'userId', as: 'invoices' });
    User.hasMany(models.Forecast, { foreignKey: 'userId', as: 'forecasts' });
  };

  return User;
};
