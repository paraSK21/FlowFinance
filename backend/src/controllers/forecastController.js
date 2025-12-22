const { Forecast, Account } = require('../models');
const improvedForecastService = require('../services/improvedForecastService');

exports.generateForecast = async (req, res) => {
  try {
    const { days = 90 } = req.body;

    // Get current balance
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true }
    });

    const currentBalance = accounts.reduce((sum, acc) => 
      sum + parseFloat(acc.currentBalance || 0), 0
    );

    // Generate forecast using improved service
    const result = await improvedForecastService.generateForecast(req.userId, parseInt(days));

    // Calculate running balance
    let runningBalance = currentBalance;
    const forecastData = result.forecasts.map(forecast => {
      runningBalance += forecast.netCashFlow;
      return {
        ...forecast,
        predictedBalance: runningBalance
      };
    });

    // Calculate summary statistics
    const summary = {
      method: 'statistical_improved',
      confidence: result.confidence,
      recurringTransactions: result.recurringTransactions.length,
      dataPoints: result.analysis.dataPoints,
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
      projectedBalance: runningBalance,
      metadata: summary
    });

    res.json({
      ...forecast.toJSON(),
      summary,
      recurringTransactions: result.recurringTransactions,
      analysis: {
        avgDailyIncome: result.analysis.avgDailyIncome,
        avgDailyExpenses: result.analysis.avgDailyExpenses,
        trend: result.analysis.trend
      }
    });
  } catch (error) {
    console.error('Generate forecast error:', error);
    res.status(500).json({ 
      error: 'Failed to generate forecast', 
      message: error.message 
    });
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
