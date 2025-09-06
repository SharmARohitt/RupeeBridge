'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Transfer() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success
  const [transactionId, setTransactionId] = useState('');
  const [balance, setBalance] = useState(0);

  const minTransfer = 10;
  const maxTransfer = 50000;
  const transferFee = 1; // 1 arbINR fee for transfers

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else {
      fetchBalance();
    }
  }, [isConnected, router]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/balance', {
        headers: {
          'x-wallet-address': address || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(e.target.value.trim());
  };

  const isValidAmount = () => {
    const num = parseFloat(amount);
    return num >= minTransfer && num <= maxTransfer && num <= balance && !isNaN(num);
  };

  const isValidAddress = () => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(recipientAddress) && recipientAddress.toLowerCase() !== address?.toLowerCase();
  };

  const isFormValid = () => {
    return isValidAmount() && isValidAddress();
  };

  const handleInitiateTransfer = async () => {
    if (!isFormValid()) return;
    
    setStep(2);
  };

  const handleConfirmTransfer = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/transactions/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || ''
        },
        body: JSON.stringify({
          recipientAddress: recipientAddress,
          amount: parseFloat(amount)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to process transfer');
      }

      const data = await response.json();
      setTransactionId(data.data?.transaction?.id || data.transactionId || `TXN${Date.now()}`);
      setStep(3);
      
      // Refresh balance
      fetchBalance();
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Failed to process transfer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowRightIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Transfer arbINR
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send arbINR tokens to another wallet instantly
          </p>
        </motion.div>

        {/* Balance Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 mb-8 text-center"
        >
          <div className="text-white/80 text-sm mb-1">Available Balance</div>
          <div className="text-white text-3xl font-bold">
            {balance.toLocaleString()} arbINR
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-purple-500 text-white' 
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
                    step > stepNumber ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
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
                Transfer Details
              </h2>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Wallet Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={handleAddressChange}
                    placeholder="0x742d35Cc6639C0532fEb99b3F9b90e976B3B0c8D"
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                </div>
                {recipientAddress && !isValidAddress() && (
                  <p className="text-red-500 text-sm mt-1">
                    {recipientAddress.toLowerCase() === address?.toLowerCase() 
                      ? "Cannot transfer to your own address" 
                      : "Please enter a valid Ethereum address"}
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (arbINR)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full px-4 py-4 text-2xl font-semibold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    arbINR
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>Min: {minTransfer} arbINR</span>
                  <span>Available: {balance.toLocaleString()} arbINR</span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-3">
                {[100, 500, 1000, Math.floor(balance * 0.25)].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    disabled={quickAmount > balance || quickAmount < minTransfer}
                    className="py-2 px-4 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quickAmount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Transfer Details */}
              {amount && isValidAmount() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-3"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Transfer amount</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{parseFloat(amount).toLocaleString()} arbINR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Network fee</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{transferFee} arbINR</span>
                  </div>
                  <div className="border-t border-purple-200 dark:border-purple-800 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total deducted</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {(parseFloat(amount) + transferFee).toLocaleString()} arbINR
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Info Banner */}
              <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Transfers are processed instantly on the Arbitrum network. The recipient will receive the tokens immediately.
                </div>
              </div>

              {/* Continue Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInitiateTransfer}
                disabled={!isFormValid()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
              >
                Review Transfer
              </motion.button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Confirm Transfer
              </h2>

              {/* Transfer Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Transfer Summary
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">From:</span>
                    <span className="font-mono text-sm">{formatAddress(address || '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">To:</span>
                    <span className="font-mono text-sm">{formatAddress(recipientAddress)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-semibold">{parseFloat(amount).toLocaleString()} arbINR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Network Fee:</span>
                    <span className="font-semibold">{transferFee} arbINR</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {(parseFloat(amount) + transferFee).toLocaleString()} arbINR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-semibold mb-1">Please verify the recipient address carefully</p>
                    <p>Transactions cannot be reversed once confirmed. Make sure the recipient address is correct.</p>
                  </div>
                </div>
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
                  onClick={handleConfirmTransfer}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Confirm Transfer'
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
                  Transfer Successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your arbINR tokens have been sent successfully
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Transaction Completed
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {parseFloat(amount).toLocaleString()} arbINR
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>To: {formatAddress(recipientAddress)}</div>
                    <div>Transaction ID: {transactionId}</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStep(1);
                    setAmount('');
                    setRecipientAddress('');
                    setTransactionId('');
                  }}
                  className="flex-1 border-2 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 font-semibold py-3 px-6 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                >
                  Send Another
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Return to Dashboard
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
