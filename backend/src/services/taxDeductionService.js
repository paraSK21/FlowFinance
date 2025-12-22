// Tax Deduction Service - Comprehensive US/Canada specific deduction rules
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
      notes: '50% deductible for business meals (was 100% in 2021-2022 temporarily)'
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
      notes: 'Business insurance premiums fully deductible. Health insurance for self-employed deductible on Form 1040.'
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
    education: {
      name: 'Education & Training',
      maxPercentage: 100,
      requiresReceipt: true,
      notes: 'Business-related education and training fully deductible'
    },
    bank_fees: {
      name: 'Bank Fees & Interest',
      maxPercentage: 100,
      requiresReceipt: false,
      notes: 'Business bank fees and loan interest fully deductible'
    },
    retirement: {
      name: 'Retirement Contributions',
      maxPercentage: 100,
      requiresReceipt: true,
      sepIraLimit: 66000, // 2024 limit
      solo401kLimit: 66000, // 2024 limit
      notes: 'SEP-IRA and Solo 401(k) contributions deductible up to limits'
    }
  },
  CA: {
    home_office: {
      name: 'Home Office',
      maxPercentage: 100,
      requiresReceipt: false,
      notes: 'Must be principal place of business or used exclusively for business. Calculate based on square footage.'
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

// Category to deduction type mapping
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
  'Operations': 'bank_fees'
};

class TaxDeductionService {
  // Weekly scan for missed deductions
  async weeklyDeductionScan(userId) {
    const user = await User.findByPk(userId);
    const country = user.taxSettings?.country || 'US';
    const lastScan = user.lastDeductionScan || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
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

      // Use AI to analyze if this is a deductible expense
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
      const deductibleAmount = deduction.amount * (rule.maxPercentage / 100);
      
      const newDeduction = await TaxDeduction.create({
        userId,
        transactionId: deduction.transaction.id,
        category: deduction.category,
        deductionType: deduction.deductionType,
        amount: deduction.amount,
        deductiblePercentage: rule.maxPercentage,
        actualDeductibleAmount: deductibleAmount,
        description: deduction.description,
        date: deduction.transaction.date,
        taxYear: new Date(deduction.transaction.date).getFullYear(),
        status: 'pending',
        aiSuggested: true,
        aiConfidence: deduction.confidence,
        scanSource: 'weekly_scan',
        notes: rule.notes
      });
      
      created.push(newDeduction);
    }

    // Update last scan date
    await user.update({ lastDeductionScan: new Date() });

    return {
      scanned: transactions.length,
      found: created.length,
      deductions: created,
      estimatedSavings: this.calculateEstimatedSavings(created, country)
    };
  }

  // Analyze transaction using AI
  async analyzeTransactionForDeduction(transaction, country) {
    // Use AI service to categorize
    const category = transaction.aiCategory || transaction.category;
    
    // Map to deduction types
    const deductionType = CATEGORY_TO_DEDUCTION_TYPE[category];
    
    if (!deductionType) {
      return {
        isDeductible: false,
        deductionType: null,
        category,
        confidence: 0,
        amount: transaction.amount,
        description: transaction.description || transaction.merchantName
      };
    }

    return {
      isDeductible: true,
      deductionType,
      category,
      confidence: transaction.aiCategoryConfidence || 0.7,
      amount: Math.abs(parseFloat(transaction.amount)),
      description: transaction.description || transaction.merchantName
    };
  }

  // Calculate estimated tax savings
  calculateEstimatedSavings(deductions, country) {
    const totalDeductible = deductions.reduce((sum, d) => 
      sum + parseFloat(d.actualDeductibleAmount || d.amount), 0
    );

    // Estimated tax rates
    const taxRate = country === 'US' ? 0.25 : 0.26; // Simplified average rates
    
    return {
      totalDeductions: totalDeductible,
      estimatedSavings: totalDeductible * taxRate,
      taxRate
    };
  }

  // Get deduction rules for country
  getDeductionRules(country) {
    return DEDUCTION_RULES[country] || DEDUCTION_RULES.US;
  }

  // Validate deduction
  validateDeduction(deduction, country) {
    const rules = DEDUCTION_RULES[country];
    const rule = rules[deduction.deductionType];
    
    if (!rule) {
      return { valid: false, error: 'Invalid deduction type' };
    }

    if (rule.requiresReceipt && !deduction.receiptUrl && !deduction.attachments?.length) {
      return { 
        valid: false, 
        warning: 'Receipt recommended for this deduction type',
        canProceed: true 
      };
    }

    return { valid: true };
  }

  // Generate tax report
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
      
      const amount = parseFloat(d.actualDeductibleAmount || d.amount);
      byCategory[type].items.push(d);
      byCategory[type].total += amount;
      totalDeductions += amount;
    });

    const user = await User.findByPk(userId);
    const country = user.taxSettings?.country || 'US';
    const savings = this.calculateEstimatedSavings(deductions, country);

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
