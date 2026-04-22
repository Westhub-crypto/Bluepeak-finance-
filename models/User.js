const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // --- 1. PERSONAL INFORMATION ---
  firstName: { 
    type: String, 
    required: [true, 'First name is required'], 
    trim: true 
  },
  surname: { 
    type: String, 
    required: [true, 'Surname is required'], 
    trim: true 
  },
  otherName: { 
    type: String, 
    trim: true 
  },
  dateOfBirth: { 
    type: Date,
    description: 'Collected during KYC Step 1' 
  },
  address: { 
    type: String, 
    trim: true,
    description: 'Collected during KYC Step 1' 
  },
  country: { 
    type: String, 
    required: [true, 'Country is required'],
    trim: true
  },

  // --- 2. AUTHENTICATION & SECURITY ---
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  username: { 
    type: String, 
    required: [true, 'Username is required'], 
    unique: true, 
    trim: true,
    lowercase: true
  },
  password: { 
    type: String,
    select: false, // Security: Prevents password from being returned in normal database queries
    required: function() { return this.authProvider === 'manual'; }
  },
  withdrawalPin: { 
    type: String,
    select: false,
    minlength: 4,
    maxlength: 6
  },
  authProvider: { 
    type: String, 
    enum: ['manual', 'google', 'apple'], 
    default: 'manual' 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'superadmin'], 
    default: 'user' 
  },
  accountStatus: {
    type: String,
    enum: ['active', 'frozen', 'banned'],
    default: 'active',
    description: 'Allows admins to lock an account for suspicious activity'
  },

  // --- 3. KYC COMPLIANCE (Maps to UI Flow) ---
  kyc: {
    status: { 
      type: String, 
      enum: ['unverified', 'pending', 'verified', 'rejected'], 
      default: 'unverified' 
    },
    idType: { 
      type: String, 
      enum: ['national', 'driver', 'passport'] 
    },
    idFrontUrl: { type: String },
    idBackUrl: { type: String },
    selfieUrl: { type: String },
    submittedAt: { type: Date },
    rejectionReason: { type: String }
  },

  // --- 4. FINANCIAL LEDGER ---
  currency: { 
    type: String, 
    default: 'NGN',
    uppercase: true
  },
  depositBalance: { 
    type: Number, 
    default: 0,
    min: [0, 'Deposit balance cannot be negative'] 
  },
  earnedBalance: { 
    type: Number, 
    default: 0,
    min: [0, 'Earned balance cannot be negative'] 
  },
  referralBalance: { 
    type: Number, 
    default: 0,
    min: [0, 'Referral balance cannot be negative'] 
  },

  // --- 5. BANKING & WITHDRAWALS ---
  bankDetails: {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountName: { type: String, trim: true },
    bankCode: { type: String, description: 'Required for automated payout APIs like SquadCo' },
    isLocked: { 
      type: Boolean, 
      default: false,
      description: 'If true, user must contact support to change bank details (anti-theft)'
    }
  },

  // --- 6. REFERRAL SYSTEM ---
  referredBy: { 
    type: String, 
    trim: true,
    lowercase: true,
    description: 'Username of the referrer' 
  }, 
  referralCount: { 
    type: Number, 
    default: 0,
    min: 0
  }

}, { 
  timestamps: true, // Automatically manages createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS ---
// Calculate Total Vault Assets dynamically without storing it
userSchema.virtual('totalAssets').get(function() {
  return this.depositBalance + this.earnedBalance;
});

module.exports = mongoose.model('User', userSchema);
