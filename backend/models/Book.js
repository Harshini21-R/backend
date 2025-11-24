const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  authors: [{ type: String }],
  description: { type: String },
  isbn: { type: String },
  coverUrl: { type: String },
  pdfUrl: { type: String },
  categories: [{ type: String }],
  publishedDate: { type: Date },
  averageRating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
  // 🆕 Rental Fields
  isRentable: { type: Boolean, default: false },
  rentPrice: { type: Number, default: 2 }, // Default 2 INR/hr
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
