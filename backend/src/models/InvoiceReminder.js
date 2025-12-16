// ====================
// backend/src/models/InvoiceReminder.js
// ====================
module.exports = (sequelize, DataTypes) => {
  const InvoiceReminder = sequelize.define('InvoiceReminder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    reminderType: {
      type: DataTypes.ENUM('before_due_3days', 'before_due_1day', 'on_due_date', 'overdue'),
      allowNull: false
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    sentAt: {
      type: DataTypes.DATE
    },
    errorMessage: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: true,
    tableName: 'invoice_reminders',
    indexes: [
      {
        fields: ['invoiceId']
      },
      {
        fields: ['scheduledDate', 'status']
      }
    ]
  });

  InvoiceReminder.associate = (models) => {
    InvoiceReminder.belongsTo(models.Invoice, { foreignKey: 'invoiceId' });
  };

  return InvoiceReminder;
};
