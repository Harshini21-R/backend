const express = require("express");
const router = express.Router();
const Rental = require("../models/Rental");
const Book = require("../models/Book");
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

// Email Transporter (Explicit Config for Production)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // Helps with some cloud SSL issues
    },
    connectionTimeout: 10000, // 10 seconds
});

// Verify connection on startup
transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ SMTP Connection Error:", error);
    } else {
        console.log("✅ SMTP Server is ready to take our messages");
    }
});

// 0️⃣ Test Email Configuration (Admin)
router.post("/test-email", authMiddleware, async (req, res) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.user.email, // Send to the admin triggering the test
            subject: "Readify Production Email Test",
            text: `This is a test email from your Render production server.\n\nSender: ${process.env.EMAIL_USER}\nRecipient: ${req.user.email}\n\nIf you received this, your email configuration is PERFECT! 🚀`
        };

        console.log("📤 Sending test email to:", req.user.email);
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Test email sent:", info.response);

        res.json({ success: true, message: "Email sent successfully!", response: info.response });
    } catch (err) {
        console.error("❌ Test email failed:", err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

// 1️⃣ Create Rental Request (User)
router.post("/request", authMiddleware, async (req, res) => {
    try {
        const { bookId, hours, transactionId } = req.body;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ error: "Book not found" });

        const totalCost = hours * book.rentPrice;

        const rental = new Rental({
            userId: req.user._id,
            bookId,
            hours,
            totalCost,
            transactionId,
            status: "pending"
        });

        await rental.save();
        res.status(201).json(rental);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2️⃣ Get My Rentals (User)
// 2️⃣ Get My Rentals (User)
router.get("/my-rentals", authMiddleware, async (req, res) => {
    try {
        const rentals = await Rental.find({ userId: req.user._id }).populate("bookId");

        const now = new Date();
        for (const rental of rentals) {
            if (rental.status === 'active' && new Date(rental.endTime) < now) {
                rental.status = 'expired';
                await rental.save();
            }
        }

        res.json(rentals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3️⃣ Get Pending Requests (Admin)
router.get("/pending", authMiddleware, async (req, res) => {
    try {
        const rentals = await Rental.find({ status: "pending" })
            .populate("userId", "name email")
            .populate("bookId", "title rentPrice");
        res.json(rentals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3.5️⃣ Get Active Rentals (Admin)
// 3.5️⃣ Get Active Rentals (Admin)
router.get("/active", authMiddleware, async (req, res) => {
    try {
        // Find all rentals that are currently marked as active
        const rentals = await Rental.find({ status: "active" })
            .populate("userId", "name email")
            .populate("bookId", "title");

        const now = new Date();
        const activeRentals = [];

        for (const rental of rentals) {
            // Check if rental has expired
            if (new Date(rental.endTime) < now) {
                rental.status = "expired";
                await rental.save();
            } else {
                activeRentals.push(rental);
            }
        }

        res.json(activeRentals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4️⃣ Approve Rental (Admin)
router.put("/approve/:id", authMiddleware, async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id).populate("userId").populate("bookId");
        if (!rental) return res.status(404).json({ error: "Rental not found" });

        rental.status = "active";
        rental.startTime = new Date();
        // Calculate end time: current time + hours * 60 * 60 * 1000
        rental.endTime = new Date(rental.startTime.getTime() + rental.hours * 60 * 60 * 1000);

        await rental.save();

        // Send Approval Email
        if (rental.userId && rental.userId.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: rental.userId.email,
                subject: "Rental Request Approved - Readify",
                text: `Dear ${rental.userId.name},\n\nYour rental request for the book "${rental.bookId.title}" has been APPROVED!\n\nStart Time: ${rental.startTime.toLocaleString()}\nEnd Time: ${rental.endTime.toLocaleString()}\n\nEnjoy reading!\n\nRegards,\nReadify Team`
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`✅ Approval email sent to ${rental.userId.email}`);
            } catch (emailError) {
                console.error("❌ Error sending approval email:", emailError);
            }
        }

        res.json(rental);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5️⃣ Toggle Rentable Status (Admin)
router.put("/toggle-rentable/:bookId", authMiddleware, async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) return res.status(404).json({ error: "Book not found" });

        book.isRentable = !book.isRentable;
        await book.save();
        res.json({ message: `Book is now ${book.isRentable ? "Rentable" : "Free"}`, isRentable: book.isRentable });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6️⃣ Extend Rental (User)
// 6️⃣ Extend Rental Request (User)
router.put("/extend/:id", authMiddleware, async (req, res) => {
    try {
        const { hours, transactionId } = req.body;
        const rental = await Rental.findById(req.params.id).populate("bookId");

        if (!rental) return res.status(404).json({ error: "Rental not found" });
        if (rental.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const additionalCost = hours * rental.bookId.rentPrice;

        // Set extension request
        rental.extensionStatus = "pending";
        rental.extensionHours = parseInt(hours);
        rental.extensionCost = additionalCost;
        rental.extensionTransactionId = transactionId;

        await rental.save();
        res.json({ message: "Extension requested", rental });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7️⃣ Get Pending Extensions (Admin)
router.get("/pending-extensions", authMiddleware, async (req, res) => {
    try {
        const rentals = await Rental.find({ extensionStatus: "pending" })
            .populate("userId", "name email")
            .populate("bookId", "title");
        res.json(rentals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8️⃣ Approve Extension (Admin)
router.put("/approve-extension/:id", authMiddleware, async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ error: "Rental not found" });

        if (rental.extensionStatus !== "pending") {
            return res.status(400).json({ error: "No pending extension" });
        }

        // Apply extension
        rental.hours += rental.extensionHours;
        rental.totalCost += rental.extensionCost;
        rental.transactionId = `${rental.transactionId}, ${rental.extensionTransactionId}`; // Append UTR

        // Update end time
        const currentEndTime = new Date(rental.endTime);
        // If expired, start from now, else add to existing end time
        const baseTime = rental.status === 'expired' ? new Date() : currentEndTime;
        rental.endTime = new Date(baseTime.getTime() + rental.extensionHours * 60 * 60 * 1000);

        if (rental.status === 'expired') {
            rental.status = 'active';
            rental.startTime = new Date(); // Reset start time if it was expired
        }

        // Reset extension fields
        rental.extensionStatus = "none";
        rental.extensionHours = 0;
        rental.extensionCost = 0;
        rental.extensionTransactionId = "";

        await rental.save();
        res.json(rental);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8.5️⃣ Reject Extension (Admin)
router.put("/reject-extension/:id", authMiddleware, async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ error: "Rental not found" });

        if (rental.extensionStatus !== "pending") {
            return res.status(400).json({ error: "No pending extension" });
        }

        // Reject extension
        rental.extensionStatus = "rejected";
        // We keep extensionHours/Cost/TransactionId to show what was rejected if needed, 
        // or we could clear them. The user wants a message "check your payment thing".
        // Keeping them allows the user to see what they tried to do.

        await rental.save();
        res.json({ message: "Extension rejected", rental });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// 8.6️⃣ Reject Rental (Admin)
router.put("/reject/:id", authMiddleware, async (req, res) => {
    try {
        const rental = await Rental.findById(req.params.id).populate("userId");
        if (!rental) return res.status(404).json({ error: "Rental not found" });

        if (rental.status !== "pending") {
            return res.status(400).json({ error: "Rental is not pending" });
        }

        rental.status = "rejected";
        await rental.save();

        // Send Rejection Email
        // Send Rejection Email
        if (rental.userId && rental.userId.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: rental.userId.email,
                subject: "Rental Request Rejected - Readify",
                text: `Dear ${rental.userId.name},\n\nYour rental request for the book has been rejected due to invalid payment details or other issues.\n\nPlease check your dashboard and try again with correct details.\n\nRegards,\nReadify Team`
            };

            // Debug logs for email
            console.log("Attempting to send email...");
            console.log("EMAIL_USER set:", !!process.env.EMAIL_USER);
            console.log("EMAIL_PASS set:", !!process.env.EMAIL_PASS);
            console.log("Recipient:", rental.userId.email);

            try {
                const info = await transporter.sendMail(mailOptions);
                console.log("✅ Email sent successfully: " + info.response);
            } catch (emailError) {
                console.error("❌ Error sending email:", emailError);
                // We don't want to fail the request if email fails, but we should log it
            }
        }

        res.json({ message: "Rental rejected and email sent", rental });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9️⃣ Delete Rental (Admin)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const rental = await Rental.findByIdAndDelete(req.params.id);
        if (!rental) return res.status(404).json({ error: "Rental not found" });
        res.json({ message: "Rental deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
