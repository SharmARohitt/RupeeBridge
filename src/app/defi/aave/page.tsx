'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function AaveIntegration() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'supply' | 'borrow'>('supply');
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supplyAPY = 8.7;
  const borrowAPY = 12.3;
  const userBalance = 1200; // arbINR balance
  const userSupplied = 0; // Currently supplied
  const userBorrowed = 0; // Currently borrowed
  const healthFactor = 1.5; // Borrowing health factor
  const maxLTV = 75; // Maximum Loan-to-Value ratio

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleSupplyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setSupplyAmount(value);
  };

  const handleBorrowAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setBorrowAmount(value);
  };

  const getMaxBorrowAmount = () => {
    const suppliedValue = userSupplied + (supplyAmount ? parseFloat(supplyAmount) : 0);
    return (suppliedValue * maxLTV) / 100;
  };

  const getNewHealthFactor = () => {
    const suppliedValue = userSupplied + (supplyAmount ? parseFloat(supplyAmount) : 0);
    const borrowedValue = userBorrowed + (borrowAmount ? parseFloat(borrowAmount) : 0);
    
    if (borrowedValue === 0) return '∞';
    return (suppliedValue * 0.8 / borrowedValue).toFixed(2); // Simplified calculation
  };

  const handleSupply = async () => {
    if (!supplyAmount) return;
    setIsLoading(true);
    
    try {
      // Simulate supply transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Supply successful!');
      setSupplyAmount('');
    } catch (error) {
      console.error('Supply failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount) return;
    setIsLoading(true);
    
    try {
      // Simulate borrow transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Borrow successful!');
      setBorrowAmount('');
    } catch (error) {
      console.error('Borrow failed:', error);
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Aave Lending Protocol
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supply your arbINR to earn interest or borrow against your collateral
          </p>
        </motion.div>

        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Supplies</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{userSupplied.toLocaleString()}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">arbINR</div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Borrows</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{userBorrowed.toLocaleString()}</div>
            <div className="text-sm text-red-600 dark:text-red-400">USDC</div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net APY</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">+{supplyAPY}%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Earning</div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Health Factor</div>
            <div className={`text-2xl font-bold ${healthFactor > 1.2 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {healthFactor}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Good</div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Tabs */}
            <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2">
              <button
                onClick={() => setActiveTab('supply')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'supply'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Supply
              </button>
              <button
                onClick={() => setActiveTab('borrow')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'borrow'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Borrow
              </button>
            </div>

            {/* Supply Tab */}
            {activeTab === 'supply' && (
              <motion.div
                key="supply"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 space-y-6"
              >
                <div className="flex items-center space-x-3">
                  <ArrowUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Supply arbINR
                  </h2>
                </div>

                {/* APY Display */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Supply APY</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Earn interest on your arbINR</p>
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {supplyAPY}%
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount to Supply
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
                      value={supplyAmount}
                      onChange={handleSupplyAmountChange}
                      placeholder="0.0"
                      className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white focus:outline-none"
                    />
                    <div className="flex space-x-2 mt-3">
                      {[25, 50, 75, 100].map((percentage) => (
                        <button
                          key={percentage}
                          onClick={() => setSupplyAmount(((userBalance * percentage) / 100).toString())}
                          className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          {percentage}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Projected Earnings */}
                {supplyAmount && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white">Projected Earnings</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Daily</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {((parseFloat(supplyAmount) * supplyAPY) / 365 / 100).toFixed(2)} arbINR
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Monthly</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {((parseFloat(supplyAmount) * supplyAPY) / 12 / 100).toFixed(2)} arbINR
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Yearly</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {((parseFloat(supplyAmount) * supplyAPY) / 100).toFixed(2)} arbINR
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Supply Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSupply}
                  disabled={!supplyAmount || parseFloat(supplyAmount) > userBalance || isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Supplying...</span>
                    </div>
                  ) : (
                    'Supply arbINR'
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* Borrow Tab */}
            {activeTab === 'borrow' && (
              <motion.div
                key="borrow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 space-y-6"
              >
                <div className="flex items-center space-x-3">
                  <ArrowDownIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Borrow USDC
                  </h2>
                </div>

                {/* Borrowing Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Borrow APY</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Variable interest rate</p>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {borrowAPY}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Max you can borrow: <span className="font-semibold">{getMaxBorrowAmount().toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* Collateral Warning */}
                {userSupplied === 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        You need to supply collateral before you can borrow. Supply arbINR first to use as collateral.
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount to Borrow
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">USDC</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Available: {getMaxBorrowAmount().toFixed(2)}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={borrowAmount}
                      onChange={handleBorrowAmountChange}
                      placeholder="0.0"
                      disabled={userSupplied === 0}
                      className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white focus:outline-none disabled:opacity-50"
                    />
                    {userSupplied > 0 && (
                      <div className="flex space-x-2 mt-3">
                        {[25, 50, 75].map((percentage) => (
                          <button
                            key={percentage}
                            onClick={() => setBorrowAmount(((getMaxBorrowAmount() * percentage) / 100).toFixed(2))}
                            className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            {percentage}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Factor Preview */}
                {borrowAmount && userSupplied > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white">Borrow Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Current Health Factor</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{healthFactor}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">New Health Factor</div>
                        <div className={`font-semibold ${parseFloat(getNewHealthFactor()) > 1.2 ? 'text-green-600' : 'text-orange-600'}`}>
                          {getNewHealthFactor()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Keep your health factor above 1.0 to avoid liquidation
                    </div>
                  </motion.div>
                )}

                {/* Borrow Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBorrow}
                  disabled={!borrowAmount || parseFloat(borrowAmount) > getMaxBorrowAmount() || userSupplied === 0 || isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Borrowing...</span>
                    </div>
                  ) : userSupplied === 0 ? (
                    'Supply Collateral First'
                  ) : (
                    'Borrow USDC'
                  )}
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Market Overview */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Market Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Supplied</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹12.5M</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Borrowed</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹8.1M</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Utilization Rate</span>
                    <span className="font-semibold text-gray-900 dark:text-white">65%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Information */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Risk Parameters
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Maximum LTV</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{maxLTV}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Liquidation Threshold</span>
                  <span className="font-semibold text-gray-900 dark:text-white">80%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Liquidation Penalty</span>
                  <span className="font-semibold text-gray-900 dark:text-white">5%</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <div className="font-semibold mb-1">How it works:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Supply arbINR to earn interest</li>
                    <li>Use supplied assets as collateral</li>
                    <li>Borrow other assets against collateral</li>
                    <li>Maintain health factor above 1.0</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
