// routes/users.js - User management routes
const express = require('express');
const User = require('../models/User');
const { authenticateWallet } = require('../middleware/auth');
const { validateUserProfile, validateKYC } = require('../middleware/validation');
const router = express.Router();

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    
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
          statistics: user.statistics,
          kyc: user.kyc,
          lastActivity: user.lastActivity
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

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateWallet, validateUserProfile, async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;
    
    // Update allowed profile fields
    if (updates.profile) {
      Object.keys(updates.profile).forEach(key => {
        if (['name', 'email', 'phone', 'avatar'].includes(key)) {
          user.profile[key] = updates.profile[key];
        }
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// POST /api/users/kyc - Submit KYC information
router.post('/kyc', authenticateWallet, validateKYC, async (req, res) => {
  try {
    const user = req.user;
    const kycData = req.body;
    
    // Update KYC information
    user.kyc = {
      ...user.kyc,
      personalInfo: kycData.personalInfo,
      documents: kycData.documents,
      address: kycData.address,
      submissionDate: new Date(),
      status: 'pending'
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'KYC information submitted successfully',
      data: {
        kyc: user.kyc
      }
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC information',
      error: error.message
    });
  }
});

// GET /api/users/kyc/status - Get KYC status
router.get('/kyc/status', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        kyc: {
          status: user.kyc.status,
          submissionDate: user.kyc.submissionDate,
          verificationDate: user.kyc.verificationDate,
          comments: user.kyc.comments
        }
      }
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC status',
      error: error.message
    });
  }
});

// GET /api/users/balance - Get user's token balance
router.get('/balance', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    const { contractService } = require('../services/contractService');
    
    // Get balance from smart contract
    const balance = await contractService.getTokenBalance(user.walletAddress);
    
    res.json({
      success: true,
      data: {
        balance: {
          arbINR: balance,
          usd: (balance * 0.012).toFixed(2), // Mock exchange rate
          inr: balance.toFixed(2)
        },
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      error: error.message
    });
  }
});

// GET /api/users/statistics - Get user statistics
router.get('/statistics', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    const Transaction = require('../models/Transaction');
    
    // Get transaction statistics
    const transactionStats = await Transaction.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    // Get monthly transaction volumes
    const monthlyStats = await Transaction.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          volume: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      success: true,
      data: {
        userStats: user.statistics,
        transactionBreakdown: transactionStats,
        monthlyVolume: monthlyStats
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// PUT /api/users/limits - Update user limits (admin only)
router.put('/limits', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    const { transactionLimit, dailyWithdrawLimit } = req.body;
    
    // In a full implementation, only admins should be able to modify limits
    // For demo purposes, we'll allow users to request limit changes
    
    if (transactionLimit) {
      user.limits.transactionLimit = Math.min(transactionLimit, 1000000); // Cap at 1M
    }
    
    if (dailyWithdrawLimit) {
      user.limits.dailyWithdrawLimit = Math.min(dailyWithdrawLimit, 500000); // Cap at 500K
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Limits updated successfully',
      data: {
        limits: user.limits
      }
    });
  } catch (error) {
    console.error('Update limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update limits',
      error: error.message
    });
  }
});

// DELETE /api/users/account - Delete user account
router.delete('/account', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has pending transactions
    const Transaction = require('../models/Transaction');
    const pendingTransactions = await Transaction.countDocuments({
      user: user._id,
      status: { $in: ['pending', 'processing'] }
    });
    
    if (pendingTransactions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with pending transactions'
      });
    }
    
    // Soft delete - mark as deleted instead of actually removing
    user.status = 'deleted';
    user.deletedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

module.exports = router;
