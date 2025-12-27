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

      if (transactions.length < 3) {
        throw new Error('Insufficient transaction history. Need at least 3 transactions.');
      }

      console.log(`\n=== FORECAST GENERATION DEBUG ===`);
      console.log(`Total transactions: ${transactions.length}`);

      // Analyze patterns
      const analysis = this.analyzeTransactionPatterns(transactions);
      
      console.log(`Analysis period: ${analysis.totalDays} days`);
      console.log(`Total income in period: $${analysis.totalIncome.toFixed(2)}`);
      console.log(`Total expenses in period: $${analysis.totalExpenses.toFixed(2)}`);
      console.log(`Income transactions: ${analysis.incomeCount}`);
      console.log(`Expense transactions: ${analysis.expenseCount}`);
      console.log(`Avg daily income: $${analysis.avgDailyIncome.toFixed(2)}`);
      console.log(`Avg daily expenses: $${analysis.avgDailyExpenses.toFixed(2)}`);
      
      // Detect recurring transactions
      const recurringTxns = this.detectRecurringTransactions(transactions);
      
      console.log(`Recurring transactions detected: ${recurringTxns.length}`);
      
      // Generate daily forecasts
      const forecasts = this.generateDailyForecasts(
        analysis,
        recurringTxns,
        days
      );

      // Calculate totals for the forecast period
      const totalProjectedIncome = forecasts.reduce((sum, f) => sum + f.projectedIncome, 0);
      const totalProjectedExpenses = forecasts.reduce((sum, f) => sum + f.projectedExpenses, 0);
      const totalNetCashFlow = forecasts.reduce((sum, f) => sum + f.netCashFlow, 0);

      console.log(`\n=== ${days}-DAY FORECAST TOTALS ===`);
      console.log(`Total projected income: $${totalProjectedIncome.toFixed(2)}`);
      console.log(`Total projected expenses: $${totalProjectedExpenses.toFixed(2)}`);
      console.log(`Total net cash flow: $${totalNetCashFlow.toFixed(2)}`);
      console.log(`===================================\n`);

      return {
        forecasts,
        analysis,
        recurringTransactions: recurringTxns
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

    // Calculate number of days in the dataset
    const dates = cleanedTxns.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));

    const incomeCount = cleanedTxns.filter(t => t.type === 'income').length || 1;
    const expenseCount = cleanedTxns.filter(t => t.type === 'expense').length || 1;

    // FIXED: Calculate daily averages by dividing by days, not transaction count
    const avgDailyIncome = totalIncome / totalDays;
    const avgDailyExpenses = totalExpenses / totalDays;

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
      outlierCount: transactions.length - cleanedTxns.length,
      totalDays,
      incomeCount,
      expenseCount
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
   * Generate daily forecasts with ranges and business rules
   */
  generateDailyForecasts(analysis, recurringTxns, days) {
    const forecasts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`\n=== DAILY FORECAST GENERATION ===`);
    console.log(`Using avg daily income: $${analysis.avgDailyIncome.toFixed(2)}`);
    console.log(`Using avg daily expenses: $${analysis.avgDailyExpenses.toFixed(2)}`);
    console.log(`Historical period: ${analysis.totalDays} days`);
    console.log(`Forecasting for: ${days} days`);
    console.log(`Recurring transactions: ${recurringTxns.length}`);

    // Calculate standard deviations for ranges
    const incomeStdDev = this.calculateStandardDeviation(
      Object.values(analysis.dayOfWeekPatterns).flatMap(p => p.income)
    );
    const expenseStdDev = this.calculateStandardDeviation(
      Object.values(analysis.dayOfWeekPatterns).flatMap(p => p.expenses)
    );

    let totalForecastIncome = 0;
    let totalForecastExpenses = 0;
    let totalRecurringIncome = 0;
    let totalRecurringExpenses = 0;

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const dayOfMonth = forecastDate.getDate();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Base prediction from patterns (this already includes historical recurring transactions)
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

      // Business Rule: Reduce income prediction on weekends (B2B businesses)
      if (isWeekend) {
        predictedIncome *= 0.3; // 70% reduction on weekends
      }

      // FIXED: Only add recurring transactions if they're NOT already in the daily average
      // Check if this is a specific recurring transaction date
      let recurringIncomeToday = 0;
      let recurringExpensesToday = 0;
      
      recurringTxns.forEach(recurring => {
        const daysSinceNext = Math.round((forecastDate - recurring.nextDate) / (1000 * 60 * 60 * 24));
        
        // Check if this recurring transaction should occur on this date (±2 days tolerance)
        if (Math.abs(daysSinceNext) <= 2 || 
            (daysSinceNext > 0 && daysSinceNext % recurring.intervalDays <= 2)) {
          if (recurring.type === 'income') {
            recurringIncomeToday += recurring.amount;
          } else {
            recurringExpensesToday += recurring.amount;
          }
        }
      });

      // Only add recurring if it's significantly more than the daily average
      // (to avoid double-counting what's already in the average)
      if (recurringIncomeToday > analysis.avgDailyIncome * 2) {
        predictedIncome = recurringIncomeToday;
        totalRecurringIncome += recurringIncomeToday;
      }
      
      if (recurringExpensesToday > analysis.avgDailyExpenses * 2) {
        predictedExpenses = recurringExpensesToday;
        totalRecurringExpenses += recurringExpensesToday;
      }

      // Apply trend adjustment
      const trendFactor = 1 + (analysis.trend.incomeTrend * (i / days));
      predictedIncome *= trendFactor;
      predictedExpenses *= (1 + (analysis.trend.expenseTrend * (i / days)));

      totalForecastIncome += predictedIncome;
      totalForecastExpenses += predictedExpenses;

      // Calculate ranges using standard deviation (not random)
      const incomeRange = incomeStdDev * 0.5; // ±0.5 std dev for range
      const expenseRange = expenseStdDev * 0.5;

      forecasts.push({
        date: forecastDate,
        projectedIncome: Math.max(0, predictedIncome),
        projectedExpenses: Math.max(0, predictedExpenses),
        netCashFlow: predictedIncome - predictedExpenses,
        // Add ranges for uncertainty
        incomeRange: {
          min: Math.max(0, predictedIncome - incomeRange),
          max: predictedIncome + incomeRange
        },
        expenseRange: {
          min: Math.max(0, predictedExpenses - expenseRange),
          max: predictedExpenses + expenseRange
        }
      });
    }

    console.log(`Total forecast income (${days} days): $${totalForecastIncome.toFixed(2)}`);
    console.log(`Total forecast expenses (${days} days): $${totalForecastExpenses.toFixed(2)}`);
    console.log(`  - From recurring income: $${totalRecurringIncome.toFixed(2)}`);
    console.log(`  - From recurring expenses: $${totalRecurringExpenses.toFixed(2)}`);
    console.log(`Net forecast: $${(totalForecastIncome - totalForecastExpenses).toFixed(2)}`);
    console.log(`===================================\n`);

    return forecasts;
  }

  /**
   * Predict amount using weighted average of patterns (NO RANDOMNESS)
   */
  predictAmount(weekData, monthData, overallAvg) {
    // Prefer month-specific data (more reliable for recurring)
    if (monthData.length > 0) {
      return monthData.reduce((a, b) => a + b, 0) / monthData.length;
    }
    
    // Fall back to week data
    if (weekData.length > 0) {
      return weekData.reduce((a, b) => a + b, 0) / weekData.length;
    }

    // Fall back to overall average
    return overallAvg;
  }

  /**
   * Calculate standard deviation for range predictions
   */
  calculateStandardDeviation(amounts) {
    if (amounts.length < 2) return 0;

    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const squaredDiffs = amounts.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / amounts.length;
    return Math.sqrt(variance);
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
}

module.exports = new ImprovedForecastService();
