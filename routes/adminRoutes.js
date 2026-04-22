const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const plans = await Plan.find().sort({ minDeposit: 1 });
        // Send back data to your admin panel
        res.json({ stats: { totalUsers, totalEarned: 0 }, plans });
    } catch (err) {
        res.status(500).json({ message: "Error fetching stats" });
    }
});

// Top-up a User
router.post('/topup', async (req, res) => {
    try {
        const { targetUser, amount, type } = req.body; // type is either 'depositBalance' or 'earnedBalance'
        
        const user = await User.findOne({ username: targetUser });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Add the amount to the specific balance
        user[type] = (user[type] || 0) + amount;
        
        // Add to transaction history
        user.transactions.push({
            type: 'Admin Credit',
            amount: amount,
            status: 'Success',
            date: new Date()
        });

        await user.save();
        res.json({ message: "Top-up successful" });
    } catch (err) {
        res.status(500).json({ message: "Top-up failed" });
    }
});

// Add a New Investment Plan
router.post('/plans', async (req, res) => {
    try {
        const { name, minDeposit, dailyRoi, duration } = req.body;
        
        const newPlan = new Plan({ name, minDeposit, dailyRoi, duration });
        await newPlan.save();
        
        res.json({ message: "Plan created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to create plan" });
    }
});

module.exports = router;
