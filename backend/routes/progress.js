const express = require("express");
const RewardEvent = require("../models/RewardEvent");
const Subject = require("../models/Subject");
const Timetable = require("../models/Timetable");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

function dateStr(d) {
  return d.toISOString().split("T")[0];
}
function dayLabel(d) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

// GET /api/progress
router.get("/", async (req, res) => {
  const userId = req.userId;
  const today = dateStr(new Date());

  // --- Today's task completion, across whichever timetables exist ---
  const timetables = await Timetable.find({ userId });
  let tasksTotalToday = 0;
  let tasksCompletedToday = 0;
  timetables.forEach((tt) => {
    const day = tt.days.find((d) => d.date === today);
    if (day) {
      tasksTotalToday += day.tasks.length;
      tasksCompletedToday += day.tasks.filter((t) => t.status === "completed").length;
    }
  });

  // --- Points earned today (sum of positive RewardEvent amounts today) ---
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysEvents = await RewardEvent.find({
    userId,
    createdAt: { $gte: startOfToday },
    amount: { $gt: 0 },
  });
  const pointsEarnedToday = todaysEvents.reduce((sum, e) => sum + e.amount, 0);

  // --- Total topics completed (across all subjects) ---
  const subjects = await Subject.find({ userId });
  let topicsCompletedTotal = 0;
  let topicsTotal = 0;
  subjects.forEach((s) =>
    s.chapters.forEach((c) =>
      c.topics.forEach((t) => {
        topicsTotal += 1;
        if (t.completed) topicsCompletedTotal += 1;
      })
    )
  );

  // --- This week's tasks-completed histogram (last 7 days incl. today) ---
  const weekCounts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = dateStr(d);
    let count = 0;
    timetables.forEach((tt) => {
      const day = tt.days.find((day) => day.date === dStr);
      if (day) count += day.tasks.filter((t) => t.status === "completed").length;
    });
    weekCounts.push({ date: dStr, label: dayLabel(d), count });
  }

  const user = await User.findById(userId);

  res.json({
    today: {
      tasksCompleted: tasksCompletedToday,
      tasksTotal: tasksTotalToday,
      pointsEarnedToday,
    },
    week: weekCounts,
    totals: {
      topicsCompletedTotal,
      topicsTotal,
      currentStreak: user.currentStreak,
      coins: user.coins,
    },
  });
});

module.exports = router;
