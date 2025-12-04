const { Transaction } = require('../models');
const { Op } = require('sequelize');

exports.getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type, category, limit = 100, offset = 0 } = req.query;
    const where = { userId: req.userId };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      transactions,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({
      where: { id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, notes } = req.body;

    const transaction = await Transaction.findOne({
      where: { id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.update({
      category: category || transaction.category,
      notes: notes !== undefined ? notes : transaction.notes
    });

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { userId: req.userId };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const transactions = await Transaction.findAll({ where });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    res.json({
      income,
      expenses,
      netCashFlow: income - expenses,
      transactionCount: transactions.length
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
