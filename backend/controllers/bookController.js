const Book = require('../models/Book');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const asyncHandler = require('../utils/asyncHandler');

// Configure Nodemailer Transporter -> REMOVED (Moved to utils/emailService.js)

// Return a flat array of books (not {books: [], total, ...}) for frontend compatibility
exports.listBooks = asyncHandler(async (req, res) => {
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
});

exports.getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json(book);
});

exports.createBook = asyncHandler(async (req, res) => {
  const payload = req.body;
  const book = new Book(payload);
  await book.save();

  // --- Send Email Notification ---
  try {
    const users = await User.find({}, 'email');
    const recipientEmails = users.map(user => user.email);

    if (recipientEmails.length > 0) {
      await sendEmail({
        to: recipientEmails,
        subject: '📚 New Book Added to Readify!',
        text: `Hello!\n\nA new book titled "${book.title}" by ${Array.isArray(book.authors) ? book.authors.join(", ") : (book.author || "Unknown Author")} has just been added to our library.\n\nCheck it out at Readify!\n\nBest regards,\nThe Readify Team`
      });
      console.log('Notification emails sent successfully!');
    }
  } catch (emailError) {
    console.error('Error sending email notification:', emailError);
    // We do not fail the request if email fails
  }
  // -------------------------------

  res.status(201).json(book);
});

exports.updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json(book);
});

exports.deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }
  res.json({ message: 'Book deleted' });
});
