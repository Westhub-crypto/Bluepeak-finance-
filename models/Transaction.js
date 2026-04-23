const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'deposit', 
      'withdrawal', 
      'investment', 
      'roi_payout', 
      'referral_bonus', 
      'admin_adjustment'
    ], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    // Note: Can be negative (e.g., for investments or withdrawals) or positive (deposits, ROI)
  },
  reference: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    description: 'Unique receipt identifier (e.g., INV-839201)'
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'reversed'], 
    default: 'completed' 
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  // Optional: Link to a specific contract if this transaction is an ROI payout or investment
  relatedContract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  }
}, { 
  timestamps: true 
});

// Indexing for faster queries since this collection will grow very large
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
