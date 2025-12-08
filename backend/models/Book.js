const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    isRented: { type: Boolean, default: false },
    // Add other fields as necessary
});

module.exports = mongoose.model('Book', bookSchema);
