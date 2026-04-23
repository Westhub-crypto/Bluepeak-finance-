const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Plan = require('../models/Plan');
const User = require('../models/User');
const Contract = require('../models/Contract'); // NEW: To track active user investments
const Transaction = require('../models/Transaction'); // NEW: For the deep audit ledger
const { protect } = require('../middleware/authMiddleware'); // Adjust path if needed

// ==========================================
// 📊 1. GET PUBLIC PLANS
// ==========================================
router.get('/plans', async (req, res) => {
  try {
    // SECURITY: Only return active plans to the public frontend
    const plans = await Plan.find({ isActive: true }).sort({ minDeposit: 1 });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Database error fetching market plans" });
  }
});

// ==========================================
// 💼 2. FETCH USER'S ACTIVE PORTFOLIOS
// ==========================================
router.get('/active', protect, async (req, res) => {
  try {
    // Fetch all currently running investment contracts for this specific user
    const activeContracts = await Contract.find({ 
        user: req.user.id, 
        status: 'active' 
    }).populate('plan', 'name dailyRoi category'); // Pulls in plan details

    res.status(200).json(activeContracts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio data" });
  }
});

// ==========================================
// 🚀 3. PURCHASE INVESTMENT PLAN (ACID COMPLIANT)
// ==========================================
router.post('/purchase', protect, async (req, res) => {
  // FINTECH UPGRADE: Start a MongoDB Session for an ACID Transaction.
  // This ensures that if the server crashes after deducting money but before 
  // creating the contract, the entire process is reversed (rolled back).
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { planId, amount } = req.body;
    
    // 1. Validate Input Amount
    const investmentAmount = Number(amount);
    if (!investmentAmount || isNaN(investmentAmount) || investmentAmount <= 0) {
        return res.status(400).json({ message: "Invalid investment amount specified." });
    }

    // 2. Fetch Plan & User securely within the transaction session
    const plan = await Plan.findById(planId).session(session);
    const user = await User.findById(req.user.id).session(session);

    if (!plan) throw new Error("Contract plan not found.");
    if (!user) throw new Error("Vault not found.");

    // 3. Plan Status Validation
    if (!plan.isActive) {
        throw new Error("This portfolio is no longer accepting new capital.");
    }

    // 4. Boundary Limits Validation
    if (investmentAmount < plan.minDeposit) {
        throw new Error(`Minimum required capital for ${plan.name} is ₦${plan.minDeposit.toLocaleString()}`);
    }
    if (investmentAmount > plan.maxDeposit) {
        throw new Error(`Maximum capital limit for ${plan.name} is ₦${plan.maxDeposit.toLocaleString()}`);
    }

    // 5. User Liquidity Validation
    if (user.depositBalance < investmentAmount) {
        throw new Error("Insufficient vault funds. Please initiate a deposit.");
    }

    // ---------------------------------------------------------
    // EXECUTE FINANCIAL LOGIC (ATOMIC)
    // ---------------------------------------------------------

    // A. Deduct exact amount from user's deposit balance
    user.depositBalance -= investmentAmount;
    await user.save({ session });

    // B. Create the formal Investment Contract
    // Calculates exact expiration date based on the plan's duration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + plan.duration);

    const newContract = new Contract({
        user: user._id,
        plan: plan._id,
        principalAmount: investmentAmount,
        dailyRoi: plan.dailyRoi,
        duration: plan.duration,
        expiresAt: expirationDate,
        status: 'active'
    });
    await newContract.save({ session });

    // C. Create a permanent Ledger Entry (Transaction History)
    const newTransaction = new Transaction({
        user: user._id,
        type: 'investment',
        amount: investmentAmount,
        reference: `INV-${Date.now().toString().slice(-6)}`, // Generates e.g., INV-839201
        status: 'completed',
        description: `Purchased ${plan.name} Contract`
    });
    await newTransaction.save({ session });

    // ---------------------------------------------------------

    // Commit the transaction to the database
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ 
      message: `Successfully allocated ₦${investmentAmount.toLocaleString()} to ${plan.name}`,
      remainingBalance: user.depositBalance,
      contractId: newContract._id
    });

  } catch (error) {
    // If ANY error occurs above (or we throw one manually), abort everything!
    await session.abortTransaction();
    session.endSession();
    
    console.error("Investment Error:", error.message);
    // Send a 400 Bad Request for logic errors, 500 for actual code crashes
    res.status(400).json({ message: error.message || "Failed to process investment contract" });
  }
});

module.exports = router;
