// backend/utils/validationSchemas.js
const Joi = require('joi');

// --- Auth Schemas ---
const signupSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    // Password: Min 6, 1 Upper, 1 Lower, 1 Number
    password: Joi.string()
        .min(6)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
        .required()
        .messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            'string.min': 'Password must be at least 6 characters long'
        }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// --- Book Schemas ---
const bookSchema = Joi.object({
    title: Joi.string().min(1).required(),
    authors: Joi.array().items(Joi.string()).min(1).required(),
    description: Joi.string().allow('').optional(),
    isbn: Joi.string().optional(),
    coverUrl: Joi.string().uri().optional(),
    pdfUrl: Joi.string().uri().optional(),
    categories: Joi.array().items(Joi.string()).optional(),
    publishedDate: Joi.date().optional(),
    isRentable: Joi.boolean().optional(),
    rentPrice: Joi.number().min(0).optional(),
});

// --- Rental Schemas ---
const rentalRequestSchema = Joi.object({
    bookId: Joi.string().required(), // Simple string check, could be a regex for MongoID
    hours: Joi.number().integer().min(1).max(720).required(), // Max 30 days buffer
    transactionId: Joi.string().min(5).required(),
});

const rentalExtensionSchema = Joi.object({
    hours: Joi.number().integer().min(1).max(720).required(),
    transactionId: Joi.string().min(5).required(),
});


module.exports = {
    signupSchema,
    loginSchema,
    bookSchema,
    rentalRequestSchema,
    rentalExtensionSchema
};
