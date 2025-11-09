const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, historyController.addToHistory);
router.get("/", authMiddleware, historyController.getMyHistory);
router.delete("/", authMiddleware, historyController.clearMyHistory);

module.exports = router;
