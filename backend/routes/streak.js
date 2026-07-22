const express = require("express");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const authMiddleware = require("../middleware/authMiddleware");
const { protectStreak, STREAK_PROTECT_COST } = require("../services/streakService");
const { BADGES } = require("../services/badgeService");

const router = express.Router();
router.use(authMiddleware);

// GET /api/streak - everything the Streak screen needs
router.get("/", async (req, res) => {
  const user = await User.findById(req.userId);
  const totalActiveDays = await ActivityLog.countDocuments({ userId: req.userId });
  // full history of active dates, oldest first - the calendar renders all of it
  const logs = await ActivityLog.find({ userId: req.userId }).sort({ date: 1 });

  res.json({
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalActiveDays,
    activityDates: logs.map((l) => ({ date: l.date, protectedDay: l.protectedDay })),
    coins: user.coins,
    badges: user.badges,
    displayedBadge: user.displayedBadge,
    badgeCatalog: BADGES,
    streakProtectCost: STREAK_PROTECT_COST,
  });
});

// POST /api/streak/protect - spend coins to retroactively cover a missed day
router.post("/protect", async (req, res) => {
  const user = await User.findById(req.userId);
  const result = await protectStreak(user);
  if (!result.success) return res.status(400).json({ message: result.message });

  await user.save();
  res.json({ currentStreak: result.currentStreak, coins: user.coins });
});

// PATCH /api/streak/badge  body: { badgeId } - choose which earned badge shows under the avatar
router.patch("/badge", async (req, res) => {
  const { badgeId } = req.body;
  const user = await User.findById(req.userId);
  if (badgeId && !user.badges.includes(badgeId)) {
    return res.status(400).json({ message: "You haven't earned that badge yet" });
  }
  user.displayedBadge = badgeId || null;
  await user.save();
  res.json({ displayedBadge: user.displayedBadge });
});

module.exports = router;
