const mongoose = require("mongoose");

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  confidenceScore: { type: Number, min: 1, max: 5, default: 3 },
  lastReviewed: { type: Date, default: null },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  deadline: { type: Date, default: null },

  // Starring now lives here (moved from the timetable task) - this is what
  // populates the Revision section inside Time-table.
  starred: { type: Boolean, default: false },

  // Set true once a scheduled task for this topic is marked "Complete".
  // Excluded from all future timetable generation/reflow once true.
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const ChapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topics: [TopicSchema],
});

const SubjectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    // The exam date for this subject - used directly as the deadline in
    // exam-centered timetable generation.
    examDate: { type: Date, default: null },
    chapters: [ChapterSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
