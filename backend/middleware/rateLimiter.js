// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Strict limiter for Auth (Login/Signup)
// Max 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs (slightly higher than 5 to be safe)
    message: {
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General limiter for other API routes
// Max 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        message: 'Too many requests from this IP, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
