const express = require("express");
const RevisionItem = require("../models/RevisionItem");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// GET /api/revision - all starred topics, most recently starred first
router.get("/", async (req, res) => {
  const items = await RevisionItem.find({ userId: req.userId }).sort({ starredAt: -1 });
  res.json({ items });
});

router.delete("/:id", async (req, res) => {
  await RevisionItem.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ message: "Removed from revision" });
});

module.exports = router;
