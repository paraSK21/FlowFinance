require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testLighterModels() {
  console.log('🧪 Testing Lighter Models for Higher Rate Limits\n');
  console.log('='.repeat(80));
  
  const apiKey = process.env.GEMINI_API_KEY_2;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Test lighter models that should have higher quotas
  const modelsToTest = [
    'gemma-3-1b-it',           // Smallest - 1B parameters
    'gemma-3-4b-it',           // Small - 4B parameters  
    'gemini-flash-lite-latest', // Current best
    'gemini-2.0-flash-lite',   // Lite version
  ];
  
  for (const modelName of modelsToTest) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\nTesting: ${modelName}`);
    console.log('-'.repeat(80));
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Test with 30 requests to find real limit
      let successCount = 0;
      let failCount = 0;
      const startTime = Date.now();
      const times = [];
      
      for (let i = 1; i <= 30; i++) {
        const reqStart = Date.now();
        try {
          const result = await model.generateContent('Categorize: Zomato. Reply with just: Food');
          const reqTime = Date.now() - reqStart;
          times.push(reqTime);
          successCount++;
          process.stdout.write(`✓${i} `);
        } catch (error) {
          failCount++;
          if (error.message.includes('429') || error.message.includes('quota')) {
            console.log(`\n\n⚠️ Rate limit hit at request ${i}`);
            break;
          } else {
            console.log(`\n✗ Error at ${i}: ${error.message.substring(0, 60)}`);
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      const avgTime = times.length > 0 ? Math.round(times.reduce((a,b) => a+b, 0) / times.length) : 0;
      
      console.log(`\n\n📊 Results for ${modelName}:`);
      console.log(`  ✓ Successful: ${successCount}`);
      console.log(`  ✗ Failed: ${failCount}`);
      console.log(`  ⏱️  Total Time: ${totalTime.toFixed(2)}s`);
      console.log(`  ⚡ Avg Response: ${avgTime}ms`);
      console.log(`  📈 Rate: ~${Math.round((successCount/totalTime)*60)} req/min`);
      
      if (successCount >= 50) {
        console.log(`\n  🎉 EXCELLENT! This model can handle 50+ requests!`);
      } else if (successCount >= 30) {
        console.log(`\n  ✅ GOOD! This model can handle 30+ requests`);
      } else if (successCount >= 15) {
        console.log(`\n  ⚠️  OK - This model can handle 15+ requests`);
      } else {
        console.log(`\n  ❌ LOW - Only ${successCount} requests before limit`);
      }
      
    } catch (error) {
      console.log(`\n❌ Model failed to initialize: ${error.message.substring(0, 100)}`);
    }
    
    // Wait before testing next model
    console.log('\n⏳ Waiting 5 seconds before next model...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Testing Complete!\n');
}

testLighterModels().catch(console.error);
