const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  plan: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Plan', 
    required: true 
  },
  principalAmount: { 
    type: Number, 
    required: [true, 'Principal investment amount is required'],
    min: [1000, 'Minimum contract size is 1,000']
  },
  dailyRoi: { 
    type: Number, 
    required: [true, 'Locked daily ROI is required'] 
  },
  duration: { 
    type: Number, 
    required: [true, 'Locked duration is required'] 
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'], 
    default: 'active' 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  // CRITICAL: Used by your backend CRON job to know when to pay daily interest
  lastPaidAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: Calculate total expected return based on locked contract terms
contractSchema.virtual('expectedTotalReturn').get(function() {
  const dailyProfit = this.principalAmount * (this.dailyRoi / 100);
  return dailyProfit * this.duration;
});

module.exports = mongoose.model('Contract', contractSchema);
