const { User } = require('../models');

/**
 * Middleware to check if user has active subscription or valid trial
 */
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        requiresPayment: true 
      });
    }

    // Check if user has active paid subscription
    if (user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active') {
      req.user = user;
      return next();
    }

    // Check if user is in trial period
    if (user.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);

      if (now < trialEnd) {
        // Trial is still active
        req.user = user;
        req.isTrialUser = true;
        req.trialDaysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        return next();
      } else {
        // Trial has expired
        return res.status(402).json({
          error: 'Your free trial has ended. Please subscribe to continue using FlowFinance.',
          requiresPayment: true,
          trialExpired: true,
          trialEndedAt: user.trialEndsAt
        });
      }
    }

    // No trial and no subscription - shouldn't happen but handle it
    return res.status(402).json({
      error: 'Subscription required to access this feature.',
      requiresPayment: true
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({ error: 'Failed to verify subscription status' });
  }
};

/**
 * Middleware to check subscription but allow access (just adds info to request)
 */
const checkSubscriptionSoft = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);

    if (user) {
      req.user = user;
      
      // Check trial status
      if (user.trialEndsAt) {
        const now = new Date();
        const trialEnd = new Date(user.trialEndsAt);
        
        if (now < trialEnd) {
          req.isTrialUser = true;
          req.trialDaysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        } else {
          req.trialExpired = true;
        }
      }

      req.hasActiveSubscription = user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active';
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next();
  }
};

module.exports = { checkSubscription, checkSubscriptionSoft };
