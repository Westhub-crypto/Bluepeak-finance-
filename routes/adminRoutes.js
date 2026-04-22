const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get Total Users and Platform Earnings
router.get('/dashboard-stats', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const totalUsers = users.length;
    const totalPlatformEarnings = users.reduce((acc, user) => acc + user.earnedBalance, 0);
    
    res.json({ totalUsers, totalPlatformEarnings, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Add new Investment Plan
router.post('/add-plan', protect, adminOnly, async (req, res) => {
  try {
    const { name, minAmount, dailyProfitPercent, weeklyProfitPercent, durationDays, isBestPlan } = req.body;
    
    // Calculate total return for the user explanation
    const totalReturnPercent = dailyProfitPercent * durationDays;

    const newPlan = new Plan({
      name, minAmount, dailyProfitPercent, weeklyProfitPercent, durationDays, totalReturnPercent, isBestPlan
    });

    await newPlan.save();
    res.status(201).json({ message: "Plan added successfully", newPlan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manual Top-up for a specific user
router.post('/topup-user', protect, adminOnly, async (req, res) => {
  try {
    const { userId, amount, balanceType } = req.body; // balanceType = 'deposit' or 'earned'
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    if (balanceType === 'deposit') {
      user.depositBalance += Number(amount);
    } else {
      user.earnedBalance += Number(amount);
    }

    await user.save();
    res.json({ message: `Successfully topped up ${user.username}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
