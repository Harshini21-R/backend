const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

//
// ✅ Register User
//
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;   // ✅ role included

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Mongoose pre-save hook hashes password
  const user = await User.create({ name, email, password, role });

  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.status(201).json({
    message: 'User registered successfully ✅',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,     // ✅ ADDED
    },
  });
});


//
// ✅ Login User
//
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error('Invalid email or password');
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid email or password');
  }

  // Generate JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.status(200).json({
    message: 'Login successful ✅',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,      // ✅ ADDED
    },
  });
});
