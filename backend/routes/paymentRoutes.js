const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Rental = require('../models/Rental');
const auth = require('../middleware/authMiddleware');

// Create Payment
router.post('/', auth, async (req, res) => {
    try {
        const { rentalId, amount, transactionId, paymentMethod } = req.body;

        const payment = new Payment({
            userId: req.user.id,
            rentalId,
            amount,
            transactionId,
            paymentMethod,
            status: 'success' // Auto-success for mock
        });

        await payment.save();

        // If linked to a rental, update rental payment status
        if (rentalId) {
            await Rental.findByIdAndUpdate(rentalId, {
                paymentStatus: 'paid',
                transactionId: transactionId // Ensure transaction ID is synced
            });
        }

        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get My Payments
router.get('/my-payments', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
