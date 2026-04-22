const axios = require('axios');
const User = require('../models/User');

exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    // Squad expects amount in Kobo (Naira * 100)
    const squadData = {
      amount: amount * 100, 
      email: user.email,
      currency: user.currency || 'NGN',
      initiate_by: user.username,
      callback_url: "https://your-frontend-link.com/dashboard", // Link back to your UI
      metadata: { user_id: user._id }
    };

    const response = await axios.post(
      'https://api-d.squadco.com/transaction/initiate', // Use 'api' for production, 'api-d' for sandbox
      squadData,
      { headers: { Authorization: `Bearer ${process.env.SQUAD_SECRET_KEY}` } }
    );

    if (response.data.success) {
      res.json({ checkout_url: response.data.data.checkout_url });
    } else {
      res.status(400).json({ message: "Squad initialization failed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
