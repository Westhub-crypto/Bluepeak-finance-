const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Security Middleware (Ensures only logged-in users can deposit)
const protect = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
};

router.post('/initiate', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Squad expects the amount in Kobo/Pesewas (Amount * 100)
        const squadData = {
            amount: amount * 100, 
            email: user.email,
            currency: user.currency || 'NGN',
            initiate_type: "inline",
            // We pass the user ID in metadata so the Webhook knows who paid!
            metadata: { user_id: user._id.toString() } 
        };

        const response = await fetch('https://api-d.squadco.com/transaction/initiate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SQUAD_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(squadData)
        });

        const data = await response.json();

        if (data.status === 200 && data.success) {
            res.status(200).json({ checkout_url: data.data.checkout_url });
        } else {
            res.status(400).json({ message: "Squad gateway failed to initialize" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

module.exports = router;
