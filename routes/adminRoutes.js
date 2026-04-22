const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');

// 1. Fetch Real Stats & Plans
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        
        // Sum up all deposit balances to show real platform money
        const allUsers = await User.find();
        const totalEarned = allUsers.reduce((sum, user) => sum + (user.earnedBalance || 0), 0);

        const plans = await Plan.find().sort({ minDeposit: 1 });
        
        res.json({ stats: { totalUsers, totalEarned }, plans });
    } catch (err) {
        res.status(500).json({ message: "Error fetching live data" });
    }
});

// 2. Fund User (Case-Insensitive)
router.post('/topup', async (req, res) => {
    try {
        const { targetUser, amount, type } = req.body; 
        
        // Find user ignoring uppercase/lowercase differences
        const user = await User.findOne({ username: { $regex: new RegExp("^" + targetUser + "$", "i") } });
        
        if (!user) {
            return res.status(404).json({ message: `User '${targetUser}' does not exist in database.` });
        }

        user[type] = (user[type] || 0) + Number(amount);
        await user.save();
        
        res.json({ message: `Successfully credited ₦${amount} to ${user.username}` });
    } catch (err) {
        res.status(500).json({ message: "Server error during funding." });
    }
});

// 3. Add Real Market Plan
router.post('/plans', async (req, res) => {
    try {
        const { name, minDeposit, dailyRoi, duration } = req.body;
        
        const newPlan = new Plan({ name, minDeposit, dailyRoi, duration });
        await newPlan.save();
        
        res.json({ message: "Plan successfully added to database" });
    } catch (err) {
        res.status(500).json({ message: "Error saving plan to database." });
    }
});

module.exports = router;
