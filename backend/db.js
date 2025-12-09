// db.js
const mongoose = require('mongoose');

// The function handles connecting to MongoDB using the URI from environment variables.
const connectDB = async () => {
    // Determine the URI to use, prioritizing MONGO_URI from the .env file
    const uri = process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!uri) {
        console.error("❌ Fatal Error: MONGO_URI is not set in environment variables.");
        // Exit process if connection string is missing
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(uri);

        console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
        return conn;

    } catch (err) {
        console.error("❌ MongoDB connection failed:");
        console.error(err.message);
        // Exit process if connection fails
        process.exit(1);
    }
};

module.exports = connectDB;