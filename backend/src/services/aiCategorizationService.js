const { HfInference } = require('@huggingface/inference');
const axios = require('axios');

class AICategorizationService {
  constructor() {
    this.hf = process.env.HUGGINGFACE_API_KEY 
      ? new HfInference(process.env.HUGGINGFACE_API_KEY) 
      : null;

    this.openai = process.env.OPENAI_API_KEY ? {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    } : null;

    this.categories = [
      'Revenue',
      'Meals & Entertainment',
      'Operations',
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

    // Rule-based patterns (learned from historical data)
    this.merchantPatterns = new Map();
    this.categoryKeywords = this.buildCategoryKeywords();
  }

  buildCategoryKeywords() {
    return {
      'Revenue': ['payment', 'deposit', 'invoice', 'sale', 'income', 'revenue', 'client payment'],
      'Meals & Entertainment': ['restaurant', 'cafe', 'coffee', 'dinner', 'lunch', 'starbucks', 'food', 'bar', 'catering'],
      'Operations': ['supplies', 'equipment', 'office', 'amazon', 'staples', 'maintenance', 'repair'],
      'Marketing': ['advertising', 'facebook ads', 'google ads', 'marketing', 'promotion', 'social media', 'seo'],
      'Utilities': ['electric', 'power', 'water', 'internet', 'phone', 'verizon', 'at&t', 'comcast', 'utility'],
      'Travel': ['hotel', 'flight', 'uber', 'lyft', 'airbnb', 'travel', 'fuel', 'gas', 'parking', 'airline'],
      'Professional Services': ['legal', 'accounting', 'consulting', 'attorney', 'lawyer', 'cpa', 'consultant'],
      'Payroll': ['salary', 'wage', 'payroll', 'gusto', 'adp', 'employee', 'contractor'],
      'Rent': ['rent', 'lease', 'property', 'landlord'],
      'Insurance': ['insurance', 'premium', 'policy'],
      'Taxes': ['tax', 'irs', 'state tax', 'federal tax'],
      'Inventory': ['inventory', 'stock', 'wholesale', 'supplier', 'vendor'],
      'Office Supplies': ['office depot', 'staples', 'paper', 'printer', 'supplies']
    };
  }

  /**
   * Hybrid AI Categorization: Rules + ML + LLM
   */
  async categorizeTransaction(description, merchantName, amount, userId = null) {
    try {
      // Step 1: Check learned patterns (fastest)
      const learnedCategory = this.checkLearnedPatterns(merchantName, userId);
      if (learnedCategory) {
        return {
          category: learnedCategory,
          confidence: 0.95,
          method: 'learned',
        };
      }

      // Step 2: Rule-based categorization (fast)
      const ruleResult = this.ruleBasedCategorization(description, merchantName, amount);
      if (ruleResult.confidence >= 0.8) {
        return ruleResult;
      }

      // Step 3: LLM categorization (most accurate but slower)
      if (this.openai || this.hf) {
        const llmResult = await this.llmCategorization(description, merchantName, amount);
        if (llmResult.confidence >= 0.7) {
          // Learn this pattern for future
          this.learnPattern(merchantName, llmResult.category, userId);
          return llmResult;
        }
      }

      // Fallback to rule-based result
      return ruleResult;
    } catch (error) {
      console.error('AI categorization error:', error);
      return this.ruleBasedCategorization(description, merchantName, amount);
    }
  }

  /**
   * Check learned patterns from previous categorizations
   */
  checkLearnedPatterns(merchantName, userId) {
    if (!merchantName) return null;
    
    const key = userId ? `${userId}:${merchantName.toLowerCase()}` : merchantName.toLowerCase();
    return this.merchantPatterns.get(key);
  }

  /**
   * Learn pattern for future categorizations
   */
  learnPattern(merchantName, category, userId) {
    if (!merchantName) return;
    
    const key = userId ? `${userId}:${merchantName.toLowerCase()}` : merchantName.toLowerCase();
    this.merchantPatterns.set(key, category);
  }

  /**
   * Rule-based categorization using keywords
   */
  ruleBasedCategorization(description, merchantName, amount) {
    const text = `${description} ${merchantName}`.toLowerCase();
    
    // Check each category's keywords
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount > 0) {
        const confidence = Math.min(0.75 + (matchCount * 0.05), 0.9);
        return {
          category,
          confidence,
          method: 'rules',
        };
      }
    }

    // Amount-based heuristics
    if (amount < 0) {  // Income
      return { category: 'Revenue', confidence: 0.6, method: 'rules' };
    }

    return { category: 'Other', confidence: 0.4, method: 'rules' };
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
   * Categorize using Hugging Face
   */
  async categorizeWithHuggingFace(description, merchantName, amount) {
    const prompt = `Categorize this business transaction into one of these categories: ${this.categories.join(', ')}.

Transaction: "${description}"
Merchant: "${merchantName}"
Amount: ${amount}

Respond with only the category name.`;

    const response = await this.hf.textGeneration({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      inputs: prompt,
      parameters: {
        max_new_tokens: 20,
        temperature: 0.3,
        return_full_text: false,
      },
    });

    const category = response.generated_text.trim();
    
    // Validate category
    const matchedCategory = this.categories.find(c => 
      category.toLowerCase().includes(c.toLowerCase())
    );

    return {
      category: matchedCategory || 'Other',
      confidence: matchedCategory ? 0.85 : 0.5,
      method: 'huggingface',
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
   * Learn from user corrections
   */
  async learnFromCorrection(transactionId, oldCategory, newCategory, merchantName, userId) {
    // Update learned patterns
    this.learnPattern(merchantName, newCategory, userId);

    // TODO: Store in database for persistent learning
    console.log(`Learned: ${merchantName} -> ${newCategory} (was ${oldCategory})`);

    return {
      success: true,
      message: 'Pattern learned successfully',
    };
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
