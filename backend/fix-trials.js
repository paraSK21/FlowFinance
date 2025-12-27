// Quick script to fix user trials
require('dotenv').config();
const { User } = require('./src/models');

async function fixTrials() {
  try {
    console.log('Connecting to database...');
    
    // Find users without trials
    const usersWithoutTrials = await User.findAll({
      where: {
        trialStartedAt: null,
        trialEndsAt: null,
        subscriptionPlan: 'free'
      }
    });

    console.log(`Found ${usersWithoutTrials.length} users without trials`);

    if (usersWithoutTrials.length === 0) {
      console.log('All users already have trials set!');
      process.exit(0);
    }

    // Set 30-day trial for each user
    const trialStartedAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    for (const user of usersWithoutTrials) {
      await user.update({
        trialStartedAt,
        trialEndsAt
      });
      console.log(`✓ Fixed trial for ${user.email} (${user.firstName} ${user.lastName})`);
    }

    console.log('\n✅ All users now have 30-day trials!');
    console.log(`Trial period: ${trialStartedAt.toLocaleDateString()} to ${trialEndsAt.toLocaleDateString()}`);

    // Show all users with their trial status
    console.log('\n📊 Current user status:');
    const allUsers = await User.findAll({
      attributes: ['email', 'firstName', 'lastName', 'subscriptionPlan', 'trialStartedAt', 'trialEndsAt']
    });

    allUsers.forEach(user => {
      const now = new Date();
      let status = 'No Trial';
      if (user.trialEndsAt) {
        status = user.trialEndsAt > now ? '✓ Active Trial' : '✗ Trial Expired';
      }
      if (user.subscriptionPlan !== 'free') {
        status = `✓ ${user.subscriptionPlan.toUpperCase()} Plan`;
      }
      console.log(`  ${user.email} - ${status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error fixing trials:', error);
    process.exit(1);
  }
}

fixTrials();
