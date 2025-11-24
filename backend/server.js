require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const historyRoutes = require("./routes/historyRoutes");
const rentalRoutes = require("./routes/rentalRoutes");

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Security + middlewares
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS FIXED ✔
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5500",
      "http://localhost:8000",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:8000",
      "https://yashwanthrajks1rvu23bsc180-readify-3.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// PDF Static Folder
app.use(
  "/pdfs",
  express.static(path.join(__dirname, "uploads/pdfs"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
    },
  })
);

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
app.use("/api/rentals", rentalRoutes);

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
