const mongoose = require("mongoose");

const RewardEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "task_completed",
        "streak_giftbox",
        "avatar_unlocked",
        "theme_unlocked",
        "badge_earned",
        "streak_protected",
      ],
      required: true,
    },
    amount: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.RewardEvent || mongoose.model("RewardEvent", RewardEventSchema);
