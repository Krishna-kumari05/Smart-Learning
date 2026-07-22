const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: String,
  type: { type: String, enum: ["mcq", "short", "long"], default: "short" },
  options: [String], // only used when type === "mcq"
  answer: String,
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
});

const PracticeSetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topicName: { type: String, required: true },
    pyqFileName: String,
    notesFileName: String,
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.PracticeSet || mongoose.model("PracticeSet", PracticeSetSchema);
