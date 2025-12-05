// server.js
// Clean, fixed Express server for Render. Binds to process.env.PORT and host 0.0.0.0.
// Uses connectDB() from ./db (keeps DB logic centralized), safe email loader,
// single app.listen, graceful shutdown, and clear routes.

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./db");

// Import Routes (adjust paths if your project layout differs)
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const historyRoutes = require("./routes/historyRoutes");
const rentalRoutes = require("./routes/rentalRoutes");

const app = express();

// Connect to MongoDB (connectDB should handle connection and errors)
connectDB();

// Middlewares
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));

// CORS configuration (only set once)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5500",
  "http://localhost:8000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:8000",
  "https://yashwanthrajks1rvu23bsc180-readify-3.onrender.com",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Static folder for PDFs
app.use(
  "/pdfs",
  express.static(path.join(__dirname, "uploads/pdfs"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
    },
  })
);

// Safely load email service
let sendEmail = null;
try {
  const emailModule = require("./utils/emailService");
  if (emailModule.init) {
    emailModule.init();
  }
  sendEmail = emailModule.sendEmail;
  if (typeof sendEmail !== "function") {
    console.warn("⚠️ emailService loaded but does not export a function. Email endpoints disabled.");
    sendEmail = null;
  } else {
    console.log("✅ emailService loaded");
  }
} catch (err) {
  console.warn("⚠️ Could not load backend/utils/emailService.js. Email endpoints disabled.", err.message);
  sendEmail = null;
}

// ---------- Basic & Debug Routes ----------
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

app.get("/api/debug-env", (req, res) => {
  res.json({
    EMAIL_USER_SET: !!process.env.EMAIL_USER,
    CLIENT_ID_SET: !!process.env.CLIENT_ID,
    REFRESH_TOKEN_SET: !!process.env.REFRESH_TOKEN,
    MONGO_URI_SET: !!(process.env.MONGO_URI || process.env.DATABASE_URL),
  });
});

// Health endpoint
app.get("/health", (req, res) => {
  const mongoState = mongoose.connection.readyState; // 0 disconnected, 1 connected...
  res.status(mongoState === 1 ? 200 : 503).json({
    status: mongoState === 1 ? "ok" : "degraded",
    mongoState,
  });
});

// ---------- API Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/rentals", rentalRoutes);

// Backend home (simple)
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "📚 Readify Backend is running!",
    version: "v1.0.0",
  });
});

// Send test email route (safe: returns 501 if email service not available)
app.post("/send-test-email", async (req, res) => {
  if (!sendEmail) {
    return res.status(501).json({ error: "Email service not available on this deployment." });
  }

  const { to, subject, text, html } = req.body || {};
  if (!to || (!text && !html)) {
    return res.status(400).json({ error: "Missing required fields: to and (text or html)." });
  }

  try {
    const result = await sendEmail({ to, subject: subject || "Test", text, html });
    res.json({ ok: true, result });
  } catch (err) {
    console.error("Error sending test email:", err);
    res.status(500).json({ error: "Failed to send email", details: err.message || err });
  }
});

// DEBUG ROUTE (Brevo)
app.post("/debug/send-test-email", async (req, res) => {
  const to =
    req.body.to ||
    process.env.DEBUG_TEST_EMAIL ||
    "your-test-email@example.com";

  try {
    const result = await require("./utils/emailService").sendEmail({
      to,
      subject: "Brevo Email Test (Production)",
      text: "If you get this email, Brevo API is working from Render.",
      html: "<p>If you get this email, <strong>Brevo API</strong> is working from Render.</p>",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Server Error",
  });
});

// ---------- Start Server (single app.listen) ----------
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT} (host ${HOST})`);
});

// ---------- Graceful shutdown ----------
async function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    if (server) {
      server.close(() => console.log("HTTP server closed"));
    }
    if (mongoose && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("✅ MongoDB disconnected");
    }
    setTimeout(() => process.exit(0), 300);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Export app for tests
module.exports = app;