// routes/transactions.js - Transaction routes for RupeeBridge
const express = require('express');
const { ethers } = require('ethers');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateWallet } = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validation');
const { contractService } = require('../services/contractService');
const router = express.Router();

// GET /api/transactions - Get user's transaction history
router.get('/', authenticateWallet, async (req, res) => {
  try {
    const { type, status, limit = 50, page = 1 } = req.query;
    
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Return mock data for demo mode
      const mockTransactions = [
        {
          transactionId: 'DEP_12345678',
          type: 'deposit',
          amount: 1000,
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          completedAt: new Date(Date.now() - 86400000 + 3600000), // 1 hour later
          from: { type: 'bank_transfer', details: 'Bank Transfer' },
          to: { address: req.user.walletAddress }
        },
        {
          transactionId: 'WTH_87654321',
          type: 'withdraw',
          amount: 500,
          status: 'pending',
          createdAt: new Date(Date.now() - 43200000), // 12 hours ago
          from: { address: req.user.walletAddress },
          to: { type: 'bank_transfer', details: 'Bank Account ****1234' }
        },
        {
          transactionId: 'TRF_11223344',
          type: 'transfer',
          amount: 200,
          status: 'completed',
          createdAt: new Date(Date.now() - 7200000), // 2 hours ago
          completedAt: new Date(Date.now() - 7200000 + 300000), // 5 minutes later
          from: { address: req.user.walletAddress },
          to: { address: '0x742d35Cc6558Ceb0BA4CFD242c35A67aC7c0Ce5E' }
        }
      ].slice(0, parseInt(limit));

      return res.json({
        success: true,
        data: {
          transactions: mockTransactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: mockTransactions.length,
            pages: 1
          }
        }
      });
    }

    const userId = req.user._id;
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const query = { user: userId };
    if (type) query.type = type;
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query, null, options)
      .populate('recipient.userId', 'walletAddress profile.name')
      .lean();
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// GET /api/transactions/:id - Get specific transaction
router.get('/:id', authenticateWallet, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      $or: [
        { transactionId: req.params.id },
        { _id: req.params.id }
      ],
      user: req.user._id
    }).populate('recipient.userId', 'walletAddress profile.name');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

// POST /api/transactions/deposit - Initiate INR deposit
router.post('/deposit', authenticateWallet, validateTransaction, async (req, res) => {
  try {
    const { amount, bankingDetails } = req.body;
    const user = req.user;
    
    // Validate amount
    if (amount < 100 || amount > 100000) {
      return res.status(400).json({
        success: false,
        message: `Deposit amount must be between ₹100 and ₹100,000`
      });
    }
    
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Return mock data for demo mode
      const transactionId = 'DEP_' + Date.now().toString().slice(-8);
      
      console.log(`💰 Mock deposit initiated: ${transactionId} - ${amount} INR for ${user.walletAddress}`);
      
      return res.json({
        success: true,
        message: 'Deposit initiated successfully',
        data: {
          transaction: {
            id: transactionId,
            amount,
            currency: 'INR',
            status: 'pending',
            bankingInstructions: {
              bankName: 'RupeeBridge Demo Bank',
              accountNumber: '1234567890',
              ifscCode: 'DEMO0001234',
              beneficiaryName: 'RupeeBridge India Ltd',
              reference: transactionId
            }
          }
        }
      });
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      walletAddress: user.walletAddress,
      type: 'deposit',
      subType: 'inr_deposit',
      amount,
      currency: 'INR',
      banking: {
        bankName: bankingDetails?.bankName,
        accountNumber: bankingDetails?.accountNumber,
        ifscCode: bankingDetails?.ifscCode,
        paymentMethod: bankingDetails?.paymentMethod || 'bank_transfer'
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });
    
    await transaction.save();
    
    // Simulate INR deposit processing (in real app, integrate with payment gateway)
    setTimeout(async () => {
      try {
        await transaction.updateStatus('processing');
        
        // Simulate bank processing delay
        setTimeout(async () => {
          try {
            // Mint arbINR tokens via smart contract
            const mintResult = await contractService.mintTokens(
              user.walletAddress,
              ethers.parseEther(amount.toString()),
              transaction.transactionId
            );
            
            if (mintResult.success) {
              await transaction.updateStatus('completed', {
                blockchainTxHash: mintResult.txHash,
                'blockchain.blockNumber': mintResult.blockNumber,
                'blockchain.gasUsed': mintResult.gasUsed
              });
              
              // Update user statistics
              await user.updateStatistics({
                type: 'deposit',
                amount: amount
              });
              
            } else {
              await transaction.updateStatus('failed', {
                error: {
                  code: 'MINT_FAILED',
                  message: mintResult.error
                }
              });
            }
          } catch (error) {
            console.error('Mint processing error:', error);
            await transaction.updateStatus('failed', {
              error: {
                code: 'PROCESSING_ERROR',
                message: error.message
              }
            });
          }
        }, 5000); // 5 second delay for demo
        
      } catch (error) {
        console.error('Deposit processing error:', error);
      }
    }, 1000); // 1 second initial delay
    
    res.status(201).json({
      success: true,
      message: 'Deposit initiated successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status,
        estimatedProcessingTime: '2-5 minutes'
      }
    });
    
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate deposit',
      error: error.message
    });
  }
});

// POST /api/transactions/withdraw - Initiate arbINR withdrawal to INR
router.post('/withdraw', authenticateWallet, validateTransaction, async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const user = req.user;
    
    // Validate amount
    if (amount < 100 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal amount must be between ₹100 and ₹50,000`
      });
    }
    
    // Check user's arbINR balance (would query smart contract)
    const contractService = require('../services/contractService');
    const balance = await contractService.getTokenBalance(user.walletAddress);
    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient arbINR balance'
      });
    }
    
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Mock withdrawal for demo mode
      const transactionId = 'WTH_' + Date.now().toString().slice(-8);
      
      // Burn tokens (mock blockchain operation)
      await contractService.burnTokens(user.walletAddress, amount);
      
      console.log(`💸 Mock withdrawal initiated: ${transactionId} - ${amount} INR for ${user.walletAddress}`);
      
      return res.json({
        success: true,
        message: 'Withdrawal initiated successfully',
        data: {
          transaction: {
            id: transactionId,
            amount,
            processingFee: 10,
            totalDeducted: amount + 10,
            status: 'processing',
            estimatedCompletion: '1-2 business days',
            bankDetails: {
              accountNumber: bankDetails?.accountNumber ? '****' + bankDetails.accountNumber.slice(-4) : '****1234',
              ifscCode: bankDetails?.ifscCode || 'DEMO0001234',
              bankName: bankDetails?.bankName || 'Demo Bank'
            }
          },
          newBalance: await contractService.getTokenBalance(user.walletAddress)
        }
      });
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      walletAddress: user.walletAddress,
      type: 'withdraw',
      subType: 'inr_withdrawal',
      amount,
      currency: 'arbINR',
      banking: {
        bankName: bankingDetails?.bankName,
        accountNumber: bankingDetails?.accountNumber,
        ifscCode: bankingDetails?.ifscCode,
        upiId: bankingDetails?.upiId,
        paymentMethod: bankingDetails?.paymentMethod || 'bank_transfer'
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });
    
    await transaction.save();
    
    // Process withdrawal
    setTimeout(async () => {
      try {
        await transaction.updateStatus('processing');
        
        // Burn arbINR tokens
        const burnResult = await contractService.burnTokens(
          user.walletAddress,
          ethers.parseEther(amount.toString()),
          transaction.transactionId
        );
        
        if (burnResult.success) {
          await transaction.updateStatus('completed', {
            blockchainTxHash: burnResult.txHash,
            'blockchain.blockNumber': burnResult.blockNumber,
            'blockchain.gasUsed': burnResult.gasUsed,
            'banking.bankTransactionId': `INR_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
          });
          
          // Update user statistics
          await user.updateStatistics({
            type: 'withdraw',
            amount: amount
          });
          
        } else {
          await transaction.updateStatus('failed', {
            error: {
              code: 'BURN_FAILED',
              message: burnResult.error
            }
          });
        }
      } catch (error) {
        console.error('Withdrawal processing error:', error);
        await transaction.updateStatus('failed', {
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message
          }
        });
      }
    }, 1000);
    
    res.status(201).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status,
        estimatedProcessingTime: '1-3 minutes'
      }
    });
    
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate withdrawal',
      error: error.message
    });
  }
});

// POST /api/transactions/transfer - Transfer arbINR to another wallet
router.post('/transfer', authenticateWallet, validateTransaction, async (req, res) => {
  try {
    const { amount, recipientAddress, note } = req.body;
    const user = req.user;
    
    // Validate recipient address
    if (!ethers.isAddress(recipientAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient wallet address'
      });
    }
    
    // Check if sending to self
    if (recipientAddress.toLowerCase() === user.walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to your own wallet'
      });
    }
    
    // Validate amount
    if (amount < 1 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: `Transfer amount must be between ₹1 and ₹50,000`
      });
    }
    
    // Check user's arbINR balance
    const balance = await contractService.getTokenBalance(user.walletAddress);
    if (balance < amount + 1) { // Include 1 arbINR fee
      return res.status(400).json({
        success: false,
        message: 'Insufficient arbINR balance (including 1 arbINR transfer fee)'
      });
    }
    
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Mock transfer for demo mode
      const transactionId = 'TRF_' + Date.now().toString().slice(-8);
      
      // Execute transfer (mock blockchain operation)
      const transferResult = await contractService.transferTokens(
        user.walletAddress, 
        recipientAddress, 
        ethers.parseEther(amount.toString()),
        transactionId
      );
      
      if (transferResult.success) {
        console.log(`💸 Mock transfer completed: ${transactionId} - ${amount} arbINR from ${user.walletAddress} to ${recipientAddress}`);
        
        return res.json({
          success: true,
          message: 'Transfer completed successfully',
          data: {
            transaction: {
              id: transactionId,
              amount,
              recipient: recipientAddress,
              status: 'completed',
              completedAt: new Date(),
              fee: 1,
              txHash: transferResult.txHash
            },
            newBalance: await contractService.getTokenBalance(user.walletAddress)
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Transfer failed: ' + transferResult.error
        });
      }
    }
    
    // Find recipient user (if exists in our system)
    const recipientUser = await User.findByWallet(recipientAddress);
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      walletAddress: user.walletAddress,
      type: 'transfer',
      subType: 'peer_transfer',
      amount,
      currency: 'arbINR',
      recipient: {
        walletAddress: recipientAddress.toLowerCase(),
        userId: recipientUser?._id
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web',
        note: note
      }
    });
    
    await transaction.save();
    
    // Process transfer
    setTimeout(async () => {
      try {
        await transaction.updateStatus('processing');
        
        // Execute transfer via smart contract
        const transferResult = await contractService.transferTokens(
          user.walletAddress,
          recipientAddress,
          ethers.parseEther(amount.toString()),
          transaction.transactionId
        );
        
        if (transferResult.success) {
          await transaction.updateStatus('completed', {
            blockchainTxHash: transferResult.txHash,
            'blockchain.blockNumber': transferResult.blockNumber,
            'blockchain.gasUsed': transferResult.gasUsed
          });
          
          // Update sender statistics
          await user.updateStatistics({
            type: 'transfer',
            amount: amount
          });
          
          // Update recipient statistics if they're in our system
          if (recipientUser) {
            await recipientUser.updateStatistics({
              type: 'transfer_received',
              amount: amount
            });
          }
          
        } else {
          await transaction.updateStatus('failed', {
            error: {
              code: 'TRANSFER_FAILED',
              message: transferResult.error
            }
          });
        }
      } catch (error) {
        console.error('Transfer processing error:', error);
        await transaction.updateStatus('failed', {
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message
          }
        });
      }
    }, 1000);
    
    res.status(201).json({
      success: true,
      message: 'Transfer initiated successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        recipient: recipientAddress,
        status: transaction.status,
        estimatedProcessingTime: '30-60 seconds'
      }
    });
    
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate transfer',
      error: error.message
    });
  }
});

// GET /api/transactions/stats - Get user transaction statistics
router.get('/user/stats', authenticateWallet, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '30d' } = req.query;
    
    // Get user statistics
    const userStats = await User.findById(userId).select('statistics');
    
    // Get transaction breakdown
    const transactionStats = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    // Get recent activity
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type amount status createdAt')
      .lean();
    
    res.json({
      success: true,
      data: {
        userStats: userStats.statistics,
        transactionBreakdown: transactionStats,
        recentActivity: recentTransactions
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// POST /api/transactions/confirm-deposit - Confirm bank transfer payment
router.post('/confirm-deposit', authenticateWallet, async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Mock confirmation for demo mode
      const contractService = require('../services/contractService');
      
      // For demo, assume the transaction exists and mint tokens
      await contractService.mintTokens(req.user.walletAddress, 1000); // Demo amount
      
      console.log(`✅ Mock deposit confirmed: ${transactionId} - 1000 INR for ${req.user.walletAddress}`);
      
      return res.json({
        success: true,
        message: 'Deposit confirmed successfully',
        data: {
          transaction: {
            id: transactionId,
            amount: 1000,
            status: 'completed',
            completedAt: new Date()
          },
          newBalance: await contractService.getTokenBalance(req.user.walletAddress)
        }
      });
    }
    
    // Find the pending deposit transaction
    const transaction = await Transaction.findOne({
      transactionId,
      user: req.user._id,
      type: 'deposit',
      status: 'pending'
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Pending deposit transaction not found'
      });
    }
    
    // In a real implementation, here you would:
    // 1. Verify the bank transfer was received
    // 2. Check the amount matches
    // 3. Validate payment reference
    
    // For demo purposes, we'll auto-approve
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();
    
    // Update user balance (mock blockchain operation)
    const contractService = require('../services/contractService');
    await contractService.mintTokens(req.user.walletAddress, transaction.amount);
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'statistics.totalDeposited': transaction.amount,
        'statistics.transactionCount': 1
      },
      $set: {
        lastActivityAt: new Date()
      }
    });
    
    console.log(`✅ Deposit confirmed: ${transactionId} - ${transaction.amount} INR for ${req.user.walletAddress}`);
    
    res.json({
      success: true,
      message: 'Deposit confirmed successfully',
      data: {
        transaction: {
          id: transaction.transactionId,
          amount: transaction.amount,
          status: transaction.status,
          completedAt: transaction.completedAt
        },
        newBalance: await contractService.getTokenBalance(req.user.walletAddress)
      }
    });
    
  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm deposit',
      error: error.message
    });
  }
});

module.exports = router;
