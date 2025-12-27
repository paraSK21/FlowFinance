const { Forecast, Account } = require('../models');
const improvedForecastService = require('../services/improvedForecastService');

exports.generateForecast = async (req, res) => {
  try {
    const { days = 90 } = req.body;

    // Get current balance
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true }
    });

    if (!accounts || accounts.length === 0) {
      return res.status(400).json({ 
        error: 'No accounts found',
        message: 'Please connect a bank account first'
      });
    }

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
        date: forecast.date,
        projectedIncome: parseFloat(forecast.projectedIncome) || 0,
        projectedExpenses: parseFloat(forecast.projectedExpenses) || 0,
        netCashFlow: parseFloat(forecast.netCashFlow) || 0,
        predictedBalance: parseFloat(runningBalance) || 0,
        incomeRange: {
          min: parseFloat(forecast.incomeRange?.min) || 0,
          max: parseFloat(forecast.incomeRange?.max) || 0
        },
        expenseRange: {
          min: parseFloat(forecast.expenseRange?.min) || 0,
          max: parseFloat(forecast.expenseRange?.max) || 0
        }
      };
    });

    // Calculate summary statistics
    const summary = {
      method: 'statistical_improved',
      recurringTransactions: result.recurringTransactions.length,
      dataPoints: result.analysis.dataPoints,
      projectedIncome: forecastData.reduce((sum, f) => sum + (parseFloat(f.projectedIncome) || 0), 0),
      projectedExpenses: forecastData.reduce((sum, f) => sum + (parseFloat(f.projectedExpenses) || 0), 0)
    };

    // Save forecast
    const forecast = await Forecast.create({
      userId: req.userId,
      startDate: new Date(),
      endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      forecastData,
      currentBalance: parseFloat(currentBalance) || 0,
      projectedBalance: parseFloat(runningBalance) || 0,
      metadata: summary
    });

    // Return properly structured response
    res.json({
      forecastData: forecastData,
      currentBalance: parseFloat(currentBalance) || 0,
      projectedBalance: parseFloat(runningBalance) || 0,
      summary: summary,
      recurringTransactions: result.recurringTransactions,
      analysis: {
        avgDailyIncome: parseFloat(result.analysis.avgDailyIncome) || 0,
        avgDailyExpenses: parseFloat(result.analysis.avgDailyExpenses) || 0,
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
