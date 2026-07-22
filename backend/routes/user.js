const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/user/onboarding  (protected)
router.post("/onboarding", authMiddleware, async (req, res) => {
  try {
    const { name, branch, collegeTime, dailyFreeTime, mostEnergeticTime } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, branch, collegeTime, dailyFreeTime, mostEnergeticTime, onboardingComplete: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Could not save onboarding details", error: err.message });
  }
});

// GET /api/user/me  (protected)
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

// PATCH /api/user/avatar  body: { avatarId } - must already be unlocked
router.patch("/avatar", authMiddleware, async (req, res) => {
  const { avatarId } = req.body;
  const user = await User.findById(req.userId);
  if (!user.unlockedAvatars.includes(avatarId)) {
    return res.status(400).json({ message: "Unlock this avatar first" });
  }
  user.avatar = avatarId;
  await user.save();
  res.json({ avatar: user.avatar });
});

// PATCH /api/user/theme  body: { themeId } - must already be unlocked
router.patch("/theme", authMiddleware, async (req, res) => {
  const { themeId } = req.body;
  const user = await User.findById(req.userId);
  if (!user.unlockedThemes.includes(themeId)) {
    return res.status(400).json({ message: "Unlock this theme first" });
  }
  user.activeTheme = themeId;
  await user.save();
  res.json({ activeTheme: user.activeTheme });
});

module.exports = router;