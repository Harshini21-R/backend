// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../utils/validationSchemas');

router.post('/register', validate(signupSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

module.exports = router;
