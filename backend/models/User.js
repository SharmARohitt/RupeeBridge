// models/User.js - User model for RupeeBridge
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum wallet address'
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email address'
    }
  },
  profile: {
    name: String,
    avatar: String,
    bio: String,
    country: String,
    timezone: String,
    language: { type: String, default: 'en' }
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'not_started'],
    default: 'not_started'
  },
  kycData: {
    documentType: String,
    documentNumber: String,
    fullName: String,
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    verificationHash: String,
    submittedAt: Date,
    verifiedAt: Date
  },
  statistics: {
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalTransfers: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    firstTransactionDate: Date,
    lastTransactionDate: Date,
    lifetimeVolume: { type: Number, default: 0 },
    averageTransactionSize: { type: Number, default: 0 }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    currency: { type: String, default: 'INR' },
    theme: { type: String, default: 'light', enum: ['light', 'dark', 'auto'] },
    language: { type: String, default: 'en' }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    backupCodes: [String],
    lastLogin: Date,
    loginHistory: [{
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      location: String
    }],
    securityEvents: [{
      type: String,
      description: String,
      timestamp: Date,
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    }]
  },
  rewards: {
    totalPoints: { type: Number, default: 0 },
    currentTier: { type: String, default: 'bronze', enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
    achievements: [{
      badgeId: String,
      badgeName: String,
      earnedAt: Date,
      nftTokenId: String
    }],
    referralCode: { type: String, unique: true, sparse: true },
    referralCount: { type: Number, default: 0 },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  bankingInfo: {
    accounts: [{
      bankName: String,
      accountNumber: String,
      accountHolderName: String,
      ifscCode: String,
      accountType: { type: String, enum: ['savings', 'current'] },
      isVerified: { type: Boolean, default: false },
      isDefault: { type: Boolean, default: false },
      addedAt: Date
    }],
    upiId: String,
    preferredWithdrawalMethod: { type: String, enum: ['bank', 'upi'], default: 'bank' }
  },
  limits: {
    dailyDepositLimit: { type: Number, default: 100000 }, // 1 lakh INR
    dailyWithdrawLimit: { type: Number, default: 50000 },  // 50k INR
    monthlyLimit: { type: Number, default: 1000000 },      // 10 lakh INR
    transactionLimit: { type: Number, default: 500000 },   // 5 lakh INR per transaction
    customLimits: {
      daily: Number,
      monthly: Number,
      transaction: Number
    }
  },
  compliance: {
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    sanctionScreening: {
      lastChecked: Date,
      status: { type: String, enum: ['clear', 'flagged', 'pending'] },
      results: mongoose.Schema.Types.Mixed
    },
    amlChecks: [{
      checkType: String,
      result: String,
      timestamp: Date,
      reference: String
    }]
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'frozen', 'closed'],
    default: 'active'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'rewards.referralCode': 1 });
userSchema.index({ status: 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.kycData?.fullName || this.profile?.name || 'Anonymous User';
});

// Virtual for current balance (would be fetched from blockchain)
userSchema.virtual('currentBalance').get(function() {
  // This would be fetched from the smart contract in real implementation
  return 0;
});

// Generate referral code
userSchema.methods.generateReferralCode = function() {
  const code = this.walletAddress.slice(2, 8).toUpperCase() + Date.now().toString().slice(-4);
  this.rewards.referralCode = code;
  return code;
};

// Update user statistics
userSchema.methods.updateStatistics = function(transactionData) {
  const stats = this.statistics;
  
  stats.transactionCount += 1;
  stats.lastTransactionDate = new Date();
  
  if (!stats.firstTransactionDate) {
    stats.firstTransactionDate = new Date();
  }
  
  if (transactionData.type === 'deposit') {
    stats.totalDeposited += transactionData.amount;
  } else if (transactionData.type === 'withdraw') {
    stats.totalWithdrawn += transactionData.amount;
  } else if (transactionData.type === 'transfer') {
    stats.totalTransfers += 1;
  }
  
  stats.lifetimeVolume += transactionData.amount;
  stats.averageTransactionSize = stats.lifetimeVolume / stats.transactionCount;
  
  return this.save();
};

// Add security event
userSchema.methods.addSecurityEvent = function(type, description, severity = 'low') {
  this.security.securityEvents.push({
    type,
    description,
    timestamp: new Date(),
    severity
  });
  
  // Keep only last 50 security events
  if (this.security.securityEvents.length > 50) {
    this.security.securityEvents = this.security.securityEvents.slice(-50);
  }
  
  return this.save();
};

// Check if user can perform transaction based on limits
userSchema.methods.checkTransactionLimits = function(amount, type = 'transaction') {
  const limits = this.limits;
  const customLimits = limits.customLimits;
  
  // Check transaction limit
  const transactionLimit = customLimits?.transaction || limits.transactionLimit;
  if (amount > transactionLimit) {
    return { allowed: false, reason: 'Transaction amount exceeds limit' };
  }
  
  // Additional daily/monthly checks would require transaction history
  return { allowed: true };
};

// Update risk score
userSchema.methods.updateRiskScore = function(factors) {
  let score = this.compliance.riskScore;
  
  // Risk scoring logic based on various factors
  if (factors.highValueTransaction) score += 10;
  if (factors.frequentTransactions) score += 5;
  if (factors.newAccount) score += 15;
  if (factors.foreignIP) score += 20;
  if (factors.kycIncomplete) score += 25;
  
  // Cap at 100
  score = Math.min(score, 100);
  
  // Determine risk level
  let riskLevel = 'low';
  if (score >= 70) riskLevel = 'high';
  else if (score >= 40) riskLevel = 'medium';
  
  this.compliance.riskScore = score;
  this.compliance.riskLevel = riskLevel;
  
  return this.save();
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure wallet address is lowercase
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  
  // Generate referral code if not exists
  if (!this.rewards.referralCode) {
    this.generateReferralCode();
  }
  
  next();
});

// Static methods

// Find user by wallet address
userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

// Get user statistics
userSchema.statics.getUserStats = function(walletAddress) {
  return this.findByWallet(walletAddress).select('statistics rewards');
};

// Get top users by volume
userSchema.statics.getTopUsers = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'statistics.lifetimeVolume': -1 })
    .limit(limit)
    .select('walletAddress profile statistics');
};

module.exports = mongoose.model('User', userSchema);
