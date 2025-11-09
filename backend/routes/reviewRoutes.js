// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

// create review (must be logged in)
router.post("/", authMiddleware, reviewController.createReview);

// global reviews
router.get("/", reviewController.getReviews);

// reviews for a specific book
router.get("/:bookId", reviewController.getReviewsByBook);

module.exports = router;
