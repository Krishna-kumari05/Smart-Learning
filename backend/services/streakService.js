const ActivityLog = require("../models/ActivityLog");
const RewardEvent = require("../models/RewardEvent");
const { checkAndAwardBadges } = require("./badgeService");

const STREAK_PROTECT_COST = 50;

function dateStr(d) {
  return d.toISOString().split("T")[0];
}

function addDays(dateString, n) {
  const d = new Date(dateString + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

// Recomputes the current streak by walking ActivityLog backwards from today
// (or yesterday, if today has no entry yet but yesterday does).
async function computeCurrentStreak(userId) {
  const today = dateStr(new Date());
  const logs = await ActivityLog.find({ userId }).sort({ date: -1 });
  const activeDates = new Set(logs.map((l) => l.date));

  let cursor = activeDates.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

// Call whenever a task in any timetable (daily/weekend/exam) is marked
// completed. Idempotent for the same day - completing multiple tasks in one
// day only counts as one active day.
async function recordActivityForToday(user) {
  const today = dateStr(new Date());

  try {
    await ActivityLog.create({ userId: user._id, date: today });
  } catch (err) {
    if (err.code !== 11000) throw err; // 11000 = already logged today, fine
  }

  const currentStreak = await computeCurrentStreak(user._id);
  const longestStreak = Math.max(user.longestStreak || 0, currentStreak);
  const totalActiveDays = await ActivityLog.countDocuments({ userId: user._id });

  user.currentStreak = currentStreak;
  user.longestStreak = longestStreak;

  const newBadges = await checkAndAwardBadges(user, totalActiveDays);

  return { currentStreak, longestStreak, totalActiveDays, newBadges };
}

// Spends coins to retroactively fill in a missed day, preventing the streak
// from resetting. Only makes sense if exactly yesterday is missing while the
// day before is present (i.e. the streak just broke).
async function protectStreak(user) {
  const today = dateStr(new Date());
  const yesterday = addDays(today, -1);
  const dayBefore = addDays(today, -2);

  const yesterdayLog = await ActivityLog.findOne({ userId: user._id, date: yesterday });
  if (yesterdayLog) {
    return { success: false, message: "Yesterday is already marked active - nothing to protect." };
  }

  const dayBeforeLog = await ActivityLog.findOne({ userId: user._id, date: dayBefore });
  if (!dayBeforeLog) {
    return { success: false, message: "There's no recent streak to protect." };
  }

  if ((user.coins || 0) < STREAK_PROTECT_COST) {
    return { success: false, message: `You need ${STREAK_PROTECT_COST} coins to protect your streak.` };
  }

  await ActivityLog.create({ userId: user._id, date: yesterday, protectedDay: true });
  user.coins -= STREAK_PROTECT_COST;

  const currentStreak = await computeCurrentStreak(user._id);
  user.currentStreak = currentStreak;
  user.longestStreak = Math.max(user.longestStreak || 0, currentStreak);

  await RewardEvent.create({
    userId: user._id,
    type: "streak_protected",
    amount: -STREAK_PROTECT_COST,
    description: "Streak protected - yesterday marked active",
  });

  return { success: true, currentStreak };
}

module.exports = {
  STREAK_PROTECT_COST,
  computeCurrentStreak,
  recordActivityForToday,
  protectStreak,
  dateStr,
};
