const express = require("express");
const Timetable = require("../models/Timetable");
const Subject = require("../models/Subject");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateWeekTimetable,
  generateExamTimetable,
  rescheduleMissedTasks,
  reflowFutureDaysAfterCompletion,
} = require("../services/schedulerService");
const { awardCoinsForTask, maybeAwardStreakGiftBox } = require("../services/rewardsService");
const { recordActivityForToday } = require("../services/streakService");

const router = express.Router();
router.use(authMiddleware);

// POST /api/timetable/generate
// Daily/Weekend body:  { mode: "daily" | "weekend", shifts?: [{start,end}] }
// Exam body:           { mode: "exam", examSubjects: [{ subjectId, examDate, topicIds: [...] }] }
router.post("/generate", async (req, res) => {
  try {
    const { mode, shifts, examSubjects } = req.body;
    const user = await User.findById(req.userId);
    if (!user.dailyFreeTime?.start || !user.dailyFreeTime?.end) {
      return res.status(400).json({ message: "Complete onboarding (free-time window) first." });
    }

    let result;
    let persistedShifts = [];
    let persistedDeadline = null;

    if (mode === "exam") {
      if (!examSubjects?.length) {
        return res.status(400).json({ message: "Choose at least one subject with a deadline." });
      }

      const subjectIds = examSubjects.map((s) => s.subjectId);
      const subjectDocs = await Subject.find({ _id: { $in: subjectIds }, userId: req.userId });

      const expanded = examSubjects.map((es) => {
        const doc = subjectDocs.find((d) => String(d._id) === String(es.subjectId));
        if (doc && es.examDate) doc.examDate = es.examDate; // will persist below

        const topics = [];
        doc?.chapters.forEach((chapter) => {
          chapter.topics.forEach((topic) => {
            if (es.topicIds.includes(String(topic._id))) {
              topics.push({
                chapterId: chapter._id,
                chapterName: chapter.name,
                topicId: topic._id,
                topicName: topic.name,
                confidenceScore: topic.confidenceScore,
                difficulty: topic.difficulty,
                completed: topic.completed,
              });
            }
          });
        });

        return {
          subjectId: es.subjectId,
          subjectName: doc?.name || "Subject",
          examDate: es.examDate,
          topics,
        };
      });

      // persist each subject's exam date for future reference
      await Promise.all(
        subjectDocs.map((doc) => doc.examDate ? doc.save() : Promise.resolve())
      );

      result = generateExamTimetable(user, expanded);
      persistedDeadline = result.deadline || null;
    } else {
      const subjects = await Subject.find({ userId: req.userId });
      result = generateWeekTimetable(user, subjects, mode || "daily", shifts);
      persistedShifts = result.shifts || [];
    }

    if (result.days.length === 0 && result.warning) {
      return res.status(400).json({ message: result.warning });
    }

    await Timetable.deleteMany({ userId: req.userId, mode: mode || "daily" });
    const timetable = await Timetable.create({
      userId: req.userId,
      mode: mode || "daily",
      deadline: persistedDeadline,
      shifts: persistedShifts,
      days: result.days,
    });

    res.status(201).json({ timetable, notice: result.warning });
  } catch (err) {
    res.status(500).json({ message: "Could not generate timetable", error: err.message });
  }
});

// GET /api/timetable?mode=daily|weekend|exam
router.get("/", async (req, res) => {
  const mode = req.query.mode || "daily";
  let timetable = await Timetable.findOne({ userId: req.userId, mode }).sort({ generatedAt: -1 });

  if (timetable) {
    rescheduleMissedTasks(timetable);
    await timetable.save();
  }

  res.json({ timetable });
});

// PATCH /api/timetable/:timetableId/day/:date/task/:taskId
// body: { status }  - "completed" | "missed" | "pending"
router.patch("/:timetableId/day/:date/task/:taskId", async (req, res) => {
  const { status } = req.body;
  const timetable = await Timetable.findOne({ _id: req.params.timetableId, userId: req.userId });
  if (!timetable) return res.status(404).json({ message: "Timetable not found" });

  const day = timetable.days.find((d) => d.date === req.params.date);
  const task = day?.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  let response = {};

  if (status && status !== task.status) {
    task.status = status;

    if (status === "completed") {
      const user = await User.findById(req.userId);

      // 1) mark the source topic completed, so it's excluded from now on
      const subject = task.subjectId ? await Subject.findById(task.subjectId) : null;
      const chapter = subject?.chapters.id(task.chapterId);
      const topic = chapter?.topics.id(task.topicId);
      if (topic) {
        topic.completed = true;
        topic.completedAt = new Date();
        await subject.save();
      }

      // 2) coins for this task's difficulty
      const coinsAwarded = await awardCoinsForTask(user, task);

      // 3) streak + badges (any completed task counts as an active day)
      const { currentStreak, longestStreak, totalActiveDays, newBadges } =
        await recordActivityForToday(user);

      // 4) 7-day streak gift box, if this crossed a milestone
      const giftCoins = await maybeAwardStreakGiftBox(user);

      await user.save();

      // 5) reflow remaining future days so the freed slot goes to the next
      // highest-priority remaining topic
      if (topic) {
        const allSubjects = await Subject.find({ userId: req.userId });
        reflowFutureDaysAfterCompletion(timetable, allSubjects, task.topicId);
      }

      response = { coinsAwarded, currentStreak, longestStreak, totalActiveDays, newBadges, giftCoins };
    }
  }

  await timetable.save();
  res.json({ timetable, ...response });
});

module.exports = router;
