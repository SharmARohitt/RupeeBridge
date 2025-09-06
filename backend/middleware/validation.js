// middleware/validation.js - Request validation middleware
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');

// Generic validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Transaction validation middleware
const validateTransaction = [
  body('amount')
    .isNumeric({ no_symbols: false })
    .withMessage('Amount must be a valid number')
    .custom((value) => {
      const amount = parseFloat(value);
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (amount > 1000000) {
        throw new Error('Amount exceeds maximum limit');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Deposit validation
const validateDeposit = [
  ...validateTransaction,
  body('bankingDetails.accountNumber')
    .optional()
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be between 8-20 characters'),
  
  body('bankingDetails.ifscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
  
  body('bankingDetails.bankName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2-100 characters'),
  
  handleValidationErrors
];

// Withdrawal validation
const validateWithdrawal = [
  ...validateTransaction,
  body('bankingDetails')
    .exists()
    .withMessage('Banking details are required for withdrawal'),
  
  body('bankingDetails.paymentMethod')
    .isIn(['bank_transfer', 'upi'])
    .withMessage('Payment method must be either bank_transfer or upi'),
  
  body('bankingDetails.accountNumber')
    .if(body('bankingDetails.paymentMethod').equals('bank_transfer'))
    .notEmpty()
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number is required for bank transfer'),
  
  body('bankingDetails.ifscCode')
    .if(body('bankingDetails.paymentMethod').equals('bank_transfer'))
    .notEmpty()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Valid IFSC code is required for bank transfer'),
  
  body('bankingDetails.upiId')
    .if(body('bankingDetails.paymentMethod').equals('upi'))
    .notEmpty()
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage('Valid UPI ID is required for UPI transfer'),
  
  handleValidationErrors
];

// Transfer validation
const validateTransfer = [
  ...validateTransaction,
  body('recipientAddress')
    .notEmpty()
    .withMessage('Recipient address is required')
    .custom((value) => {
      if (!ethers.isAddress(value)) {
        throw new Error('Invalid recipient wallet address');
      }
      return true;
    }),
  
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Note cannot exceed 200 characters'),
  
  handleValidationErrors
];

// User profile validation
const validateUserProfile = [
  body('profile.name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),
  
  body('profile.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('profile.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  
  handleValidationErrors
];

// KYC validation
const validateKYC = [
  body('personalInfo.fullName')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name is required (2-100 characters)'),
  
  body('personalInfo.dateOfBirth')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid date of birth is required'),
  
  body('personalInfo.nationality')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nationality is required'),
  
  body('documents.idType')
    .isIn(['passport', 'driving_license', 'national_id', 'aadhaar'])
    .withMessage('Valid ID type is required'),
  
  body('documents.idNumber')
    .notEmpty()
    .isLength({ min: 5, max: 50 })
    .withMessage('ID number is required'),
  
  body('address.street')
    .notEmpty()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address is required'),
  
  body('address.city')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('City is required'),
  
  body('address.country')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country is required'),
  
  body('address.postalCode')
    .notEmpty()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code is required'),
  
  handleValidationErrors
];

// Limit validation
const validateLimits = [
  body('transactionLimit')
    .optional()
    .isNumeric()
    .custom((value) => {
      const limit = parseFloat(value);
      if (limit < 1000 || limit > 10000000) {
        throw new Error('Transaction limit must be between ₹1,000 and ₹10,000,000');
      }
      return true;
    }),
  
  body('dailyWithdrawLimit')
    .optional()
    .isNumeric()
    .custom((value) => {
      const limit = parseFloat(value);
      if (limit < 500 || limit > 5000000) {
        throw new Error('Daily withdrawal limit must be between ₹500 and ₹5,000,000');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Generic amount validation
const validateAmount = (field = 'amount', min = 0, max = 1000000) => [
  body(field)
    .isNumeric({ no_symbols: false })
    .withMessage(`${field} must be a valid number`)
    .custom((value) => {
      const amount = parseFloat(value);
      if (amount < min) {
        throw new Error(`${field} must be at least ${min}`);
      }
      if (amount > max) {
        throw new Error(`${field} cannot exceed ${max}`);
      }
      return true;
    }),
  
  handleValidationErrors
];

// Wallet address validation
const validateWalletAddress = (field = 'walletAddress') => [
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .custom((value) => {
      if (!ethers.isAddress(value)) {
        throw new Error(`Invalid ${field} format`);
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateTransaction,
  validateDeposit,
  validateWithdrawal,
  validateTransfer,
  validateUserProfile,
  validateKYC,
  validateLimits,
  validateAmount,
  validateWalletAddress,
  handleValidationErrors
};
