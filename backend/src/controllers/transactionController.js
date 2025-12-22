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
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0);

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

exports.correctCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const transaction = await Transaction.findOne({
      where: { id, userId: req.userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldCategory = transaction.aiCategory || transaction.category;

    // Update transaction
    await transaction.update({
      category,
      aiCategory: category,
      aiCategoryConfidence: 0.95,
      categorizationMethod: 'learned_pattern',
      needsReview: false
    });

    // Learn from correction
    const aiService = require('../services/aiCategorizationService');
    await aiService.learnFromCorrection(id, transaction, category, req.userId);

    res.json({
      success: true,
      transaction,
      message: `Category updated from "${oldCategory}" to "${category}" and pattern learned`
    });
  } catch (error) {
    console.error('Correct category error:', error);
    res.status(500).json({ error: 'Failed to correct category' });
  }
};

exports.getLowConfidenceTransactions = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const where = {
      userId: req.userId,
      needsReview: true
    };

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
    console.error('Get low confidence transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions needing review' });
  }
};

exports.bulkRecategorize = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const where = { userId: req.userId };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const transactions = await Transaction.findAll({ where });
    const aiService = require('../services/aiCategorizationService');

    let updated = 0;
    for (const txn of transactions) {
      const result = await aiService.categorizeTransaction(
        txn.description,
        txn.merchantName,
        txn.amount,
        req.userId,
        txn.type
      );

      await txn.update({
        aiCategory: result.category,
        aiCategoryConfidence: result.confidence,
        categorizationMethod: result.method,
        needsReview: result.confidence < 0.75
      });

      updated++;
    }

    res.json({
      success: true,
      message: `Recategorized ${updated} transactions`,
      updated
    });
  } catch (error) {
    console.error('Bulk recategorize error:', error);
    res.status(500).json({ error: 'Failed to recategorize transactions' });
  }
};

exports.getLearnedPatterns = async (req, res) => {
  try {
    const aiService = require('../services/aiCategorizationService');
    const patterns = await aiService.getUserLearnedPatterns(req.userId);

    res.json({
      patterns,
      total: patterns.length
    });
  } catch (error) {
    console.error('Get learned patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch learned patterns' });
  }
};

exports.deleteLearnedPattern = async (req, res) => {
  try {
    const { merchantToken } = req.params;
    const aiService = require('../services/aiCategorizationService');
    
    const result = await aiService.deleteLearnedPattern(req.userId, merchantToken);

    if (result.success) {
      res.json({ success: true, message: 'Pattern deleted successfully' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Delete learned pattern error:', error);
    res.status(500).json({ error: 'Failed to delete pattern' });
  }
};
