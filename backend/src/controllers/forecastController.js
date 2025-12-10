const { Forecast, Transaction, Account } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiCategorizationService');

exports.generateForecast = async (req, res) => {
  try {
    const { days = 90, useML = true } = req.body;

    // Get historical transactions (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        date: { [Op.gte]: sixMonthsAgo }
      },
      order: [['date', 'ASC']]
    });

    if (transactions.length < 5) {
      return res.status(400).json({ 
        error: 'Insufficient transaction history. Need at least 5 transactions to generate forecast.' 
      });
    }

    // Get current balance
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true }
    });

    const currentBalance = accounts.reduce((sum, acc) => 
      sum + parseFloat(acc.currentBalance || 0), 0
    );

    // Generate forecast using AI/ML
    const forecastData = await aiService.generateForecast(
      transactions,
      currentBalance,
      parseInt(days),
      useML
    );

    // Calculate summary statistics
    const summary = {
      method: forecastData[0]?.method || 'statistical',
      mlEnhanced: forecastData[0]?.method === 'ml_enhanced',
      averageConfidence: forecastData.reduce((sum, f) => sum + f.confidence, 0) / forecastData.length,
      projectedIncome: forecastData.reduce((sum, f) => sum + f.projectedIncome, 0),
      projectedExpenses: forecastData.reduce((sum, f) => sum + f.projectedExpenses, 0)
    };

    // Save forecast
    const forecast = await Forecast.create({
      userId: req.userId,
      startDate: new Date(),
      endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      forecastData,
      currentBalance,
      projectedBalance: forecastData[forecastData.length - 1].predictedBalance,
      metadata: summary
    });

    res.json({
      ...forecast.toJSON(),
      summary
    });
  } catch (error) {
    console.error('Generate forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast', message: error.message });
  }
};

exports.getForecasts = async (req, res) => {
  try {
    const forecasts = await Forecast.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json(forecasts);
  } catch (error) {
    console.error('Get forecasts error:', error);
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
};
