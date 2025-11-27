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

        // Extension Request Fields
        extensionStatus: {
            type: String,
            enum: ["none", "pending", "rejected"],
            default: "none"
        },
        extensionHours: { type: Number },
        extensionCost: { type: Number },
        extensionTransactionId: { type: String },

        startTime: { type: Date },
        endTime: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Rental", rentalSchema);
