const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get all plans for users
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plans" });
  }
});

// Logic for purchasing a plan would go here next
module.exports = router;
