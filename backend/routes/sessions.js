const express = require("express");
const StudySession = require("../models/StudySession");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { updateStreakOnActivity } = require("../services/streakService");
const { maybeAwardStreakGiftBox } = require("../services/rewardsService");

const router = express.Router();
router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const { subjectId, subjectName, chapterName, topicName, type, durationMinutes } = req.body;

    const session = await StudySession.create({
      userId: req.userId,
      subjectId: subjectId || null,
      subjectName: subjectName || "",
      chapterName: chapterName || "",
      topicName: topicName || "",
      type,
      durationMinutes,
    });

    let streakInfo = null;
    let giftCoins = 0;

    if (type === "focus") {
      const user = await User.findById(req.userId);
      const updated = updateStreakOnActivity(user);
      user.currentStreak = updated.currentStreak;
      user.longestStreak = updated.longestStreak;
      user.lastActiveDate = updated.lastActiveDate;

      giftCoins = await maybeAwardStreakGiftBox(user);

      await user.save();
      streakInfo = updated;
    }

    res.status(201).json({ session, streak: streakInfo, giftCoins });
  } catch (err) {
    res.status(500).json({ message: "Could not log session", error: err.message });
  }
});

router.get("/", async (req, res) => {
  const sessions = await StudySession.find({ userId: req.userId }).sort({ completedAt: -1 }).limit(100);
  res.json({ sessions });
});

module.exports = router;
