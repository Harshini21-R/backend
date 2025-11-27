const Book = require('../models/Book');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Return a flat array of books (not {books: [], total, ...}) for frontend compatibility
exports.listBooks = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { title: regex },
        { authors: regex },
        { description: regex },
        { categories: regex }
      ];
    }

    // Remove .skip/.limit if you want all books at once, otherwise frontend must handle {books, total, ...}
    // Here: Return ALL books as an array for frontend code compatibility
    const books = await Book.find(filter).sort({ createdAt: -1 }).lean();

    res.json(books);
  } catch (err) {
    next(err);
  }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    next(err);
  }
};

exports.createBook = async (req, res, next) => {
  try {
    const payload = req.body;
    const book = new Book(payload);
    await book.save();

    // --- Send Email Notification ---
    try {
      const users = await User.find({}, 'email');
      const recipientEmails = users.map(user => user.email);

      if (recipientEmails.length > 0) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: recipientEmails,
          subject: '📚 New Book Added to Readify!',
          text: `Hello!\n\nA new book titled "${book.title}" by ${book.author} has just been added to our library.\n\nCheck it out at Readify!\n\nBest regards,\nThe Readify Team`
        };

        await transporter.sendMail(mailOptions);
        console.log('Notification emails sent successfully!');
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // We do not fail the request if email fails
    }
    // -------------------------------

    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
};
