/**
 * Expense Management Service
 * Track and categorize business expenses
 */

const { Transaction } = require('../models');
const { Op } = require('sequelize');

class ExpenseService {
  /**
   * Create expense
   */
  async createExpense(userId, expenseData) {
    try {
      const expense = await Transaction.create({
        userId,
        amount: -Math.abs(expenseData.amount), // Ensure negative
        description: expenseData.description,
        category: expenseData.category,
        date: expenseData.date || new Date(),
        merchant: expenseData.merchant,
        paymentMethod: expenseData.paymentMethod,
        receiptUrl: expenseData.receiptUrl,
        isExpense: true,
        tags: expenseData.tags || []
      });

      return expense;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Get expenses with filters
   */
  async getExpenses(userId, filters = {}) {
    try {
      const where = {
        userId,
        amount: { [Op.lt]: 0 }
      };

      if (filters.startDate && filters.endDate) {
        where.date = {
          [Op.between]: [filters.startDate, filters.endDate]
        };
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.merchant) {
        where.merchant = { [Op.like]: `%${filters.merchant}%` };
      }

      const expenses = await Transaction.findAll({
        where,
        order: [['date', 'DESC']]
      });

      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Get expense categories
   */
  async getCategories(userId) {
    try {
      const expenses = await Transaction.findAll({
        where: {
          userId,
          amount: { [Op.lt]: 0 }
        },
        attributes: ['category'],
        group: ['category']
      });

      return expenses.map(e => e.category).filter(Boolean);
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }
}

module.exports = new ExpenseService();
