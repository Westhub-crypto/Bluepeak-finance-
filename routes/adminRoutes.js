const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. Get Total Stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  const users = await User.find().select('-password');
  const totalEarnings = users.reduce((acc, user) => acc + user.earnedBalance, 0);
  res.json({ totalUsers: users.length, totalEarnings, users });
});

// 2. Add Investment Plan
router.post('/plans', protect, adminOnly, async (req, res) => {
  const plan = new Plan(req.body);
  await plan.save();
  res.json({ message: 'Plan created successfully', plan });
});

// 3. Top up User Balance
router.post('/topup', protect, adminOnly, async (req, res) => {
  const { userId, amount, type } = req.body; // type: 'deposit' or 'earned'
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (type === 'deposit') user.depositBalance += amount;
  else user.earnedBalance += amount;

  await user.save();
  res.json({ message: 'Balance updated', user });
});

module.exports = router;
