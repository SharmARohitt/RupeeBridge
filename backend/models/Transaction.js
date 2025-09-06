// models/Transaction.js - Transaction model for RupeeBridge
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  blockchainTxHash: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: 'Invalid transaction hash'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid wallet address'
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdraw', 'transfer', 'swap', 'lend', 'borrow', 'stake', 'unstake'],
    index: true
  },
  subType: {
    type: String,
    enum: [
      'inr_deposit',      // INR to arbINR
      'inr_withdrawal',   // arbINR to INR
      'peer_transfer',    // arbINR to another user
      'uniswap_swap',     // arbINR to other tokens
      'aave_deposit',     // Supply to Aave
      'aave_withdraw',    // Withdraw from Aave
      'aave_borrow',      // Borrow from Aave
      'aave_repay'        // Repay Aave loan
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    get: v => Math.round(v * 100) / 100 // Round to 2 decimal places
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    enum: ['INR', 'arbINR', 'USDC', 'USDT', 'ETH']
  },
  // For transfers - recipient details
  recipient: {
    walletAddress: {
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid recipient wallet address'
      }
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // For swaps - token exchange details
  swap: {
    fromToken: String,
    toToken: String,
    fromAmount: Number,
    toAmount: Number,
    exchangeRate: Number,
    slippage: Number,
    dexProtocol: { type: String, enum: ['uniswap', 'sushiswap', '1inch'] }
  },
  // For DeFi operations
  defi: {
    protocol: { type: String, enum: ['aave', 'compound', 'uniswap'] },
    operation: String,
    poolAddress: String,
    apy: Number,
    collateralRatio: Number
  },
  // Financial details
  fees: {
    networkFee: { type: Number, default: 0 },
    protocolFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 }
  },
  // Banking details for INR transactions
  banking: {
    bankTransactionId: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    paymentMethod: { type: String, enum: ['bank_transfer', 'upi', 'card'] },
    processingTime: Number // in minutes
  },
  // Blockchain details
  blockchain: {
    network: { type: String, default: 'arbitrum', enum: ['arbitrum', 'arbitrum-sepolia'] },
    chainId: { type: Number, default: 42161 },
    blockNumber: Number,
    blockHash: String,
    gasUsed: Number,
    gasPrice: Number,
    nonce: Number,
    confirmations: { type: Number, default: 0 }
  },
  // Compliance and risk
  compliance: {
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    amlCheck: {
      status: { type: String, enum: ['pending', 'passed', 'failed', 'manual_review'] },
      checkedAt: Date,
      flags: [String]
    },
    sanctionCheck: {
      status: { type: String, enum: ['pending', 'passed', 'failed'] },
      checkedAt: Date
    },
    fraudCheck: {
      status: { type: String, enum: ['pending', 'passed', 'failed'] },
      score: Number,
      checkedAt: Date
    }
  },
  // Processing timestamps
  timestamps: {
    initiated: { type: Date, default: Date.now },
    submitted: Date,
    confirmed: Date,
    completed: Date,
    failed: Date
  },
  // Error handling
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
    retryCount: { type: Number, default: 0 },
    lastRetry: Date
  },
  // Additional metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    appVersion: String,
    source: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' }
  },
  // Notifications
  notifications: {
    email: { sent: Boolean, sentAt: Date },
    push: { sent: Boolean, sentAt: Date },
    sms: { sent: Boolean, sentAt: Date }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});

// Compound indexes for common queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ walletAddress: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'blockchain.network': 1, 'blockchain.blockNumber': 1 });
transactionSchema.index({ transactionId: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for transaction display name
transactionSchema.virtual('displayName').get(function() {
  const typeMap = {
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    transfer: 'Transfer',
    swap: 'Token Swap',
    lend: 'Lending',
    borrow: 'Borrowing'
  };
  return typeMap[this.type] || this.type;
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toLocaleString()} ${this.currency}`;
});

// Virtual for total cost including fees
transactionSchema.virtual('totalCost').get(function() {
  return this.amount + (this.fees.totalFee || 0);
});

// Virtual for processing time
transactionSchema.virtual('processingTime').get(function() {
  if (this.timestamps.completed && this.timestamps.initiated) {
    return Math.floor((this.timestamps.completed - this.timestamps.initiated) / 1000 / 60); // minutes
  }
  return null;
});

// Instance methods

// Generate unique transaction ID
transactionSchema.methods.generateTransactionId = function() {
  const prefix = this.type.toUpperCase().substr(0, 3);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  this.transactionId = `${prefix}_${timestamp}_${random}`;
  return this.transactionId;
};

// Update transaction status
transactionSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Update timestamp
  const timestampField = {
    'submitted': 'submitted',
    'confirmed': 'confirmed',
    'completed': 'completed',
    'failed': 'failed'
  }[newStatus];
  
  if (timestampField) {
    this.timestamps[timestampField] = new Date();
  }
  
  // Add any additional data
  Object.assign(this, additionalData);
  
  return this.save();
};

// Calculate and update fees
transactionSchema.methods.calculateFees = function() {
  let networkFee = 0;
  let protocolFee = 0;
  let platformFee = 0;
  
  // Network fees (gas fees for blockchain transactions)
  if (['transfer', 'swap', 'lend', 'borrow'].includes(this.type)) {
    networkFee = this.amount * 0.001; // 0.1% network fee
  }
  
  // Protocol fees (for DeFi operations)
  if (this.defi && this.defi.protocol) {
    protocolFee = this.amount * 0.002; // 0.2% protocol fee
  }
  
  // Platform fees
  platformFee = this.amount * 0.005; // 0.5% platform fee
  
  this.fees = {
    networkFee,
    protocolFee,
    platformFee,
    totalFee: networkFee + protocolFee + platformFee
  };
  
  return this.fees;
};

// Add compliance check
transactionSchema.methods.addComplianceCheck = function(checkType, status, details = {}) {
  if (!this.compliance[checkType]) {
    this.compliance[checkType] = {};
  }
  
  this.compliance[checkType].status = status;
  this.compliance[checkType].checkedAt = new Date();
  
  if (details.score) this.compliance[checkType].score = details.score;
  if (details.flags) this.compliance[checkType].flags = details.flags;
  
  return this.save();
};

// Check if transaction needs manual review
transactionSchema.methods.needsManualReview = function() {
  // High-value transactions
  if (this.amount > 100000) return true; // 1 lakh INR
  
  // High risk score
  if (this.compliance.riskScore > 70) return true;
  
  // Failed compliance checks
  const checks = ['amlCheck', 'sanctionCheck', 'fraudCheck'];
  for (const check of checks) {
    if (this.compliance[check]?.status === 'failed') return true;
  }
  
  return false;
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Generate transaction ID if not exists
  if (!this.transactionId) {
    this.generateTransactionId();
  }
  
  // Ensure wallet address is lowercase
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  
  if (this.recipient?.walletAddress) {
    this.recipient.walletAddress = this.recipient.walletAddress.toLowerCase();
  }
  
  // Calculate fees if not set
  if (!this.fees.totalFee) {
    this.calculateFees();
  }
  
  next();
});

// Static methods

// Find transactions by user
transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ user: userId });
  
  if (options.type) query.where({ type: options.type });
  if (options.status) query.where({ status: options.status });
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort);
  else query.sort({ createdAt: -1 });
  
  return query;
};

// Find transactions by wallet
transactionSchema.statics.findByWallet = function(walletAddress, options = {}) {
  const query = this.find({ walletAddress: walletAddress.toLowerCase() });
  
  if (options.type) query.where({ type: options.type });
  if (options.status) query.where({ status: options.status });
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort);
  else query.sort({ createdAt: -1 });
  
  return query;
};

// Get transaction statistics
transactionSchema.statics.getStats = function(timeframe = '30d') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalVolume: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Find pending transactions
transactionSchema.statics.findPending = function(olderThan = null) {
  const query = { status: { $in: ['pending', 'processing'] } };
  
  if (olderThan) {
    query.createdAt = { $lt: new Date(Date.now() - olderThan) };
  }
  
  return this.find(query).sort({ createdAt: 1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);
