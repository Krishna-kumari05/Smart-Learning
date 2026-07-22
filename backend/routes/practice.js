const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const YoutubeQuery = require("../models/YoutubeQuery");
const PracticeSet = require("../models/PracticeSet");
const authMiddleware = require("../middleware/authMiddleware");
const { searchVideosForTopic } = require("../services/youtubeService");
const { generateQuestionsFromNotes } = require("../services/questionGenService");

const router = express.Router();
router.use(authMiddleware);

// Uploaded PDFs land in backend/uploads/ temporarily, then get deleted after
// text extraction - only the extracted text is stored in MongoDB.
const upload = multer({ dest: "uploads/" });

async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

// ---------- YouTube recommendations ----------

// POST /api/practice/youtube  body: { topic }
router.post("/youtube", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) return res.status(400).json({ message: "Enter a topic" });

    const videos = await searchVideosForTopic(topic.trim());
    const saved = await YoutubeQuery.create({ userId: req.userId, topic: topic.trim(), videos });

    res.status(201).json({ query: saved });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch YouTube videos", error: err.message });
  }
});

// GET /api/practice/youtube - history list (topic + date only, no need for full video list here)
router.get("/youtube", async (req, res) => {
  const queries = await YoutubeQuery.find({ userId: req.userId })
    .select("topic createdAt")
    .sort({ createdAt: -1 });
  res.json({ queries });
});

// GET /api/practice/youtube/:id - revisit a saved topic's videos
router.get("/youtube/:id", async (req, res) => {
  const query = await YoutubeQuery.findOne({ _id: req.params.id, userId: req.userId });
  if (!query) return res.status(404).json({ message: "Not found" });
  res.json({ query });
});

// ---------- PYQ + notes -> practice questions ----------

// POST /api/practice/questions
// multipart form fields: topicName (text), pyqFile (pdf), notesFile (pdf, optional if notesText given), notesText (text, optional)
router.post(
  "/questions",
  upload.fields([{ name: "pyqFile", maxCount: 1 }, { name: "notesFile", maxCount: 1 }]),
  async (req, res) => {
    const pyqFile = req.files?.pyqFile?.[0];
    const notesFile = req.files?.notesFile?.[0];

    try {
      const { topicName, notesText: pastedNotes } = req.body;
      if (!topicName?.trim()) {
        return res.status(400).json({ message: "Topic name is required" });
      }
      if (!pastedNotes?.trim() && !notesFile) {
        return res.status(400).json({ message: "Provide notes - either upload a PDF or paste text" });
      }

      const notesText = notesFile ? await extractPdfText(notesFile.path) : pastedNotes;
      const pyqText = pyqFile ? await extractPdfText(pyqFile.path) : null;

      const questions = await generateQuestionsFromNotes(topicName.trim(), notesText, pyqText);

      const saved = await PracticeSet.create({
        userId: req.userId,
        topicName: topicName.trim(),
        pyqFileName: pyqFile?.originalname || null,
        notesFileName: notesFile?.originalname || null,
        questions,
      });

      res.status(201).json({ practiceSet: saved });
    } catch (err) {
      res.status(500).json({ message: "Could not generate questions", error: err.message });
    } finally {
      // clean up temp files regardless of success/failure
      if (pyqFile) fs.unlink(pyqFile.path, () => {});
      if (notesFile) fs.unlink(notesFile.path, () => {});
    }
  }
);

// GET /api/practice/questions - history list
router.get("/questions", async (req, res) => {
  const sets = await PracticeSet.find({ userId: req.userId })
    .select("topicName createdAt")
    .sort({ createdAt: -1 });
  res.json({ sets });
});

// GET /api/practice/questions/:id - revisit a saved question set
router.get("/questions/:id", async (req, res) => {
  const set = await PracticeSet.findOne({ _id: req.params.id, userId: req.userId });
  if (!set) return res.status(404).json({ message: "Not found" });
  res.json({ practiceSet: set });
});

module.exports = router;
