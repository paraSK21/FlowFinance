// ====================
// backend/src/models/Forecast.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const Forecast = sequelize.define('Forecast', {
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
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    projectedBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    forecastData: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    confidence: {
      type: DataTypes.FLOAT
    },
    modelVersion: {
      type: DataTypes.STRING,
      defaultValue: '1.0'
    }
  }, {
    timestamps: true,
    tableName: 'forecasts'
  });

  Forecast.associate = (models) => {
    Forecast.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Forecast;
};
