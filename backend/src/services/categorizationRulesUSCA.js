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
      // Fast Food Chains (US)
      'mcdonalds', "mcdonald's", 'burger king', 'wendys', "wendy's",
      'taco bell', 'kfc', 'popeyes', 'chick-fil-a', 'chickfila',
      'five guys', 'in-n-out', 'shake shack', 'chipotle',
      'panera bread', 'subway', 'jimmy johns', "jimmy john's",
      'arbys', "arby's", 'sonic drive', 'dairy queen',
      'white castle', 'jack in the box', 'carls jr', "carl's jr",
      'hardees', "hardee's", 'whataburger', 'culvers', "culver's",
      'raising canes', "raising cane's", 'zaxbys', "zaxby's",
      'del taco', 'el pollo loco', 'wingstop', 'wing stop',
      'jersey mikes', "jersey mike's", 'firehouse subs',
      'potbelly', 'which wich', 'blaze pizza', 'mod pizza',
      'smashburger', 'habit burger', 'fatburger',
      // Fast Food (Canada)
      'tim hortons', 'tims', 'a&w', 'harveys', "harvey's",
      'swiss chalet', 'st-hubert', 'mary browns', "mary brown's",
      // Coffee Shops
      'starbucks', 'dunkin', 'dunkin donuts', 'tim hortons',
      'peets coffee', "peet's coffee", 'caribou coffee',
      'dutch bros', 'coffee bean', 'second cup',
      'philz coffee', 'blue bottle', 'intelligentsia',
      'la colombe', 'stumptown', 'peets', 'biggby coffee',
      // Casual Dining (US)
      'applebees', "applebee's", 'chilis', "chili's",
      'olive garden', 'red lobster', 'outback steakhouse',
      'texas roadhouse', 'buffalo wild wings', 'hooters',
      'dennys', "denny's", 'ihop', 'cracker barrel',
      'cheesecake factory', 'pf changs', "p.f. chang's",
      'tgi fridays', "tgi friday's", 'red robin',
      'longhorn steakhouse', 'logans roadhouse', "logan's roadhouse",
      'bonefish grill', 'carrabbas', "carrabba's",
      'yard house', 'california pizza kitchen', 'cpk',
      'benihana', 'flemings', "fleming's", 'ruths chris', "ruth's chris",
      'mortons', "morton's", 'capital grille', 'seasons 52',
      'bahama breeze', 'maggianos', "maggiano's",
      // Casual Dining (Canada)
      'boston pizza', 'bp', 'east side marios', "east side mario's",
      'the keg', 'keg steakhouse', 'milestones', 'moxies',
      'earls', 'cactus club', 'joeys', "joey's",
      // Pizza
      'pizza hut', 'dominos', "domino's", 'papa johns', "papa john's",
      'little caesars', 'marcos pizza', "marco's pizza",
      'pizza pizza', 'boston pizza', 'papa murphys', "papa murphy's",
      'hungry howies', "hungry howie's", 'cicis', "cici's pizza",
      'round table', 'godfathers', "godfather's pizza",
      'pizza nova', 'pizzaiolo', '241 pizza',
      // Food Delivery
      'doordash', 'uber eats', 'ubereats', 'grubhub',
      'postmates', 'seamless', 'skip the dishes', 'skipthedishes',
      'instacart', 'gopuff', 'caviar', 'delivery.com',
      // Bakery & Desserts
      'krispy kreme', 'dunkin donuts', 'baskin robbins',
      'cold stone', 'marble slab', 'dairy queen',
      'carvel', 'rita\'s italian ice', 'yogurtland',
      'pinkberry', 'red mango', 'sweetfrog', 'tcby',
      'nothing bundt cakes', 'crumbl', 'insomnia cookies',
      // Grocery Stores (when buying prepared food/deli)
      'whole foods deli', 'trader joes prepared', 'wegmans cafe',
      // Restaurants (Generic)
      'restaurant', 'cafe', 'bistro', 'grill', 'diner',
      'eatery', 'food court', 'catering', 'cafeteria',
      'steakhouse', 'seafood', 'sushi bar', 'buffet'
    ],

    // === OFFICE SUPPLIES ===
    'Office Supplies': [
      // Office Supply Stores (US)
      'staples', 'office depot', 'officedepot', 'officemax',
      'amazon - office', 'amazon office', 'amazon.com office',
      'uline', 'quill', 'viking office', 'w.b. mason',
      'paper source', 'container store',
      // Office Supply Stores (Canada)
      'grand & toy', 'bureau en gros', 'staples canada',
      // Print & Copy Services
      'fedex office', 'ups store', 'kinkos', "kinko's",
      'print shop', 'copy center', 'vistaprint', 'moo',
      'overnight prints', 'gotprint', 'printful', 'printify',
      // Shipping Supplies
      'uline', 'packagingsupplies', 'uhaul boxes',
      // Furniture (Office)
      'ikea office', 'wayfair office', 'herman miller',
      'steelcase', 'hon', 'haworth', 'knoll'
    ],

    // === MARKETING & ADVERTISING ===
    'Marketing': [
      // Digital Advertising Platforms
      'google ads', 'google adwords', 'google advertising',
      'facebook ads', 'meta ads', 'instagram ads',
      'linkedin ads', 'linkedin advertising',
      'twitter ads', 'x ads', 'tiktok ads',
      'pinterest ads', 'snapchat ads', 'reddit ads',
      'microsoft advertising', 'bing ads', 'amazon ads',
      'youtube ads', 'quora ads', 'taboola', 'outbrain',
      // Email Marketing
      'mailchimp', 'constant contact', 'sendinblue',
      'convertkit', 'activecampaign', 'aweber',
      'klaviyo', 'drip', 'getresponse', 'mailerlite',
      // Social Media Management
      'hootsuite', 'buffer', 'sprout social', 'later',
      'planoly', 'socialbee', 'agorapulse', 'sendible',
      // SEO & Analytics Tools
      'semrush', 'moz', 'ahrefs', 'google analytics',
      'similarweb', 'spyfu', 'majestic', 'screaming frog',
      'ubersuggest', 'serpstat',
      // Design & Creative Tools
      'canva', 'canva pro', 'adobe creative', 'figma',
      'sketch', 'invision', 'crello', 'visme',
      'piktochart', 'snappa', 'placeit', 'renderforest',
      // Marketing Automation
      'hubspot', 'marketo', 'pardot', 'eloqua',
      'autopilot', 'customer.io', 'intercom',
      // Advertising Agencies
      'marketing agency', 'ad agency', 'creative agency',
      'digital agency', 'media buying',
      // Traditional Advertising
      'billboard', 'radio ad', 'tv ad', 'newspaper ad',
      'magazine ad', 'direct mail', 'print ad', 'outdoor advertising'
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
      // Ride Sharing & Taxis
      'uber', 'uber trip', 'uber ride', 'lyft', 'via', 'curb taxi',
      'taxi', 'cab', 'yellow cab', 'checker cab',
      'waymo', 'cruise', 'gett', 'juno',
      // Airlines (US Major)
      'american airlines', 'aa', 'delta', 'delta air lines',
      'united airlines', 'united', 'southwest', 'southwest airlines',
      'jetblue', 'alaska airlines', 'hawaiian airlines',
      // Airlines (US Budget)
      'spirit airlines', 'frontier airlines', 'allegiant',
      'sun country', 'avelo', 'breeze airways',
      // Airlines (Canada)
      'air canada', 'westjet', 'porter airlines',
      'air transat', 'flair airlines', 'swoop',
      // Airlines (International operating in US/CA)
      'british airways', 'lufthansa', 'air france',
      'klm', 'emirates', 'qatar airways', 'etihad',
      // Hotels (Major Chains)
      'marriott', 'hilton', 'hyatt', 'ihg', 'intercontinental',
      'holiday inn', 'holiday inn express', 'crowne plaza',
      'best western', 'comfort inn', 'comfort suites',
      'quality inn', 'sleep inn', 'clarion',
      'la quinta', 'motel 6', 'super 8', 'days inn',
      'hampton inn', 'courtyard', 'residence inn',
      'fairfield inn', 'springhill suites', 'towneplace',
      'homewood suites', 'home2 suites', 'embassy suites',
      'doubletree', 'waldorf astoria', 'conrad',
      'fairmont', 'four seasons', 'sheraton', 'westin',
      'w hotel', 'st regis', 'luxury collection',
      'aloft', 'element', 'moxy', 'ac hotel',
      'radisson', 'ramada', 'wyndham', 'travelodge',
      'red roof inn', 'extended stay', 'candlewood',
      // Hotels (Canada)
      'delta hotels', 'sandman', 'coast hotels',
      // Booking Sites & Travel Agencies
      'expedia', 'booking.com', 'hotels.com', 'priceline',
      'kayak', 'orbitz', 'travelocity', 'hotwire',
      'cheapoair', 'onetravel', 'tripadvisor',
      'airbnb', 'vrbo', 'homeaway', 'vacasa',
      // Car Rental
      'enterprise', 'hertz', 'avis', 'budget',
      'national car', 'alamo', 'thrifty', 'dollar rent',
      'sixt', 'payless', 'advantage', 'fox rent a car',
      'zipcar', 'turo', 'getaround',
      // Gas Stations (US)
      'shell', 'chevron', 'exxon', 'mobil', 'bp',
      'texaco', 'arco', 'sunoco', '76', 'circle k',
      'speedway', 'marathon', 'valero', 'phillips 66',
      'conoco', 'citgo', 'gulf', 'hess', 'racetrac',
      'wawa', 'sheetz', 'kwik trip', 'casey\'s',
      'maverik', 'loves', 'pilot', 'flying j',
      // Gas Stations (Canada)
      'petro-canada', 'esso', 'husky', 'shell canada',
      'canadian tire gas', 'ultramar', 'fas gas',
      'co-op gas', 'mohawk', 'pioneer',
      // Parking & Tolls
      'parking', 'parkade', 'park n fly', 'park \'n fly',
      'spothero', 'parkwhiz', 'bestparking',
      'toll', 'ez pass', 'ezpass', 'fastrak', 'sunpass',
      '407 etr', 'ipass', 'txtag', 'peach pass',
      // Public Transit
      'amtrak', 'via rail', 'greyhound', 'megabus',
      'bolt bus', 'flixbus', 'peter pan',
      // Local Transit (US)
      'metro', 'mta', 'bart', 'caltrain', 'metra',
      'septa', 'wmata', 'marta', 'trimet',
      'rtd', 'metro transit', 'king county metro',
      // Local Transit (Canada)
      'go transit', 'ttc', 'stm', 'translink',
      'oc transpo', 'calgary transit', 'edmonton transit',
      // Travel Services
      'tsa precheck', 'global entry', 'clear',
      'lounge pass', 'priority pass'
    ],

    // === OPERATIONS / GENERAL BUSINESS ===
    'Operations': [
      // Retail (General Supplies - US)
      'walmart', 'target', 'costco', 'sams club', "sam's club",
      'bjs wholesale', "bj's wholesale",
      'home depot', 'lowes', "lowe's", 'menards',
      'ace hardware', 'true value', 'do it best',
      'harbor freight', 'northern tool', 'tractor supply',
      'rural king', 'fleet farm', 'blain\'s farm',
      // Retail (Canada)
      'canadian tire', 'home hardware', 'rona',
      'princess auto', 'kent building supplies',
      'timber mart', 'castle building centres',
      // Grocery/Wholesale (for business supplies)
      'costco business', 'restaurant depot',
      'cash and carry', 'smart foodservice',
      // E-commerce
      'amazon', 'amazon.com', 'amazon.ca', 'amazon prime',
      'amazon business', 'ebay', 'etsy', 'newegg',
      'alibaba', 'aliexpress', 'dhgate', 'banggood',
      'overstock', 'wayfair', 'chewy',
      // Electronics & Tech Supplies
      'best buy', 'microcenter', 'micro center',
      'frys electronics', "fry's", 'b&h photo',
      'adorama', 'newegg', 'tigerdirect',
      'canada computers', 'memory express',
      'sparkfun', 'adafruit', 'digikey', 'mouser',
      'newark', 'arrow electronics', 'avnet',
      // Shipping & Logistics
      'fedex', 'ups', 'usps', 'dhl', 'canada post',
      'purolator', 'canpar', 'loomis', 'gls',
      'ontrac', 'lasership', 'amazon logistics',
      // Payment Processing Fees
      'stripe fee', 'paypal fee', 'square fee',
      'shopify fee', 'payment processing',
      // Credit Card Payments
      'credit card payment', 'visa payment', 'mastercard payment',
      'amex payment', 'discover payment', 'cc payment',
      // Bank Fees
      'bank fee', 'service charge', 'monthly fee',
      'overdraft fee', 'wire fee', 'atm fee',
      'nsf fee', 'returned item', 'maintenance fee',
      // Equipment & Maintenance
      'maintenance', 'repair', 'equipment', 'machinery',
      'tools', 'hardware', 'supplies', 'parts',
      'grainger', 'fastenal', 'msc industrial',
      'zoro', 'global industrial', 'webstaurant',
      // Janitorial & Cleaning
      'cleaning supplies', 'janitorial', 'sanitizer',
      'paper towels', 'toilet paper', 'soap',
      // Safety Equipment
      'safety equipment', 'ppe', 'first aid',
      'fire extinguisher', 'safety gear'
    ],

    // === SOFTWARE & SUBSCRIPTIONS ===
    'Software': [
      // Productivity Suites
      'microsoft 365', 'office 365', 'microsoft office',
      'google workspace', 'g suite', 'gsuite',
      'apple icloud', 'icloud+', 'icloud storage',
      // Communication & Collaboration
      'slack', 'slack technologies', 'zoom', 'zoom.us',
      'microsoft teams', 'google meet', 'webex', 'cisco webex',
      'goto meeting', 'gotomeeting', 'ringcentral',
      'dialpad', '8x8', 'vonage', 'nextiva',
      'discord nitro', 'telegram premium',
      // Project Management
      'asana', 'trello', 'monday.com', 'clickup',
      'basecamp', 'wrike', 'smartsheet', 'airtable',
      'notion', 'coda', 'confluence', 'jira',
      // CRM & Sales
      'salesforce', 'hubspot', 'zoho', 'zoho crm',
      'pipedrive', 'freshsales', 'close', 'copper',
      'insightly', 'nimble', 'agile crm',
      // Accounting & Finance
      'quickbooks', 'quickbooks online', 'xero', 'freshbooks',
      'wave', 'sage', 'netsuite', 'bill.com',
      'expensify', 'concur', 'ramp', 'brex',
      'divvy', 'airbase', 'tipalti',
      // Design & Creative
      'adobe', 'adobe creative cloud', 'adobe acrobat',
      'figma', 'sketch', 'invision', 'framer',
      'canva pro', 'affinity', 'corel',
      // Cloud Storage
      'dropbox', 'dropbox business', 'box', 'box.com',
      'google drive', 'google one', 'onedrive',
      'sync.com', 'pcloud', 'icedrive', 'backblaze',
      // Development & DevOps
      'github', 'gitlab', 'bitbucket', 'circleci',
      'travis ci', 'jenkins', 'datadog', 'new relic',
      'sentry', 'bugsnag', 'rollbar', 'pagerduty',
      'opsgenie', 'statuspage', 'pingdom',
      // Cloud Infrastructure
      'aws', 'amazon web services', 'azure', 'microsoft azure',
      'google cloud', 'gcp', 'heroku', 'digitalocean',
      'linode', 'vultr', 'cloudflare', 'fastly',
      'vercel', 'netlify', 'render', 'railway',
      // Domain & Hosting
      'godaddy', 'namecheap', 'bluehost', 'hostgator',
      'siteground', 'dreamhost', 'a2 hosting',
      'inmotion', 'hostinger', 'ionos',
      // Website Builders
      'squarespace', 'wix', 'weebly', 'webflow',
      'wordpress', 'wordpress.com', 'shopify',
      'bigcommerce', 'woocommerce',
      // Security & Password Management
      'norton', 'mcafee', 'kaspersky', 'malwarebytes',
      'bitdefender', 'avast', 'avg', 'eset',
      'lastpass', '1password', 'dashlane', 'bitwarden',
      'keeper', 'nordpass', 'roboform',
      // VPN & Privacy
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost',
      'private internet access', 'pia', 'protonvpn',
      'tunnelbear', 'windscribe', 'mullvad',
      // Email Services
      'gsuite', 'microsoft exchange', 'protonmail',
      'fastmail', 'zoho mail', 'rackspace email',
      // Analytics & SEO
      'google analytics', 'mixpanel', 'amplitude',
      'heap', 'segment', 'hotjar', 'fullstory',
      'semrush', 'ahrefs', 'moz', 'screaming frog',
      // Customer Support
      'zendesk', 'intercom', 'freshdesk', 'help scout',
      'drift', 'crisp', 'livechat', 'olark',
      'tawk.to', 'tidio', 'gorgias',
      // HR & Recruiting
      'bamboohr', 'gusto', 'rippling', 'namely',
      'workday', 'adp', 'paychex', 'zenefits',
      'greenhouse', 'lever', 'jobvite', 'workable',
      // Learning & Training
      'linkedin learning', 'udemy business', 'coursera',
      'pluralsight', 'skillshare', 'masterclass',
      // Other SaaS
      'calendly', 'acuity', 'typeform', 'surveymonkey',
      'mailchimp', 'sendgrid', 'twilio', 'zapier',
      'ifttt', 'make', 'integromat', 'n8n'
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
      'ach credit', 'wire in', 'transfer from',
      'refund received', 'reimbursement', 'commission received',
      'royalty', 'dividend', 'interest income'
    ],

    'Meals & Entertainment': [
      'restaurant', 'cafe', 'coffee', 'diner', 'bistro',
      'grill', 'bar', 'pub', 'tavern', 'eatery',
      'food', 'meal', 'lunch', 'dinner', 'breakfast',
      'pizza', 'burger', 'sandwich', 'sushi', 'taco',
      'catering', 'delivery', 'takeout', 'drive-thru',
      'bakery', 'dessert', 'ice cream', 'donut',
      'fast food', 'quick service', 'food truck',
      'buffet', 'brunch', 'appetizer', 'entree'
    ],

    'Office Supplies': [
      'office supply', 'stationery', 'paper', 'pens',
      'printer', 'ink', 'toner', 'desk', 'chair',
      'filing', 'folder', 'binder', 'notebook',
      'stapler', 'tape', 'scissors', 'calculator',
      'whiteboard', 'marker', 'highlighter', 'post-it',
      'envelope', 'label', 'clipboard', 'organizer',
      'desk pad', 'mouse pad', 'keyboard', 'monitor',
      'office furniture', 'filing cabinet', 'bookshelf'
    ],

    'Marketing': [
      'advertising', 'marketing', 'promotion', 'campaign',
      'ad spend', 'google ads', 'facebook ads', 'social media',
      'seo', 'sem', 'ppc', 'email marketing',
      'content marketing', 'influencer', 'sponsorship',
      'billboard', 'radio ad', 'tv ad', 'print ad',
      'digital marketing', 'brand', 'branding',
      'lead generation', 'conversion', 'analytics',
      'retargeting', 'remarketing', 'display ad',
      'video ad', 'native ad', 'affiliate marketing'
    ],

    'Utilities': [
      'electric', 'electricity', 'power', 'hydro',
      'gas', 'water', 'sewer', 'trash', 'waste',
      'internet', 'phone', 'mobile', 'cell', 'wireless',
      'cable', 'satellite', 'broadband', 'wifi',
      'utility', 'telecom', 'communication',
      'heating', 'cooling', 'hvac', 'energy',
      'recycling', 'garbage', 'sanitation'
    ],

    'Travel': [
      'airline', 'flight', 'airfare', 'airport',
      'hotel', 'motel', 'lodging', 'accommodation',
      'rental car', 'car rental', 'uber', 'lyft', 'taxi',
      'parking', 'toll', 'gas station', 'fuel',
      'train', 'rail', 'bus', 'transit',
      'travel', 'trip', 'business travel',
      'mileage', 'per diem', 'baggage', 'luggage',
      'conference travel', 'airbnb', 'vacation rental'
    ],

    'Operations': [
      'supplies', 'equipment', 'machinery', 'tools',
      'maintenance', 'repair', 'service', 'parts',
      'shipping', 'freight', 'delivery', 'courier',
      'bank fee', 'service charge', 'transaction fee',
      'credit card payment', 'loan payment',
      'inventory', 'wholesale', 'bulk purchase',
      'packaging', 'materials', 'components',
      'merchant fee', 'processing fee', 'atm fee'
    ],

    'Software': [
      'software', 'subscription', 'saas', 'cloud',
      'hosting', 'domain', 'website', 'app',
      'license', 'microsoft', 'adobe', 'google',
      'aws', 'azure', 'dropbox', 'slack', 'zoom',
      'api', 'platform', 'service', 'tool',
      'crm', 'erp', 'analytics', 'automation',
      'integration', 'plugin', 'extension', 'add-on'
    ],

    'Professional Services': [
      'legal', 'attorney', 'lawyer', 'law firm',
      'accounting', 'accountant', 'cpa', 'bookkeeping',
      'consulting', 'consultant', 'advisory',
      'freelance', 'contractor', 'agency',
      'professional fee', 'service fee',
      'audit', 'tax preparation', 'financial advisor',
      'business coach', 'mentor', 'expert',
      'architect', 'engineer', 'designer'
    ],

    'Payroll': [
      'payroll', 'salary', 'wages', 'employee',
      'staff', 'paycheck', 'compensation',
      'bonus', 'commission', 'overtime',
      'benefits', 'health insurance', '401k',
      'retirement', 'fica', 'withholding',
      'garnishment', 'direct deposit', 'pay stub'
    ],

    'Rent': [
      'rent', 'lease', 'landlord', 'property',
      'office space', 'warehouse', 'retail space',
      'commercial', 'coworking', 'storage',
      'facility', 'building', 'premises',
      'real estate', 'property management'
    ],

    'Insurance': [
      'insurance', 'premium', 'policy', 'coverage',
      'liability', 'workers comp', 'health insurance',
      'business insurance', 'auto insurance',
      'property insurance', 'general liability',
      'professional liability', 'e&o', 'umbrella',
      'cyber insurance', 'data breach', 'bonding'
    ],

    'Taxes': [
      'tax', 'irs', 'cra', 'federal tax', 'state tax',
      'sales tax', 'gst', 'hst', 'pst', 'vat',
      'income tax', 'payroll tax', 'property tax',
      'estimated tax', 'quarterly tax',
      'franchise tax', 'excise tax', 'use tax',
      'tax filing', 'tax payment', 'tax penalty'
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
