// backend/controllers/historyController.js
const History = require("../models/History");
const Book = require("../models/Book");

// ➕ Add / Update history
exports.addToHistory = async (req, res) => {
  try {
    console.log("📥 addToHistory Body:", req.body);
    const { bookId, currentPage, totalPages, isCompleted } = req.body;

    // ✅ Check token user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "User authentication failed" });
    }

    // ✅ Validate bookId
    if (!bookId) {
      return res.status(400).json({ error: "bookId is required" });
    }

    // ✅ Check book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // ✅ Update existing OR create new
    const history = await History.findOneAndUpdate(
      { userId: req.user._id, bookId },
      {
        date: Date.now(),
        currentPage: currentPage || 1,
        totalPages: totalPages || 0,
        isCompleted: isCompleted || false
      },
      { upsert: true, new: true } // update if exists
    );

    return res.status(201).json(history);
  } catch (err) {
    console.error("❌ History Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// 📖 Get logged-in user’s reading history
exports.getMyHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.user._id })
      .populate("bookId")
      .sort({ date: -1 });

    // Fetch ratings and reviews for these books by this user
    const historyWithExtras = await Promise.all(history.map(async (h) => {
      // Convert mongoose doc to object to attach new properties
      const hObj = h.toObject();

      if (h.bookId) {
        const rating = await require("../models/Rating").findOne({
          user: req.user._id,
          book: h.bookId._id
        });

        const review = await require("../models/Review").findOne({
          user: req.user._id,
          bookId: h.bookId._id
        });

        hObj.userRating = rating ? rating.rating : null;
        hObj.userReview = review ? review.comment : null;
      }

      return hObj;
    }));

    return res.json(historyWithExtras);
  } catch (err) {
    console.error("❌ Get History Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// 🗑️ Clear logged-in user’s history
exports.clearMyHistory = async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user._id });
    return res.json({ message: "History cleared" });
  } catch (err) {
    console.error("❌ Clear History Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
