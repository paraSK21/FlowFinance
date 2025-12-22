// Comprehensive US/Canada Business Transaction Categorization Rules
// Updated: December 2025

module.exports = {
  // Merchant-to-Category Mappings (Exact Match - Highest Priority)
  merchantMappings: {
    // === REVENUE / INCOME ===
    'Revenue': [
      // Payment Processors & Gateways
      'stripe payout', 'stripe transfer', 'stripe settlement',
      'square deposit', 'square payout', 'square inc',
      'paypal transfer', 'paypal payout', 'paypal inc',
      'shopify payments', 'shopify payout',
      'venmo payment', 'zelle payment',
      'quickbooks payment',
      // Client/Customer Payments
      'client payment', 'customer payment', 'invoice payment',
      'payment received', 'deposit from', 'transfer from',
      // Salary/Payroll (for employees)
      'salary credit', 'payroll deposit', 'direct deposit',
      'ach credit', 'wire transfer in'
    ],

    // === MEALS & ENTERTAINMENT (50% Deductible) ===
    'Meals & Entertainment': [
      // Fast Food Chains
      'mcdonalds', "mcdonald's", 'burger king', 'wendys', "wendy's",
      'taco bell', 'kfc', 'popeyes', 'chick-fil-a', 'chickfila',
      'five guys', 'in-n-out', 'shake shack', 'chipotle',
      'panera bread', 'subway', 'jimmy johns', "jimmy john's",
      'arbys', "arby's", 'sonic drive', 'dairy queen',
      // Coffee Shops
      'starbucks', 'dunkin', 'dunkin donuts', 'tim hortons',
      'peets coffee', "peet's coffee", 'caribou coffee',
      'dutch bros', 'coffee bean', 'second cup',
      // Casual Dining
      'applebees', "applebee's", 'chilis', "chili's",
      'olive garden', 'red lobster', 'outback steakhouse',
      'texas roadhouse', 'buffalo wild wings', 'hooters',
      'dennys', "denny's", 'ihop', 'cracker barrel',
      'cheesecake factory', 'pf changs', "p.f. chang's",
      // Pizza
      'pizza hut', 'dominos', "domino's", 'papa johns', "papa john's",
      'little caesars', 'marcos pizza', "marco's pizza",
      'pizza pizza', 'boston pizza',
      // Food Delivery
      'doordash', 'uber eats', 'ubereats', 'grubhub',
      'postmates', 'seamless', 'skip the dishes', 'skipthedishes',
      // Restaurants (Generic)
      'restaurant', 'cafe', 'bistro', 'grill', 'diner',
      'eatery', 'food court', 'catering'
    ],

    // === OFFICE SUPPLIES ===
    'Office Supplies': [
      'staples', 'office depot', 'officedepot', 'officemax',
      'grand & toy', 'bureau en gros',
      'amazon - office', 'amazon office', 'amazon.com office',
      'uline', 'quill', 'viking office',
      'paper source', 'fedex office', 'ups store',
      'kinkos', "kinko's", 'print shop', 'copy center'
    ],

    // === MARKETING & ADVERTISING ===
    'Marketing': [
      // Digital Advertising
      'google ads', 'google adwords', 'google advertising',
      'facebook ads', 'meta ads', 'instagram ads',
      'linkedin ads', 'linkedin advertising',
      'twitter ads', 'x ads', 'tiktok ads',
      'pinterest ads', 'snapchat ads', 'reddit ads',
      'microsoft advertising', 'bing ads',
      // Marketing Tools
      'mailchimp', 'constant contact', 'hubspot',
      'hootsuite', 'buffer', 'sprout social',
      'canva', 'adobe creative', 'semrush',
      'moz', 'ahrefs', 'google analytics',
      // Traditional Advertising
      'billboard', 'radio ad', 'tv ad', 'newspaper ad',
      'magazine ad', 'direct mail', 'print ad'
    ],

    // === UTILITIES ===
    'Utilities': [
      // Electric Companies (US)
      'pge', 'pg&e', 'pacific gas', 'con edison', 'coned',
      'duke energy', 'southern company', 'exelon',
      'dominion energy', 'american electric', 'aep',
      'xcel energy', 'entergy', 'firstenergy',
      // Electric Companies (Canada)
      'hydro one', 'bc hydro', 'hydro quebec', 'hydro-quebec',
      'toronto hydro', 'manitoba hydro', 'saskpower',
      'nova scotia power', 'nb power', 'newfoundland power',
      // Telecom (US)
      'verizon', 'att', 'at&t', 't-mobile', 'tmobile',
      'sprint', 'comcast', 'xfinity', 'spectrum',
      'cox communications', 'centurylink', 'frontier',
      // Telecom (Canada)
      'rogers', 'bell canada', 'telus', 'shaw',
      'videotron', 'freedom mobile', 'fido',
      // Internet/Cable
      'internet bill', 'cable bill', 'wifi bill',
      'broadband', 'fiber optic',
      // Water/Gas
      'water bill', 'water utility', 'gas bill',
      'natural gas', 'propane', 'heating oil',
      // Generic
      'utility payment', 'electric bill', 'power bill',
      'phone bill', 'mobile bill', 'cell phone'
    ],

    // === TRAVEL ===
    'Travel': [
      // Ride Sharing
      'uber', 'lyft', 'via', 'curb taxi',
      // Airlines (US)
      'american airlines', 'delta', 'united airlines',
      'southwest', 'jetblue', 'alaska airlines',
      'spirit airlines', 'frontier airlines', 'allegiant',
      // Airlines (Canada)
      'air canada', 'westjet', 'porter airlines',
      'air transat', 'flair airlines',
      // Hotels
      'marriott', 'hilton', 'hyatt', 'ihg', 'intercontinental',
      'holiday inn', 'best western', 'comfort inn',
      'la quinta', 'motel 6', 'super 8', 'days inn',
      'hampton inn', 'courtyard', 'residence inn',
      'fairmont', 'four seasons', 'sheraton',
      // Booking Sites
      'expedia', 'booking.com', 'hotels.com', 'priceline',
      'kayak', 'orbitz', 'travelocity', 'hotwire',
      'airbnb', 'vrbo', 'homeaway',
      // Car Rental
      'enterprise', 'hertz', 'avis', 'budget',
      'national car', 'alamo', 'thrifty', 'dollar rent',
      // Gas Stations
      'shell', 'chevron', 'exxon', 'mobil', 'bp',
      'texaco', 'arco', 'sunoco', '76', 'circle k',
      'petro-canada', 'esso', 'husky', 'canadian tire gas',
      // Parking & Tolls
      'parking', 'parkade', 'park n fly',
      'toll', 'ez pass', 'fastrak', '407 etr',
      // Rail/Bus
      'amtrak', 'via rail', 'greyhound', 'megabus',
      'bolt bus', 'go transit', 'ttc', 'metro'
    ],

    // === OPERATIONS / GENERAL BUSINESS ===
    'Operations': [
      // Retail (General Supplies)
      'walmart', 'target', 'costco', 'sams club', "sam's club",
      'bjs wholesale', "bj's wholesale",
      'canadian tire', 'home hardware', 'rona', 'lowes', "lowe's",
      'home depot', 'menards', 'ace hardware',
      // E-commerce
      'amazon', 'amazon.com', 'amazon.ca', 'amazon prime',
      'ebay', 'etsy', 'alibaba', 'aliexpress',
      // Shipping & Logistics
      'fedex', 'ups', 'usps', 'dhl', 'canada post',
      'purolator', 'canpar',
      // Credit Card Payments
      'credit card payment', 'visa payment', 'mastercard payment',
      'amex payment', 'discover payment',
      // Bank Fees
      'bank fee', 'service charge', 'monthly fee',
      'overdraft fee', 'wire fee', 'atm fee',
      // Equipment & Maintenance
      'maintenance', 'repair', 'equipment', 'machinery',
      'tools', 'hardware', 'supplies'
    ],

    // === SOFTWARE & SUBSCRIPTIONS ===
    'Software': [
      // Business Software
      'microsoft 365', 'office 365', 'microsoft office',
      'google workspace', 'g suite', 'gsuite',
      'adobe', 'adobe creative cloud', 'adobe acrobat',
      'salesforce', 'hubspot', 'zoho',
      'quickbooks', 'xero', 'freshbooks', 'wave',
      'slack', 'zoom', 'microsoft teams',
      'dropbox', 'box', 'google drive',
      'github', 'gitlab', 'bitbucket',
      'aws', 'amazon web services', 'azure', 'google cloud',
      'heroku', 'digitalocean', 'linode',
      // Domain & Hosting
      'godaddy', 'namecheap', 'bluehost', 'hostgator',
      'siteground', 'dreamhost', 'squarespace', 'wix',
      'wordpress', 'shopify',
      // Security & Tools
      'norton', 'mcafee', 'kaspersky', 'malwarebytes',
      'lastpass', '1password', 'dashlane'
    ],

    // === PROFESSIONAL SERVICES ===
    'Professional Services': [
      'legal', 'lawyer', 'attorney', 'law firm',
      'accounting', 'accountant', 'cpa', 'bookkeeper',
      'consultant', 'consulting', 'advisory',
      'freelancer', 'contractor', 'agency',
      'notary', 'paralegal', 'tax preparer'
    ],

    // === PAYROLL ===
    'Payroll': [
      'adp', 'paychex', 'gusto', 'quickbooks payroll',
      'payroll', 'salary', 'wages', 'employee payment',
      'staff payment', 'paycheck', 'direct deposit',
      'ceridian', 'dayforce', 'bamboohr'
    ],

    // === RENT ===
    'Rent': [
      'rent payment', 'lease payment', 'landlord',
      'property rent', 'office rent', 'warehouse rent',
      'commercial rent', 'retail space', 'coworking',
      'regus', 'wework', 'spaces'
    ],

    // === INSURANCE ===
    'Insurance': [
      // Health Insurance
      'blue cross', 'blue shield', 'aetna', 'cigna',
      'united healthcare', 'humana', 'kaiser',
      'anthem', 'wellcare', 'molina',
      'manulife', 'sun life', 'great-west life',
      // Business Insurance
      'state farm', 'allstate', 'geico', 'progressive',
      'farmers insurance', 'nationwide', 'liberty mutual',
      'travelers', 'chubb', 'hartford',
      'intact insurance', 'aviva', 'desjardins',
      // Generic
      'insurance premium', 'insurance payment',
      'liability insurance', 'workers comp', 'business insurance'
    ],

    // === TAXES ===
    'Taxes': [
      'irs', 'internal revenue', 'tax payment',
      'estimated tax', 'quarterly tax', 'federal tax',
      'state tax', 'sales tax', 'payroll tax',
      'cra', 'canada revenue', 'gst', 'hst', 'pst',
      'income tax', 'corporate tax', 'property tax'
    ]
  },

  // Keyword Patterns (Fuzzy Match - Medium Priority)
  categoryKeywords: {
    'Revenue': [
      'payout', 'settlement', 'deposit', 'payment received',
      'invoice paid', 'customer payment', 'client payment',
      'sales', 'income', 'revenue', 'earnings',
      'salary credit', 'payroll deposit', 'direct deposit',
      'ach credit', 'wire in', 'transfer from'
    ],

    'Meals & Entertainment': [
      'restaurant', 'cafe', 'coffee', 'diner', 'bistro',
      'grill', 'bar', 'pub', 'tavern', 'eatery',
      'food', 'meal', 'lunch', 'dinner', 'breakfast',
      'pizza', 'burger', 'sandwich', 'sushi', 'taco',
      'catering', 'delivery', 'takeout', 'drive-thru'
    ],

    'Office Supplies': [
      'office supply', 'stationery', 'paper', 'pens',
      'printer', 'ink', 'toner', 'desk', 'chair',
      'filing', 'folder', 'binder', 'notebook',
      'stapler', 'tape', 'scissors', 'calculator'
    ],

    'Marketing': [
      'advertising', 'marketing', 'promotion', 'campaign',
      'ad spend', 'google ads', 'facebook ads', 'social media',
      'seo', 'sem', 'ppc', 'email marketing',
      'content marketing', 'influencer', 'sponsorship',
      'billboard', 'radio ad', 'tv ad', 'print ad'
    ],

    'Utilities': [
      'electric', 'electricity', 'power', 'hydro',
      'gas', 'water', 'sewer', 'trash', 'waste',
      'internet', 'phone', 'mobile', 'cell', 'wireless',
      'cable', 'satellite', 'broadband', 'wifi',
      'utility', 'telecom', 'communication'
    ],

    'Travel': [
      'airline', 'flight', 'airfare', 'airport',
      'hotel', 'motel', 'lodging', 'accommodation',
      'rental car', 'car rental', 'uber', 'lyft', 'taxi',
      'parking', 'toll', 'gas station', 'fuel',
      'train', 'rail', 'bus', 'transit',
      'travel', 'trip', 'business travel'
    ],

    'Operations': [
      'supplies', 'equipment', 'machinery', 'tools',
      'maintenance', 'repair', 'service', 'parts',
      'shipping', 'freight', 'delivery', 'courier',
      'bank fee', 'service charge', 'transaction fee',
      'credit card payment', 'loan payment'
    ],

    'Software': [
      'software', 'subscription', 'saas', 'cloud',
      'hosting', 'domain', 'website', 'app',
      'license', 'microsoft', 'adobe', 'google',
      'aws', 'azure', 'dropbox', 'slack', 'zoom'
    ],

    'Professional Services': [
      'legal', 'attorney', 'lawyer', 'law firm',
      'accounting', 'accountant', 'cpa', 'bookkeeping',
      'consulting', 'consultant', 'advisory',
      'freelance', 'contractor', 'agency',
      'professional fee', 'service fee'
    ],

    'Payroll': [
      'payroll', 'salary', 'wages', 'employee',
      'staff', 'paycheck', 'compensation',
      'bonus', 'commission', 'overtime'
    ],

    'Rent': [
      'rent', 'lease', 'landlord', 'property',
      'office space', 'warehouse', 'retail space',
      'commercial', 'coworking'
    ],

    'Insurance': [
      'insurance', 'premium', 'policy', 'coverage',
      'liability', 'workers comp', 'health insurance',
      'business insurance', 'auto insurance'
    ],

    'Taxes': [
      'tax', 'irs', 'cra', 'federal tax', 'state tax',
      'sales tax', 'gst', 'hst', 'pst', 'vat',
      'income tax', 'payroll tax', 'property tax',
      'estimated tax', 'quarterly tax'
    ]
  },

  // Amount-based heuristics (Low Priority - Fallback)
  amountHeuristics: {
    // Large recurring amounts likely to be rent
    rent: {
      minAmount: 1000,
      maxAmount: 10000,
      recurring: true,
      description: 'Large monthly recurring payment'
    },
    // Small recurring amounts likely to be subscriptions
    software: {
      minAmount: 5,
      maxAmount: 500,
      recurring: true,
      description: 'Small recurring subscription'
    },
    // Very large one-time amounts
    equipment: {
      minAmount: 5000,
      maxAmount: 100000,
      recurring: false,
      description: 'Large capital expense'
    }
  }
};
