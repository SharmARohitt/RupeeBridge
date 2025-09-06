// routes/contracts.js - Smart contract interaction routes
const express = require('express');
const { contractService } = require('../services/contractService');
const { authenticateWallet } = require('../middleware/auth');
const { validateAmount, validateWalletAddress } = require('../middleware/validation');
const router = express.Router();

// GET /api/contracts/info - Get contract information
router.get('/info', async (req, res) => {
  try {
    const contractInfo = await contractService.getContractInfo();
    
    res.json({
      success: true,
      data: contractInfo
    });
  } catch (error) {
    console.error('Get contract info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract information',
      error: error.message
    });
  }
});

// GET /api/contracts/balance/:address - Get token balance for address
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!contractService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }
    
    const balance = await contractService.getTokenBalance(address);
    
    res.json({
      success: true,
      data: {
        address,
        balance: balance,
        balanceFormatted: balance.toLocaleString(),
        usdValue: (balance * 0.012).toFixed(2),
        inrValue: balance.toFixed(2)
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

// POST /api/contracts/validate-address - Validate wallet address
router.post('/validate-address', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    const isValid = contractService.isValidAddress(address);
    
    let additionalInfo = {};
    if (isValid) {
      try {
        const balance = await contractService.getTokenBalance(address);
        additionalInfo = {
          hasBalance: balance > 0,
          balance: balance
        };
      } catch (error) {
        // Address is valid but balance check failed
        additionalInfo = {
          hasBalance: false,
          balance: 0
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        address,
        isValid,
        ...additionalInfo
      }
    });
  } catch (error) {
    console.error('Validate address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate address',
      error: error.message
    });
  }
});

// GET /api/contracts/transaction/:txHash - Get transaction details
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    // Mock transaction details (in production, query actual blockchain)
    const mockTransaction = {
      hash: txHash,
      status: 'confirmed',
      blockNumber: Math.floor(Math.random() * 1000000) + 19000000,
      gasUsed: Math.floor(Math.random() * 50000) + 21000,
      gasPrice: '0.0001',
      timestamp: new Date().toISOString(),
      confirmations: Math.floor(Math.random() * 100) + 12
    };
    
    res.json({
      success: true,
      data: mockTransaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message
    });
  }
});

// GET /api/contracts/stats - Get contract statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock contract statistics
    const stats = {
      totalSupply: '50000000',
      totalHolders: 10847,
      totalTransactions: 156789,
      marketCap: '600000000', // $600M
      price: {
        usd: 0.012,
        inr: 1.0
      },
      volume24h: '2400000',
      circulating: '48500000'
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get contract stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract statistics',
      error: error.message
    });
  }
});

// POST /api/contracts/estimate-gas - Estimate gas for transaction
router.post('/estimate-gas', authenticateWallet, async (req, res) => {
  try {
    const { operation, amount, toAddress } = req.body;
    
    // Mock gas estimation
    let estimatedGas;
    switch (operation) {
      case 'transfer':
        estimatedGas = 21000 + Math.floor(Math.random() * 5000);
        break;
      case 'mint':
        estimatedGas = 45000 + Math.floor(Math.random() * 10000);
        break;
      case 'burn':
        estimatedGas = 35000 + Math.floor(Math.random() * 8000);
        break;
      default:
        estimatedGas = 25000;
    }
    
    const gasPrice = 0.0001; // Mock gas price in ETH
    const estimatedCost = estimatedGas * gasPrice;
    
    res.json({
      success: true,
      data: {
        operation,
        estimatedGas,
        gasPrice,
        estimatedCost: estimatedCost.toFixed(6),
        estimatedCostUSD: (estimatedCost * 2000).toFixed(2) // Assuming 1 ETH = $2000
      }
    });
  } catch (error) {
    console.error('Estimate gas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate gas',
      error: error.message
    });
  }
});

// GET /api/contracts/events - Get recent contract events
router.get('/events', async (req, res) => {
  try {
    const { limit = 50, offset = 0, eventType } = req.query;
    
    // Mock recent events
    const mockEvents = [
      {
        type: 'Transfer',
        from: '0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e',
        to: '0x8ba1f109551bD432803012645Hac136c78c1ba1f',
        amount: '1000.00',
        txHash: '0x' + Math.random().toString(16).slice(2) + Date.now().toString(16),
        blockNumber: Math.floor(Math.random() * 1000000) + 19000000,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
      },
      {
        type: 'Mint',
        to: '0x8ba1f109551bD432803012645Hac136c78c1ba1f',
        amount: '2500.00',
        txHash: '0x' + Math.random().toString(16).slice(2) + Date.now().toString(16),
        blockNumber: Math.floor(Math.random() * 1000000) + 19000000,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
      },
      {
        type: 'Burn',
        from: '0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e',
        amount: '500.00',
        txHash: '0x' + Math.random().toString(16).slice(2) + Date.now().toString(16),
        blockNumber: Math.floor(Math.random() * 1000000) + 19000000,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }
    ];
    
    let filteredEvents = mockEvents;
    if (eventType) {
      filteredEvents = mockEvents.filter(event => 
        event.type.toLowerCase() === eventType.toLowerCase()
      );
    }
    
    const paginatedEvents = filteredEvents.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        events: paginatedEvents,
        pagination: {
          total: filteredEvents.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract events',
      error: error.message
    });
  }
});

module.exports = router;
