'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_reminders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      invoiceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'invoice_id'
      },
      reminderType: {
        type: Sequelize.ENUM('before_due_3days', 'before_due_1day', 'on_due_date', 'overdue'),
        allowNull: false,
        field: 'reminder_type'
      },
      scheduledDate: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'scheduled_date'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      sentAt: {
        type: Sequelize.DATE,
        field: 'sent_at'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        field: 'error_message'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    });

    // Add indexes
    await queryInterface.addIndex('invoice_reminders', ['invoice_id']);
    await queryInterface.addIndex('invoice_reminders', ['scheduled_date', 'status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invoice_reminders');
  }
};
