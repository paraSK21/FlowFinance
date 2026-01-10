const jwt = require('jsonwebtoken');

exports.googleCallback = async (req, res) => {
  try {
    // User is attached by passport
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }

    // Record consent if not already recorded
    if (!user.consentAccepted) {
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress || 
                        'unknown';
      
      await user.update({
        consentAccepted: true,
        consentAcceptedAt: new Date(),
        consentVersion: '1.0',
        consentIpAddress: ipAddress
      });
      
      console.log(`✓ Consent recorded for user ${user.id} from IP ${ipAddress}`);
    }

    // Start 7-day trial if user is new (no trial started yet)
    if (!user.trialStartedAt && user.subscriptionPlan === 'free') {
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

      await user.update({
        trialStartedAt: trialStartDate,
        trialEndsAt: trialEndDate,
      });

      console.log(`Trial started for user ${user.id}: ${trialStartDate} to ${trialEndDate}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

exports.googleAuthFailed = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
};
