const RewardEvent = require("../models/RewardEvent");

const COINS_BY_DIFFICULTY = { easy: 10, medium: 20, hard: 50 };

async function awardCoinsForTask(user, task) {
  const amount = COINS_BY_DIFFICULTY[task.difficulty] || 10;
  user.coins = (user.coins || 0) + amount;

  await RewardEvent.create({
    userId: user._id,
    type: "task_completed",
    amount,
    description: `${task.topicName || "Task"} completed`,
  });

  return amount;
}

// Every 7-day streak milestone opens a gift box worth a random 10-100 coins,
// awarded once per milestone. Call this after currentStreak has been updated.
async function maybeAwardStreakGiftBox(user) {
  const milestone = Math.floor((user.currentStreak || 0) / 7);
  if (milestone > 0 && milestone > (user.lastGiftMilestone || 0)) {
    const amount = Math.floor(Math.random() * 91) + 10;
    user.coins = (user.coins || 0) + amount;
    user.lastGiftMilestone = milestone;

    await RewardEvent.create({
      userId: user._id,
      type: "streak_giftbox",
      amount,
      description: `${milestone * 7}-day streak gift box`,
    });

    return amount;
  }
  return 0;
}

module.exports = { awardCoinsForTask, maybeAwardStreakGiftBox, COINS_BY_DIFFICULTY };
