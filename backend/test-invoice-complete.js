/**
 * Complete Invoice System Test
 * Tests all invoice functionality end-to-end
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let testInvoiceId = '';

// Test user credentials (create a test user first)
const testUser = {
  email: 'test@example.com',
  password: 'Test123!@#',
  firstName: 'Test',
  lastName: 'User',
  businessName: 'Test Business'
};

async function runTests() {
  console.log('🧪 Starting Complete Invoice System Test\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Login or Register
    await loginOrRegister();
    
    // Step 2: Create Invoice
    await testCreateInvoice();
    
    // Step 3: Get All Invoices
    await testGetInvoices();
    
    // Step 4: Get Invoice Stats
    await testGetStats();
    
    // Step 5: Chase Invoice
    await testChaseInvoice();
    
    // Step 6: Mark as Paid
    await testMarkAsPaid();
    
    // Step 7: Get Invoice Reminders
    await testGetReminders();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✓ Invoice creation');
    console.log('  ✓ Invoice listing');
    console.log('  ✓ Invoice statistics');
    console.log('  ✓ Chase functionality');
    console.log('  ✓ Payment tracking');
    console.log('  ✓ Reminder system');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function loginOrRegister() {
  console.log('\n1️⃣  Testing Authentication...');
  
  try {
    // Try to login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    console.log('   ✓ Logged in successfully');
  } catch (error) {
    // If login fails, register
    console.log('   → User not found, registering...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    authToken = registerResponse.data.token;
    console.log('   ✓ Registered successfully');
  }
}

async function testCreateInvoice() {
  console.log('\n2️⃣  Testing Invoice Creation...');
  
  const invoiceData = {
    clientName: 'Acme Corporation',
    clientEmail: 'client@acme.com',
    clientPhone: '+1234567890',
    amount: 1500.00,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    description: 'Web development services - Q4 2024',
    autoChaseEnabled: true,
    lineItems: [
      { description: 'Frontend Development', quantity: 40, rate: 25, amount: 1000 },
      { description: 'Backend API', quantity: 20, rate: 25, amount: 500 }
    ]
  };
  
  const response = await axios.post(`${API_URL}/invoices`, invoiceData, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  testInvoiceId = response.data.id;
  console.log('   ✓ Invoice created:', response.data.invoiceNumber);
  console.log('   → Amount: $' + response.data.amount);
  console.log('   → Client: ' + response.data.clientName);
  console.log('   → Due Date: ' + new Date(response.data.dueDate).toLocaleDateString());
}

async function testGetInvoices() {
  console.log('\n3️⃣  Testing Get Invoices...');
  
  const response = await axios.get(`${API_URL}/invoices`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('   ✓ Retrieved ' + response.data.length + ' invoice(s)');
  response.data.forEach(inv => {
    console.log(`   → ${inv.invoiceNumber}: $${inv.amount} - ${inv.status}`);
  });
}

async function testGetStats() {
  console.log('\n4️⃣  Testing Invoice Statistics...');
  
  const response = await axios.get(`${API_URL}/invoices/stats/summary`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log('   ✓ Stats retrieved:');
  console.log('   → Total Due: $' + (response.data.totalDue || 0).toFixed(2));
  console.log('   → Overdue Count: ' + (response.data.overdueCount || 0));
  console.log('   → Total Paid: $' + (response.data.totalPaid || 0).toFixed(2));
}

async function testChaseInvoice() {
  console.log('\n5️⃣  Testing Chase Invoice...');
  
  const response = await axios.post(
    `${API_URL}/invoices/${testInvoiceId}/chase`,
    {},
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  console.log('   ✓ Chase notification sent');
  console.log('   → Chase count: ' + response.data.invoice.chaseCount);
}

async function testMarkAsPaid() {
  console.log('\n6️⃣  Testing Mark as Paid...');
  
  const response = await axios.post(
    `${API_URL}/invoices/${testInvoiceId}/mark-paid`,
    {
      paidAmount: 1500.00,
      paidDate: new Date()
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  console.log('   ✓ Invoice marked as paid');
  console.log('   → Status: ' + response.data.status);
  console.log('   → Paid Amount: $' + response.data.paidAmount);
}

async function testGetReminders() {
  console.log('\n7️⃣  Testing Get Reminders...');
  
  const response = await axios.get(
    `${API_URL}/invoices/${testInvoiceId}/reminders`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  console.log('   ✓ Retrieved ' + response.data.length + ' reminder(s)');
  response.data.forEach(reminder => {
    console.log(`   → ${reminder.reminderType}: ${reminder.status} - ${new Date(reminder.scheduledDate).toLocaleDateString()}`);
  });
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
