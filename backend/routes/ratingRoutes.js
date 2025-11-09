// routes/ratingRoutes.js
const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const authMiddleware = require("../middleware/authMiddleware");

// global ratings
router.get("/", ratingController.getAllRatings);

// create/update rating
router.post("/", authMiddleware, ratingController.addRating);

// my ratings
router.get("/mine", authMiddleware, ratingController.getMyRatingsWithBooks);

// my rating on specific book
router.get("/my/:bookId", authMiddleware, ratingController.getMyRating);

module.exports = router;
