const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },
        hours: { type: Number, required: true },
        totalCost: { type: Number, required: true },
        transactionId: { type: String, required: true }, // UTR from user

        status: {
            type: String,
            enum: ["pending", "active", "rejected", "expired"],
            default: "pending",
        },
        paymentStatus: { type: String, default: 'pending' },
        lateFee: { type: Number, default: 0 },

        // Extension Request Fields
        extensionStatus: {
            type: String,
            enum: ["none", "pending", "rejected", "approved"],
            default: "none"
        },
        isExtended: { type: Boolean, default: false },
        autoExpiry: { type: Boolean, default: true },
        extensionHours: { type: Number },
        extensionCost: { type: Number },
        extensionTransactionId: { type: String },

        startTime: { type: Date },
        endTime: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Rental", rentalSchema);
