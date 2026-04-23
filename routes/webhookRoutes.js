const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction'); // Utilizing the standalone ledger

// ==========================================
// 📡 SQUADCO MASTER WEBHOOK LISTENER
// ==========================================
// NOTE: For crypto.createHmac to work perfectly, your Express app must parse 
// the raw body for this specific route. Standard express.json() might format it slightly.
router.post('/squad', async (req, res) => {
    // 1. VERIFY SQUADCO SIGNATURE (Anti-Fraud Gatekeeper)
    const squadSignature = req.headers['x-squad-encrypted-body'];
    
    // Hash the incoming payload with your secret key
    const hash = crypto.createHmac('sha512', process.env.SQUAD_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex')
                       .toUpperCase();

    if (hash !== squadSignature) {
        console.error("🚨 CRITICAL: Unauthorized webhook attempt blocked!");
        return res.status(401).send('Unauthorized Signature');
    }

    const squadEvent = req.body;

    // 2. PROCESS SUCCESSFUL CHARGES
    // Squad occasionally uses 'charge.success' or 'charge_completed' depending on API version
    if (squadEvent.Event === 'charge_completed' || squadEvent.event === 'charge.success') {
        const payload = squadEvent.Body || squadEvent.data;
        const transactionRef = payload.transaction_ref;
        const userId = payload.metadata?.user_id;
        const amountPaid = payload.amount / 100; // Convert Kobo to Naira

        // Start ACID Transaction to guarantee multi-document database integrity
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // A. PREVENT DOUBLE-CREDITING (Idempotency Check)
            // Fetch the pending transaction we created in paymentRoutes.js
            let depositTxn = await Transaction.findOne({ reference: transactionRef }).session(session);
            
            if (depositTxn && depositTxn.status === 'completed') {
                await session.abortTransaction();
                session.endSession();
                return res.status(200).send('Transaction already processed');
            }

            // B. LOCATE VAULT
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("Vault not found for this transaction ID");

            // C. UPDATE USER DEPOSIT BALANCE
            user.depositBalance += amountPaid;
            await user.save({ session });

            // D. FINALIZE LEDGER RECEIPT
            if (depositTxn) {
                depositTxn.status = 'completed';
                depositTxn.amount = amountPaid; // Trust Squad's confirmed amount
            } else {
                // Fallback: If no pending transaction was found, create one now
                depositTxn = new Transaction({
                    user: user._id,
                    type: 'deposit',
                    amount: amountPaid,
                    reference: transactionRef,
                    status: 'completed',
                    description: 'SquadCo Gateway Deposit'
                });
            }
            await depositTxn.save({ session });

            // E. REFERRAL NETWORK LOGIC (15% Commission)
            if (user.referredBy) {
                const referrer = await User.findOne({ username: user.referredBy }).session(session);
                
                if (referrer) {
                    const bonusAmount = amountPaid * 0.15;
                    
                    // Credit the Referrer's specialized referral balance (matches User schema upgrade)
                    referrer.referralBalance += bonusAmount;
                    await referrer.save({ session });

                    // Generate a ledger receipt for the referrer so they see it in their Track page!
                    const referralTxn = new Transaction({
                        user: referrer._id,
                        type: 'referral_bonus',
                        amount: bonusAmount,
                        reference: `REF-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
                        status: 'completed',
                        description: `15% Commission from @${user.username}'s deposit`
                    });
                    await referralTxn.save({ session });
                }
            }

            // COMMIT EVERYTHING TO THE DATABASE
            await session.commitTransaction();
            session.endSession();
            
            console.log(`✅ WEBHOOK SUCCESS: ₦${amountPaid} credited to @${user.username}`);

        } catch (error) {
            // If anything fails (e.g., referrer missing, DB timeout), rollback EVERYTHING.
            await session.abortTransaction();
            session.endSession();
            console.error("Webhook Processing Error:", error.message);
            // We return 200 so SquadCo doesn't infinitely retry a broken payload, 
            // but we log it to fix the code.
            return res.status(200).send('Error processing payload');
        }
    }

    // Always return 200 to SquadCo to acknowledge receipt
    res.status(200).send('Webhook Received');
});

module.exports = router;
