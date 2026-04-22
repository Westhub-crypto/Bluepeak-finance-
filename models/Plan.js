const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minDeposit: { type: Number, required: true },
  dailyRoi: { type: Number, required: true },
  duration: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', planSchema);
