const express = require("express");
const Subject = require("../models/Subject");
const RevisionItem = require("../models/RevisionItem");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  const subjects = await Subject.find({ userId: req.userId }).sort({ createdAt: 1 });
  res.json({ subjects });
});

// POST /api/subjects  body: { name, examDate? }
router.post("/", async (req, res) => {
  const { name, examDate } = req.body;
  if (!name) return res.status(400).json({ message: "Subject name is required" });
  const subject = await Subject.create({
    userId: req.userId,
    name,
    examDate: examDate || null,
    chapters: [],
  });
  res.status(201).json({ subject });
});

// PATCH /api/subjects/:subjectId  body: { examDate }  - set/update the exam date
router.patch("/:subjectId", async (req, res) => {
  const { examDate } = req.body;
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.subjectId, userId: req.userId },
    { examDate: examDate || null },
    { new: true }
  );
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  res.json({ subject });
});

router.post("/:subjectId/chapters", async (req, res) => {
  const { name } = req.body;
  const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.userId });
  if (!subject) return res.status(404).json({ message: "Subject not found" });

  subject.chapters.push({ name, topics: [] });
  await subject.save();
  res.status(201).json({ subject });
});

router.post("/:subjectId/chapters/:chapterId/topics", async (req, res) => {
  const { name, difficulty, deadline } = req.body;
  const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.userId });
  if (!subject) return res.status(404).json({ message: "Subject not found" });

  const chapter = subject.chapters.id(req.params.chapterId);
  if (!chapter) return res.status(404).json({ message: "Chapter not found" });

  chapter.topics.push({
    name,
    confidenceScore: 3,
    difficulty: difficulty || "medium",
    deadline: deadline || null,
  });
  await subject.save();
  res.status(201).json({ subject });
});

// PATCH /api/subjects/:subjectId/chapters/:chapterId/topics/:topicId
// body: { confidenceScore?, difficulty?, deadline?, starred? }
router.patch("/:subjectId/chapters/:chapterId/topics/:topicId", async (req, res) => {
  const { confidenceScore, difficulty, deadline, starred } = req.body;
  const subject = await Subject.findOne({ _id: req.params.subjectId, userId: req.userId });
  if (!subject) return res.status(404).json({ message: "Subject not found" });

  const chapter = subject.chapters.id(req.params.chapterId);
  const topic = chapter?.topics.id(req.params.topicId);
  if (!topic) return res.status(404).json({ message: "Topic not found" });

  if (confidenceScore !== undefined) {
    topic.confidenceScore = confidenceScore;
    topic.lastReviewed = new Date();
  }
  if (difficulty !== undefined) topic.difficulty = difficulty;
  if (deadline !== undefined) topic.deadline = deadline || null;

  if (typeof starred === "boolean" && starred !== topic.starred) {
    topic.starred = starred;
    if (starred) {
      await RevisionItem.create({
        userId: req.userId,
        subjectName: subject.name,
        chapterName: chapter.name,
        topicName: topic.name,
      });
    } else {
      await RevisionItem.deleteOne({
        userId: req.userId,
        subjectName: subject.name,
        chapterName: chapter.name,
        topicName: topic.name,
      });
    }
  }

  await subject.save();
  res.json({ subject });
});

router.delete("/:subjectId", async (req, res) => {
  await Subject.deleteOne({ _id: req.params.subjectId, userId: req.userId });
  res.json({ message: "Subject deleted" });
});

module.exports = router;
