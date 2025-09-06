'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Deposit() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Bank Transfer, 3: Confirmation
  const [transactionId, setTransactionId] = useState('');

  const minDeposit = 100;
  const maxDeposit = 100000;
  const processingFee = 0; // No fee for deposits
  const exchangeRate = 1; // 1:1 peg

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const isValidAmount = () => {
    const num = parseFloat(amount);
    return num >= minDeposit && num <= maxDeposit && !isNaN(num);
  };

  const handleInitiateDeposit = async () => {
    if (!isValidAmount()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/transactions/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          amount: parseFloat(amount),
          type: 'bank_transfer'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate deposit');
      }

      const data = await response.json();
      setTransactionId(data.transactionId);
      setStep(2);
    } catch (error) {
      console.error('Deposit initiation failed:', error);
      alert('Failed to initiate deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/confirm-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      setStep(3);
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      alert('Failed to confirm payment. Please try again.');
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

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowDownIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Deposit INR
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Convert your INR to arbINR tokens instantly
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {step > stepNumber ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-8 h-0.5 ${
                    step > stepNumber ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Enter Deposit Amount
              </h2>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (INR)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full px-4 py-4 text-2xl font-semibold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    INR
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>Min: ₹{minDeposit.toLocaleString()}</span>
                  <span>Max: ₹{maxDeposit.toLocaleString()}</span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-3">
                {[500, 1000, 5000, 10000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className="py-2 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    ₹{quickAmount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Exchange Details */}
              {amount && isValidAmount() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">You deposit</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₹{parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Exchange rate</span>
                    <span className="font-semibold text-gray-900 dark:text-white">1 INR = 1 arbINR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Processing fee</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">Free</span>
                  </div>
                  <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">You receive</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {parseFloat(amount).toLocaleString()} arbINR
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Info Banner */}
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <InformationCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your bank transfer will be processed within 5-10 minutes. arbINR tokens will be minted to your wallet upon confirmation.
                </div>
              </div>

              {/* Continue Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInitiateDeposit}
                disabled={!isValidAmount() || isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Continue to Bank Transfer'
                )}
              </motion.button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Complete Bank Transfer
              </h2>

              {/* Transaction Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Transfer Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Transaction ID: <span className="font-mono">{transactionId}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bank Name:</span>
                    <span className="font-semibold">RupeeBridge Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                    <span className="font-mono">1234567890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                    <span className="font-mono">RUPB0001234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount to Transfer:</span>
                    <span className="font-bold text-green-600">₹{parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                    <span className="font-mono text-sm">{transactionId}</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Open your banking app or visit your bank&apos;s website</li>
                  <li>Initiate a transfer to the account details shown above</li>
                  <li>Use the transaction ID as the reference/remark</li>
                  <li>Click &quot;I&apos;ve Made the Payment&quot; button below once completed</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmPayment}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "I&apos;ve Made the Payment"
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Deposit Successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your arbINR tokens have been minted to your wallet
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Transaction Completed
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  +{parseFloat(amount).toLocaleString()} arbINR
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Transaction ID: {transactionId}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200"
              >
                Return to Dashboard
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
