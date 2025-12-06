// backend/middleware/validate.js
const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorDetails = error.details.map((detail) => detail.message);
        return res.status(400).json({ error: 'Validation Error', details: errorDetails });
    }

    next();
};

module.exports = validate;
