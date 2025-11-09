const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ UNIQUE index to avoid duplicate history
historySchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model("History", historySchema);
