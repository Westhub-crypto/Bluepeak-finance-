const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// 🛡️ SECURITY MIDDLEWARE
// ==========================================
const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'bluepeaksecret');
            
            // UPGRADE: Fetch user to ensure they haven't been banned mid-session
            const user = await User.findById(decoded.id);
            if (!user) return res.status(401).json({ message: 'User session invalid' });
            
            if (user.accountStatus !== 'active') {
                return res.status(403).json({ message: `Account is ${user.accountStatus}` });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// ==========================================
// 📝 REGISTER ACCOUNT
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { firstName, surname, username, email, country, password, referredBy } = req.body;
    
    // 1. Sanitize Inputs (Prevent duplicate accounts due to capitalization)
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // 2. Check for existing user
    const userExists = await User.findOne({ 
        $or: [{ email: cleanEmail }, { username: cleanUsername }] 
    });
    
    if (userExists) {
        return res.status(400).json({ message: "Email or Username already taken" });
    }

    // 3. High-Security Hashing (Fintech standard: 12 rounds)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User
    const user = new User({
      firstName, 
      surname, 
      username: cleanUsername, 
      email: cleanEmail, 
      country, 
      password: hashedPassword,
      referredBy: referredBy ? referredBy.toLowerCase().trim() : undefined
    });

    await user.save();

    // 5. Handle Referral Network Logic
    if (user.referredBy) {
        // Find the referrer and increment their referral count
        await User.findOneAndUpdate(
            { username: user.referredBy },
            { $inc: { referralCount: 1 } }
        ).catch(err => console.error("Referral tracking failed:", err));
    }

    res.status(201).json({ message: "Vault Created Successfully" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ==========================================
// 🔐 SECURE LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body; 
    const loginIdentifier = email.toLowerCase().trim();

    // CRITICAL FIX: Because we added `select: false` to the password in the schema, 
    // we MUST explicitly request it here using `.select('+password')`, otherwise it fails.
    const user = await User.findOne({ 
        $or: [{ email: loginIdentifier }, { username: loginIdentifier }] 
    }).select('+password');
    
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // SECURITY: Block banned or frozen accounts from logging in
    if (user.accountStatus !== 'active') {
        return res.status(403).json({ 
            message: `Access Denied: Account is ${user.accountStatus}. Please contact support.` 
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // FINTECH STANDARD: Shorter token expiration (1 day instead of 7 days)
    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET || 'bluepeaksecret', 
        { expiresIn: '1d' } 
    );

    res.status(200).json({ 
        token, 
        user: { 
            username: user.username, 
            role: user.role,
            kycStatus: user.kyc?.status || 'unverified'
        } 
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Error authenticating user" });
  }
});

// ==========================================
// 👤 GET LIVE USER DATA
// ==========================================
router.get('/me', protect, async (req, res) => {
    try {
        // The `protect` middleware already verified the user
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Vault not found" });

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching telemetry data" });
    }
});

// ==========================================
// 📊 GET PUBLIC MARKET PLANS
// ==========================================
router.get('/plans', async (req, res) => {
    try {
        // CRITICAL FIX: Only return plans where `isActive` is true. 
        // This hides archived/soft-deleted plans from regular users.
        const plans = await Plan.find({ isActive: true }).sort({ minDeposit: 1 });
        res.status(200).json(plans);
    } catch (err) {
        res.status(500).json({ message: "Server Error fetching market data" });
    }
});

module.exports = router;
