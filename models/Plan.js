const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['Short-term', 'Mid-term', 'Long-term', 'Elite'],
    default: 'Short-term',
    description: 'Maps directly to the frontend filtering tabs'
  },
  minDeposit: { 
    type: Number, 
    required: [true, 'Minimum deposit is required'],
    min: [1000, 'Minimum deposit cannot be less than 1,000']
  },
  maxDeposit: {
    type: Number,
    required: [true, 'Maximum deposit limit is required']
  },
  dailyRoi: { 
    type: Number, 
    required: [true, 'Daily ROI percentage is required'],
    min: [0.1, 'ROI must be at least 0.1%'],
    max: [100, 'ROI cannot exceed 100% per day']
  },
  duration: { 
    type: Number, 
    required: [true, 'Duration in days is required'],
    min: [1, 'Duration must be at least 1 day']
  },
  isPopular: {
    type: Boolean,
    default: false,
    description: 'Triggers the ⭐ Most Popular badge and gold styling in the UI'
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Allows admins to hide legacy plans without deleting them'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [250, 'Description cannot exceed 250 characters']
  }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS ---
// Calculate the total expected ROI over the entire duration
planSchema.virtual('totalRoi').get(function() {
  return this.dailyRoi * this.duration;
});

// --- CUSTOM VALIDATION ---
// Ensure maximum deposit is strictly greater than minimum deposit
planSchema.pre('validate', function(next) {
  if (this.maxDeposit < this.minDeposit) {
    this.invalidate('maxDeposit', 'Maximum deposit must be greater than or equal to minimum deposit');
  }
  next();
});

module.exports = mongoose.model('Plan', planSchema);
