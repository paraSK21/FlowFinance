const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

class AICategorizationService {
  constructor() {
    // Initialize multiple Gemini API keys for fallback from environment variables
    this.geminiApiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5
    ].filter(key => key && key.trim() !== ''); // Filter out empty/undefined keys
    
    if (this.geminiApiKeys.length === 0) {
      console.warn('⚠️ No Gemini API keys configured. AI categorization will not be available.');
      console.warn('   Add GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc. to your .env file');
    } else {
      console.log(`✓ Loaded ${this.geminiApiKeys.length} Gemini API key(s) from environment`);
    }
    
    this.currentKeyIndex = 0;
    this.failedKeys = new Set();
    this.keyLastUsed = {}; // Track last usage time for rate limiting
    this.keyRequestCount = {}; // Track requests per minute per key
    this.mlForecastCache = new Map(); // Cache ML forecast insights to save API calls
    
    // Use lighter models for better rate limits
    // Based on testing results:
    // - gemma-3-1b-it: 30+ requests per key (~52 req/min) ✅ BEST
    // - gemma-3-4b-it: 30+ requests per key (~33 req/min) ✅ GOOD
    // - gemini-flash-lite-latest: 10 requests per key (~55 req/min) ❌ LOW QUOTA
    this.modelNames = [
      'gemma-3-1b-it',              // BEST: 30+ req/key, 1B params, fast (~1s response)
      'gemma-3-4b-it',              // GOOD: 30+ req/key, 4B params, slower (~1.7s response)
      'gemini-flash-lite-latest',   // Fallback: 10 req/key
      'gemini-flash-latest',        // Fallback: Standard flash
      'gemini-2.5-flash'            // Fallback: Latest flash
    ];
    this.currentModelIndex = 0;
    
    this.gemini = null;
    this.geminiModel = null;
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
    
    // Initialize Gemini after all properties are set
    this.initializeGemini();
  }

  initializeGemini() {
    try {
      if (this.geminiApiKeys.length === 0) {
        console.warn('⚠️ Cannot initialize Gemini: No API keys available');
        return;
      }
      
      const apiKey = this.geminiApiKeys[this.currentKeyIndex];
      if (!apiKey) {
        console.error(`⚠️ API key #${this.currentKeyIndex + 1} is undefined or empty`);
        return;
      }
      
      this.gemini = new GoogleGenerativeAI(apiKey);
      
      // Try models in order of preference (lighter models = more quota)
      let modelInitialized = false;
      for (let i = this.currentModelIndex; i < this.modelNames.length; i++) {
        try {
          this.geminiModel = this.gemini.getGenerativeModel({ model: this.modelNames[i] });
          this.currentModelIndex = i;
          console.log(`✓ Initialized Gemini with API key #${this.currentKeyIndex + 1} using model: ${this.modelNames[i]}`);
          modelInitialized = true;
          break;
        } catch (modelError) {
          console.log(`Model ${this.modelNames[i]} not available, trying next...`);
        }
      }
      
      if (!modelInitialized) {
        throw new Error('No Gemini models available');
      }
      
      // Initialize tracking for this key
      if (!this.keyRequestCount[this.currentKeyIndex]) {
        this.keyRequestCount[this.currentKeyIndex] = 0;
      }
    } catch (error) {
      console.error('Failed to initialize Gemini:', error.message);
    }
  }

  switchToNextApiKey() {
    const startIndex = this.currentKeyIndex;
    this.failedKeys.add(this.currentKeyIndex);
    
    // Try next available key
    do {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.geminiApiKeys.length;
      
      // If we've tried all keys, check if enough time has passed to retry
      if (this.currentKeyIndex === startIndex) {
        const now = Date.now();
        let hasAvailableKey = false;
        
        // Check if any key's cooldown period has expired (1 minute)
        for (let i = 0; i < this.geminiApiKeys.length; i++) {
          const lastUsed = this.keyLastUsed[i] || 0;
          if (now - lastUsed > 60000) { // 1 minute cooldown
            this.currentKeyIndex = i;
            this.failedKeys.delete(i);
            this.keyRequestCount[i] = 0; // Reset counter
            hasAvailableKey = true;
            console.log(`✓ Cooldown expired for API key #${i + 1}, retrying...`);
            break;
          }
        }
        
        if (!hasAvailableKey) {
          console.error('All Gemini API keys exhausted. Please wait 1 minute.');
          this.failedKeys.clear(); // Reset for next attempt
          throw new Error('All Gemini API keys have exceeded quota. Please wait 1 minute before retrying.');
        }
      }
    } while (this.failedKeys.has(this.currentKeyIndex));
    
    console.log(`⚠️ Switching to Gemini API key #${this.currentKeyIndex + 1}`);
    this.initializeGemini();
    return true;
  }

  buildCategoryKeywords() {
    return {
      'Revenue': ['payout', 'settlement', 'sales', 'stripe', 'razorpay payout', 'cashfree settlement', 
                  'customer payment', 'invoice paid', 'payment received', 'deposit', 'income', 'revenue',
                  'salary credit', 'salary credited', 'sal credit', 'credited by', 'transfer from'],
      'Meals & Entertainment': ['zomato', 'swiggy', 'dominos', 'starbucks', 'café', 'cafe', 'cafeteria', 'restaurant', 
                                'diner', 'food', 'pizza', 'burger', 'mcdonald', 'kfc', 'subway', 'dunkin', 'canteen', 'mess', 'iitb'],
      'Operations': ['maintenance', 'repair', 'equipment', 'machinery', 'tools', 'hardware', 'software license', 
                     'cred', 'credpay', 'credit card', 'bill payment'],
      'Marketing': ['amazon ads', 'meta ads', 'google ads', 'facebook ads', 'instagram ads', 'linkedin ads',
                    'campaign', 'ad spend', 'advertising', 'promotion', 'marketing', 'seo', 'sem'],
      'Utilities': ['electricity bill', 'electric bill', 'power bill', 'water bill', 'wifi bill', 'broadband bill', 'internet bill',
                    'mobile recharge', 'jio recharge', 'airtel recharge', 'vodafone', 'vi recharge', 'bsnl', 'gas bill', 'lpg', 'electricity', 'neft from acme'],
      'Travel': ['uber', 'ola', 'rapido', 'airline', 'indigo', 'spicejet', 'air india', 'vistara', 'irctc',
                 'flight', 'hotel', 'booking.com', 'makemytrip', 'goibibo', 'oyo', 'treebo', 'toll', 'parking', 'cab', 'taxi'],
      'Professional Services': ['consulting', 'consultant', 'ca fees', 'chartered accountant', 'legal fees',
                                'lawyer', 'attorney', 'audit', 'freelancer', 'contractor invoice', 'advisory'],
      'Payroll': ['salary', 'payroll', 'wages', 'stipend', 'employee', 'staff payment', 'bonus', 'incentive'],
      'Rent': ['rent', 'lease', 'landlord', 'property rent', 'office rent', 'warehouse rent'],
      'Insurance': ['insurance', 'premium', 'policy', 'lic', 'hdfc life', 'icici lombard', 'bajaj allianz',
                    'star health', 'max life', 'sbi life'],
      'Taxes': ['tax', 'tds', 'tds payment', 'advance tax', 'gst payment', 'gst', 'income tax', 'itr'],
      'Inventory': ['supplier', 'vendor', 'wholesale', 'stock purchase', 'raw material', 'goods', 'amazon'],
      'Office Supplies': ['notebook', 'stationery', 'printer ink', 'pens', 'office chair', 'desk', 'paper',
                          'stapler', 'file', 'folder']
    };
  }

  buildMerchantMappings() {
    return {
      // IT/Electronics Equipment -> Inventory or Operations
      'Inventory': ['lenovo', 'dell', 'hp', 'croma', 'reliance digital', 'asus', 'acer', 'apple store',
                    'samsung', 'lg', 'sony', 'flipkart', 'amazon india', 'amazon'],
      // Food Delivery & Dining
      'Meals & Entertainment': ['zomato', 'swiggy', 'dominos', 'pizza hut', 'starbucks', 'mcdonald',
                                'kfc', 'subway', 'burger king', 'dunkin donuts', 'cafeteria', 'iitb', 'canteen', 'cafe'],
      // Advertising Platforms
      'Marketing': ['meta', 'facebook', 'instagram', 'google ads', 'linkedin', 'twitter ads'],
      // Travel Services
      'Travel': ['uber', 'ola', 'rapido', 'indigo', 'spicejet', 'air india', 'vistara', 'irctc',
                 'makemytrip', 'goibibo', 'oyo', 'treebo', 'booking.com'],
      // Telecom & Utilities
      'Utilities': ['jio', 'airtel', 'vodafone', 'vi', 'bsnl', 'tata sky', 'dish tv', 'hathway', 'electricity', 'neft from acme'],
      // Bill Payment & Credit Card Services
      'Operations': ['cred', 'credit card payment', 'bill payment', 'credpay'],
      // Insurance Companies
      'Insurance': ['lic', 'hdfc life', 'icici lombard', 'bajaj allianz', 'star health', 'max life', 'sbi life'],
      // Payment Gateways (Revenue) - Only for settlements/payouts
      'Revenue': ['razorpay payout', 'razorpay settlement', 'stripe payout', 'cashfree settlement', 'instamojo settlement']
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
      // Only use rule result if confidence is high (0.85+)
      if (ruleResult.confidence >= 0.85) {
        return ruleResult;
      }

      // TIER 3: AI/LLM Fallback (Only if rules are not confident)
      if (this.geminiModel) {
        try {
          const llmResult = await this.llmCategorization(cleanNarration, merchantTokens.join(' '), amount);
          if (llmResult.confidence >= 0.70) {
            return llmResult;
          }
          // If LLM has low confidence, still prefer it over low-confidence rules
          if (llmResult.confidence > ruleResult.confidence) {
            return llmResult;
          }
        } catch (llmError) {
          console.error('LLM categorization failed, falling back to rules:', llmError.message);
          // Continue to rule result fallback
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
        const merchantLower = merchant.toLowerCase();
        
        // Check if merchant name appears in narration or tokens
        const hasExactMatch = merchantTokens.some(token => {
          const tokenLower = token.toLowerCase();
          return tokenLower === merchantLower || 
                 tokenLower.includes(merchantLower) ||
                 merchantLower.includes(tokenLower);
        });
        
        // Also check in full narration text
        const inNarration = text.includes(merchantLower);
        
        if (hasExactMatch || inNarration) {
          return { category, confidence: 0.92, method: 'rule_based', matchedMerchant: merchant };
        }
      }
    }

    // Step 2: Check keyword patterns (more flexible matching)
    let maxMatches = 0;
    let matchedCategory = null;
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matchCount = keywords.filter(keyword => {
        const keywordLower = keyword.toLowerCase();
        
        // For multi-word keywords, require exact phrase match
        if (keyword.includes(' ')) {
          return text.includes(keywordLower);
        }
        
        // For single words, try multiple matching strategies
        // 1. Word boundary match (strict)
        const wordBoundary = new RegExp(`\\b${keywordLower}\\b`, 'i');
        if (wordBoundary.test(text)) return true;
        
        // 2. Contains match for short keywords (3-4 chars)
        if (keywordLower.length <= 4 && text.includes(keywordLower)) return true;
        
        // 3. Token match - check if any token contains or equals keyword
        const tokenMatch = merchantTokens.some(token => 
          token.toLowerCase() === keywordLower || 
          token.toLowerCase().includes(keywordLower) ||
          keywordLower.includes(token.toLowerCase())
        );
        if (tokenMatch) return true;
        
        return false;
      }).length;
      
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        matchedCategory = category;
      }
    }

    if (maxMatches > 0) {
      // Single strong match is enough for high confidence
      const confidence = maxMatches >= 2 
        ? Math.min(0.88 + (maxMatches * 0.02), 0.95)
        : Math.min(0.82 + (maxMatches * 0.03), 0.88);
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

      // Credits from payment gateways, customers, or salary -> Revenue
      if (transactionType === 'income' || amount < 0) {
        if (text.match(/payout|settlement|razorpay|stripe|cashfree|customer|salary credit|sal credit|credited by|transfer from/)) {
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
   * LLM-based categorization (Gemini, OpenAI, or Hugging Face)
   */
  async llmCategorization(description, merchantName, amount) {
    try {
      if (this.geminiModel) {
        return await this.categorizeWithGemini(description, merchantName, amount);
      } else if (this.openai) {
        return await this.categorizeWithOpenAI(description, merchantName, amount);
      }
      
      throw new Error('No LLM service configured');
    } catch (error) {
      console.error('LLM categorization error:', error);
      throw error;
    }
  }

  /**
   * Categorize using Google Gemini with automatic API key fallback
   */
  async categorizeWithGemini(description, merchantTokens, amount, retryCount = 0) {
    const maxRetries = this.geminiApiKeys.length * 2; // Allow retries with cooldown
    
    try {
      // Track request for rate limiting
      this.keyRequestCount[this.currentKeyIndex] = (this.keyRequestCount[this.currentKeyIndex] || 0) + 1;
      this.keyLastUsed[this.currentKeyIndex] = Date.now();
      
      const prompt = `You are a financial categorization expert for Indian business transactions.

Categorize this transaction into EXACTLY ONE category from this list:
${this.categories.join(', ')}

Transaction Details:
- Description: "${description}"
- Merchant/Tokens: "${merchantTokens}"
- Amount: ₹${Math.abs(amount)}

Indian Business Context Rules:
- CRED/CredPay (credit card bill payment) = Operations
- Cafeteria/Canteen/Mess/IITB Cafeteria = Meals & Entertainment
- Zomato/Swiggy (food delivery) = Meals & Entertainment
- Uber/Ola/Rapido (ride-sharing/cab) = Travel
- Jio/Airtel/Vi (telecom) = Utilities
- Amazon/Flipkart (e-commerce) = Inventory
- Google Ads/Meta Ads = Marketing
- Razorpay/Stripe/Cashfree (payment gateway settlements) = Revenue
- Salary Credit/Salary Received/Transfer From (incoming money) = Revenue
- Salary Payment/Wages (paying employees) = Payroll
- ATM Withdrawal = Other (cash withdrawal, not a business expense category)
- Rent/Lease = Rent
- Insurance premiums = Insurance
- TDS/GST/Tax = Taxes
- Stationery/Office items = Office Supplies
- CA/Legal/Consulting = Professional Services
- Electricity/Power Bill = Utilities

Respond in this EXACT format:
Category: [category name]
Confidence: [0.XX]`;

      const result = await this.geminiModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse response
      const categoryMatch = text.match(/Category:\s*(.+)/i);
      const confidenceMatch = text.match(/Confidence:\s*([\d.]+)/i);

      let category = categoryMatch ? categoryMatch[1].trim() : 'Other';
      let confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75;

      // Validate category
      const matchedCategory = this.categories.find(c => 
        category.toLowerCase().includes(c.toLowerCase()) || 
        c.toLowerCase().includes(category.toLowerCase())
      );

      const finalCategory = matchedCategory || 'Other';
      const finalConfidence = matchedCategory ? confidence : 0.50;

      const modelName = this.modelNames[this.currentModelIndex];
      console.log(`Gemini ${modelName} (Key #${this.currentKeyIndex + 1}, Req: ${this.keyRequestCount[this.currentKeyIndex]}): "${merchantTokens}" → ${finalCategory} (${(finalConfidence * 100).toFixed(0)}%)`);

      // Reset failed keys on success
      if (this.failedKeys.size > 0) {
        this.failedKeys.clear();
      }

      return {
        category: finalCategory,
        confidence: finalConfidence,
        method: 'gemini_ai',
        apiKeyUsed: this.currentKeyIndex + 1,
        modelUsed: modelName,
        requestCount: this.keyRequestCount[this.currentKeyIndex]
      };
    } catch (error) {
      const errorMessage = error.message || '';
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('RESOURCE_EXHAUSTED') ||
                          errorMessage.includes('rate limit') ||
                          errorMessage.includes('RATE_LIMIT_EXCEEDED');

      console.error(`Gemini API error (Key #${this.currentKeyIndex + 1}, Model: ${this.modelNames[this.currentModelIndex]}):`, errorMessage);

      // If quota exceeded and we have more keys to try
      if (isQuotaError && retryCount < maxRetries) {
        console.log(`⚠️ API key #${this.currentKeyIndex + 1} quota exceeded (${this.keyRequestCount[this.currentKeyIndex]} requests), trying next key...`);
        
        try {
          this.switchToNextApiKey();
          // Small delay before retry to avoid hammering the API
          await new Promise(resolve => setTimeout(resolve, 500));
          // Retry with next API key
          return await this.categorizeWithGemini(description, merchantTokens, amount, retryCount + 1);
        } catch (switchError) {
          // All keys exhausted
          throw new Error(`All ${this.geminiApiKeys.length} Gemini API keys exhausted. ${switchError.message}`);
        }
      }

      // If not a quota error or no more retries, throw the error
      throw new Error(`Gemini categorization failed: ${errorMessage}`);
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
      hasGemini: !!this.geminiModel,
      hasOpenAI: !!this.openai,
      currentApiKey: this.currentKeyIndex + 1,
      totalApiKeys: this.geminiApiKeys.length,
      currentModel: this.modelNames[this.currentModelIndex],
      apiKeyStats: this.getApiKeyStats()
    };
  }

  /**
   * Get detailed API key usage statistics
   */
  getApiKeyStats() {
    const stats = [];
    const now = Date.now();
    
    for (let i = 0; i < this.geminiApiKeys.length; i++) {
      const lastUsed = this.keyLastUsed[i] || 0;
      const timeSinceLastUse = lastUsed ? now - lastUsed : null;
      const isFailed = this.failedKeys.has(i);
      const requestCount = this.keyRequestCount[i] || 0;
      
      stats.push({
        keyNumber: i + 1,
        requestCount,
        lastUsed: lastUsed ? new Date(lastUsed).toISOString() : 'Never',
        timeSinceLastUse: timeSinceLastUse ? `${Math.floor(timeSinceLastUse / 1000)}s ago` : 'Never',
        status: isFailed ? 'Failed/Cooling down' : (i === this.currentKeyIndex ? 'Active' : 'Available'),
        cooldownRemaining: isFailed && timeSinceLastUse < 60000 ? `${Math.ceil((60000 - timeSinceLastUse) / 1000)}s` : '0s'
      });
    }
    
    return stats;
  }

  /**
   * Reset API key counters and failed status (useful for testing or manual reset)
   */
  resetApiKeyStats() {
    this.failedKeys.clear();
    this.keyRequestCount = {};
    this.keyLastUsed = {};
    this.currentKeyIndex = 0;
    this.mlForecastCache.clear(); // Also clear ML cache
    this.initializeGemini();
    console.log('✓ API key statistics reset');
    return { success: true, message: 'All API keys reset and ready to use' };
  }

  /**
   * Check if we have sufficient API quota for ML operations
   * Returns true if we have at least 20% quota remaining
   */
  checkAPIQuota() {
    const totalKeys = this.geminiApiKeys.length;
    const failedKeysCount = this.failedKeys.size;
    
    // Calculate current key usage
    const currentKeyRequests = this.keyRequestCount[this.currentKeyIndex] || 0;
    const currentKeyQuotaUsed = currentKeyRequests / 30; // 30 requests per key
    
    // Check if current key has at least 20% quota left
    if (currentKeyQuotaUsed < 0.8) {
      return true; // Current key has enough quota
    }
    
    // Check if we have other available keys
    const availableKeys = totalKeys - failedKeysCount;
    if (availableKeys > 1) {
      return true; // We have backup keys
    }
    
    // Low quota - preserve for categorization
    return false;
  }

  /**
   * Get quota usage summary
   */
  getQuotaUsage() {
    const totalKeys = this.geminiApiKeys.length;
    const failedKeys = this.failedKeys.size;
    const availableKeys = totalKeys - failedKeys;
    
    const currentKeyRequests = this.keyRequestCount[this.currentKeyIndex] || 0;
    const currentKeyQuotaPercent = Math.round((currentKeyRequests / 30) * 100);
    
    const totalRequestsUsed = Object.values(this.keyRequestCount).reduce((sum, count) => sum + count, 0);
    const totalCapacity = totalKeys * 30;
    const totalQuotaPercent = Math.round((totalRequestsUsed / totalCapacity) * 100);
    
    return {
      totalKeys,
      availableKeys,
      failedKeys,
      currentKeyRequests,
      currentKeyQuotaPercent,
      totalRequestsUsed,
      totalCapacity,
      totalQuotaPercent,
      mlCacheSize: this.mlForecastCache.size,
      recommendation: totalQuotaPercent > 80 ? 'High usage - ML forecasting disabled' : 'Normal - ML forecasting enabled'
    };
  }

  /**
   * Generate cash flow forecast based on historical patterns with ML enhancement
   */
  async generateForecast(transactions, currentBalance, days = 90, useML = true) {
    try {
      // Analyze historical patterns
      const analysis = this.analyzeTransactionPatterns(transactions);
      
      // Try ML-enhanced forecast first if enabled and Gemini is available
      let mlInsights = null;
      if (useML && this.geminiModel && transactions.length >= 10) {
        // Check if we have enough API quota before using ML
        const hasQuota = this.checkAPIQuota();
        
        if (hasQuota) {
          try {
            mlInsights = await this.getMLForecastInsights(transactions, analysis, days);
            console.log('✓ ML insights generated for forecast enhancement');
          } catch (mlError) {
            console.warn('ML forecast insights failed, using statistical method:', mlError.message);
          }
        } else {
          console.warn('⚠️ API quota low, skipping ML enhancement to preserve quota for categorization');
        }
      }
      
      // Generate daily forecasts
      const forecasts = [];
      let runningBalance = currentBalance;

      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);

        // Predict cash flow for this day (statistical method)
        const prediction = this.predictDailyCashFlow(
          forecastDate,
          analysis,
          transactions
        );

        // Apply ML adjustments if available
        if (mlInsights) {
          prediction.income *= mlInsights.incomeMultiplier;
          prediction.expenses *= mlInsights.expenseMultiplier;
          prediction.confidence = Math.min(0.95, prediction.confidence * mlInsights.confidenceBoost);
          prediction.netCashFlow = prediction.income - prediction.expenses;
        }

        runningBalance += prediction.netCashFlow;

        forecasts.push({
          date: forecastDate,
          predictedBalance: runningBalance,
          projectedIncome: prediction.income,
          projectedExpenses: prediction.expenses,
          confidence: prediction.confidence,
          method: mlInsights ? 'ml_enhanced' : 'statistical'
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Forecast generation error:', error);
      throw error;
    }
  }

  /**
   * Get ML-based forecast insights using Gemini AI with caching
   */
  async getMLForecastInsights(transactions, analysis, days) {
    if (!this.geminiModel) {
      throw new Error('Gemini model not available');
    }

    // Create cache key based on transaction data
    const lastTxnDate = transactions[transactions.length - 1]?.date;
    const txnCount = transactions.length;
    const cacheKey = `${lastTxnDate}_${txnCount}_${days}`;
    
    // Check cache first (valid for 24 hours)
    const cached = this.mlForecastCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
      console.log('✓ Using cached ML forecast insights (saves API call)');
      return cached.insights;
    }

    // Prepare transaction summary for AI
    const recentTxns = transactions.slice(-30); // Last 30 transactions
    const summary = this.prepareTransactionSummary(recentTxns, analysis);

    const prompt = `You are a financial forecasting expert. Analyze this business transaction data and provide forecast adjustments.

Transaction Summary:
- Total Transactions: ${transactions.length}
- Date Range: ${transactions[0]?.date} to ${transactions[transactions.length - 1]?.date}
- Average Daily Income: ₹${analysis.monthlyAverages.income.toFixed(2)}
- Average Daily Expenses: ₹${analysis.monthlyAverages.expenses.toFixed(2)}
- Recurring Transactions: ${analysis.recurringTransactions.length}

Recent Transaction Categories (last 30):
${summary.categoryBreakdown}

Recent Trends:
${summary.trendDescription}

Task: Predict adjustments for the next ${days} days forecast.

Consider:
1. Seasonal patterns (current month: ${new Date().toLocaleString('default', { month: 'long' })})
2. Growth/decline trends
3. Business cycle patterns
4. Recurring transaction impact

Respond in this EXACT JSON format (no markdown, just JSON):
{
  "incomeMultiplier": 1.0,
  "expenseMultiplier": 1.0,
  "confidenceBoost": 1.0,
  "reasoning": "brief explanation"
}

Rules:
- incomeMultiplier: 0.7 to 1.3 (1.0 = no change, 1.2 = 20% increase expected)
- expenseMultiplier: 0.7 to 1.3
- confidenceBoost: 0.8 to 1.2 (1.0 = no change, 1.1 = 10% more confident)
- Keep reasoning under 100 characters`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      const insights = JSON.parse(jsonStr);
      
      // Validate and constrain values
      const validatedInsights = {
        incomeMultiplier: Math.max(0.7, Math.min(1.3, insights.incomeMultiplier || 1.0)),
        expenseMultiplier: Math.max(0.7, Math.min(1.3, insights.expenseMultiplier || 1.0)),
        confidenceBoost: Math.max(0.8, Math.min(1.2, insights.confidenceBoost || 1.0)),
        reasoning: insights.reasoning || 'ML analysis applied'
      };
      
      // Cache the insights for 24 hours
      this.mlForecastCache.set(cacheKey, {
        insights: validatedInsights,
        timestamp: Date.now()
      });
      
      console.log('✓ ML forecast insights cached for 24 hours');
      
      return validatedInsights;
    } catch (error) {
      console.error('ML forecast insights error:', error.message);
      // Return neutral multipliers on error
      return {
        incomeMultiplier: 1.0,
        expenseMultiplier: 1.0,
        confidenceBoost: 1.0,
        reasoning: 'Using statistical forecast only'
      };
    }
  }

  /**
   * Prepare transaction summary for ML analysis
   */
  prepareTransactionSummary(transactions, analysis) {
    // Category breakdown
    const categories = {};
    transactions.forEach(txn => {
      const cat = txn.aiCategory || txn.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    const categoryBreakdown = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => `  - ${cat}: ${count} transactions`)
      .join('\n');

    // Trend description
    const trend = this.calculateTrend(transactions);
    let trendDescription = '';
    if (trend.incomeTrend > 0.05) {
      trendDescription += `  - Income trending UP by ${(trend.incomeTrend * 100).toFixed(1)}%\n`;
    } else if (trend.incomeTrend < -0.05) {
      trendDescription += `  - Income trending DOWN by ${(Math.abs(trend.incomeTrend) * 100).toFixed(1)}%\n`;
    } else {
      trendDescription += '  - Income stable\n';
    }
    
    if (trend.expenseTrend > 0.05) {
      trendDescription += `  - Expenses trending UP by ${(trend.expenseTrend * 100).toFixed(1)}%`;
    } else if (trend.expenseTrend < -0.05) {
      trendDescription += `  - Expenses trending DOWN by ${(Math.abs(trend.expenseTrend) * 100).toFixed(1)}%`;
    } else {
      trendDescription += '  - Expenses stable';
    }

    return {
      categoryBreakdown,
      trendDescription
    };
  }

  /**
   * Analyze transaction patterns for forecasting with outlier detection
   */
  analyzeTransactionPatterns(transactions) {
    const dayOfWeekPatterns = {};
    const dayOfMonthPatterns = {}; // NEW: Track patterns by day of month
    const monthlyAverages = { income: 0, expenses: 0 };
    const recurringTransactions = [];

    // IMPROVEMENT 1: Remove outliers before analysis
    const cleanedTransactions = this.removeOutliers(transactions);

    // Group by day of week AND day of month
    cleanedTransactions.forEach(txn => {
      const date = new Date(txn.date);
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();
      const amount = Math.abs(parseFloat(txn.amount));

      // Day of week patterns
      if (!dayOfWeekPatterns[dayOfWeek]) {
        dayOfWeekPatterns[dayOfWeek] = { income: [], expenses: [] };
      }

      // Day of month patterns (for recurring bills)
      if (!dayOfMonthPatterns[dayOfMonth]) {
        dayOfMonthPatterns[dayOfMonth] = { income: [], expenses: [] };
      }

      if (txn.type === 'income' || parseFloat(txn.amount) < 0) {
        dayOfWeekPatterns[dayOfWeek].income.push(amount);
        dayOfMonthPatterns[dayOfMonth].income.push(amount);
        monthlyAverages.income += amount;
      } else {
        dayOfWeekPatterns[dayOfWeek].expenses.push(amount);
        dayOfMonthPatterns[dayOfMonth].expenses.push(amount);
        monthlyAverages.expenses += amount;
      }
    });

    // IMPROVEMENT 2: Use weighted average (recent transactions more important)
    const weightedAverages = this.calculateWeightedAverages(cleanedTransactions);
    
    // Calculate simple averages as fallback
    const incomeCount = cleanedTransactions.filter(t => t.type === 'income' || parseFloat(t.amount) < 0).length || 1;
    const expenseCount = cleanedTransactions.filter(t => t.type === 'expense' && parseFloat(t.amount) >= 0).length || 1;
    
    monthlyAverages.income = weightedAverages.income || (monthlyAverages.income / incomeCount);
    monthlyAverages.expenses = weightedAverages.expenses || (monthlyAverages.expenses / expenseCount);

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
      dayOfMonthPatterns, // NEW
      monthlyAverages,
      recurringTransactions,
      outlierCount: transactions.length - cleanedTransactions.length // NEW
    };
  }

  /**
   * Remove outliers using IQR method (Interquartile Range)
   */
  removeOutliers(transactions) {
    if (transactions.length < 10) return transactions; // Need enough data

    const amounts = transactions.map(t => Math.abs(parseFloat(t.amount))).sort((a, b) => a - b);
    
    // Calculate Q1, Q3, and IQR
    const q1Index = Math.floor(amounts.length * 0.25);
    const q3Index = Math.floor(amounts.length * 0.75);
    const q1 = amounts[q1Index];
    const q3 = amounts[q3Index];
    const iqr = q3 - q1;
    
    // Define outlier bounds (1.5 * IQR is standard)
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);
    
    // Filter out outliers
    return transactions.filter(t => {
      const amount = Math.abs(parseFloat(t.amount));
      return amount >= lowerBound && amount <= upperBound;
    });
  }

  /**
   * Calculate weighted averages (recent transactions weighted more)
   */
  calculateWeightedAverages(transactions) {
    if (transactions.length === 0) return { income: 0, expenses: 0 };

    let weightedIncome = 0;
    let weightedExpenses = 0;
    let incomeWeightSum = 0;
    let expenseWeightSum = 0;

    transactions.forEach((txn, index) => {
      // Weight increases linearly (most recent = highest weight)
      const weight = (index + 1) / transactions.length;
      const amount = Math.abs(parseFloat(txn.amount));

      if (txn.type === 'income' || parseFloat(txn.amount) < 0) {
        weightedIncome += amount * weight;
        incomeWeightSum += weight;
      } else {
        weightedExpenses += amount * weight;
        expenseWeightSum += weight;
      }
    });

    return {
      income: incomeWeightSum > 0 ? weightedIncome / incomeWeightSum : 0,
      expenses: expenseWeightSum > 0 ? weightedExpenses / expenseWeightSum : 0
    };
  }

  /**
   * Predict daily cash flow based on patterns with improved logic
   */
  predictDailyCashFlow(date, analysis, recentTransactions) {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const weekPatterns = analysis.dayOfWeekPatterns[dayOfWeek] || { income: [], expenses: [] };
    const monthPatterns = analysis.dayOfMonthPatterns?.[dayOfMonth] || { income: [], expenses: [] };

    // IMPROVEMENT: Combine day-of-week and day-of-month patterns
    // Day of month is more important for recurring bills (rent, salary, etc.)
    let avgIncome, avgExpenses;

    if (monthPatterns.income.length > 0) {
      // Use day-of-month pattern if available (more specific)
      avgIncome = monthPatterns.income.reduce((a, b) => a + b, 0) / monthPatterns.income.length;
    } else if (weekPatterns.income.length > 0) {
      // Fall back to day-of-week pattern
      avgIncome = weekPatterns.income.reduce((a, b) => a + b, 0) / weekPatterns.income.length;
    } else {
      // Fall back to overall average
      avgIncome = analysis.monthlyAverages.income;
    }

    if (monthPatterns.expenses.length > 0) {
      avgExpenses = monthPatterns.expenses.reduce((a, b) => a + b, 0) / monthPatterns.expenses.length;
    } else if (weekPatterns.expenses.length > 0) {
      avgExpenses = weekPatterns.expenses.reduce((a, b) => a + b, 0) / weekPatterns.expenses.length;
    } else {
      avgExpenses = analysis.monthlyAverages.expenses;
    }

    // IMPROVEMENT 1: Add recurring transactions on specific dates
    analysis.recurringTransactions.forEach(recurring => {
      // Check if this is a monthly recurring transaction (like rent on 1st, salary on 25th)
      if (recurring.frequency >= 2) {
        // Assume recurring expenses happen on 1st, 5th, 10th, 15th, 20th, 25th
        const recurringDays = [1, 5, 10, 15, 20, 25];
        if (recurringDays.includes(dayOfMonth)) {
          if (recurring.amount > 0) {
            avgExpenses += recurring.amount / 6; // Distribute across likely days
          }
        }
      }
    });

    // IMPROVEMENT 2: Calculate trend from recent transactions
    const trend = this.calculateTrend(recentTransactions);
    avgIncome *= (1 + trend.incomeTrend);
    avgExpenses *= (1 + trend.expenseTrend);

    // IMPROVEMENT 3: Use weighted variance based on historical volatility
    // Prefer month patterns for volatility if available
    const incomeData = monthPatterns.income.length > 0 ? monthPatterns.income : weekPatterns.income;
    const expenseData = monthPatterns.expenses.length > 0 ? monthPatterns.expenses : weekPatterns.expenses;
    
    const incomeVolatility = this.calculateVolatility(incomeData);
    const expenseVolatility = this.calculateVolatility(expenseData);
    
    const income = avgIncome * (1 + (Math.random() - 0.5) * incomeVolatility);
    const expenses = avgExpenses * (1 + (Math.random() - 0.5) * expenseVolatility);

    // IMPROVEMENT 4: Better confidence calculation
    const weekDataPoints = weekPatterns.income.length + weekPatterns.expenses.length;
    const monthDataPoints = monthPatterns.income.length + monthPatterns.expenses.length;
    const totalDataPoints = weekDataPoints + monthDataPoints;
    
    // Higher confidence if we have both week and month patterns
    const baseConfidence = Math.min(0.90, 0.4 + (totalDataPoints / 40)); // Max 90% with 20+ data points
    
    // Boost confidence if we have month-specific data (more reliable for recurring)
    const monthBoost = monthDataPoints > 0 ? 1.1 : 1.0;
    
    // Reduce confidence for far future dates
    const daysAhead = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
    const timeDecay = Math.max(0.5, 1 - (daysAhead / 180)); // Confidence drops over time
    
    const confidence = Math.min(0.95, baseConfidence * monthBoost * timeDecay);

    return {
      income: Math.max(0, income),
      expenses: Math.max(0, expenses),
      netCashFlow: income - expenses,
      confidence: Math.max(0.3, Math.min(0.95, confidence))
    };
  }

  /**
   * Calculate trend from recent transactions (growth/decline)
   */
  calculateTrend(transactions) {
    if (transactions.length < 10) {
      return { incomeTrend: 0, expenseTrend: 0 };
    }

    // Split into first half and second half
    const midPoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midPoint);
    const secondHalf = transactions.slice(midPoint);

    const firstIncome = firstHalf.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    const secondIncome = secondHalf.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const firstExpense = firstHalf.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    const secondExpense = secondHalf.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const incomeTrend = firstIncome > 0 ? (secondIncome - firstIncome) / firstIncome : 0;
    const expenseTrend = firstExpense > 0 ? (secondExpense - firstExpense) / firstExpense : 0;

    // Cap trends at ±20% to avoid extreme predictions
    return {
      incomeTrend: Math.max(-0.2, Math.min(0.2, incomeTrend)),
      expenseTrend: Math.max(-0.2, Math.min(0.2, expenseTrend))
    };
  }

  /**
   * Calculate volatility (standard deviation) of amounts
   */
  calculateVolatility(amounts) {
    if (amounts.length < 2) return 0.15; // Default 15% variance

    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const squaredDiffs = amounts.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Return coefficient of variation (std dev / mean), capped at 30%
    const volatility = mean > 0 ? stdDev / mean : 0.15;
    return Math.min(0.3, volatility);
  }

  /**
   * Find potential tax deductions from transactions
   */
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

module.exports = new AICategorizationService();
