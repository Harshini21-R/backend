// server.js
// Minimal, robust Express server configured for Render (binds to process.env.PORT).
// Includes MongoDB connection, basic routes, graceful shutdown, and safe email-service usage.

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("tiny"));

// Try to load email service but don't crash if it's missing or broken
let sendEmail;
try {
  // adjust path if your file lives elsewhere
  sendEmail = require("./backend/utils/emailService");
  if (sendEmail && typeof sendEmail !== "function") {
    // if the module exports an object, try common export shapes
    sendEmail = sendEmail.sendEmail || sendEmail.default || sendEmail;
  }
  if (typeof sendEmail !== "function") {
    console.warn(
      "⚠️ emailService loaded but does not export a function. Email endpoints will be disabled."
    );
    sendEmail = null;
  } else {
    console.log("✅ emailService loaded");
  }
} catch (err) {
  console.warn(
    "⚠️ Could not load backend/utils/emailService.js. Email endpoints will be disabled.",
    err.message
  );
  sendEmail = null;
}

// Basic routes
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    name: process.env.npm_package_name || "my-app",
    uptime: process.uptime(),
  });
});

// Health endpoint (useful for Render and load balancers)
app.get("/health", (req, res) => {
  const mongoState = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  res.status(mongoState === 1 ? 200 : 503).json({
    status: mongoState === 1 ? "ok" : "degraded",
    mongoState,
  });
});

// Test email endpoint (safe: won't crash if email service is missing)
app.post("/send-test-email", async (req, res) => {
  if (!sendEmail) {
    return res
      .status(501)
      .json({ error: "Email service not available on this deployment." });
  }

  const { to, subject, text, html } = req.body || {};
  if (!to || (!text && !html)) {
    return res
      .status(400)
      .json({ error: "Missing required fields: to and (text or html)." });
  }

  try {
    const result = await sendEmail({ to, subject: subject || "Test", text, html });
    // result shape depends on implementation; don't assume too much
    res.json({ ok: true, result });
  } catch (err) {
    console.error("Error sending test email:", err);
    res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || null;

async function connectMongo() {
  if (!MONGO_URI) {
    console.warn("⚠️ No MONGO_URI provided. Skipping MongoDB connection.");
    return;
  }
  try {
    // use recommended options
    await mongoose.connect(MONGO_URI, {
      // options as needed by your mongoose version
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    // Do not exit process here; keep server up so Render can show logs.
  }
}

connectMongo();

// Start server listening on Render's assigned port
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT} (host ${HOST})`);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    if (server) server.close();
    if (mongoose && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("✅ MongoDB disconnected");
    }
    // allow logs to flush
    setTimeout(() => process.exit(0), 300);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Export app for testing (optional)
module.exports = app;