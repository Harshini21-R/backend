require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./db");

// Routes
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const historyRoutes = require("./routes/historyRoutes");

const app = express();

// MongoDB Atlas
connectDB();

// Middleware
app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5500",
      "https://YOUR-FRONTEND.onrender.com"
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// PDFs static path
app.use("/pdfs", express.static(path.join(__dirname, "uploads/pdfs")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/history", historyRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "📚 Readify Backend is running smoothly!",
    version: "v1.0.0",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Server Error" });
});

// Render Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
