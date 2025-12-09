// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    adminResponse: { type: String } // Optional field for admin response
    // Add other fields as necessary
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
