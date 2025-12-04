// ====================
// backend/src/models/InventoryItem.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const InventoryItem = sequelize.define('InventoryItem', {
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
    sku: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    costPrice: {
      type: DataTypes.DECIMAL(15, 2)
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(15, 2)
    },
    category: {
      type: DataTypes.STRING
    },
    location: {
      type: DataTypes.STRING
    },
    supplier: {
      type: DataTypes.STRING
    },
    lastRestocked: {
      type: DataTypes.DATE
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'inventory_items'
  });

  InventoryItem.associate = (models) => {
    InventoryItem.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return InventoryItem;
};
