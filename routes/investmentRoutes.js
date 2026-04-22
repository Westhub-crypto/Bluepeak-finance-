const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get all plans for users
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plans" });
  }
});

// Purchase an Investment Plan
router.post('/purchase', protect, async (req, res) => {
  try {
    const { planId } = req.body;
    const user = await User.findById(req.user.id);
    const plan = await Plan.findById(planId);

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Check if user has enough balance
    if (user.depositBalance < plan.minAmount) {
      return res.status(400).json({ message: "Insufficient deposit balance. Please top up." });
    }

    // Logic: Deduct balance
    user.depositBalance -= plan.minAmount;
    
    // In a production app, you would save this to an 'ActiveInvestments' collection
    // For now, we update the user's record
    await user.save();

    res.json({ 
      message: `Successfully invested in ${plan.name}`,
      remainingBalance: user.depositBalance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
