const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    // true if this day was filled in retroactively by a Streak Protector
    // rather than by actually completing a task
    protectedDay: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One activity record per user per calendar day
ActivityLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
