const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    name: { type: String, default: "" },
    branch: { type: String, default: "" },
    collegeTime: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
    },
    dailyFreeTime: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
    },
    mostEnergeticTime: {
      type: String,
      enum: ["early_morning", "morning", "afternoon", "evening", "night", ""],
      default: "",
    },
    onboardingComplete: { type: Boolean, default: false },

    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    lastGiftMilestone: { type: Number, default: 0 },

    avatar: { type: String, default: "default" },
    unlockedAvatars: { type: [String], default: ["default"] },
    activeTheme: { type: String, default: "app" },
    unlockedThemes: { type: [String], default: ["app"] },

    // Badges earned from total-active-days milestones (see badgeService.js)
    badges: { type: [String], default: [] },
    // Which badge id shows under the avatar - user's choice among earned badges
    displayedBadge: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
