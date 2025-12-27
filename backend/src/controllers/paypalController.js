const paypal = require('@paypal/checkout-server-sdk');
const { User } = require('../models');

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Create subscription plan (one-time setup)
exports.createSubscriptionPlan = async (req, res) => {
  try {
    // This would typically be done once via PayPal dashboard
    // Returning plan ID for reference
    res.json({
      planId: process.env.PAYPAL_PLAN_ID,
      message: 'Use PayPal dashboard to create subscription plans'
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return plan ID for frontend to create subscription
    res.json({
      planId: process.env.PAYPAL_PLAN_ID,
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle subscription approval (webhook or callback)
exports.handleSubscriptionApproval = async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;

    if (!subscriptionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify subscription with PayPal
    const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);
    const paypalClient = client();
    const response = await paypalClient.execute(request);

    if (response.result.status === 'ACTIVE') {
      // Update user subscription
      await User.update(
        {
          paypalSubscriptionId: subscriptionId,
          subscriptionPlan: 'pro',
          subscriptionStatus: 'active'
        },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: 'Subscription activated successfully'
      });
    } else {
      res.status(400).json({
        error: 'Subscription not active',
        status: response.result.status
      });
    }
  } catch (error) {
    console.error('Subscription approval error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);

    if (!user || !user.paypalSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel with PayPal
    const request = new paypal.subscriptions.SubscriptionsCancelRequest(user.paypalSubscriptionId);
    request.requestBody({ reason: 'User requested cancellation' });
    
    const paypalClient = client();
    await paypalClient.execute(request);

    // Update user
    await user.update({
      subscriptionStatus: 'cancelled'
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get subscription status
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check trial status
    let trialStatus = null;
    if (user.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      
      trialStatus = {
        isActive: now < trialEnd,
        startedAt: user.trialStartedAt,
        endsAt: user.trialEndsAt,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        hasExpired: now >= trialEnd
      };
    }

    // Check PayPal subscription
    let paypalSubscription = null;
    if (user.paypalSubscriptionId) {
      try {
        const request = new paypal.subscriptions.SubscriptionsGetRequest(user.paypalSubscriptionId);
        const paypalClient = client();
        const response = await paypalClient.execute(request);
        
        paypalSubscription = {
          id: response.result.id,
          status: response.result.status,
          startTime: response.result.start_time,
          nextBillingTime: response.result.billing_info?.next_billing_time
        };
      } catch (error) {
        console.error('Error fetching PayPal subscription:', error);
      }
    }

    res.json({
      hasSubscription: user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active',
      plan: user.subscriptionPlan || 'free',
      status: user.subscriptionStatus,
      trial: trialStatus,
      paypal: paypalSubscription,
      requiresPayment: trialStatus?.hasExpired && user.subscriptionPlan === 'free'
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PayPal webhook handler
exports.webhook = async (req, res) => {
  try {
    const webhookEvent = req.body;
    
    console.log('PayPal webhook received:', webhookEvent.event_type);

    switch (webhookEvent.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(webhookEvent.resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(webhookEvent.resource);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(webhookEvent.resource);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(webhookEvent.resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(webhookEvent.resource);
        break;

      default:
        console.log(`Unhandled webhook event: ${webhookEvent.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Helper functions
async function handleSubscriptionActivated(resource) {
  const subscriptionId = resource.id;
  
  // Find user by subscription ID
  const user = await User.findOne({
    where: { paypalSubscriptionId: subscriptionId }
  });

  if (user) {
    await user.update({
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active'
    });
    console.log(`Subscription activated for user ${user.id}`);
  }
}

async function handleSubscriptionCancelled(resource) {
  const subscriptionId = resource.id;
  
  const user = await User.findOne({
    where: { paypalSubscriptionId: subscriptionId }
  });

  if (user) {
    await user.update({
      subscriptionPlan: 'free',
      subscriptionStatus: 'cancelled'
    });
    console.log(`Subscription cancelled for user ${user.id}`);
  }
}

async function handleSubscriptionSuspended(resource) {
  const subscriptionId = resource.id;
  
  const user = await User.findOne({
    where: { paypalSubscriptionId: subscriptionId }
  });

  if (user) {
    await user.update({
      subscriptionStatus: 'suspended'
    });
    console.log(`Subscription suspended for user ${user.id}`);
  }
}

async function handleSubscriptionExpired(resource) {
  const subscriptionId = resource.id;
  
  const user = await User.findOne({
    where: { paypalSubscriptionId: subscriptionId }
  });

  if (user) {
    await user.update({
      subscriptionPlan: 'free',
      subscriptionStatus: 'expired'
    });
    console.log(`Subscription expired for user ${user.id}`);
  }
}

async function handlePaymentCompleted(resource) {
  console.log(`Payment completed: ${resource.id}`);
  // Additional logic for successful payments if needed
}
