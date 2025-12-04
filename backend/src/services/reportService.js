/**
 * Report Service - Generate Financial Reports
 * Provides comprehensive financial analytics and reporting
 */

const { Transaction, Invoice, Account, InventoryItem } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class ReportService {
  /**
   * Generate Profit & Loss Report
   */
  async generateProfitLossReport(userId, startDate, endDate) {
    try {
      const transactions = await Transaction.findAll({
        where: {
          userId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const invoices = await Invoice.findAll({
        where: {
          userId,
          status: 'paid',
          paidAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      // Calculate revenue
      const revenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      // Calculate expenses by category
      const expensesByCategory = {};
      let totalExpenses = 0;

      transactions.forEach(txn => {
        if (txn.amount < 0) {
          const category = txn.category || 'Uncategorized';
          expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(txn.amount);
          totalExpenses += Math.abs(txn.amount);
        }
      });

      const netProfit = revenue - totalExpenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        period: { startDate, endDate },
        revenue,
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategory
        },
        netProfit,
        profitMargin: profitMargin.toFixed(2),
        invoiceCount: invoices.length,
        transactionCount: transactions.length
      };
    } catch (error) {
      console.error('Error generating P&L report:', error);
      throw error;
    }
  }

  /**
   * Generate Cash Flow Report
   */
  async generateCashFlowReport(userId, startDate, endDate) {
    try {
      const transactions = await Transaction.findAll({
        where: {
          userId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['date', 'ASC']]
      });

      const accounts = await Account.findAll({
        where: { userId }
      });

      const openingBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

      let runningBalance = openingBalance;
      const dailyCashFlow = {};
      let totalInflow = 0;
      let totalOutflow = 0;

      transactions.forEach(txn => {
        const date = txn.date.toISOString().split('T')[0];
        
        if (!dailyCashFlow[date]) {
          dailyCashFlow[date] = { inflow: 0, outflow: 0, net: 0 };
        }

        if (txn.amount > 0) {
          dailyCashFlow[date].inflow += txn.amount;
          totalInflow += txn.amount;
        } else {
          dailyCashFlow[date].outflow += Math.abs(txn.amount);
          totalOutflow += Math.abs(txn.amount);
        }

        dailyCashFlow[date].net = dailyCashFlow[date].inflow - dailyCashFlow[date].outflow;
        runningBalance += txn.amount;
      });

      return {
        period: { startDate, endDate },
        openingBalance,
        closingBalance: runningBalance,
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow,
        dailyCashFlow,
        averageDailyBalance: runningBalance / Object.keys(dailyCashFlow).length || 0
      };
    } catch (error) {
      console.error('Error generating cash flow report:', error);
      throw error;
    }
  }

  /**
   * Generate Sales Report
   */
  async generateSalesReport(userId, startDate, endDate) {
    try {
      const invoices = await Invoice.findAll({
        where: {
          userId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const totalSales = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const unpaidInvoices = invoices.filter(inv => inv.status === 'pending');
      const overdueInvoices = invoices.filter(inv => 
        inv.status === 'pending' && new Date(inv.dueDate) < new Date()
      );

      const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      // Calculate average payment time
      const paymentTimes = paidInvoices
        .filter(inv => inv.paidAt)
        .map(inv => {
          const issued = new Date(inv.createdAt);
          const paid = new Date(inv.paidAt);
          return Math.floor((paid - issued) / (1000 * 60 * 60 * 24));
        });

      const avgPaymentTime = paymentTimes.length > 0
        ? paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length
        : 0;

      return {
        period: { startDate, endDate },
        totalInvoices: invoices.length,
        totalSales,
        paid: {
          count: paidInvoices.length,
          amount: totalPaid,
          percentage: ((paidInvoices.length / invoices.length) * 100).toFixed(2)
        },
        unpaid: {
          count: unpaidInvoices.length,
          amount: totalUnpaid
        },
        overdue: {
          count: overdueInvoices.length,
          amount: totalOverdue
        },
        averageInvoiceValue: totalSales / invoices.length || 0,
        averagePaymentTime: avgPaymentTime.toFixed(1),
        collectionRate: ((totalPaid / totalSales) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('Error generating sales report:', error);
      throw error;
    }
  }

  /**
   * Generate Expense Report
   */
  async generateExpenseReport(userId, startDate, endDate) {
    try {
      const expenses = await Transaction.findAll({
        where: {
          userId,
          amount: { [Op.lt]: 0 },
          date: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const totalExpenses = expenses.reduce((sum, exp) => sum + Math.abs(exp.amount), 0);

      // Group by category
      const byCategory = {};
      expenses.forEach(exp => {
        const category = exp.category || 'Uncategorized';
        if (!byCategory[category]) {
          byCategory[category] = { count: 0, amount: 0, transactions: [] };
        }
        byCategory[category].count++;
        byCategory[category].amount += Math.abs(exp.amount);
        byCategory[category].transactions.push({
          date: exp.date,
          description: exp.description,
          amount: Math.abs(exp.amount)
        });
      });

      // Calculate percentages
      Object.keys(byCategory).forEach(category => {
        byCategory[category].percentage = ((byCategory[category].amount / totalExpenses) * 100).toFixed(2);
      });

      // Top expenses
      const topExpenses = expenses
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 10)
        .map(exp => ({
          date: exp.date,
          description: exp.description,
          category: exp.category,
          amount: Math.abs(exp.amount)
        }));

      return {
        period: { startDate, endDate },
        totalExpenses,
        transactionCount: expenses.length,
        averageExpense: totalExpenses / expenses.length || 0,
        byCategory,
        topExpenses
      };
    } catch (error) {
      console.error('Error generating expense report:', error);
      throw error;
    }
  }

  /**
   * Generate Inventory Report
   */
  async generateInventoryReport(userId) {
    try {
      const items = await InventoryItem.findAll({
        where: { userId }
      });

      const totalValue = items.reduce((sum, item) => 
        sum + (parseFloat(item.unitPrice) * item.quantity), 0
      );

      const lowStockItems = items.filter(item => 
        item.quantity <= item.reorderPoint
      );

      const outOfStockItems = items.filter(item => item.quantity === 0);

      const byCategory = {};
      items.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!byCategory[category]) {
          byCategory[category] = { count: 0, value: 0, quantity: 0 };
        }
        byCategory[category].count++;
        byCategory[category].value += parseFloat(item.unitPrice) * item.quantity;
        byCategory[category].quantity += item.quantity;
      });

      return {
        totalItems: items.length,
        totalValue,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        lowStockItems: lowStockItems.length,
        outOfStockItems: outOfStockItems.length,
        byCategory,
        averageItemValue: totalValue / items.length || 0,
        alerts: {
          lowStock: lowStockItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            reorderPoint: item.reorderPoint
          })),
          outOfStock: outOfStockItems.map(item => ({
            name: item.name,
            sku: item.sku
          }))
        }
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw error;
    }
  }

  /**
   * Generate Tax Summary Report
   */
  async generateTaxSummaryReport(userId, year) {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const transactions = await Transaction.findAll({
        where: {
          userId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const invoices = await Invoice.findAll({
        where: {
          userId,
          status: 'paid',
          paidAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      // Calculate quarterly breakdown
      const quarters = {
        Q1: { revenue: 0, expenses: 0 },
        Q2: { revenue: 0, expenses: 0 },
        Q3: { revenue: 0, expenses: 0 },
        Q4: { revenue: 0, expenses: 0 }
      };

      invoices.forEach(inv => {
        const month = new Date(inv.paidAt).getMonth();
        const quarter = `Q${Math.floor(month / 3) + 1}`;
        quarters[quarter].revenue += parseFloat(inv.total);
      });

      transactions.forEach(txn => {
        if (txn.amount < 0) {
          const month = new Date(txn.date).getMonth();
          const quarter = `Q${Math.floor(month / 3) + 1}`;
          quarters[quarter].expenses += Math.abs(txn.amount);
        }
      });

      const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const totalExpenses = transactions
        .filter(txn => txn.amount < 0)
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

      return {
        year,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        quarters,
        estimatedTaxLiability: (totalRevenue - totalExpenses) * 0.25 // 25% estimate
      };
    } catch (error) {
      console.error('Error generating tax summary:', error);
      throw error;
    }
  }

  /**
   * Generate Dashboard Summary
   */
  async generateDashboardSummary(userId) {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [recentTransactions, pendingInvoices, accounts] = await Promise.all([
        Transaction.findAll({
          where: {
            userId,
            date: { [Op.gte]: thirtyDaysAgo }
          },
          order: [['date', 'DESC']],
          limit: 10
        }),
        Invoice.findAll({
          where: {
            userId,
            status: 'pending'
          }
        }),
        Account.findAll({
          where: { userId }
        })
      ]);

      const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      return {
        totalBalance,
        pendingInvoices: {
          count: pendingInvoices.length,
          amount: pendingAmount
        },
        recentActivity: recentTransactions.length,
        accountsConnected: accounts.length
      };
    } catch (error) {
      console.error('Error generating dashboard summary:', error);
      throw error;
    }
  }
}

module.exports = new ReportService();
