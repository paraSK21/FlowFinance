// Test SendGrid email configuration
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function testSendGrid() {
  console.log('Testing SendGrid Configuration...\n');
  
  // Check environment variables
  console.log('✓ SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : '❌ Missing');
  console.log('✓ SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || '❌ Missing');
  console.log('✓ SENDGRID_FROM_NAME:', process.env.SENDGRID_FROM_NAME || '❌ Missing');
  console.log('');

  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is not set in .env file');
    process.exit(1);
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: process.env.SENDGRID_FROM_EMAIL, // Send to yourself for testing
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || 'FlowFinance'
    },
    subject: 'SendGrid Test Email - FlowFinance',
    text: 'This is a test email from FlowFinance to verify SendGrid configuration.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #3b82f6;">✓ SendGrid Test Successful!</h2>
        <p>Your SendGrid email configuration is working correctly.</p>
        <p>You can now send invoice emails from FlowFinance.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Sent from FlowFinance Invoice System
        </p>
      </div>
    `,
  };

  try {
    console.log('Sending test email...');
    const response = await sgMail.send(msg);
    console.log('\n✓ Email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('\nCheck your inbox at:', process.env.SENDGRID_FROM_EMAIL);
    console.log('\n✓ SendGrid is configured correctly!');
  } catch (error) {
    console.error('\n❌ SendGrid Error:', error.message);
    
    if (error.code === 403 || error.response?.statusCode === 403) {
      console.error('\n⚠️  SENDER VERIFICATION REQUIRED!');
      console.error('Your sender email is not verified with SendGrid.\n');
      console.error('To fix this:');
      console.error('1. Go to: https://app.sendgrid.com/settings/sender_auth/senders');
      console.error('2. Click "Create New Sender" or "Verify a Single Sender"');
      console.error('3. Enter your email:', process.env.SENDGRID_FROM_EMAIL);
      console.error('4. Check your email and click the verification link');
      console.error('5. Run this test again\n');
    } else if (error.response?.body?.errors) {
      console.error('\nError Details:');
      error.response.body.errors.forEach(err => {
        console.error(`  - ${err.message}`);
      });
    }
    
    process.exit(1);
  }
}

testSendGrid();
