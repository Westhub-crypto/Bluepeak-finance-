const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware'); // Import your upgraded security middleware

// ==========================================
// 💳 1. INITIATE SECURE DEPOSIT
// ==========================================
router.post('/initiate', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const depositAmount = Number(amount);

        // 1. Validation
        if (!depositAmount || isNaN(depositAmount) || depositAmount < 3000) {
            return res.status(400).json({ message: 'Minimum deposit is ₦3,000' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User vault not found' });

        // 2. Generate Unique Transaction Reference
        const txnReference = `DEP-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        // 3. Log the "Pending" Transaction in our Ledger
        // We do this BEFORE calling SquadCo so we have a record even if they abandon the checkout
        const newTransaction = new Transaction({
            user: user._id,
            type: 'deposit',
            amount: depositAmount,
            reference: txnReference,
            status: 'pending',
            description: 'SquadCo Gateway Deposit'
        });
        await newTransaction.save();

        // 4. Build SquadCo Payload
        const squadData = {
            amount: depositAmount * 100, // Squad expects Kobo
            email: user.email,
            currency: user.currency || 'NGN',
            initiate_type: "inline",
            transaction_ref: txnReference,
            callback_url: `${process.env.FRONTEND_URL}/track`, // Where to send user after payment
            metadata: { 
                user_id: user._id.toString(),
                ledger_id: newTransaction._id.toString()
            } 
        };

        // 5. Connect to SquadCo API
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
            // Revert pending transaction if API fails
            newTransaction.status = 'failed';
            newTransaction.description = 'SquadCo Gateway Initialization Failed';
            await newTransaction.save();
            
            res.status(400).json({ message: "Payment gateway temporarily unavailable" });
        }
    } catch (error) {
        console.error("Payment Initiation Error:", error);
        res.status(500).json({ message: "Server error initiating gateway" });
    }
});

// ==========================================
// 📡 2. SQUADCO WEBHOOK (THE CRITICAL LISTENER)
// ==========================================
// Note: Webhooks should ideally parse raw bodies to verify signatures accurately.
router.post('/webhook', async (req, res) => {
    // 1. Verify SquadCo Signature (Anti-Fraud mechanism)
    // Squad sends an HMAC SHA512 hash of the payload in the headers.
    const squadSignature = req.headers['x-squad-encrypted-body'];
    
    // Stringify the body exactly as it was received to verify
    const hash = crypto.createHmac('sha512', process.env.SQUAD_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex')
                       .toUpperCase();

    if (hash !== squadSignature) {
        // Log this. If it happens, someone is trying to hack your deposit system.
        console.error("🚨 UNAUTHORIZED WEBHOOK ATTEMPT DETECTED");
        return res.status(401).send('Unauthorized');
    }

    const event = req.body;

    // 2. Only process successful transactions
    if (event.Event === 'charge_completed' || event.event === 'charge_completed') {
        const { transaction_ref, metadata, amount } = event.Body || event.data;
        const actualAmountCredited = amount / 100; // Convert back from Kobo

        // Start ACID Transaction to guarantee database integrity
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the pending transaction
            const transaction = await Transaction.findOne({ reference: transaction_ref }).session(session);
            
            // Prevent Double-Crediting: If it's already completed, ignore it.
            if (!transaction) throw new Error("Transaction not found");
            if (transaction.status === 'completed') {
                await session.abortTransaction();
                session.endSession();
                return res.status(200).send('Already processed');
            }

            // Find the User
            const user = await User.findById(metadata.user_id).session(session);
            if (!user) throw new Error("User not found for this transaction");

            // Update Ledger
            transaction.status = 'completed';
            transaction.amount = actualAmountCredited; // Trust Squad's amount over our pending amount
            await transaction.save({ session });

            // Credit User Vault
            user.depositBalance += actualAmountCredited;
            await user.save({ session });

            // Commit to Database
            await session.commitTransaction();
            session.endSession();
            
            console.log(`✅ Webhook Processed: Credited ₦${actualAmountCredited} to @${user.username}`);

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            console.error("Webhook Processing Error:", err.message);
            // We still return 200 to SquadCo, otherwise they will keep retrying the webhook endlessly
            return res.status(200).send('Error processing, check logs');
        }
    }

    // Acknowledge receipt to SquadCo
    res.status(200).send('Webhook Received');
});

module.exports = router;
