const express = require("express");
const User = require("../models/User");
const RewardEvent = require("../models/RewardEvent");
const authMiddleware = require("../middleware/authMiddleware");
const { AVATARS, THEMES } = require("../services/shopCatalog");

const router = express.Router();
router.use(authMiddleware);

// GET /api/rewards - everything the Rewards screen needs in one call
router.get("/", async (req, res) => {
  const user = await User.findById(req.userId);
  const recentEvents = await RewardEvent.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    coins: user.coins,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    avatar: user.avatar,
    activeTheme: user.activeTheme,
    unlockedAvatars: user.unlockedAvatars,
    unlockedThemes: user.unlockedThemes,
    avatarCatalog: AVATARS,
    themeCatalog: THEMES,
    recentEvents,
  });
});

// POST /api/rewards/unlock-avatar  body: { avatarId }
router.post("/unlock-avatar", async (req, res) => {
  const { avatarId } = req.body;
  const item = AVATARS.find((a) => a.id === avatarId);
  if (!item) return res.status(404).json({ message: "Avatar not found" });

  const user = await User.findById(req.userId);
  if (user.unlockedAvatars.includes(avatarId)) {
    return res.status(400).json({ message: "Already unlocked" });
  }
  if (user.coins < item.cost) {
    return res.status(400).json({ message: "Not enough coins" });
  }

  user.coins -= item.cost;
  user.unlockedAvatars.push(avatarId);
  await user.save();

  await RewardEvent.create({
    userId: req.userId,
    type: "avatar_unlocked",
    amount: -item.cost,
    description: `Unlocked ${item.name} avatar`,
  });

  res.json({ coins: user.coins, unlockedAvatars: user.unlockedAvatars });
});

// POST /api/rewards/unlock-theme  body: { themeId }
router.post("/unlock-theme", async (req, res) => {
  const { themeId } = req.body;
  const item = THEMES.find((t) => t.id === themeId);
  if (!item) return res.status(404).json({ message: "Theme not found" });

  const user = await User.findById(req.userId);
  if (user.unlockedThemes.includes(themeId)) {
    return res.status(400).json({ message: "Already unlocked" });
  }
  if (user.coins < item.cost) {
    return res.status(400).json({ message: "Not enough coins" });
  }

  user.coins -= item.cost;
  user.unlockedThemes.push(themeId);
  await user.save();

  await RewardEvent.create({
    userId: req.userId,
    type: "theme_unlocked",
    amount: -item.cost,
    description: `Unlocked ${item.name} theme`,
  });

  res.json({ coins: user.coins, unlockedThemes: user.unlockedThemes });
});

module.exports = router;
