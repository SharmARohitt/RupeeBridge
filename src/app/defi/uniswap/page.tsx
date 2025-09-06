'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  InformationCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function UniswapIntegration() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'swap' | 'pool'>('swap');
  const [swapAmount, setSwapAmount] = useState('');
  const [fromToken, setFromToken] = useState('arbINR');
  const [toToken, setToToken] = useState('USDC');
  const [poolAmount1, setPoolAmount1] = useState('');
  const [poolAmount2, setPoolAmount2] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const exchangeRate = 0.012; // 1 INR = 0.012 USDC (example)
  const poolAPY = 12.5;
  const userBalance = 1200; // arbINR balance

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleSwapAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setSwapAmount(value);
  };

  const handlePoolAmount1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setPoolAmount1(value);
    // Auto-calculate second token amount based on pool ratio
    if (value) {
      setPoolAmount2((parseFloat(value) * exchangeRate).toFixed(2));
    } else {
      setPoolAmount2('');
    }
  };

  const getSwapOutput = () => {
    if (!swapAmount) return '0';
    const amount = parseFloat(swapAmount);
    if (fromToken === 'arbINR') {
      return (amount * exchangeRate).toFixed(4);
    } else {
      return (amount / exchangeRate).toFixed(2);
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleSwap = async () => {
    if (!swapAmount) return;
    setIsLoading(true);
    
    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Swap completed successfully!');
      setSwapAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!poolAmount1 || !poolAmount2) return;
    setIsLoading(true);
    
    try {
      // Simulate liquidity addition
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Liquidity added successfully!');
      setPoolAmount1('');
      setPoolAmount2('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <CurrencyRupeeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RupeeBridge
            </span>
          </div>
        </motion.div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowsUpDownIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Uniswap Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Swap tokens and provide liquidity to earn rewards
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 mb-8 max-w-md mx-auto"
        >
          <button
            onClick={() => setActiveTab('swap')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'swap'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Swap
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'pool'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Pool
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Interface */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8"
          >
            {activeTab === 'swap' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Swap Tokens
                </h2>

                {/* From Token */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    From
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <select
                        value={fromToken}
                        onChange={(e) => setFromToken(e.target.value)}
                        className="bg-transparent text-lg font-semibold text-gray-900 dark:text-white focus:outline-none"
                      >
                        <option value="arbINR">arbINR</option>
                        <option value="USDC">USDC</option>
                      </select>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Balance: {userBalance.toLocaleString()}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={swapAmount}
                      onChange={handleSwapAmountChange}
                      placeholder="0.0"
                      className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSwapTokens}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ArrowsUpDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>

                {/* To Token */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    To
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <select
                        value={toToken}
                        onChange={(e) => setToToken(e.target.value)}
                        className="bg-transparent text-lg font-semibold text-gray-900 dark:text-white focus:outline-none"
                      >
                        <option value="USDC">USDC</option>
                        <option value="arbINR">arbINR</option>
                      </select>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getSwapOutput()}
                    </div>
                  </div>
                </div>

                {/* Exchange Rate */}
                {swapAmount && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        1 {fromToken} = {fromToken === 'arbINR' ? exchangeRate : (1/exchangeRate).toFixed(2)} {toToken}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Swap Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSwap}
                  disabled={!swapAmount || isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Swapping...</span>
                    </div>
                  ) : (
                    'Swap'
                  )}
                </motion.button>
              </div>
            )}

            {activeTab === 'pool' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Liquidity
                </h2>

                {/* Pool Info */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">arbINR/USDC Pool</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Earn fees and rewards</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{poolAPY}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">APY</div>
                    </div>
                  </div>
                </div>

                {/* Token 1 Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    arbINR Amount
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">arbINR</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Balance: {userBalance.toLocaleString()}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={poolAmount1}
                      onChange={handlePoolAmount1Change}
                      placeholder="0.0"
                      className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Plus Icon */}
                <div className="flex justify-center">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <PlusIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>

                {/* Token 2 Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    USDC Amount
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">USDC</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Balance: 0
                      </div>
                    </div>
                    <input
                      type="text"
                      value={poolAmount2}
                      onChange={(e) => setPoolAmount2(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pool Share */}
                {poolAmount1 && poolAmount2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Your pool share</span>
                      <span className="font-semibold text-gray-900 dark:text-white">0.01%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">LP tokens received</span>
                      <span className="font-semibold text-gray-900 dark:text-white">~{poolAmount1}</span>
                    </div>
                  </motion.div>
                )}

                {/* Add Liquidity Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddLiquidity}
                  disabled={!poolAmount1 || !poolAmount2 || isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding Liquidity...</span>
                    </div>
                  ) : (
                    'Add Liquidity'
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Pool Stats */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pool Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Liquidity</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$2.4M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$156K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">24h Fees</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">$468</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your Position</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$0</span>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrophyIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Liquidity Rewards
                </h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Earn additional rewards for providing liquidity:
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Trading Fees:</span>
                    <span className="font-semibold text-green-600">0.3% APY</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Rewards:</span>
                    <span className="font-semibold text-purple-600">12.2% APY</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total APY:</span>
                      <span className="text-green-600">{poolAPY}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Providing liquidity earns you a share of trading fees. The more you provide, the more you earn!
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
