const { Forecast, Transaction, Account } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');

exports.generateForecast = async (req, res) => {
  try {
    const { days = 90 } = req.body;

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

    // Get current balance
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true }
    });

    const currentBalance = accounts.reduce((sum, acc) => 
      sum + parseFloat(acc.currentBalance || 0), 0
    );

    // Generate forecast using AI
    const forecastData = await aiService.generateForecast(
      transactions,
      currentBalance,
      parseInt(days)
    );

    // Save forecast
    const forecast = await Forecast.create({
      userId: req.userId,
      startDate: new Date(),
      endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      forecastData,
      currentBalance,
      projectedBalance: forecastData[forecastData.length - 1].predictedBalance
    });

    res.json(forecast);
  } catch (error) {
    console.error('Generate forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
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
