const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Security Middleware
const protect = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'bluepeaksecret');
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
};

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { firstName, surname, username, email, country, password } = req.body;
    
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: "Email or Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      firstName, surname, username, email, country, password: hashedPassword, agreedToTerms: true
    });

    await user.save();
    res.status(201).json({ message: "Account Created" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body; 
    const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
    
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'bluepeaksecret', { expiresIn: '7d' });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Login Error" });
  }
});

// GET LIVE USER DATA (New!)
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// GET LIVE PLANS (New!)
router.get('/plans', async (req, res) => {
    try {
        const plans = await Plan.find().sort({ minDeposit: 1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
