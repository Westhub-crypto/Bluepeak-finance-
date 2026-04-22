const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  surname: { type: String, required: true },
  otherName: { type: String },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String }, 
  country: { type: String, required: true },
  currency: { type: String, default: 'NGN' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Balances
  depositBalance: { type: Number, default: 0 },
  earnedBalance: { type: Number, default: 0 },
  referralBalance: { type: Number, default: 0 },

  // Security & Bank (Lockdown logic)
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    accountName: { type: String },
    isLocked: { type: Boolean, default: false }
  },
  withdrawalPin: { type: String },
  
  // Support System (Two-way chat)
  supportChat: [{
    sender: { type: String, enum: ['user', 'admin'] },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Referrals
  referredBy: { type: String }, 
  referralCount: { type: Number, default: 0 },

  authProvider: { type: String, default: 'manual' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
