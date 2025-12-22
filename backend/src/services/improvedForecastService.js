// Improved Cash Flow Forecasting Service
// Uses statistical methods with proper recurring transaction detection

const { Transaction } = require('../models');
const { Op } = require('sequelize');

class ImprovedForecastService {
  /**
   * Generate cash flow forecast with improved logic
   */
  async generateForecast(userId, days = 90) {
    try {
      // Get historical transactions (last 6 months minimum)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const transactions = await Transaction.findAll({
        where: {
          userId,
          date: { [Op.gte]: sixMonthsAgo }
        },
        order: [['date', 'ASC']]
      });

      if (transactions.length < 10) {
        throw new Error('Insufficient transaction history. Need at least 10 transactions.');
      }

      // Analyze patterns
      const analysis = this.analyzeTransactionPatterns(transactions);
      
      // Detect recurring transactions
      const recurringTxns = this.detectRecurringTransactions(transactions);
      
      // Generate daily forecasts
      const forecasts = this.generateDailyForecasts(
        analysis,
        recurringTxns,
        days
      );

      return {
        forecasts,
        analysis,
        recurringTransactions: recurringTxns,
        confidence: this.calculateOverallConfidence(analysis, recurringTxns)
      };
    } catch (error) {
      console.error('Forecast generation error:', error);
      throw error;
    }
  }

  /**
   * Analyze transaction patterns with outlier removal
   */
  analyzeTransactionPatterns(transactions) {
    // Remove outliers first
    const cleanedTxns = this.removeOutliers(transactions);

    // Group by day of week and day of month
    const dayOfWeekPatterns = {};
    const dayOfMonthPatterns = {};
    const categoryPatterns = {};

    cleanedTxns.forEach(txn => {
      const date = new Date(txn.date);
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();
      const amount = Math.abs(parseFloat(txn.amount));
      const category = txn.aiCategory || txn.category || 'Other';
      const type = txn.type;

      // Day of week patterns
      if (!dayOfWeekPatterns[dayOfWeek]) {
        dayOfWeekPatterns[dayOfWeek] = { income: [], expenses: [] };
      }
      if (type === 'income') {
        dayOfWeekPatterns[dayOfWeek].income.push(amount);
      } else {
        dayOfWeekPatterns[dayOfWeek].expenses.push(amount);
      }

      // Day of month patterns (for recurring bills)
      if (!dayOfMonthPatterns[dayOfMonth]) {
        dayOfMonthPatterns[dayOfMonth] = { income: [], expenses: [] };
      }
      if (type === 'income') {
        dayOfMonthPatterns[dayOfMonth].income.push(amount);
      } else {
        dayOfMonthPatterns[dayOfMonth].expenses.push(amount);
      }

      // Category patterns
      if (!categoryPatterns[category]) {
        categoryPatterns[category] = { amounts: [], count: 0 };
      }
      categoryPatterns[category].amounts.push(amount);
      categoryPatterns[category].count++;
    });

    // Calculate averages
    const totalIncome = cleanedTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const totalExpenses = cleanedTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const incomeCount = cleanedTxns.filter(t => t.type === 'income').length || 1;
    const expenseCount = cleanedTxns.filter(t => t.type === 'expense').length || 1;

    const avgDailyIncome = totalIncome / incomeCount;
    const avgDailyExpenses = totalExpenses / expenseCount;

    // Calculate trend
    const trend = this.calculateTrend(cleanedTxns);

    return {
      dayOfWeekPatterns,
      dayOfMonthPatterns,
      categoryPatterns,
      avgDailyIncome,
      avgDailyExpenses,
      totalIncome,
      totalExpenses,
      trend,
      dataPoints: cleanedTxns.length,
      outlierCount: transactions.length - cleanedTxns.length
    };
  }

  /**
   * Detect recurring transactions (rent, subscriptions, payroll, etc.)
   */
  detectRecurringTransactions(transactions) {
    const recurring = [];
    const merchantAmountMap = {};

    // Group by merchant and similar amounts
    transactions.forEach(txn => {
      const merchant = (txn.merchantName || txn.description || '').toLowerCase().trim();
      const amount = Math.abs(parseFloat(txn.amount));
      const key = `${merchant}_${Math.round(amount)}`;

      if (!merchantAmountMap[key]) {
        merchantAmountMap[key] = [];
      }
      merchantAmountMap[key].push({
        date: new Date(txn.date),
        amount,
        merchant,
        type: txn.type,
        category: txn.aiCategory || txn.category
      });
    });

    // Find patterns (2+ occurrences)
    Object.entries(merchantAmountMap).forEach(([key, txns]) => {
      if (txns.length >= 2) {
        // Calculate average interval between transactions
        const sortedDates = txns.map(t => t.date).sort((a, b) => a - b);
        const intervals = [];
        
        for (let i = 1; i < sortedDates.length; i++) {
          const daysDiff = Math.round((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
          intervals.push(daysDiff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;

        // Classify as recurring if interval is consistent (±7 days)
        const isConsistent = intervals.every(interval => 
          Math.abs(interval - avgInterval) <= 7
        );

        if (isConsistent) {
          // Determine frequency
          let frequency = 'unknown';
          if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
          else if (avgInterval >= 12 && avgInterval <= 16) frequency = 'biweekly';
          else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'weekly';
          else if (avgInterval >= 85 && avgInterval <= 95) frequency = 'quarterly';

          // Predict next occurrence
          const lastDate = sortedDates[sortedDates.length - 1];
          const nextDate = new Date(lastDate);
          nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

          recurring.push({
            merchant: txns[0].merchant,
            amount: avgAmount,
            type: txns[0].type,
            category: txns[0].category,
            frequency,
            intervalDays: Math.round(avgInterval),
            occurrences: txns.length,
            lastDate,
            nextDate,
            confidence: Math.min(0.95, 0.6 + (txns.length * 0.1))
          });
        }
      }
    });

    return recurring.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Generate daily forecasts
   */
  generateDailyForecasts(analysis, recurringTxns, days) {
    const forecasts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const dayOfMonth = forecastDate.getDate();

      // Base prediction from patterns
      let predictedIncome = this.predictAmount(
        analysis.dayOfWeekPatterns[dayOfWeek]?.income || [],
        analysis.dayOfMonthPatterns[dayOfMonth]?.income || [],
        analysis.avgDailyIncome
      );

      let predictedExpenses = this.predictAmount(
        analysis.dayOfWeekPatterns[dayOfWeek]?.expenses || [],
        analysis.dayOfMonthPatterns[dayOfMonth]?.expenses || [],
        analysis.avgDailyExpenses
      );

      // Add recurring transactions
      recurringTxns.forEach(recurring => {
        const daysSinceNext = Math.round((forecastDate - recurring.nextDate) / (1000 * 60 * 60 * 24));
        
        // Check if this recurring transaction should occur on this date (±2 days tolerance)
        if (Math.abs(daysSinceNext) <= 2 || 
            (daysSinceNext > 0 && daysSinceNext % recurring.intervalDays <= 2)) {
          if (recurring.type === 'income') {
            predictedIncome += recurring.amount;
          } else {
            predictedExpenses += recurring.amount;
          }
        }
      });

      // Apply trend adjustment
      const trendFactor = 1 + (analysis.trend.incomeTrend * (i / days));
      predictedIncome *= trendFactor;
      predictedExpenses *= (1 + (analysis.trend.expenseTrend * (i / days)));

      // Calculate confidence (decreases over time)
      const baseConfidence = Math.min(0.90, 0.5 + (analysis.dataPoints / 100));
      const timeDecay = Math.max(0.5, 1 - (i / (days * 2)));
      const confidence = baseConfidence * timeDecay;

      forecasts.push({
        date: forecastDate,
        projectedIncome: Math.max(0, predictedIncome),
        projectedExpenses: Math.max(0, predictedExpenses),
        netCashFlow: predictedIncome - predictedExpenses,
        confidence: Math.max(0.3, Math.min(0.95, confidence))
      });
    }

    return forecasts;
  }

  /**
   * Predict amount using weighted average of patterns
   */
  predictAmount(weekData, monthData, overallAvg) {
    // Prefer month-specific data (more reliable for recurring)
    if (monthData.length > 0) {
      const avg = monthData.reduce((a, b) => a + b, 0) / monthData.length;
      const volatility = this.calculateVolatility(monthData);
      return avg * (1 + (Math.random() - 0.5) * volatility);
    }
    
    // Fall back to week data
    if (weekData.length > 0) {
      const avg = weekData.reduce((a, b) => a + b, 0) / weekData.length;
      const volatility = this.calculateVolatility(weekData);
      return avg * (1 + (Math.random() - 0.5) * volatility);
    }

    // Fall back to overall average
    return overallAvg * (1 + (Math.random() - 0.5) * 0.2);
  }

  /**
   * Remove outliers using IQR method
   */
  removeOutliers(transactions) {
    if (transactions.length < 10) return transactions;

    const amounts = transactions.map(t => Math.abs(parseFloat(t.amount))).sort((a, b) => a - b);
    
    const q1Index = Math.floor(amounts.length * 0.25);
    const q3Index = Math.floor(amounts.length * 0.75);
    const q1 = amounts[q1Index];
    const q3 = amounts[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);
    
    return transactions.filter(t => {
      const amount = Math.abs(parseFloat(t.amount));
      return amount >= lowerBound && amount <= upperBound;
    });
  }

  /**
   * Calculate trend (growth/decline)
   */
  calculateTrend(transactions) {
    if (transactions.length < 10) {
      return { incomeTrend: 0, expenseTrend: 0 };
    }

    const midPoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midPoint);
    const secondHalf = transactions.slice(midPoint);

    const firstIncome = firstHalf
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const secondIncome = secondHalf
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const firstExpense = firstHalf
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const secondExpense = secondHalf
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const incomeTrend = firstIncome > 0 ? (secondIncome - firstIncome) / firstIncome : 0;
    const expenseTrend = firstExpense > 0 ? (secondExpense - firstExpense) / firstExpense : 0;

    return {
      incomeTrend: Math.max(-0.3, Math.min(0.3, incomeTrend)),
      expenseTrend: Math.max(-0.3, Math.min(0.3, expenseTrend))
    };
  }

  /**
   * Calculate volatility (coefficient of variation)
   */
  calculateVolatility(amounts) {
    if (amounts.length < 2) return 0.2;

    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const squaredDiffs = amounts.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    const volatility = mean > 0 ? stdDev / mean : 0.2;
    return Math.min(0.4, volatility);
  }

  /**
   * Calculate overall forecast confidence
   */
  calculateOverallConfidence(analysis, recurringTxns) {
    let confidence = 0.5;

    // More data points = higher confidence
    if (analysis.dataPoints > 50) confidence += 0.2;
    else if (analysis.dataPoints > 20) confidence += 0.1;

    // Recurring transactions = higher confidence
    if (recurringTxns.length > 5) confidence += 0.15;
    else if (recurringTxns.length > 2) confidence += 0.1;

    // Stable trend = higher confidence
    if (Math.abs(analysis.trend.incomeTrend) < 0.1 && 
        Math.abs(analysis.trend.expenseTrend) < 0.1) {
      confidence += 0.1;
    }

    return Math.min(0.90, confidence);
  }
}

module.exports = new ImprovedForecastService();
