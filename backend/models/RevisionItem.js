const mongoose = require("mongoose");

const RevisionItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectName: String,
    chapterName: String,
    topicName: String,
    starredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RevisionItem", RevisionItemSchema);
