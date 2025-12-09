// server.js (MUST be at the very top)
const dotenv = require('dotenv');
dotenv.config(); 
// ------------------------------------

const express = require('express');
// const cors = require('cors'); // CORS is commented out to ensure connection stability
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const dbConnect = require('./db'); 

// Import all routes and middleware
const authRoutes = require('./routes/authRoutes');
// NOTE: Add your other route imports here (e.g., bookRoutes)

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Connect to Database
dbConnect();

const app = express();

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Logging Middleware
app.use(morgan('dev'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
// NOTE: Add your other route usage here (e.g., app.use('/api/books', bookRoutes);)

// Optional test route
app.get('/', (req, res) => {
    res.send('Welcome to Readify API!');
});

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// CRITICAL FIX: Use process.env.PORT and bind to 0.0.0.0 (all interfaces)
const PORT = process.env.PORT || 5000; 
const HOST = '0.0.0.0'; // Forces the server to listen on all network interfaces

app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
