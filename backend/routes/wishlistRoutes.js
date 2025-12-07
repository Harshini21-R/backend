const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/authMiddleware');

// Get Wishlist
router.get('/', auth, async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ userId: req.user.id }).populate('bookId');
        res.json(wishlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to Wishlist
router.post('/', auth, async (req, res) => {
    try {
        const { bookId } = req.body;
        const newItem = new Wishlist({ userId: req.user.id, bookId });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: "Already in wishlist" });
        res.status(500).json({ error: err.message });
    }
});

// Remove from Wishlist
router.delete('/:id', auth, async (req, res) => {
    try {
        await Wishlist.findByIdAndDelete(req.params.id);
        res.json({ message: "Removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
