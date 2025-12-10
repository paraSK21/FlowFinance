require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Keys and Models\n');
  console.log('='.repeat(80));
  
  // Get API keys from env
  const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5
  ].filter(key => key && key.trim() !== '');
  
  console.log(`\n✓ Found ${apiKeys.length} API keys in .env file\n`);
  
  // Test with second API key (first one seems exhausted)
  console.log('Listing available models with API Key #2:\n');
  
  const genAI = new GoogleGenerativeAI(apiKeys[1] || apiKeys[0]);
  
  // List available models first
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeys[1] || apiKeys[0]}`);
    const data = await response.json();
    
    if (data.models) {
      console.log('Available models:');
      data.models.forEach(model => {
        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
          console.log(`  - ${model.name.replace('models/', '')}`);
        }
      });
      console.log('');
    }
  } catch (error) {
    console.log('Could not list models:', error.message);
  }
  
  // Models to test (in order of preference - lighter = more quota)
  const models = [
    'gemini-2.0-flash-lite',      // Lightest, most quota
    'gemini-flash-lite-latest',   // Alias for lite
    'gemini-2.0-flash',            // Standard flash
    'gemini-flash-latest',         // Alias for flash
    'gemini-2.5-flash'             // Latest flash
  ];
  
  console.log('Testing models:\n');
  let workingModel = null;
  
  for (const modelName of models) {
    try {
      console.log(`  Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Say "Hello" in one word');
      const response = result.response;
      const text = response.text();
      
      console.log(`    ✓ SUCCESS! Response: "${text.trim()}"`);
      workingModel = modelName;
      break;
    } catch (error) {
      console.log(`    ✗ FAILED: ${error.message}`);
    }
  }
  
  if (!workingModel) {
    console.log('\n❌ No working model found!');
    return;
  }
  
  console.log(`\n✅ Best working model: ${workingModel}\n`);
  console.log('='.repeat(80));
  
  // Test rate limits
  console.log('\n🚀 Testing Rate Limits (sending 20 requests)...\n');
  
  const model = genAI.getGenerativeModel({ model: workingModel });
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  const requestTimes = [];
  
  for (let i = 1; i <= 20; i++) {
    const reqStart = Date.now();
    try {
      await model.generateContent(`Categorize: Zomato food order. Reply with just the category name.`);
      const reqEnd = Date.now();
      const duration = reqEnd - reqStart;
      requestTimes.push(duration);
      successCount++;
      console.log(`  Request ${i}/20: ✓ Success (${duration}ms)`);
    } catch (error) {
      failCount++;
      const errorMsg = error.message.includes('429') || error.message.includes('quota') 
        ? 'RATE LIMIT HIT' 
        : error.message.substring(0, 50);
      console.log(`  Request ${i}/20: ✗ Failed (${errorMsg})`);
      
      if (error.message.includes('429') || error.message.includes('quota')) {
        console.log('\n⚠️ Rate limit reached! Testing fallback to next API key...\n');
        
        // Try next API key
        if (apiKeys.length > 1) {
          console.log('Switching to API Key #2...');
          const genAI2 = new GoogleGenerativeAI(apiKeys[1]);
          const model2 = genAI2.getGenerativeModel({ model: workingModel });
          
          try {
            await model2.generateContent('Test');
            console.log('  ✓ API Key #2 works! Fallback successful.\n');
          } catch (err) {
            console.log('  ✗ API Key #2 also failed:', err.message.substring(0, 50));
          }
        }
        break;
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  const avgTime = requestTimes.length > 0 
    ? Math.round(requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length)
    : 0;
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Rate Limit Test Results:\n');
  console.log(`  Model Used: ${workingModel}`);
  console.log(`  Total Requests: 20`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total Time: ${totalTime.toFixed(2)}s`);
  console.log(`  Average Response Time: ${avgTime}ms`);
  console.log(`  Requests Per Minute: ~${Math.round((successCount / totalTime) * 60)}`);
  
  if (successCount >= 15) {
    console.log(`\n✅ Rate limit is approximately ${successCount} requests per ${Math.round(totalTime)}s`);
    console.log(`   This means ~${Math.round((successCount / totalTime) * 60)} requests/minute per API key`);
    console.log(`   With ${apiKeys.length} keys, total capacity: ~${Math.round((successCount / totalTime) * 60 * apiKeys.length)} requests/minute`);
  }
  
  console.log('\n' + '='.repeat(80));
}

testGeminiAPI().catch(console.error);
