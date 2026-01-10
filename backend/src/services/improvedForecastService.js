// Improved Cash Flow Forecasting Service - Production Ready
// Uses deterministic statistical methods with proper recurring transaction detection
// No randomness, no double-counting, configurable business patterns

const { Transaction, User } = require('../models');
const { Op } = require('sequelize');

class ImprovedForecastService {
  /**
   * Generate cash flow forecast with improved logic
   */
  async generateForecast(userId, days = 90) {
    try {
      // Get user settings for business pattern configuration
      const user = await User.findByPk(userId);
      const businessSettings = user?.businessSettings || {};
      
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
      console.log(`Total income in period: ${this.safeFloat(analysis.totalIncome).toFixed(2)}`);
      console.log(`Total expenses in period: ${this.safeFloat(analysis.totalExpenses).toFixed(2)}`);
      console.log(`Income transactions: ${analysis.incomeCount}`);
      console.log(`Expense transactions: ${analysis.expenseCount}`);
      console.log(`Avg daily income: ${this.safeFloat(analysis.avgDailyIncome).toFixed(2)}`);
      console.log(`Avg daily expenses: ${this.safeFloat(analysis.avgDailyExpenses).toFixed(2)}`);
      
      // Detect recurring transactions
      const recurringTxns = this.detectRecurringTransactions(transactions);
      
      console.log(`Recurring transactions detected: ${recurringTxns.length}`);
      
      // Generate daily forecasts
      const forecasts = this.generateDailyForecasts(
        analysis,
        recurringTxns,
        days,
        businessSettings
      );

      // Calculate totals for the forecast period
      const totalProjectedIncome = forecasts.reduce((sum, f) => sum + this.safeFloat(f.projectedIncome), 0);
      const totalProjectedExpenses = forecasts.reduce((sum, f) => sum + this.safeFloat(f.projectedExpenses), 0);
      const totalNetCashFlow = forecasts.reduce((sum, f) => sum + this.safeFloat(f.netCashFlow), 0);

      console.log(`\n=== ${days}-DAY FORECAST TOTALS ===`);
      console.log(`Total projected income: ${totalProjectedIncome.toFixed(2)}`);
      console.log(`Total projected expenses: ${totalProjectedExpenses.toFixed(2)}`);
      console.log(`Total net cash flow: ${totalNetCashFlow.toFixed(2)}`);
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
   * Safe float conversion with null/undefined handling
   */
  safeFloat(value, defaultValue = 0) {
    if (value === null || value === undefined || isNaN(value)) {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
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
      const amount = Math.abs(this.safeFloat(txn.amount));
      const category = txn.aiCategory || txn.category || 'Other';
      // Plaid: positive = income, negative = expense
      const type = txn.amount > 0 ? 'income' : 'expense';

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
    // Plaid: positive amounts = income, negative amounts = expenses
    const totalIncome = cleanedTxns
      .filter(t => this.safeFloat(t.amount) > 0)
      .reduce((sum, t) => sum + this.safeFloat(t.amount), 0);
    
    const totalExpenses = cleanedTxns
      .filter(t => this.safeFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(this.safeFloat(t.amount)), 0);

    // Calculate number of days in the dataset
    const dates = cleanedTxns.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));

    const incomeCount = cleanedTxns.filter(t => this.safeFloat(t.amount) > 0).length || 1;
    const expenseCount = cleanedTxns.filter(t => this.safeFloat(t.amount) < 0).length || 1;

    // Calculate daily averages by dividing by days, not transaction count
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
      const amount = Math.abs(this.safeFloat(txn.amount));
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
   * Generate daily forecasts - DETERMINISTIC, NO RANDOMNESS, NO DOUBLE-COUNTING
   */
  generateDailyForecasts(analysis, recurringTxns, days, businessSettings = {}) {
    const forecasts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get business pattern settings (configurable per user)
    const weekendIncomeMultiplier = this.safeFloat(businessSettings.weekendIncomeMultiplier, 1.0);
    const weekendExpenseMultiplier = this.safeFloat(businessSettings.weekendExpenseMultiplier, 1.0);

    console.log(`\n=== DAILY FORECAST GENERATION ===`);
    console.log(`Using avg daily income: ${this.safeFloat(analysis.avgDailyIncome).toFixed(2)}`);
    console.log(`Using avg daily expenses: ${this.safeFloat(analysis.avgDailyExpenses).toFixed(2)}`);
    console.log(`Historical period: ${analysis.totalDays} days`);
    console.log(`Forecasting for: ${days} days`);
    console.log(`Recurring transactions: ${recurringTxns.length}`);
    console.log(`Weekend income multiplier: ${weekendIncomeMultiplier}`);

    // Calculate standard deviations for ranges (deterministic)
    const incomeStdDev = this.calculateStandardDeviation(
      Object.values(analysis.dayOfWeekPatterns).flatMap(p => p.income)
    );
    const expenseStdDev = this.calculateStandardDeviation(
      Object.values(analysis.dayOfWeekPatterns).flatMap(p => p.expenses)
    );

    // Track which recurring transactions we've already accounted for
    const recurringSchedule = this.buildRecurringSchedule(recurringTxns, days);

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const dayOfMonth = forecastDate.getDate();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateKey = forecastDate.toISOString().split('T')[0];

      // Base prediction from patterns (DETERMINISTIC - no randomness)
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

      // Apply configurable weekend multiplier (default 1.0 = no change)
      if (isWeekend) {
        predictedIncome *= weekendIncomeMultiplier;
        predictedExpenses *= weekendExpenseMultiplier;
      }

      // Check if there are specific recurring transactions on this date
      // IMPORTANT: Only add if they're significantly larger than daily average
      // This prevents double-counting since daily averages already include historical recurring
      const scheduledRecurring = recurringSchedule[dateKey] || { income: 0, expenses: 0 };
      
      // Only override if recurring amount is 3x larger than daily average (clear signal)
      if (scheduledRecurring.income > analysis.avgDailyIncome * 3) {
        predictedIncome = scheduledRecurring.income;
      }
      
      if (scheduledRecurring.expenses > analysis.avgDailyExpenses * 3) {
        predictedExpenses = scheduledRecurring.expenses;
      }

      // Apply trend adjustment (deterministic)
      const trendFactor = 1 + (this.safeFloat(analysis.trend.incomeTrend) * (i / days));
      predictedIncome *= trendFactor;
      predictedExpenses *= (1 + (this.safeFloat(analysis.trend.expenseTrend) * (i / days)));

      // Calculate ranges using standard deviation (deterministic)
      const incomeRange = incomeStdDev * 0.5; // ±0.5 std dev for range
      const expenseRange = expenseStdDev * 0.5;

      forecasts.push({
        date: forecastDate,
        projectedIncome: Math.max(0, predictedIncome),
        projectedExpenses: Math.max(0, predictedExpenses),
        netCashFlow: predictedIncome - predictedExpenses,
        // Add ranges for uncertainty (deterministic)
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

    return forecasts;
  }

  /**
   * Build a schedule of when recurring transactions should occur
   * This prevents double-counting by identifying specific dates
   */
  buildRecurringSchedule(recurringTxns, days) {
    const schedule = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    recurringTxns.forEach(recurring => {
      let currentDate = new Date(recurring.nextDate);
      
      // Schedule occurrences for the forecast period
      for (let i = 0; i < days; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() + i + 1);
        
        // Check if recurring transaction should occur on this date (±2 days tolerance)
        const daysDiff = Math.abs((checkDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 2) {
          const dateKey = checkDate.toISOString().split('T')[0];
          
          if (!schedule[dateKey]) {
            schedule[dateKey] = { income: 0, expenses: 0 };
          }
          
          if (recurring.type === 'income') {
            schedule[dateKey].income += recurring.amount;
          } else {
            schedule[dateKey].expenses += recurring.amount;
          }
          
          // Move to next occurrence
          currentDate.setDate(currentDate.getDate() + recurring.intervalDays);
        }
      }
    });

    return schedule;
  }

  /**
   * Predict amount using weighted average of patterns (DETERMINISTIC - NO RANDOMNESS)
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
   * Calculate standard deviation for range predictions (deterministic)
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

    const amounts = transactions.map(t => Math.abs(this.safeFloat(t.amount))).sort((a, b) => a - b);
    
    const q1Index = Math.floor(amounts.length * 0.25);
    const q3Index = Math.floor(amounts.length * 0.75);
    const q1 = amounts[q1Index];
    const q3 = amounts[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);
    
    return transactions.filter(t => {
      const amount = Math.abs(this.safeFloat(t.amount));
      return amount >= lowerBound && amount <= upperBound;
    });
  }

  /**
   * Calculate trend (growth/decline) - deterministic
   */
  calculateTrend(transactions) {
    if (transactions.length < 10) {
      return { incomeTrend: 0, expenseTrend: 0 };
    }

    const midPoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midPoint);
    const secondHalf = transactions.slice(midPoint);

    // Plaid: positive amounts = income, negative amounts = expenses
    const firstIncome = firstHalf
      .filter(t => this.safeFloat(t.amount) > 0)
      .reduce((sum, t) => sum + this.safeFloat(t.amount), 0);
    
    const secondIncome = secondHalf
      .filter(t => this.safeFloat(t.amount) > 0)
      .reduce((sum, t) => sum + this.safeFloat(t.amount), 0);
    
    const firstExpense = firstHalf
      .filter(t => this.safeFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(this.safeFloat(t.amount)), 0);
    
    const secondExpense = secondHalf
      .filter(t => this.safeFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(this.safeFloat(t.amount)), 0);

    const incomeTrend = firstIncome > 0 ? (secondIncome - firstIncome) / firstIncome : 0;
    const expenseTrend = firstExpense > 0 ? (secondExpense - firstExpense) / firstExpense : 0;

    return {
      incomeTrend: Math.max(-0.3, Math.min(0.3, incomeTrend)),
      expenseTrend: Math.max(-0.3, Math.min(0.3, expenseTrend))
    };
  }
}

module.exports = new ImprovedForecastService();
