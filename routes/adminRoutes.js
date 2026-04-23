const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');

// ==========================================
// 🛡️ ADMIN SECURITY MIDDLEWARE
// ==========================================
// Note: In production, extract this to a middleware/auth.js file
const protectAdmin = async (req, res, next) => {
    try {
        // 1. Extract Token from "Bearer <token>"
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Not authorized, no token" });

        // 2. Verify Token (Assuming you use jsonwebtoken)
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_temporary_secret');

        // 3. Find User & Check Admin Role
        const user = await User.findById(decoded.id).select('+role'); // Ensure role is selected
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. High-level clearance required." });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Session expired or invalid token" });
    }
};

// Apply the security middleware to ALL routes in this file
router.use(protectAdmin);

// ==========================================
// 📊 1. FETCH REAL-TIME PLATFORM STATS
// ==========================================
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        
        // 🚀 UPGRADE: Use MongoDB Aggregation instead of loading all users into RAM
        // This calculates the sums directly inside the database engine (Lightning Fast)
        const balanceStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalDeposits: { $sum: "$depositBalance" },
                    totalEarned: { $sum: "$earnedBalance" },
                    totalReferral: { $sum: "$referralBalance" }
                }
            }
        ]);

        const stats = balanceStats[0] || { totalDeposits: 0, totalEarned: 0, totalReferral: 0 };
        
        // Fetch only active plans for the admin view
        const plans = await Plan.find({ isActive: true }).sort({ minDeposit: 1 });
        
        res.status(200).json({ 
            stats: { 
                totalUsers, 
                totalPlatformLiquidity: stats.totalDeposits + stats.totalEarned,
                ...stats 
            }, 
            plans 
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ message: "Database engine error fetching live telemetry" });
    }
});

// ==========================================
// 💰 2. FUND / DEBIT USER VAULT
// ==========================================
router.post('/topup', async (req, res) => {
    try {
        const { targetUser, amount, type } = req.body; 
        
        // Security: Prevent malicious injections by strictly allowing only specific balance fields
        const allowedWallets = ['depositBalance', 'earnedBalance', 'referralBalance'];
        if (!allowedWallets.includes(type)) {
            return res.status(400).json({ message: "Invalid wallet identifier" });
        }

        // Security: Ensure amount is a valid number (can be negative for debits)
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount === 0) {
            return res.status(400).json({ message: "Invalid transaction amount" });
        }

        // Find user ignoring case, and update their balance securely
        const user = await User.findOne({ username: { $regex: new RegExp("^" + targetUser + "$", "i") } });
        
        if (!user) {
            return res.status(404).json({ message: `Vault for '${targetUser}' not found.` });
        }

        // Prevent balance from dropping below zero
        if (user[type] + numericAmount < 0) {
            return res.status(400).json({ message: "Transaction failed: Insufficient funds for debit." });
        }

        user[type] += numericAmount;
        await user.save();
        
        res.status(200).json({ 
            message: `Successfully processed ${numericAmount > 0 ? 'credit' : 'debit'} of ₦${Math.abs(numericAmount).toLocaleString()} for @${user.username}`,
            newBalance: user[type]
        });
    } catch (err) {
        console.error("Topup Error:", err);
        res.status(500).json({ message: "Server error during ledger update." });
    }
});

// ==========================================
// 📈 3. CREATE NEW MARKET PLAN
// ==========================================
router.post('/plans', async (req, res) => {
    try {
        // Now matches the upgraded Plan.js schema
        const { name, category, minDeposit, maxDeposit, dailyRoi, duration, isPopular } = req.body;
        
        if (minDeposit > maxDeposit) {
            return res.status(400).json({ message: "Minimum deposit cannot exceed maximum deposit limits." });
        }

        const newPlan = new Plan({ 
            name, 
            category, 
            minDeposit, 
            maxDeposit, 
            dailyRoi, 
            duration, 
            isPopular 
        });
        
        await newPlan.save();
        
        res.status(201).json({ 
            message: "Institutional Plan successfully deployed to market",
            plan: newPlan
        });
    } catch (err) {
        // Handle Mongoose duplicate key errors (e.g., plan name already exists)
        if (err.code === 11000) {
            return res.status(400).json({ message: "A plan with this name already exists." });
        }
        res.status(500).json({ message: "Error saving contract to database." });
    }
});

// ==========================================
// 🛑 4. TOGGLE PLAN VISIBILITY (Soft Delete)
// ==========================================
router.put('/plans/:id/toggle', async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        plan.isActive = !plan.isActive;
        await plan.save();

        res.status(200).json({ message: `Plan '${plan.name}' is now ${plan.isActive ? 'Active' : 'Hidden'}` });
    } catch (err) {
        res.status(500).json({ message: "Error updating plan status" });
    }
});

// ==========================================
// 🪪 5. FETCH PENDING KYC REQUESTS
// ==========================================
router.get('/kyc/pending', async (req, res) => {
    try {
        // Find users whose KYC status is 'pending'
        const pendingUsers = await User.find({ 'kyc.status': 'pending' })
            .select('username firstName surname email kyc createdAt');
            
        res.status(200).json({ 
            count: pendingUsers.length,
            requests: pendingUsers 
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching compliance data" });
    }
});

module.exports = router;
