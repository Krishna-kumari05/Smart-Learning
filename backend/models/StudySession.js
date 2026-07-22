const mongoose = require("mongoose");

const StudySessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    // denormalized names so the frontend doesn't need extra lookups to show history
    subjectName: { type: String, default: "" },
    chapterName: { type: String, default: "" },
    topicName: { type: String, default: "" },
    type: { type: String, enum: ["focus", "break"], required: true },
    durationMinutes: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudySession", StudySessionSchema);
