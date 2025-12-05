require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Book = require("./models/Book");

// Configuration
const API_URL = "http://localhost:5000/api";
const USER_EMAIL = "rajyashwanthks@gmail.com";

async function runTest() {
    console.log("🚀 Starting Rental Flow Test...");

    // 1. Connect to DB to get User/Book IDs and generate tokens
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    try {
        // 2. Get User
        const user = await User.findOne({ email: USER_EMAIL });
        if (!user) throw new Error(`User ${USER_EMAIL} not found`);
        console.log(`👤 Found User: ${user.name} (${user._id})`);

        // 3. Get/Create Admin
        let admin = await User.findOne({ role: "admin" });
        if (!admin) {
            console.log("⚠️ No admin found, creating temporary admin...");
            admin = await User.create({
                name: "Test Admin",
                email: "admin@test.com",
                password: "password123",
                role: "admin"
            });
        }
        console.log(`👮 Admin: ${admin.name} (${admin._id})`);

        // 4. Generate Tokens
        const userToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        const adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // 5. Get a Rentable Book
        let book = await Book.findOne({ isRentable: true });
        if (!book) {
            console.log("⚠️ No rentable book found, making one rentable...");
            book = await Book.findOne();
            if (book) {
                book.isRentable = true;
                await book.save();
            } else {
                throw new Error("No books in database");
            }
        }
        console.log(`📖 Book: ${book.title} (${book._id})`);

        // Helper for requests
        const http = require('http');
        const request = (method, path, token, body) => {
            return new Promise((resolve, reject) => {
                const options = {
                    hostname: 'localhost',
                    port: 5000,
                    path: '/api' + path,
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                };

                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve(parsed);
                            } else {
                                reject(new Error(parsed.error || res.statusMessage));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                req.on('error', (e) => reject(e));
                if (body) req.write(JSON.stringify(body));
                req.end();
            });
        };

        // --- TEST CASE 1: APPROVAL ---
        console.log("\n--- 🧪 TEST CASE 1: APPROVAL ---");

        // Create Rental Request
        console.log("📝 Creating Rental Request...");
        const rental1 = await request("POST", "/rentals/request", userToken, {
            bookId: book._id,
            hours: 24,
            transactionId: "TEST_TXN_APPROVE"
        });
        console.log(`✅ Rental Created: ${rental1._id}`);

        // Approve Rental
        console.log("👍 Approving Rental...");
        const approved = await request("PUT", `/rentals/approve/${rental1._id}`, adminToken);
        console.log(`✅ Rental Approved! Status: ${approved.status}`);
        console.log("📧 CHECK CONSOLE FOR APPROVAL EMAIL LOGS");


        // --- TEST CASE 2: REJECTION ---
        console.log("\n--- 🧪 TEST CASE 2: REJECTION ---");

        // Create Rental Request
        console.log("📝 Creating Rental Request...");
        const rental2 = await request("POST", "/rentals/request", userToken, {
            bookId: book._id,
            hours: 24,
            transactionId: "TEST_TXN_REJECT"
        });
        console.log(`✅ Rental Created: ${rental2._id}`);

        // Reject Rental
        console.log("👎 Rejecting Rental...");
        const rejected = await request("PUT", `/rentals/reject/${rental2._id}`, adminToken);
        console.log(`✅ Rental Rejected! Status: ${rejected.rental.status}`); // API returns { message, rental }
        console.log("📧 CHECK CONSOLE FOR REJECTION EMAIL LOGS");

    } catch (err) {
        console.error("❌ Test Failed:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n🏁 Test Complete");
    }
}

runTest();
