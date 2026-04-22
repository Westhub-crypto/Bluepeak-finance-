const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/squad', async (req, res) => {
    try {
        const squadEvent = req.body;

        // Verify it's a successful charge
        if (squadEvent.event === 'charge.success') {
            const userId = squadEvent.data.metadata.user_id;
            const amountPaid = squadEvent.data.amount / 100; // Convert back from Kobo

            const user = await User.findById(userId);
            if (user) {
                // 1. Credit the User
                user.depositBalance += amountPaid;

                // 2. Add to transaction history
                user.transactions.push({
                    type: 'Deposit',
                    amount: amountPaid,
                    status: 'Success',
                    date: new Date()
                });

                // 3. Referral Commission Logic (15%)
                if (user.referredBy) {
                    const referrer = await User.findOne({ username: user.referredBy });
                    if (referrer) {
                        const bonus = amountPaid * 0.15;
                        referrer.refEarnings += bonus;
                        referrer.depositBalance += bonus; // Credit bonus to deposit balance
                        await referrer.save();
                    }
                }

                await user.save();
            }
        }
        
        // Always return 200 to Squad so they know you received it
        res.status(200).send('Webhook Received');
    } catch (error) {
        res.status(500).send('Webhook Error');
    }
});

module.exports = router;
