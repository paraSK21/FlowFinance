// ====================
// backend/src/models/Invoice.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
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
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientEmail: {
      type: DataTypes.STRING
    },
    clientPhone: {
      type: DataTypes.STRING
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'overdue', 'paid', 'cancelled'),
      defaultValue: 'draft'
    },
    description: {
      type: DataTypes.TEXT
    },
    lineItems: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    autoChaseEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastChaseDate: {
      type: DataTypes.DATE
    },
    chaseCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    paidDate: {
      type: DataTypes.DATE
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2)
    },
    notes: {
      type: DataTypes.TEXT
    },
    paymentLink: {
      type: DataTypes.STRING
    },
    stripePaymentLinkId: {
      type: DataTypes.STRING
    },
    stripePaymentId: {
      type: DataTypes.STRING
    },
    razorpayPaymentLinkId: {
      type: DataTypes.STRING
    },
    razorpayPaymentId: {
      type: DataTypes.STRING
    },
    refundAmount: {
      type: DataTypes.DECIMAL(15, 2)
    },
    refundDate: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    tableName: 'invoices'
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Invoice;
};
