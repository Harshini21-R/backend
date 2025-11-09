require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();

// 🧠 Connect to MongoDB
connectDB()
  .then(() => console.log('✅ MongoDB connection successful'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err));

// 🔧 Middleware setup
app.use(helmet());
app.use(cors({
  origin: '*', // Change this to your frontend URL for production
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve PDFs from the uploads/pdfs directory
// Accessible at http://localhost:5000/pdfs/filename.pdf
app.use('/pdfs', express.static('uploads/pdfs'));

// 📦 API Routes
app.use('/api/auth', authRoutes);         // User login/signup
app.use('/api/books', bookRoutes);        // Book management
app.use('/api/reviews', reviewRoutes);    // Reviews system
app.use('/api/ratings', ratingRoutes);    // Ratings system
app.use('/api/history', historyRoutes);   // Reading history

// 🩺 Health check route
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: '📚 Readify Backend is running smoothly!',
    version: 'v1.0.0',
    endpoints: [
      '/api/auth',
      '/api/books',
      '/api/reviews',
      '/api/ratings',
      '/api/history',
      '/pdfs/:filename',
    ],
  });
});

// ❗ Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Server Error' });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
