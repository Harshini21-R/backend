require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./db");
const bodyParser = require("body-parser");
const multer = require("multer"); // For file uploads
const stripe = require("stripe")("your_stripe_secret_key"); // Replace with your actual Stripe secret key
const mongoose = require("mongoose"); // Assuming you're using MongoDB
const Book = require("./models/Book"); // Adjust the path as necessary
const Review = require("./models/Review"); // Adjust the path as necessary

// Import Routes
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const historyRoutes = require("./routes/historyRoutes");

const app = express();
const port = 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for file uploads
const upload = multer({ dest: "uploads/kindle/" }); // Set upload destination

// CORS FIXED ✔
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5500",
      
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// PDF Static Folder
app.use("/pdfs", express.static(path.join(__dirname, "uploads/pdfs")));

// ---------- Test Route (MUST HAVE) ----------
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

// ---------- API ROUTES ----------
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/history", historyRoutes);

// Payment endpoint
app.post("/api/payment", async (req, res) => {
  const { amount } = req.body; // Amount should be in cents
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });
    res.json({
      clientSecret: paymentIntent.client_secret,
      message: "Payment processed successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rent Book endpoint
app.post("/api/rent/:id", async (req, res) => {
  const bookId = req.params.id;
  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Update book status to rented
    book.isRented = true; // Assuming you have an isRented field
    await book.save();
    res.json({ message: `Book ${book.title} rented successfully!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to User Review endpoint
app.post("/api/reviews/:id/respond", async (req, res) => {
  const reviewId = req.params.id;
  const { response } = req.body;
  try {
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.adminResponse = response; // Assuming you have an adminResponse field
    await review.save();
    res.json({ message: `Response to review ${reviewId} submitted!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kindle Upload endpoint
app.post("/api/upload/kindle", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // Process the uploaded file (e.g., save to database or move to a specific directory)
  res.json({ message: "Kindle book uploaded successfully!", file: req.file });
});

// ---------- Backend home route ----------
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "📚 Readify Backend is running!",
    version: "v1.0.0",
  });
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Server Error",
  });
});

// ---------- Start Server ----------
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
