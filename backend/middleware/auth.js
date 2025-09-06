// middleware/auth.js - Authentication middleware
const { ethers } = require('ethers');
const User = require('../models/User');

// Middleware to authenticate wallet-based requests
const authenticateWallet = async (req, res, next) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    const { signature, message } = req.headers;

    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    // For demo purposes, we'll skip signature verification
    // In production, verify the signature against the message
    /*
    if (signature && message) {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          return res.status(401).json({
            success: false,
            message: 'Invalid signature'
          });
        }
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Signature verification failed'
        });
      }
    }
    */

    // Find or create user
    let user = await User.findByWallet(walletAddress);
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        profile: {
          name: `User_${walletAddress.slice(-6)}`,
          registrationDate: new Date()
        },
        status: 'active'
      });
      await user.save();
      console.log(`👤 New user created: ${walletAddress}`);
    } else {
      // Update last activity
      user.lastActivity = new Date();
      await user.save();
    }

    // Attach user to request
    req.user = user;
    req.walletAddress = walletAddress.toLowerCase();
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required'
    });
  }

  next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Rate limiting for specific operations
const createRateLimit = (windowMs, maxRequests, message) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    // Check current requests
    const currentRequests = requests.get(key) || [];
    
    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    currentRequests.push(now);
    requests.set(key, currentRequests);

    next();
  };
};

module.exports = {
  authenticateWallet,
  requireVerification,
  requireAdmin,
  createRateLimit
};
