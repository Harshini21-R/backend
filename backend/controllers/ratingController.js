// controllers/ratingController.js
const Rating = require("../models/Rating");
const Book = require("../models/Book");

// ✅ Create/update rating
exports.addRating = async (req, res) => {
  try {
    const { bookId, rating } = req.body;
    if (!bookId || !rating) {
      return res.status(400).json({ error: "Book ID & rating required" });
    }

    await Rating.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { rating },
      { upsert: true, new: true }
    );

    // recalc
    const ratings = await Rating.find({ book: bookId });
    const ratingsCount = ratings.length;
    const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratingsCount;

    await Book.findByIdAndUpdate(bookId, {
      averageRating: avg,
      ratingsCount
    });

    res.status(201).json({
      message: "Rating submitted",
      averageRating: avg,
      ratingsCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Global ratings
exports.getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate("book", "title")
      .populate("user", "name email")
      .sort({ updatedAt: -1 });

    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ My rating for one book
exports.getMyRating = async (req, res) => {
  try {
    const { bookId } = req.params;
    const rating = await Rating.findOne({ user: req.user._id, book: bookId });
    res.json({ rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ My ratings list
exports.getMyRatingsWithBooks = async (req, res) => {
  try {
    const ratings = await Rating.find({ user: req.user._id })
      .populate("book", "title coverUrl")
      .sort({ updatedAt: -1 });

    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
