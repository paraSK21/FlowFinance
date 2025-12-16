/**
 * Test script to verify forecast accuracy and consistency
 * Run with: node backend/test-forecast-accuracy.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = response.data.token;
    console.log('✓ Logged in successfully');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function generateForecast(useML = true) {
  try {
    const response = await axios.post(
      `${API_URL}/forecasts/generate`,
      { days: 90, useML },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error('✗ Forecast generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testForecastConsistency() {
  console.log('\n=== Testing Forecast Consistency ===\n');
  
  // Generate forecast twice with same parameters
  console.log('Generating forecast #1...');
  const forecast1 = await generateForecast(true);
  
  if (!forecast1) {
    console.error('✗ Failed to generate first forecast');
    return;
  }
  
  console.log('Generating forecast #2...');
  const forecast2 = await generateForecast(true);
  
  if (!forecast2) {
    console.error('✗ Failed to generate second forecast');
    return;
  }
  
  // Compare results
  console.log('\n--- Comparison ---');
  console.log('Forecast #1 - Day 30 balance:', forecast1.forecastData[29]?.predictedBalance);
  console.log('Forecast #2 - Day 30 balance:', forecast2.forecastData[29]?.predictedBalance);
  
  const day30Diff = Math.abs(
    forecast1.forecastData[29]?.predictedBalance - forecast2.forecastData[29]?.predictedBalance
  );
  
  console.log('Difference:', day30Diff);
  
  if (day30Diff < 0.01) {
    console.log('✓ Forecasts are consistent (deterministic)');
  } else {
    console.log('✗ Forecasts differ (non-deterministic - possible issue)');
  }
}

async function testForecastQuality() {
  console.log('\n=== Testing Forecast Quality ===\n');
  
  const forecast = await generateForecast(true);
  
  if (!forecast) {
    console.error('✗ Failed to generate forecast');
    return;
  }
  
  console.log('Current Balance:', forecast.currentBalance);
  console.log('Projected Balance (Day 90):', forecast.projectedBalance);
  console.log('Method:', forecast.summary?.method);
  console.log('ML Enhanced:', forecast.summary?.mlEnhanced);
  console.log('Average Confidence:', (forecast.summary?.averageConfidence * 100).toFixed(1) + '%');
  
  // Check confidence scores
  const confidences = forecast.forecastData.map(f => f.confidence);
  const minConfidence = Math.min(...confidences);
  const maxConfidence = Math.max(...confidences);
  
  console.log('\n--- Confidence Analysis ---');
  console.log('Min Confidence:', (minConfidence * 100).toFixed(1) + '%');
  console.log('Max Confidence:', (maxConfidence * 100).toFixed(1) + '%');
  
  if (minConfidence >= 0.40 && maxConfidence <= 0.80) {
    console.log('✓ Confidence scores are realistic (40-80% range)');
  } else {
    console.log('⚠ Confidence scores outside expected range');
  }
  
  // Check for trend
  const day1Balance = forecast.forecastData[0]?.predictedBalance;
  const day30Balance = forecast.forecastData[29]?.predictedBalance;
  const day90Balance = forecast.forecastData[89]?.predictedBalance;
  
  console.log('\n--- Balance Progression ---');
  console.log('Day 1:', day1Balance?.toFixed(2));
  console.log('Day 30:', day30Balance?.toFixed(2));
  console.log('Day 90:', day90Balance?.toFixed(2));
  
  const trend30 = ((day30Balance - day1Balance) / day1Balance * 100).toFixed(1);
  const trend90 = ((day90Balance - day1Balance) / day1Balance * 100).toFixed(1);
  
  console.log('30-day trend:', trend30 + '%');
  console.log('90-day trend:', trend90 + '%');
  
  // Check ML insights if available
  if (forecast.summary?.mlEnhanced) {
    console.log('\n--- ML Enhancement ---');
    console.log('✓ ML insights were applied');
    console.log('Projected Income:', forecast.summary.projectedIncome?.toFixed(2));
    console.log('Projected Expenses:', forecast.summary.projectedExpenses?.toFixed(2));
  } else {
    console.log('\n⚠ ML enhancement not used (statistical method only)');
  }
}

async function testWithoutML() {
  console.log('\n=== Testing Without ML Enhancement ===\n');
  
  const forecast = await generateForecast(false);
  
  if (!forecast) {
    console.error('✗ Failed to generate forecast');
    return;
  }
  
  console.log('Method:', forecast.summary?.method);
  console.log('ML Enhanced:', forecast.summary?.mlEnhanced);
  console.log('Average Confidence:', (forecast.summary?.averageConfidence * 100).toFixed(1) + '%');
  
  if (forecast.summary?.method === 'statistical') {
    console.log('✓ Statistical method used as expected');
  } else {
    console.log('⚠ Unexpected method:', forecast.summary?.method);
  }
}

async function runTests() {
  console.log('=================================');
  console.log('  Forecast Accuracy Test Suite  ');
  console.log('=================================');
  
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('\nCannot proceed without authentication');
    return;
  }
  
  await testForecastConsistency();
  await testForecastQuality();
  await testWithoutML();
  
  console.log('\n=================================');
  console.log('  Tests Complete  ');
  console.log('=================================\n');
}

runTests().catch(console.error);
