// Tax Deduction Service - Production Ready for US/Canada
// Comprehensive deduction rules with proper validation and progressive tax rates

const { TaxDeduction, Transaction, User } = require('../models');
const { Op } = require('sequelize');
const aiService = require('./aiCategorizationService');

// IRS/CRA approved deduction categories with detailed rules
const DEDUCTION_RULES = {
  US: {
    home_office: {
      name: 'Home Office',
      maxPercentage: 100,
      requiresReceipt: false,
      simplifiedRate: 5, // $5 per square foot
      maxSquareFeet: 300,
      notes: 'Must be used exclusively and regularly for business. Simplified method: $5/sqft up to 300 sqft.'
    },
    vehicle: {
      name: 'Vehicle Expenses',
      maxPercentage: 100,
      standardMileageRate: 0.67, // 2024 IRS rate (67¢/mile)
      requiresReceipt: true,
      notes: 'Track business vs personal use. Standard mileage rate or actual expenses.'
    },
    meals: {
      name: 'Business Meals',
      maxPercentage: 50,
      requiresReceipt: true,
      notes: '50% deductible for business meals'
    },
    travel: {
      name: 'Business Travel',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Lodging, airfare, car rental 100% deductible. Meals 50%.'
    },
    supplies: {
      name: 'Office Supplies',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Fully deductible if used for business'
    },
    software: {
      name: 'Software & Subscriptions',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business software and SaaS subscriptions fully deductible'
    },
    equipment: {
      name: 'Equipment & Machinery',
      maxPercentage: 100,
      requiresReceipt: true,
      section179Limit: 1160000, // 2024 limit
      notes: 'Section 179 allows immediate expensing up to $1,160,000. Otherwise depreciate.'
    },
    professional_fees: {
      name: 'Professional Fees',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Legal, accounting, consulting fees fully deductible'
    },
    advertising: {
      name: 'Advertising & Marketing',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'All advertising and marketing expenses fully deductible'
    },
    insurance: {
      name: 'Business Insurance',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business insurance premiums fully deductible.'
    },
    utilities: {
      name: 'Utilities',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business portion of utilities fully deductible'
    },
    rent: {
      name: 'Rent & Lease',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business rent and equipment leases fully deductible'
    },
    payroll: {
      name: 'Payroll & Wages',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Employee wages and payroll taxes fully deductible'
    },
    taxes: {
      name: 'Business Taxes',
      maxPercentage: 100,
      requiresReceipt: false,
      notes: 'State and local business taxes deductible (not federal income tax)'
    }
  },
  CA: {
    home_office: {
      name: 'Home Office',
      maxPercentage: 100,
      requiresReceipt: false,
      notes: 'Must be principal place of business or used exclusively for business.'
    },
    vehicle: {
      name: 'Vehicle Expenses',
      maxPercentage: 100,
      requiresReceipt: true,
      reasonablePerKm: 0.68, // 2024 CRA rate (68¢/km)
      notes: 'Track business vs personal kilometers. Reasonable per-km rate or actual expenses.'
    },
    meals: {
      name: 'Business Meals',
      maxPercentage: 50,
      requiresReceipt: true,
      notes: '50% deductible for business meals and entertainment'
    },
    travel: {
      name: 'Business Travel',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Lodging, airfare, car rental 100% deductible. Meals 50%.'
    },
    supplies: {
      name: 'Office Supplies',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Fully deductible if used for business'
    },
    software: {
      name: 'Software & Subscriptions',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business software and subscriptions fully deductible'
    },
    equipment: {
      name: 'Equipment & Machinery',
      maxPercentage: 100,
      requiresReceipt: true,
      ccaClasses: true,
      notes: 'Capital Cost Allowance (CCA) - depreciate over time based on asset class'
    },
    professional_fees: {
      name: 'Professional Fees',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Legal, accounting, consulting fees fully deductible'
    },
    advertising: {
      name: 'Advertising & Marketing',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'All advertising and marketing expenses fully deductible'
    },
    insurance: {
      name: 'Business Insurance',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business insurance premiums fully deductible'
    },
    utilities: {
      name: 'Utilities',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business portion of utilities fully deductible'
    },
    rent: {
      name: 'Rent & Lease',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business rent and equipment leases fully deductible'
    },
    payroll: {
      name: 'Payroll & Wages',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Employee wages and payroll taxes fully deductible'
    },
    gst_hst: {
      name: 'GST/HST Input Tax Credits',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Claim GST/HST paid on business expenses as input tax credits'
    },
    cpp: {
      name: 'CPP Contributions',
      maxPercentage: 50,
      requiresReceipt: false,
      notes: 'Self-employed can deduct employer portion of CPP contributions'
    }
  }
};

// Complete category to deduction type mapping
const CATEGORY_TO_DEDUCTION_TYPE = {
  'Office Supplies': 'supplies',
  'Software': 'software',
  'Travel': 'travel',
  'Meals & Entertainment': 'meals',
  'Marketing': 'advertising',
  'Utilities': 'utilities',
  'Professional Services': 'professional_fees',
  'Rent': 'rent',
  'Insurance': 'insurance',
  'Operations': 'equipment', // General operations can include equipment
  'Payroll': 'payroll',
  'Taxes': 'taxes'
};

// US Federal Tax Brackets 2024 (Single Filer)
const US_TAX_BRACKETS_2024 = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 }
];

// Canada Federal Tax Brackets 2024
const CA_TAX_BRACKETS_2024 = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 }
];

class TaxDeductionService {
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
   * Calculate progressive tax rate based on income
   */
  calculateProgressiveTaxRate(income, country) {
    const brackets = country === 'US' ? US_TAX_BRACKETS_2024 : CA_TAX_BRACKETS_2024;
    let totalTax = 0;
    let remainingIncome = income;

    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      const bracketSize = bracket.max - bracket.min;
      
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracketSize);
      totalTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return income > 0 ? totalTax / income : 0;
  }

  /**
   * Weekly scan for missed deductions
   */
  async weeklyDeductionScan(userId) {
    const user = await User.findByPk(userId);
    const country = user?.taxSettings?.country || 'US';
    const lastScan = user?.lastDeductionScan || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get transactions since last scan
    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: { [Op.gte]: lastScan },
        type: 'expense'
      }
    });

    const potentialDeductions = [];
    
    for (const transaction of transactions) {
      // Check if already categorized as deduction
      const existing = await TaxDeduction.findOne({
        where: { transactionId: transaction.id }
      });
      
      if (existing) continue;

      // Analyze if this is a deductible expense
      const analysis = await this.analyzeTransactionForDeduction(transaction, country);
      
      if (analysis.isDeductible) {
        potentialDeductions.push({
          transaction,
          ...analysis
        });
      }
    }

    // Create pending deductions
    const created = [];
    for (const deduction of potentialDeductions) {
      const rule = DEDUCTION_RULES[country][deduction.deductionType];
      if (!rule) continue;
      
      const deductibleAmount = this.safeFloat(deduction.amount) * (rule.maxPercentage / 100);
      
      const newDeduction = await TaxDeduction.create({
        userId,
        transactionId: deduction.transaction.id,
        category: deduction.category,
        deductionType: deduction.deductionType,
        amount: this.safeFloat(deduction.amount),
        deductiblePercentage: rule.maxPercentage,
        actualDeductibleAmount: deductibleAmount,
        description: deduction.description,
        date: deduction.transaction.date,
        taxYear: new Date(deduction.transaction.date).getFullYear(),
        status: 'pending',
        aiSuggested: true,
        aiConfidence: this.safeFloat(deduction.confidence),
        scanSource: 'weekly_scan',
        notes: rule.notes
      });
      
      created.push(newDeduction);
    }

    // Update last scan date
    await user.update({ lastDeductionScan: new Date() });

    // Calculate estimated income for progressive tax calculation
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearIncome = await Transaction.sum('amount', {
      where: {
        userId,
        type: 'income',
        date: { [Op.gte]: yearStart }
      }
    });

    return {
      scanned: transactions.length,
      found: created.length,
      deductions: created,
      estimatedSavings: this.calculateEstimatedSavings(created, country, this.safeFloat(yearIncome))
    };
  }

  /**
   * Analyze transaction using AI and rules
   */
  async analyzeTransactionForDeduction(transaction, country) {
    const category = transaction.aiCategory || transaction.category;
    
    // Map to deduction types
    const deductionType = CATEGORY_TO_DEDUCTION_TYPE[category];
    
    if (!deductionType) {
      return {
        isDeductible: false,
        deductionType: null,
        category,
        confidence: 0,
        amount: this.safeFloat(transaction.amount),
        description: transaction.description || transaction.merchantName
      };
    }

    // Validate against rules
    const rules = DEDUCTION_RULES[country];
    const rule = rules[deductionType];
    
    if (!rule) {
      return {
        isDeductible: false,
        deductionType: null,
        category,
        confidence: 0,
        amount: this.safeFloat(transaction.amount),
        description: transaction.description || transaction.merchantName
      };
    }

    return {
      isDeductible: true,
      deductionType,
      category,
      confidence: this.safeFloat(transaction.aiCategoryConfidence, 0.7),
      amount: Math.abs(this.safeFloat(transaction.amount)),
      description: transaction.description || transaction.merchantName
    };
  }

  /**
   * Calculate estimated tax savings using progressive tax rates
   */
  calculateEstimatedSavings(deductions, country, estimatedIncome = 75000) {
    const totalDeductible = deductions.reduce((sum, d) => 
      sum + this.safeFloat(d.actualDeductibleAmount || d.amount), 0
    );

    // Calculate marginal tax rate based on estimated income
    const marginalRate = this.calculateProgressiveTaxRate(estimatedIncome, country);
    
    // Add state/provincial average (simplified)
    const stateProvincialRate = country === 'US' ? 0.05 : 0.10; // Average rates
    const effectiveRate = marginalRate + stateProvincialRate;
    
    return {
      totalDeductions: totalDeductible,
      estimatedSavings: totalDeductible * effectiveRate,
      marginalTaxRate: marginalRate,
      effectiveTaxRate: effectiveRate,
      estimatedIncome
    };
  }

  /**
   * Get deduction rules for country
   */
  getDeductionRules(country) {
    return DEDUCTION_RULES[country] || DEDUCTION_RULES.US;
  }

  /**
   * Validate deduction with proper checks
   */
  validateDeduction(deduction, country) {
    const rules = DEDUCTION_RULES[country];
    if (!rules) {
      return { valid: false, error: 'Invalid country code' };
    }
    
    const rule = rules[deduction.deductionType];
    
    if (!rule) {
      return { valid: false, error: 'Invalid deduction type' };
    }

    if (rule.requiresReceipt && !deduction.receiptUrl && !deduction.attachments?.length) {
      return { 
        valid: false, 
        warning: 'Receipt required for this deduction type',
        canProceed: false 
      };
    }

    return { valid: true };
  }

  /**
   * Generate tax report with progressive tax calculations
   */
  async generateTaxReport(userId, taxYear) {
    const deductions = await TaxDeduction.findAll({
      where: {
        userId,
        taxYear,
        status: 'approved'
      },
      include: [{ model: Transaction }]
    });

    const byCategory = {};
    let totalDeductions = 0;

    deductions.forEach(d => {
      const type = d.deductionType || 'other';
      if (!byCategory[type]) {
        byCategory[type] = {
          name: type,
          items: [],
          total: 0
        };
      }
      
      const amount = this.safeFloat(d.actualDeductibleAmount || d.amount);
      byCategory[type].items.push(d);
      byCategory[type].total += amount;
      totalDeductions += amount;
    });

    const user = await User.findByPk(userId);
    const country = user?.taxSettings?.country || 'US';
    
    // Get year income for progressive tax calculation
    const yearStart = new Date(taxYear, 0, 1);
    const yearEnd = new Date(taxYear, 11, 31);
    const yearIncome = await Transaction.sum('amount', {
      where: {
        userId,
        type: 'income',
        date: { [Op.between]: [yearStart, yearEnd] }
      }
    });

    const savings = this.calculateEstimatedSavings(deductions, country, this.safeFloat(yearIncome));

    return {
      taxYear,
      totalDeductions,
      byCategory,
      deductionCount: deductions.length,
      ...savings
    };
  }
}

module.exports = new TaxDeductionService();
