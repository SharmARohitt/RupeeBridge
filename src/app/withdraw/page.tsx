'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  ArrowUpIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Withdraw() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success
  const [transactionId, setTransactionId] = useState('');
  const [userBalance, setUserBalance] = useState(0);

  const minWithdraw = 100;
  const maxWithdraw = 50000;
  const processingFee = 10; // ₹10 fee for withdrawals
  const exchangeRate = 1; // 1:1 peg

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else {
      fetchUserBalance();
    }
  }, [isConnected, router]);

  const fetchUserBalance = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/contracts/balance/${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const isValidAmount = () => {
    const num = parseFloat(amount);
    return num >= minWithdraw && num <= maxWithdraw && num <= userBalance && !isNaN(num);
  };

  const isValidBankDetails = () => {
    return bankAccount.length >= 9 && 
           ifscCode.length >= 11 && 
           bankName.trim().length > 0 && 
           accountHolder.trim().length > 0;
  };

  const totalAmount = parseFloat(amount) + processingFee;

  const handleInitiateWithdraw = async () => {
    if (!isValidAmount() || !isValidBankDetails()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/transactions/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          amount: parseFloat(amount),
          bankDetails: {
            accountNumber: bankAccount,
            ifscCode,
            bankName,
            accountHolder
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate withdrawal');
      }

      const data = await response.json();
      setTransactionId(data.data.transaction.id);
      setStep(2);
    } catch (error) {
      console.error('Withdrawal initiation failed:', error);
      alert('Failed to initiate withdrawal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would process the withdrawal
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep(3);
    } catch (error) {
      console.error('Withdrawal confirmation failed:', error);
      alert('Failed to process withdrawal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <CurrencyRupeeIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Withdraw arbINR
          </span>
        </motion.div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {step === 1 && (
          <motion.div {...fadeInUp} className="space-y-8">
            {/* Balance Display */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Available Balance</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {userBalance.toFixed(2)} <span className="text-lg">arbINR</span>
                </p>
              </div>
            </div>

            {/* Withdraw Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Withdrawal Details
                  </h3>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 pl-8 pr-16 text-lg border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <CurrencyRupeeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-4" />
                    <span className="absolute right-3 top-4 text-sm text-gray-500">arbINR</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Min: ₹{minWithdraw}</span>
                    <span>Max: ₹{maxWithdraw}</span>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                    Bank Account Details
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Enter account holder name"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter bank account number"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="Enter IFSC code"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Fee Information */}
                {amount && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <div className="flex items-start space-x-2">
                      <InformationCircleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <p className="font-medium">Transaction Summary</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between">
                            <span>Withdrawal Amount:</span>
                            <span>₹{parseFloat(amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Fee:</span>
                            <span>₹{processingFee}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-orange-200 dark:border-orange-700 pt-1">
                            <span>Total Deducted:</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Withdraw Button */}
                <motion.button
                  onClick={handleInitiateWithdraw}
                  disabled={!isValidAmount() || !isValidBankDetails() || isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:from-red-700 hover:to-orange-700 disabled:hover:from-gray-400 disabled:hover:to-gray-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <ArrowUpIcon className="w-5 h-5" />
                      <span>Withdraw arbINR</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div {...fadeInUp} className="space-y-8">
            {/* Confirmation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                  <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Confirm Withdrawal
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please review your withdrawal details before confirming
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-left">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                      <span className="font-mono text-sm">{transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-semibold">₹{parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
                      <span>₹{processingFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bank Account:</span>
                      <span className="font-mono text-sm">****{bankAccount.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                      <span className="font-mono text-sm">{ifscCode}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-3 font-semibold">
                      <span>Total Deducted:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <motion.button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 px-6 rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handleConfirmWithdraw}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:from-red-700 hover:to-orange-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Confirm Withdrawal"
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div {...fadeInUp} className="space-y-8">
            {/* Success */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Withdrawal Submitted!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your withdrawal request has been submitted successfully
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium mb-2">What happens next?</p>
                    <ul className="space-y-1 text-left">
                      <li>• Your withdrawal is being processed</li>
                      <li>• Funds will be transferred to your bank account within 1-2 business days</li>
                      <li>• You&apos;ll receive a confirmation once the transfer is complete</li>
                      <li>• Transaction ID: <span className="font-mono">{transactionId}</span></li>
                    </ul>
                  </div>
                </div>

                <motion.button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to Dashboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
