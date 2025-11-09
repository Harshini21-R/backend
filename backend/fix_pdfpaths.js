const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./db');
const Book = require('./models/Book');

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const books = await Book.find();
    let updated = 0;
    for (const b of books) {
      if (b.pdfPath && b.pdfPath.startsWith('books/')) {
        b.pdfPath = b.pdfPath.replace(/^books\//, 'pdfs/');
        await b.save();
        updated++;
      }
    }
    console.log(`✅ Updated ${updated} book(s) pdfPath`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
