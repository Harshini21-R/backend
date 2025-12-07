const express = require('express');
const router = express.Router();
const AdminLog = require('../models/AdminLog');
const auth = require('../middleware/authMiddleware');

// Get All Logs (Admin)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin only" });

        const logs = await AdminLog.find().populate('adminId', 'name email').sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
