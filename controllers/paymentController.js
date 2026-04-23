const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction'); // Utilizing the audit ledger

// ==========================================
// 💳 INITIATE SECURE DEPOSIT
// ==========================================
exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const depositAmount = Number(amount);

    // 1. Strict Validation
    if (!depositAmount || isNaN(depositAmount) || depositAmount < 3000) {
        return res.status(400).json({ message: 'Minimum deposit is ₦3,000' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User vault not found' });

    // 2. Generate Unique Cryptographic Reference
    const txnReference = `DEP-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // 3. Pre-Log the Pending Transaction (Shadow Ledger)
    // We log this BEFORE hitting SquadCo so we track abandoned checkouts.
    const newTransaction = new Transaction({
        user: user._id,
        type: 'deposit',
        amount: depositAmount,
        reference: txnReference,
        status: 'pending',
        description: 'SquadCo Gateway Initialization'
    });
    await newTransaction.save();

    // 4. Construct SquadCo Payload
    const squadData = {
      amount: depositAmount * 100, // Squad expects Kobo
      email: user.email,
      currency: user.currency || 'NGN',
      initiate_type: "inline",
      transaction_ref: txnReference,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track`, // Dynamic redirect
      metadata: { 
          user_id: user._id.toString(),
          ledger_id: newTransaction._id.toString()
      }
    };

    // 5. Connect to SquadCo API via Axios
    const response = await axios.post(
      'https://api-d.squadco.com/transaction/initiate', // Use 'api' for production
      squadData,
      { 
          headers: { 
              'Authorization': `Bearer ${process.env.SQUAD_SECRET_KEY}`,
              'Content-Type': 'application/json'
          } 
      }
    );

    // 6. Handle Response
    if (response.data && response.data.success) {
      res.status(200).json({ checkout_url: response.data.data.checkout_url });
    } else {
      // Revert pending transaction if API returns a soft failure
      newTransaction.status = 'failed';
      newTransaction.description = 'SquadCo Gateway Soft Failure';
      await newTransaction.save();
      
      res.status(400).json({ message: "Squad gateway failed to initialize" });
    }

  } catch (error) {
    // Advanced Axios Error Handling
    console.error("Squad API Error:", error.response?.data || error.message);
    
    // If we have a user in context, try to mark the transaction as failed
    res.status(500).json({ message: "Payment gateway temporarily unavailable. Please try again later." });
  }
};

// ==========================================
// 📡 SQUADCO MASTER WEBHOOK LISTENER
// ==========================================
exports.handleWebhook = async (req, res) => {
    // 1. Verify SquadCo Signature (Anti-Fraud Gatekeeper)
    const squadSignature = req.headers['x-squad-encrypted-body'];
    
    const hash = crypto.createHmac('sha512', process.env.SQUAD_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex')
                       .toUpperCase();

    if (hash !== squadSignature) {
        console.error("🚨 CRITICAL: Unauthorized webhook attempt blocked!");
        return res.status(401).send('Unauthorized Signature');
    }

    const squadEvent = req.body;

    // 2. Process Successful Charges
    if (squadEvent.Event === 'charge_completed' || squadEvent.event === 'charge.success') {
        const payload = squadEvent.Body || squadEvent.data;
        const transactionRef = payload.transaction_ref;
        const userId = payload.metadata?.user_id;
        const amountPaid = payload.amount / 100; // Convert Kobo back to Naira

        // Start ACID Transaction to guarantee multi-document database integrity
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // A. Idempotency Check (Prevent Double-Crediting)
            let depositTxn = await Transaction.findOne({ reference: transactionRef }).session(session);
            
            if (depositTxn && depositTxn.status === 'completed') {
                await session.abortTransaction();
                session.endSession();
                return res.status(200).send('Transaction already processed');
            }

            // B. Locate Vault
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("Vault not found for this transaction ID");

            // C. Update User Deposit Balance
            user.depositBalance += amountPaid;
            await user.save({ session });

            // D. Finalize Ledger Receipt
            if (depositTxn) {
                depositTxn.status = 'completed';
                depositTxn.amount = amountPaid;
            } else {
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

            // E. Referral Network Logic (15% Commission)
            if (user.referredBy) {
                const referrer = await User.findOne({ username: user.referredBy }).session(session);
                
                if (referrer) {
                    const bonusAmount = amountPaid * 0.15;
                    referrer.referralBalance += bonusAmount;
                    await referrer.save({ session });

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

            // Commit to Database
            await session.commitTransaction();
            session.endSession();
            
            console.log(`✅ WEBHOOK SUCCESS: ₦${amountPaid} credited to @${user.username}`);

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Webhook Processing Error:", error.message);
            return res.status(200).send('Error processing payload');
        }
    }

    res.status(200).send('Webhook Received');
};
