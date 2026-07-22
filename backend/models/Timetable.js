const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  // precise reference back to the Subject/Chapter/Topic this task came from,
  // so completion and reflow can target the exact topic instead of matching
  // by name (which was fragile if two topics shared a name)
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  chapterId: { type: mongoose.Schema.Types.ObjectId },
  topicId: { type: mongoose.Schema.Types.ObjectId },

  subjectName: String,
  chapterName: String,
  topicName: String,
  startTime: String,
  endTime: String,
  type: { type: String, enum: ["study", "revision"], default: "study" },
  status: { type: String, enum: ["pending", "completed", "missed"], default: "pending" },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
});

const DaySchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  tasks: [TaskSchema],
});

const TimetableSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["daily", "exam", "weekend"], default: "daily" },
    deadline: { type: Date, default: null }, // exam mode only
    // weekend mode: the shift windows the user picked, e.g.
    // [{start:"06:00", end:"09:00"}, {start:"18:00", end:"21:00"}]
    shifts: [{ start: String, end: String }],
    generatedAt: { type: Date, default: Date.now },
    days: [DaySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
