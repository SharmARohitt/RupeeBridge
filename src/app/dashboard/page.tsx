'use client';

import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  TrophyIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  from?: string;
  to?: string;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [arbINRBalance, setArbINRBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: '1000',
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      to: address
    },
    {
      id: '2',
      type: 'transfer',
      amount: '250',
      status: 'completed',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      from: address,
      to: '0x742d35Cc6634C0532925a3b8D7389c7abb1F1c1e'
    },
    {
      id: '3',
      type: 'withdraw',
      amount: '500',
      status: 'pending',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      from: address
    }
  ]);

  const usdValue = '14.40'; // Assuming 1 INR = 0.012 USD
  const inrValue = '1,200';

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else {
      fetchUserBalance();
      fetchTransactions();
    }
  }, [isConnected, router]);

  const fetchUserBalance = async () => {
    try {
      setIsBalanceLoading(true);
      const response = await fetch(`http://localhost:5000/api/contracts/balance/${address}`);
      if (response.ok) {
        const data = await response.json();
        setArbINRBalance(data.data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions?limit=5`, {
        headers: {
          'x-wallet-address': address || '',
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.transactions) {
          setTransactions(data.data.transactions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownIcon className="w-4 h-4 text-green-500" />;
      case 'withdraw':
        return <ArrowUpIcon className="w-4 h-4 text-red-500" />;
      case 'transfer':
        return <ArrowsRightLeftIcon className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <CurrencyRupeeIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            RupeeBridge
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatAddress(address)}
          </div>
          <ConnectButton showBalance={false} />
        </motion.div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your arbINR balance and explore DeFi opportunities
          </p>
        </motion.div>

        {/* Balance Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Main Balance Card */}
          <motion.div
            variants={fadeInUp}
            className="md:col-span-2 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Wallet Balance
                </h3>
                <div className="flex items-center space-x-2">
                  {balanceVisible ? (
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      {isBalanceLoading ? (
                        <div className="animate-pulse">•••••</div>
                      ) : (
                        <>
                          {arbINRBalance.toFixed(2)} <span className="text-lg text-blue-600">arbINR</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      ••••• <span className="text-lg text-blue-600">arbINR</span>
                    </div>
                  )}
                  <button
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {balanceVisible ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {balanceVisible && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ≈ ₹{inrValue} INR • ${usdValue} USD
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <CurrencyRupeeIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/deposit')}
                className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <ArrowDownIcon className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Deposit</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/withdraw')}
                className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <ArrowUpIcon className="w-5 h-5 text-red-600 dark:text-red-400 mb-2" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Withdraw</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/transfer')}
                className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <ArrowsRightLeftIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Transfer</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            variants={fadeInUp}
            className="space-y-4"
          >
            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹142.50</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">+12.5% this month</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rewards Points</h4>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">2,580</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gold tier</p>
                </div>
                <TrophyIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* DeFi Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">DeFi Opportunities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 cursor-pointer"
              onClick={() => router.push('/defi/uniswap')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Uniswap Pool
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Provide liquidity to arbINR/USDC pool
                  </p>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    12.5% APY
                  </div>
                </div>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-xl flex items-center justify-center">
                  <PlusIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Your Position: ₹0 • Available: ₹{inrValue}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 cursor-pointer"
              onClick={() => router.push('/defi/aave')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Aave Lending
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Lend your arbINR and earn interest
                  </p>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    8.7% APY
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Your Position: ₹0 • Available: ₹{inrValue}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                        {tx.type}
                      </h4>
                      {getStatusIcon(tx.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tx.type === 'transfer' && tx.to && `To ${formatAddress(tx.to)}`}
                      {tx.type === 'deposit' && 'From Bank Account'}
                      {tx.type === 'withdraw' && 'To Bank Account'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'deposit' ? 'text-green-600 dark:text-green-400' : 
                    tx.type === 'withdraw' ? 'text-red-600 dark:text-red-400' : 
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount} arbINR
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(tx.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
