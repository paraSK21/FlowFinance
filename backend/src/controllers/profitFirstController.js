// ====================
// backend/src/controllers/profitFirstController.js
// ====================
const { User, Account, Transaction } = require('../models');
const { Op } = require('sequelize');

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    
    res.json({
      enabled: user.profitFirstEnabled,
      settings: user.profitFirstSettings
    });
  } catch (error) {
    console.error('Get Profit First settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { enabled, settings } = req.body;

    const user = await User.findByPk(req.userId);

    // Validate percentages add up to 100
    if (settings) {
      const total = Object.values(settings).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        return res.status(400).json({ 
          error: 'Percentages must add up to 100' 
        });
      }
    }

    await user.update({
      profitFirstEnabled: enabled !== undefined ? enabled : user.profitFirstEnabled,
      profitFirstSettings: settings || user.profitFirstSettings
    });

    res.json({
      enabled: user.profitFirstEnabled,
      settings: user.profitFirstSettings
    });
  } catch (error) {
    console.error('Update Profit First settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

exports.calculateSplits = async (req, res) => {
  try {
    const { amount } = req.query;
    const user = await User.findByPk(req.userId);

    if (!user.profitFirstEnabled) {
      return res.status(400).json({ 
        error: 'Profit First not enabled' 
      });
    }

    const totalAmount = parseFloat(amount);
    const settings = user.profitFirstSettings;

    const splits = {
      profit: (totalAmount * settings.profit) / 100,
      tax: (totalAmount * settings.tax) / 100,
      opex: (totalAmount * settings.opex) / 100
    };

    res.json({
      totalAmount,
      splits,
      percentages: settings
    });
  } catch (error) {
    console.error('Calculate splits error:', error);
    res.status(500).json({ error: 'Failed to calculate splits' });
  }
};

exports.getAccountBalances = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    // Get total balance
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true }
    });

    const totalBalance = accounts.reduce((sum, acc) => 
      sum + parseFloat(acc.currentBalance || 0), 0
    );

    // Calculate current allocation based on Profit First
    const settings = user.profitFirstSettings;
    const allocation = {
      profit: (totalBalance * settings.profit) / 100,
      tax: (totalBalance * settings.tax) / 100,
      opex: (totalBalance * settings.opex) / 100
    };

    res.json({
      totalBalance,
      allocation,
      percentages: settings
    });
  } catch (error) {
    console.error('Get account balances error:', error);
    res.status(500).json({ error: 'Failed to fetch account balances' });
  }
};

exports.simulateSplit = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    // Get income from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const income = await Transaction.sum('amount', {
      where: {
        userId: req.userId,
        type: 'income',
        date: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const totalIncome = Math.abs(income || 0);
    const settings = user.profitFirstSettings;

    const projectedSplits = {
      profit: (totalIncome * settings.profit) / 100,
      tax: (totalIncome * settings.tax) / 100,
      opex: (totalIncome * settings.opex) / 100
    };

    res.json({
      period: 'Last 30 days',
      totalIncome,
      projectedSplits,
      percentages: settings
    });
  } catch (error) {
    console.error('Simulate split error:', error);
    res.status(500).json({ error: 'Failed to simulate split' });
  }
};
