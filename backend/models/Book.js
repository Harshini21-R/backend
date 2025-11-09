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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
