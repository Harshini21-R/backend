const express = require("express");
const router = express.Router();
const Rental = require("../models/Rental");
const Book = require("../models/Book");
const authMiddleware = require("../middleware/authMiddleware");
const { sendEmail } = require("../utils/emailService");
const validate = require("../middleware/validate");
const { rentalRequestSchema, rentalExtensionSchema } = require("../utils/validationSchemas");
const asyncHandler = require("../utils/asyncHandler");
const validateId = require("../middleware/validateId");

// Email Transporter -> REMOVED (Moved to utils/emailService.js)

// 0️⃣ Test Email Configuration (Admin)
router.post("/test-email", authMiddleware, asyncHandler(async (req, res) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: req.user.email, // Send to the admin triggering the test
        subject: "Readify Production Email Test",
        text: `This is a test email from your Render production server.\n\nSender: ${process.env.EMAIL_USER}\nRecipient: ${req.user.email}\n\nIf you received this, your email configuration is PERFECT! 🚀`
    };

    console.log("📤 Sending test email to:", req.user.email);
    const info = await sendEmail({
        to: req.user.email,
        subject: "Readify Production Email Test",
        text: `This is a test email from your Render production server.\n\nSender: ${process.env.EMAIL_USER}\nRecipient: ${req.user.email}\n\nIf you received this, your email configuration is PERFECT! 🚀`
    });
    if (info) {
        console.log("✅ Test email sent:", info.response);
        res.json({ success: true, message: "Email sent successfully!", response: info.response });
    } else {
        console.warn("⚠️ Email sent but no info returned");
        res.json({ success: true, message: "Email sent (no info)", response: "No details" });
    }
}));

// 1️⃣ Create Rental Request (User)
router.post("/request", authMiddleware, validate(rentalRequestSchema), asyncHandler(async (req, res) => {
    const { bookId, hours, transactionId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
        res.status(404);
        throw new Error("Book not found");
    }

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
}));

// 2️⃣ Get My Rentals (User)
router.get("/my-rentals", authMiddleware, asyncHandler(async (req, res) => {
    const rentals = await Rental.find({ userId: req.user._id }).populate("bookId");

    const now = new Date();
    for (const rental of rentals) {
        if (rental.status === 'active' && new Date(rental.endTime) < now) {
            rental.status = 'expired';
            await rental.save();
        }
    }

    res.json(rentals);
}));

// 3️⃣ Get Pending Requests (Admin)
router.get("/pending", authMiddleware, asyncHandler(async (req, res) => {
    const rentals = await Rental.find({ status: "pending" })
        .populate("userId", "name email")
        .populate("bookId", "title rentPrice");
    res.json(rentals);
}));

// 3.5️⃣ Get Active Rentals (Admin)
router.get("/active", authMiddleware, asyncHandler(async (req, res) => {
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
}));

// 4️⃣ Approve Rental (Admin)
router.put("/approve/:id", authMiddleware, validateId(), asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id).populate("userId").populate("bookId");
    if (!rental) {
        res.status(404);
        throw new Error("Rental not found");
    }

    rental.status = "active";
    rental.startTime = new Date();
    // Calculate end time: current time + hours * 60 * 60 * 1000
    rental.endTime = new Date(rental.startTime.getTime() + rental.hours * 60 * 60 * 1000);

    await rental.save();

    // Send Approval Email
    if (rental.userId && rental.userId.email) {
        try {
            await sendEmail({
                to: rental.userId.email,
                subject: "Rental Request Approved - Readify",
                text: `Dear ${rental.userId.name},\n\nYour rental request for the book "${rental.bookId.title}" has been APPROVED!\n\nStart Time: ${rental.startTime.toLocaleString()}\nEnd Time: ${rental.endTime.toLocaleString()}\n\nEnjoy reading!\n\nRegards,\nReadify Team`
            });
            console.log(`✅ Approval email sent to ${rental.userId.email}`);
        } catch (emailError) {
            console.error("❌ Error sending approval email:", emailError);
        }
    }

    res.json(rental);
}));

// 5️⃣ Toggle Rentable Status (Admin)
router.put("/toggle-rentable/:bookId", authMiddleware, validateId('bookId'), asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.bookId);
    if (!book) {
        res.status(404);
        throw new Error("Book not found");
    }

    book.isRentable = !book.isRentable;
    await book.save();
    res.json({ message: `Book is now ${book.isRentable ? "Rentable" : "Free"}`, isRentable: book.isRentable });
}));

// 6️⃣ Extend Rental Request (User)
router.put("/extend/:id", authMiddleware, validateId(), validate(rentalExtensionSchema), asyncHandler(async (req, res) => {
    const { hours, transactionId } = req.body;
    const rental = await Rental.findById(req.params.id).populate("bookId");

    if (!rental) {
        res.status(404);
        throw new Error("Rental not found");
    }
    if (rental.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Unauthorized");
    }

    const additionalCost = hours * rental.bookId.rentPrice;

    // Set extension request
    rental.extensionStatus = "pending";
    rental.extensionHours = parseInt(hours);
    rental.extensionCost = additionalCost;
    rental.extensionTransactionId = transactionId;

    await rental.save();
    res.json({ message: "Extension requested", rental });
}));

// 7️⃣ Get Pending Extensions (Admin)
router.get("/pending-extensions", authMiddleware, asyncHandler(async (req, res) => {
    const rentals = await Rental.find({ extensionStatus: "pending" })
        .populate("userId", "name email")
        .populate("bookId", "title");
    res.json(rentals);
}));

// 8️⃣ Approve Extension (Admin)
router.put("/approve-extension/:id", authMiddleware, validateId(), asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
        res.status(404);
        throw new Error("Rental not found");
    }

    if (rental.extensionStatus !== "pending") {
        res.status(400);
        throw new Error("No pending extension");
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
}));

// 8.5️⃣ Reject Extension (Admin)
router.put("/reject-extension/:id", authMiddleware, validateId(), asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
        res.status(404);
        throw new Error("Rental not found");
    }

    if (rental.extensionStatus !== "pending") {
        res.status(400);
        throw new Error("No pending extension");
    }

    // Reject extension
    rental.extensionStatus = "rejected";
    // We keep extensionHours/Cost/TransactionId to show what was rejected if needed

    await rental.save();
    res.json({ message: "Extension rejected", rental });
}));

// 8.6️⃣ Reject Rental (Admin)
router.put("/reject/:id", authMiddleware, validateId(), asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id).populate("userId");
    if (!rental) {
        res.status(404);
        throw new Error("Rental not found");
    }

    if (rental.status !== "pending") {
        res.status(400);
        throw new Error("Rental is not pending");
    }

    rental.status = "rejected";
    await rental.save();

    // Send Rejection Email
    if (rental.userId && rental.userId.email) {
        try {
            const info = await sendEmail({
                to: rental.userId.email,
                subject: "Rental Request Rejected - Readify",
                text: `Dear ${rental.userId.name},\n\nYour rental request for the book has been rejected due to invalid payment details or other issues.\n\nPlease check your dashboard and try again with correct details.\n\nRegards,\nReadify Team`
            });
            if (info) {
                console.log("✅ Email sent successfully: " + info.response);
            } else {
                console.log("⚠️ Email sent but no info returned.");
            }
        } catch (emailError) {
            console.error("❌ Error sending email:", emailError);
            // We don't want to fail the request if email fails, but we should log it
        }
    }

    res.json({ message: "Rental rejected and email sent", rental });
}));

// 9️⃣ Delete Rental (Admin)
router.delete("/:id", authMiddleware, validateId(), asyncHandler(async (req, res) => {
    const rental = await Rental.findByIdAndDelete(req.params.id);
    if (!rental) {
        res.status(404);
        throw new Error("Rental not found");
    }
    res.json({ message: "Rental deleted successfully" });
}));

module.exports = router;
