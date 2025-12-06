// backend/middleware/validateId.js
const mongoose = require('mongoose');

// Defaults to checking 'id' param, but can be customized e.g., validateId('bookId')
const validateId = (paramName = 'id') => (req, res, next) => {
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: `Invalid ${paramName} format` });
    }

    next();
};

module.exports = validateId;
