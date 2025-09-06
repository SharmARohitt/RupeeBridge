// routes/auth.js - Authentication routes
const express = require('express');
const { ethers } = require('ethers');
const User = require('../models/User');
const { validateWalletAddress } = require('../middleware/validation');
const router = express.Router();

// POST /api/auth/challenge - Get authentication challenge
router.post('/challenge', validateWalletAddress('walletAddress'), async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    // Generate a unique challenge message
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    const challenge = `Sign this message to authenticate with RupeeBridge.\n\nTimestamp: ${timestamp}\nNonce: ${nonce}\nWallet: ${walletAddress}`;
    
    res.json({
      success: true,
      data: {
        challenge,
        timestamp,
        nonce
      }
    });
  } catch (error) {
    console.error('Challenge generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate challenge',
      error: error.message
    });
  }
});

// POST /api/auth/verify - Verify wallet signature
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address, signature, and message are required'
      });
    }
    
    // Verify signature (in demo mode, we'll skip actual verification)
    let verified = true;
    
    /*
    // Uncomment for production signature verification
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      verified = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      verified = false;
    }
    */
    
    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    // Find or create user
    let user = await User.findByWallet(walletAddress);
    
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        profile: {
          name: `User_${walletAddress.slice(-6)}`,
          registrationDate: new Date()
        },
        status: 'active'
      });
      await user.save();
    }
    
    // Update last activity
    user.lastActivity = new Date();
    await user.save();
    
    // Generate session token (simplified for demo)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          profile: user.profile,
          isVerified: user.isVerified,
          status: user.status
        },
        token
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});

// GET /api/auth/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { walletaddress } = req.headers;
    
    if (!walletaddress) {
      return res.status(401).json({
        success: false,
        message: 'Wallet address required'
      });
    }
    
    const user = await User.findByWallet(walletaddress);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          profile: user.profile,
          isVerified: user.isVerified,
          status: user.status,
          limits: user.limits,
          statistics: user.statistics
        }
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// POST /api/auth/logout - Logout (invalidate session)
router.post('/logout', (req, res) => {
  try {
    // In a full implementation, you would invalidate the session/token here
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

module.exports = router;
