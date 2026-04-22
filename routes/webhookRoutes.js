const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/squad-webhook', async (req, res) => {
  // Squad sends verification in headers usually, but for now, let's process the body
  const { body } = req;

  if (body.event === 'charge.success') {
    const userId = body.data.metadata.user_id;
    const amountPaid = body.data.amount / 100; // Convert back from Kobo

    try {
      const user = await User.findById(userId);
      if (user) {
        user.depositBalance += amountPaid;
        
        // Handle Referral Bonus (15%)
        if (user.referredBy) {
          const referrer = await User.findOne({ username: user.referredBy });
          if (referrer) {
            const bonus = amountPaid * 0.15;
            referrer.referralBalance += bonus;
            await referrer.save();
          }
        }
        
        await user.save();
      }
      res.status(200).send('Webhook Received');
    } catch (err) {
      res.status(500).send('Internal Error');
    }
  } else {
    res.status(200).send('Event not handled');
  }
});

module.exports = router;
