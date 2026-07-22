const RewardEvent = require("../models/RewardEvent");

// Ordered by threshold ascending. Extend this list any time - nothing else
// needs to change.
const BADGES = [
  { days: 5, id: "task_slayer", name: "Task Slayer" },
  { days: 10, id: "daily_dominator", name: "Daily Dominator" },
  { days: 20, id: "learning_ninja", name: "Learning Ninja" },
  { days: 40, id: "focus_master", name: "Focus Master" },
  { days: 75, id: "unstoppable", name: "Unstoppable" },
];

// Call whenever totalActiveDays changes. Mutates user.badges in place;
// caller saves the user document. Returns any newly-earned badges.
async function checkAndAwardBadges(user, totalActiveDays) {
  const newlyEarned = [];

  for (const badge of BADGES) {
    if (totalActiveDays >= badge.days && !user.badges.includes(badge.id)) {
      user.badges.push(badge.id);
      newlyEarned.push(badge);

      await RewardEvent.create({
        userId: user._id,
        type: "badge_earned",
        amount: 0,
        description: `Badge earned: ${badge.name}`,
      });

      // First badge earned automatically becomes the displayed one if none set yet
      if (!user.displayedBadge) user.displayedBadge = badge.id;
    }
  }

  return newlyEarned;
}

module.exports = { BADGES, checkAndAwardBadges };
