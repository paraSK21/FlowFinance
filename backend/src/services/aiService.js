// ====================
// backend/src/services/aiService.js
// ====================
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');

const hf = process.env.HUGGINGFACE_API_KEY 
  ? new HfInference(process.env.HUGGINGFACE_API_KEY) 
  : null;

class AIService {
  constructor() {
    this.categories = [
      'Meals & Entertainment',
      'Operations',
      'Revenue',
      'Marketing',
      'Utilities',
      'Office Supplies',
      'Travel',
      'Professional Services',
      'Inventory',
      'Payroll',
      'Rent',
      'Insurance',
      'Taxes',
      'Other'
    ];
  }

  async categorizeTransaction(description, merchantName, amount) {
    try {
      // Use Hugging Face Inference API (Free tier available)
      if (hf) {
        return await this.categorizeWithHuggingFace(description, merchantName, amount);
      }
      
      // Fallback to rule-based categorization
      return this.ruleBasedCategorization(description, merchantName, amount);
    } catch (error) {
      console.error('AI categorization error:', error);
      return this.ruleBasedCategorization(description, merchantName, amount);
    }
  }

  async categorizeWithHuggingFace(description, merchantName, amount) {
    try {
      const prompt = `Categorize this business transaction into one of these categories: ${this.categories.join(', ')}.

Transaction: "${description}"
Merchant: "${merchantName}"
Amount: $${amount}

Respond with only the category name, nothing else.`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        inputs: prompt,
        parameters: {
          max_new_tokens: 20,
          temperature: 0.3,
          return_full_text: false
        }
      });

      const category = response.generated_text.trim();
      
      // Validate category
      const matchedCategory = this.categories.find(c => 
        category.toLowerCase().includes(c.toLowerCase())
      );

      return {
        category: matchedCategory || 'Other',
        confidence: matchedCategory ? 0.85 : 0.5,
        method: 'ai'
      };
    } catch (error) {
      console.error('Hugging Face categorization error:', error);
      return this.ruleBasedCategorization(description, merchantName, amount);
    }
  }

  ruleBasedCategorization(description, merchantName, amount) {
    const text = `${description} ${merchantName}`.toLowerCase();
    
    const rules = {
      'Revenue': ['payment', 'deposit', 'invoice', 'sale', 'income'],
      'Meals & Entertainment': ['restaurant', 'cafe', 'coffee', 'dinner', 'lunch', 'starbucks', 'food'],
      'Operations': ['supplies', 'equipment', 'office', 'amazon', 'staples'],
      'Marketing': ['advertising', 'facebook ads', 'google ads', 'marketing', 'promotion'],
      'Utilities': ['electric', 'power', 'water', 'internet', 'phone', 'verizon', 'at&t'],
      'Travel': ['hotel', 'flight', 'uber', 'lyft', 'airbnb', 'travel', 'fuel', 'gas'],
      'Professional Services': ['legal', 'accounting', 'consulting', 'attorney', 'lawyer'],
      'Payroll': ['salary', 'wage', 'payroll', 'gusto', 'adp'],
      'Rent': ['rent', 'lease', 'property'],
      'Insurance': ['insurance', 'premium'],
      'Taxes': ['tax', 'irs', 'state tax']
    };

    for (const [category, keywords] of Object.entries(rules)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return {
          category,
          confidence: 0.75,
          method: 'rules'
        };
      }
    }

    // Amount-based heuristics
    if (amount < 0) {  // Income
      return { category: 'Revenue', confidence: 0.6, method: 'rules' };
    }

    return { category: 'Other', confidence: 0.4, method: 'rules' };
  }

  async generateForecast(transactions, currentBalance, days = 90) {
    try {
      // Analyze historical patterns
      const analysis = this.analyzeTransactionPatterns(transactions);
      
      // Generate daily forecasts
      const forecasts = [];
      let runningBalance = currentBalance;

      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);

        // Predict cash flow for this day
        const prediction = this.predictDailyCashFlow(
          forecastDate,
          analysis,
          transactions
        );

        runningBalance += prediction.netCashFlow;

        forecasts.push({
          date: forecastDate,
          predictedBalance: runningBalance,
          projectedIncome: prediction.income,
          projectedExpenses: prediction.expenses,
          confidence: prediction.confidence
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Forecast generation error:', error);
      throw error;
    }
  }

  analyzeTransactionPatterns(transactions) {
    const dayOfWeekPatterns = {};
    const monthlyAverages = { income: 0, expenses: 0 };
    const recurringTransactions = [];

    // Group by day of week
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const dayOfWeek = date.getDay();

      if (!dayOfWeekPatterns[dayOfWeek]) {
        dayOfWeekPatterns[dayOfWeek] = { income: [], expenses: [] };
      }

      if (txn.type === 'income') {
        dayOfWeekPatterns[dayOfWeek].income.push(txn.amount);
        monthlyAverages.income += parseFloat(txn.amount);
      } else {
        dayOfWeekPatterns[dayOfWeek].expenses.push(txn.amount);
        monthlyAverages.expenses += parseFloat(txn.amount);
      }
    });

    // Calculate averages
    const txnCount = transactions.length || 1;
    monthlyAverages.income /= txnCount;
    monthlyAverages.expenses /= txnCount;

    // Find recurring transactions
    const merchantFrequency = {};
    transactions.forEach(txn => {
      const key = `${txn.merchantName}-${txn.amount}`;
      merchantFrequency[key] = (merchantFrequency[key] || 0) + 1;
    });

    Object.entries(merchantFrequency).forEach(([key, count]) => {
      if (count >= 2) {
        const [merchant, amount] = key.split('-');
        recurringTransactions.push({ merchant, amount: parseFloat(amount), frequency: count });
      }
    });

    return {
      dayOfWeekPatterns,
      monthlyAverages,
      recurringTransactions
    };
  }

  predictDailyCashFlow(date, analysis, recentTransactions) {
    const dayOfWeek = date.getDay();
    const patterns = analysis.dayOfWeekPatterns[dayOfWeek] || { income: [], expenses: [] };

    // Calculate average for this day of week
    const avgIncome = patterns.income.length > 0
      ? patterns.income.reduce((a, b) => a + b, 0) / patterns.income.length
      : analysis.monthlyAverages.income;

    const avgExpenses = patterns.expenses.length > 0
      ? patterns.expenses.reduce((a, b) => a + b, 0) / patterns.expenses.length
      : analysis.monthlyAverages.expenses;

    // Add randomness and trending
    const variance = 0.15;
    const income = avgIncome * (1 + (Math.random() - 0.5) * variance);
    const expenses = avgExpenses * (1 + (Math.random() - 0.5) * variance);

    // Confidence based on data availability
    const dataPoints = patterns.income.length + patterns.expenses.length;
    const confidence = Math.min(0.95, 0.5 + (dataPoints / 100));

    return {
      income,
      expenses,
      netCashFlow: income - expenses,
      confidence
    };
  }

  async findTaxDeductions(transactions) {
    const potentialDeductions = [];
    
    const deductibleCategories = {
      'Meals & Entertainment': { rate: 0.5, description: '50% deductible business meals' },
      'Operations': { rate: 1.0, description: '100% deductible operating expenses' },
      'Marketing': { rate: 1.0, description: '100% deductible advertising' },
      'Utilities': { rate: 1.0, description: '100% deductible utilities' },
      'Office Supplies': { rate: 1.0, description: '100% deductible supplies' },
      'Travel': { rate: 1.0, description: '100% deductible business travel' },
      'Professional Services': { rate: 1.0, description: '100% deductible professional fees' },
      'Insurance': { rate: 1.0, description: '100% deductible business insurance' }
    };

    transactions.forEach(txn => {
      const category = txn.aiCategory || txn.category;
      
      if (deductibleCategories[category] && txn.type === 'expense') {
        const deduction = deductibleCategories[category];
        const deductibleAmount = parseFloat(txn.amount) * deduction.rate;

        potentialDeductions.push({
          transactionId: txn.id,
          category,
          amount: deductibleAmount,
          originalAmount: txn.amount,
          description: `${txn.description} - ${deduction.description}`,
          date: txn.date,
          confidence: txn.aiCategoryConfidence || 0.7
        });
      }
    });

    return potentialDeductions;
  }
}

module.exports = new AIService();
