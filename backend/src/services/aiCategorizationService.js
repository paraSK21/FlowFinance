const { HfInference } = require('@huggingface/inference');
const axios = require('axios');

class AICategorizationService {
  constructor() {
    this.hf = process.env.HUGGINGFACE_API_KEY 
      ? new HfInference(process.env.HUGGINGFACE_API_KEY) 
      : null;

    this.categories = [
      'Revenue',
      'Meals & Entertainment',
      'Operations',
      'Marketing',
      'Utilities',
      'Travel',
      'Professional Services',
      'Payroll',
      'Rent',
      'Insurance',
      'Taxes',
      'Inventory',
      'Office Supplies',
      'Other'
    ];

    // In-memory cache for learned patterns (loaded from DB on startup)
    this.merchantPatterns = new Map();
    this.categoryKeywords = this.buildCategoryKeywords();
    this.merchantMappings = this.buildMerchantMappings();
  }

  buildCategoryKeywords() {
    return {
      'Revenue': ['payout', 'settlement', 'sales', 'stripe', 'razorpay payout', 'cashfree settlement', 
                  'customer payment', 'invoice paid', 'payment received', 'credit', 'deposit', 'income'],
      'Meals & Entertainment': ['zomato', 'swiggy', 'dominos', 'starbucks', 'café', 'cafe', 'restaurant', 
                                'diner', 'food', 'pizza', 'burger', 'mcdonald', 'kfc', 'subway', 'dunkin'],
      'Operations': ['maintenance', 'repair', 'equipment', 'machinery', 'tools', 'hardware', 'software license'],
      'Marketing': ['amazon ads', 'meta ads', 'google ads', 'facebook ads', 'instagram ads', 'linkedin ads',
                    'campaign', 'ad spend', 'advertising', 'promotion', 'marketing', 'seo', 'sem'],
      'Utilities': ['electricity bill', 'electric', 'power', 'water bill', 'wifi', 'broadband', 'internet',
                    'mobile recharge', 'jio', 'airtel', 'vodafone', 'vi', 'bsnl', 'gas bill', 'lpg'],
      'Travel': ['uber', 'ola', 'rapido', 'airline', 'indigo', 'spicejet', 'air india', 'vistara', 'irctc',
                 'flight', 'hotel', 'booking.com', 'makemytrip', 'goibibo', 'oyo', 'treebo', 'toll', 'parking'],
      'Professional Services': ['consulting', 'consultant', 'ca fees', 'chartered accountant', 'legal fees',
                                'lawyer', 'attorney', 'audit', 'freelancer', 'contractor invoice', 'advisory'],
      'Payroll': ['salary', 'payroll', 'wages', 'stipend', 'employee', 'staff payment', 'bonus', 'incentive'],
      'Rent': ['rent', 'lease', 'landlord', 'property rent', 'office rent', 'warehouse rent'],
      'Insurance': ['insurance', 'premium', 'policy', 'lic', 'hdfc life', 'icici lombard', 'bajaj allianz',
                    'star health', 'max life', 'sbi life'],
      'Taxes': ['tax', 'tds', 'tds payment', 'advance tax', 'gst payment', 'gst', 'income tax', 'itr'],
      'Inventory': ['supplier', 'vendor', 'wholesale', 'stock purchase', 'raw material', 'goods'],
      'Office Supplies': ['notebook', 'stationery', 'printer ink', 'pens', 'office chair', 'desk', 'paper',
                          'stapler', 'file', 'folder']
    };
  }

  buildMerchantMappings() {
    return {
      // IT/Electronics Equipment -> Inventory or Operations
      'Inventory': ['lenovo', 'dell', 'hp', 'croma', 'reliance digital', 'asus', 'acer', 'apple store',
                    'samsung', 'lg', 'sony', 'flipkart', 'amazon india'],
      // Food Delivery
      'Meals & Entertainment': ['zomato', 'swiggy', 'dominos', 'pizza hut', 'starbucks', 'mcdonald',
                                'kfc', 'subway', 'burger king', 'dunkin donuts'],
      // Advertising Platforms
      'Marketing': ['meta', 'facebook', 'instagram', 'google ads', 'linkedin', 'twitter ads'],
      // Travel Services
      'Travel': ['uber', 'ola', 'rapido', 'indigo', 'spicejet', 'air india', 'vistara', 'irctc',
                 'makemytrip', 'goibibo', 'oyo', 'treebo', 'booking.com'],
      // Telecom & Utilities
      'Utilities': ['jio', 'airtel', 'vodafone', 'vi', 'bsnl', 'tata sky', 'dish tv', 'hathway'],
      // Insurance Companies
      'Insurance': ['lic', 'hdfc life', 'icici lombard', 'bajaj allianz', 'star health', 'max life', 'sbi life'],
      // Payment Gateways (Revenue)
      'Revenue': ['razorpay', 'stripe', 'cashfree', 'paytm', 'phonepe', 'instamojo']
    };
  }

  /**
   * Three-Tier Categorization Pipeline: User Corrections → Rules → AI Fallback
   */
  async categorizeTransaction(description, merchantName, amount, userId = null, transactionType = null) {
    try {
      // Normalize inputs
      const normalizedDesc = (description || '').toLowerCase().trim();
      const normalizedMerchant = (merchantName || '').toLowerCase().trim();
      
      // Parse UPI/IMPS/NEFT narrations to extract merchant tokens
      const parsedData = this.parseIndianPaymentNarration(normalizedDesc, normalizedMerchant);
      const merchantTokens = parsedData.merchantTokens;
      const cleanNarration = parsedData.cleanNarration;

      // TIER 1: User Correction Memory (Highest Priority - Hard Override)
      const learnedCategory = await this.checkLearnedPatterns(merchantTokens, amount, userId);
      if (learnedCategory) {
        return {
          category: learnedCategory.category,
          confidence: 0.95,
          method: 'learned_pattern',
          matchedToken: learnedCategory.matchedToken
        };
      }

      // TIER 2: Rule-Based Engine (Fast & Deterministic)
      const ruleResult = this.ruleBasedCategorization(
        cleanNarration, 
        merchantTokens, 
        amount, 
        transactionType
      );
      if (ruleResult.confidence >= 0.85) {
        return ruleResult;
      }

      // TIER 3: AI/LLM Fallback (Only if rules are not confident)
      if (this.hf) {
        const llmResult = await this.llmCategorization(cleanNarration, merchantTokens.join(' '), amount);
        if (llmResult.confidence >= 0.70) {
          return llmResult;
        }
      }

      // Final fallback to rule result (even if low confidence)
      return ruleResult;
    } catch (error) {
      console.error('Categorization error:', error);
      return { category: 'Other', confidence: 0.3, method: 'error' };
    }
  }

  /**
   * Parse Indian UPI/IMPS/NEFT narrations to extract merchant info
   * Example: "UPI/34345345/LENOVO_STORE@icici/LENOVO DLR" -> ["lenovo", "lenovo_store"]
   */
  parseIndianPaymentNarration(description, merchantName) {
    const tokens = new Set();
    const combined = `${description} ${merchantName}`;
    
    // Extract UPI VPA handles (e.g., LENOVO_STORE@icici)
    const vpaMatch = combined.match(/([a-z0-9_]+)@[a-z]+/gi);
    if (vpaMatch) {
      vpaMatch.forEach(vpa => {
        const handle = vpa.split('@')[0].toLowerCase();
        tokens.add(handle);
        // Also add individual words from underscore-separated handles
        handle.split('_').forEach(part => {
          if (part.length > 2) tokens.add(part);
        });
      });
    }

    // Extract merchant-like tokens from UPI narration (between slashes)
    const upiParts = combined.split('/');
    upiParts.forEach(part => {
      const cleaned = part.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
      cleaned.split(/\s+/).forEach(word => {
        if (word.length > 3 && !this.isNoiseWord(word)) {
          tokens.add(word);
        }
      });
    });

    // Clean narration for keyword matching
    const cleanNarration = combined
      .replace(/upi\/\d+\//gi, '')
      .replace(/imps\/\d+\//gi, '')
      .replace(/neft\/\d+\//gi, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .toLowerCase()
      .trim();

    return {
      merchantTokens: Array.from(tokens),
      cleanNarration
    };
  }

  isNoiseWord(word) {
    const noise = ['upi', 'imps', 'neft', 'rtgs', 'payment', 'transfer', 'from', 'to', 'via'];
    return noise.includes(word);
  }

  /**
   * Check learned patterns from user corrections (DB-backed)
   */
  async checkLearnedPatterns(merchantTokens, amount, userId) {
    if (!userId || merchantTokens.length === 0) return null;

    // Check in-memory cache first
    for (const token of merchantTokens) {
      const key = `${userId}:${token}`;
      const cached = this.merchantPatterns.get(key);
      if (cached) {
        // Check if amount is in similar range (±30%)
        if (!cached.amount || this.isAmountSimilar(amount, cached.amount)) {
          return { category: cached.category, matchedToken: token };
        }
      }
    }

    // Query database for learned patterns
    try {
      const { CategoryLearning } = require('../models');
      const { Op } = require('sequelize');
      
      const learned = await CategoryLearning.findOne({
        where: { 
          userId, 
          merchantToken: { [Op.in]: merchantTokens } 
        },
        order: [['correctedAt', 'DESC']]
      });

      if (learned) {
        // Check amount similarity if amount is stored
        if (!learned.amount || this.isAmountSimilar(amount, parseFloat(learned.amount))) {
          // Cache for future lookups
          const key = `${userId}:${learned.merchantToken}`;
          this.merchantPatterns.set(key, { 
            category: learned.category, 
            amount: learned.amount 
          });
          
          return { 
            category: learned.category, 
            matchedToken: learned.merchantToken 
          };
        }
      }
    } catch (error) {
      console.error('Error querying learned patterns:', error);
    }
    
    return null;
  }

  isAmountSimilar(amount1, amount2, tolerance = 0.3) {
    const diff = Math.abs(amount1 - amount2);
    const avg = (Math.abs(amount1) + Math.abs(amount2)) / 2;
    return diff / avg <= tolerance;
  }

  /**
   * Learn pattern for future categorizations (in-memory + DB)
   */
  learnPattern(merchantToken, category, amount, userId) {
    if (!merchantToken || !userId) return;
    
    const key = `${userId}:${merchantToken.toLowerCase()}`;
    this.merchantPatterns.set(key, { category, amount });
    
    // TODO: Persist to database
    console.log(`Learned pattern: ${merchantToken} -> ${category} (amount: ${amount})`);
  }

  /**
   * Enhanced Rule-Based Categorization with Indian merchant knowledge
   */
  ruleBasedCategorization(narration, merchantTokens, amount, transactionType) {
    let bestMatch = { category: 'Other', confidence: 0.4, method: 'rule_based' };
    const text = `${narration} ${merchantTokens.join(' ')}`.toLowerCase();

    // Step 1: Check merchant mappings (highest confidence)
    for (const [category, merchants] of Object.entries(this.merchantMappings)) {
      for (const merchant of merchants) {
        if (merchantTokens.some(token => token.includes(merchant) || merchant.includes(token))) {
          return { category, confidence: 0.92, method: 'rule_based', matchedMerchant: merchant };
        }
      }
    }

    // Step 2: Check keyword patterns
    let maxMatches = 0;
    let matchedCategory = null;
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        matchedCategory = category;
      }
    }

    if (maxMatches > 0) {
      const confidence = Math.min(0.80 + (maxMatches * 0.03), 0.90);
      bestMatch = { category: matchedCategory, confidence, method: 'rule_based' };
    }

    // Step 3: Amount & frequency heuristics for ambiguous cases
    if (bestMatch.confidence < 0.85) {
      // Large one-time debits (₹30k-₹2L) without clear keywords -> likely Inventory/Operations
      if (amount >= 30000 && amount <= 200000 && transactionType === 'expense') {
        if (!text.match(/food|travel|rent|salary/)) {
          bestMatch = { category: 'Inventory', confidence: 0.75, method: 'rule_based' };
        }
      }

      // Credits from payment gateways or customers -> Revenue
      if (transactionType === 'income' || amount < 0) {
        if (text.match(/payout|settlement|razorpay|stripe|cashfree|customer/)) {
          bestMatch = { category: 'Revenue', confidence: 0.88, method: 'rule_based' };
        }
      }

      // Monthly recurring patterns (detected by amount similarity in future iterations)
      // Rent: ₹20k-₹1L monthly
      // Utilities: ₹500-₹5k monthly
      // Payroll: ₹15k+ monthly
    }

    return bestMatch;
  }

  /**
   * LLM-based categorization (OpenAI or Hugging Face)
   */
  async llmCategorization(description, merchantName, amount) {
    try {
      if (this.openai) {
        return await this.categorizeWithOpenAI(description, merchantName, amount);
      } else if (this.hf) {
        return await this.categorizeWithHuggingFace(description, merchantName, amount);
      }
      
      throw new Error('No LLM service configured');
    } catch (error) {
      console.error('LLM categorization error:', error);
      throw error;
    }
  }

  /**
   * Categorize using OpenAI GPT
   */
  async categorizeWithOpenAI(description, merchantName, amount) {
    const prompt = `Categorize this business transaction into ONE of these categories: ${this.categories.join(', ')}.

Transaction Details:
- Description: "${description}"
- Merchant: "${merchantName}"
- Amount: $${amount}

Respond with ONLY the category name and a confidence score (0-1) in this format:
Category: [category name]
Confidence: [0.XX]`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a financial transaction categorization expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 50,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data.choices[0].message.content;
    const categoryMatch = result.match(/Category:\s*(.+)/i);
    const confidenceMatch = result.match(/Confidence:\s*([\d.]+)/i);

    const category = categoryMatch ? categoryMatch[1].trim() : 'Other';
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;

    // Validate category
    const matchedCategory = this.categories.find(c => 
      category.toLowerCase().includes(c.toLowerCase())
    );

    return {
      category: matchedCategory || 'Other',
      confidence: matchedCategory ? confidence : 0.5,
      method: 'openai',
    };
  }

  /**
   * Categorize using Hugging Face (AI Fallback)
   */
  async categorizeWithHuggingFace(description, merchantTokens, amount) {
    const prompt = `You are a financial categorization expert. Categorize this Indian business transaction into EXACTLY ONE of these 14 categories: ${this.categories.join(', ')}.

Transaction Details:
- Description: "${description}"
- Merchant/Tokens: "${merchantTokens}"
- Amount: ₹${Math.abs(amount)}

Rules:
- Food delivery (Zomato, Swiggy) = Meals & Entertainment
- IT equipment (Lenovo, Dell, HP) = Inventory
- Ads (Google, Meta, Facebook) = Marketing
- Travel (Uber, Ola, flights) = Travel
- Telecom/Internet (Jio, Airtel) = Utilities
- Salary/wages = Payroll
- Rent/lease = Rent
- Insurance premiums = Insurance
- Tax/TDS/GST = Taxes
- Office items (stationery, printer) = Office Supplies
- Consulting/legal/CA = Professional Services
- Customer payments/settlements = Revenue

Respond with ONLY the category name, nothing else.`;

    const response = await this.hf.textGeneration({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      inputs: prompt,
      parameters: {
        max_new_tokens: 30,
        temperature: 0.2,
        return_full_text: false,
      },
    });

    let category = response.generated_text.trim().split('\n')[0].trim();
    
    // Clean up response (remove any extra text)
    category = category.replace(/^(Category:|Answer:|Response:)/i, '').trim();
    
    // Validate category
    const matchedCategory = this.categories.find(c => 
      category.toLowerCase().includes(c.toLowerCase()) || 
      c.toLowerCase().includes(category.toLowerCase())
    );

    return {
      category: matchedCategory || 'Other',
      confidence: matchedCategory ? 0.78 : 0.50,
      method: 'ai_fallback',
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  async batchCategorize(transactions, userId = null) {
    const results = [];
    
    for (const txn of transactions) {
      try {
        const result = await this.categorizeTransaction(
          txn.description,
          txn.merchantName,
          txn.amount,
          userId
        );
        results.push({
          transactionId: txn.id,
          ...result,
        });
      } catch (error) {
        console.error(`Failed to categorize transaction ${txn.id}:`, error);
        results.push({
          transactionId: txn.id,
          category: 'Other',
          confidence: 0.3,
          method: 'error',
        });
      }
    }

    return results;
  }

  /**
   * Learn from user corrections (stores in DB for persistence)
   */
  async learnFromCorrection(transactionId, transaction, newCategory, userId) {
    try {
      const { description, merchantName, amount } = transaction;
      
      // Parse to get merchant tokens
      const parsedData = this.parseIndianPaymentNarration(
        description || '', 
        merchantName || ''
      );
      
      // Persist to database
      const { CategoryLearning } = require('../models');
      const learnedTokens = [];
      
      for (const token of parsedData.merchantTokens) {
        if (token.length > 3) {
          // Update in-memory cache
          this.learnPattern(token, newCategory, amount, userId);
          
          // Persist to database (upsert to handle duplicates)
          await CategoryLearning.upsert({
            userId,
            transactionId,
            merchantToken: token.toLowerCase(),
            category: newCategory,
            amount,
            correctedAt: new Date()
          });
          
          learnedTokens.push(token);
        }
      }

      console.log(`✓ Learned correction: ${learnedTokens.join(', ')} -> ${newCategory}`);

      return {
        success: true,
        message: 'Pattern learned successfully',
        learnedTokens
      };
    } catch (error) {
      console.error('Learn from correction error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load learned patterns from database on startup
   */
  async loadLearnedPatterns(userId = null) {
    try {
      const { CategoryLearning } = require('../models');
      const where = userId ? { userId } : {};
      
      const patterns = await CategoryLearning.findAll({
        where,
        order: [['correctedAt', 'DESC']]
      });
      
      patterns.forEach(p => {
        const key = `${p.userId}:${p.merchantToken}`;
        this.merchantPatterns.set(key, { 
          category: p.category, 
          amount: p.amount ? parseFloat(p.amount) : null 
        });
      });
      
      console.log(`✓ Loaded ${patterns.length} learned patterns from database`);
      return patterns.length;
    } catch (error) {
      console.error('Error loading learned patterns:', error);
      return 0;
    }
  }

  /**
   * Get learned patterns for a specific user
   */
  async getUserLearnedPatterns(userId) {
    try {
      const { CategoryLearning } = require('../models');
      
      const patterns = await CategoryLearning.findAll({
        where: { userId },
        order: [['correctedAt', 'DESC']],
        limit: 100
      });

      return patterns.map(p => ({
        merchantToken: p.merchantToken,
        category: p.category,
        amount: p.amount,
        correctedAt: p.correctedAt
      }));
    } catch (error) {
      console.error('Error fetching user patterns:', error);
      return [];
    }
  }

  /**
   * Delete a learned pattern
   */
  async deleteLearnedPattern(userId, merchantToken) {
    try {
      const { CategoryLearning } = require('../models');
      
      await CategoryLearning.destroy({
        where: { userId, merchantToken: merchantToken.toLowerCase() }
      });

      // Remove from cache
      const key = `${userId}:${merchantToken.toLowerCase()}`;
      this.merchantPatterns.delete(key);

      console.log(`✓ Deleted learned pattern: ${merchantToken}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting learned pattern:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get categorization statistics
   */
  getStats() {
    return {
      learnedPatterns: this.merchantPatterns.size,
      categories: this.categories.length,
      hasOpenAI: !!this.openai,
      hasHuggingFace: !!this.hf,
    };
  }
}

module.exports = new AICategorizationService();
