// controllers/reviewController.js
const Review = require("../models/Review");


// ✅ Create review
exports.createReview = async (req, res) => {
  try {
    const { bookId, comment } = req.body;

    if (!bookId || !comment)
      return res.status(400).json({ message: "bookId & comment required" });

    const newReview = new Review({
      bookId,
      user: req.user._id,   // ✅ Auto-attach user
      comment
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Global reviews
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("bookId", "title")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Per-book reviews
exports.getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reviews = await Review.find({ bookId })
      .populate("bookId", "title")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
