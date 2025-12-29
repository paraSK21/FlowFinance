const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const googleAuthController = require('../controllers/googleAuthController');

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/google/failure',
    session: true, // Need session for OAuth flow
  }),
  googleAuthController.googleCallback
);

// Failure route
router.get('/google/failure', googleAuthController.googleAuthFailed);

module.exports = router;
