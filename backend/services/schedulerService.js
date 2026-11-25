// schedulerService.js

const STUDY_BLOCK_MINUTES = 25;
const BREAK_BLOCK_MINUTES = 5;
const BLOCK_CYCLE = STUDY_BLOCK_MINUTES + BREAK_BLOCK_MINUTES;
// A leftover gap (or a whole short window) at least this long becomes a
// shorter study block instead of being wasted.
const MIN_BLOCK_MINUTES = 10;

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
// End of a window in minutes. If the end is earlier than the start, the window
// crosses midnight (e.g. 22:00 -> 01:00), so the end falls on the next day.
// Equal start/end is an empty window.
function windowEndMinutes(start, end) {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  return e >= s ? e : e + 24 * 60;
}
function dateStr(d) {
  return d.toISOString().split("T")[0];
}
function nextDatesForWeekdays(weekdays, count) {
  const dates = [];
  const cursor = new Date();
  while (dates.length < count) {
    if (weekdays.includes(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function confidenceWeight(topic) {
  return Math.max(1 - (topic.confidenceScore - 1) / 4, 0.25);
}
function difficultyBoost(topic) {
  return topic.difficulty === "hard" ? 2 : topic.difficulty === "easy" ? 0.75 : 1;
}
function urgencyMultiplier(deadline) {
  if (!deadline) return 1;
  const daysLeft = Math.max((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24), 0.5);
  return Math.min(30 / daysLeft, 6);
}

// Flattens subjects -> chapters -> topics, skipping anything already
// completed, and computes a scheduling weight for each.
function buildWeightedTopicList(subjects, { respectDeadlines = true } = {}) {
  const topics = [];
  subjects.forEach((subject) => {
    subject.chapters.forEach((chapter) => {
      chapter.topics.forEach((topic) => {
        if (topic.completed) return; // never schedule finished topics again
        let weight = confidenceWeight(topic) * difficultyBoost(topic);
        if (respectDeadlines && topic.deadline) weight *= urgencyMultiplier(topic.deadline);
        topics.push({
          subjectId: subject._id,
          chapterId: chapter._id,
          topicId: topic._id,
          subjectName: subject.name,
          chapterName: chapter.name,
          topicName: topic.name,
          confidenceScore: topic.confidenceScore,
          difficulty: topic.difficulty || "medium",
          deadline: topic.deadline,
          weight,
        });
      });
    });
  });
  return topics;
}

function buildRoundRobinQueue(weightedTopics, length) {
  if (weightedTopics.length === 0) return [];
  const totalWeight = weightedTopics.reduce((sum, t) => sum + t.weight, 0);
  const credits = weightedTopics.map(() => 0);
  const queue = [];
  for (let i = 0; i < length; i++) {
    weightedTopics.forEach((t, idx) => (credits[idx] += t.weight));
    let maxIdx = 0;
    for (let idx = 1; idx < credits.length; idx++) if (credits[idx] > credits[maxIdx]) maxIdx = idx;
    queue.push(weightedTopics[maxIdx]);
    credits[maxIdx] -= totalWeight / weightedTopics.length;
  }
  return queue;
}

function taskFromTopic(topic, start, end) {
  return {
    subjectId: topic.subjectId,
    chapterId: topic.chapterId,
    topicId: topic.topicId,
    subjectName: topic.subjectName,
    chapterName: topic.chapterName,
    topicName: topic.topicName,
    startTime: start,
    endTime: end,
    type: topic.confidenceScore >= 4 ? "revision" : "study",
    difficulty: topic.difficulty,
    status: "pending",
  };
}

// Splits one free-time window into study blocks: full 25-min blocks separated by
// 5-min breaks, plus one shorter block if the leftover time is >= MIN_BLOCK_MINUTES.
// So a 15-min window gives one 15-min block, and a 40-min window gives 25 + 10.
function planBlocksForWindow(start, end) {
  const from = timeToMinutes(start);
  const to = windowEndMinutes(start, end);
  const plan = [];
  let cursor = from;
  while (cursor + STUDY_BLOCK_MINUTES <= to) {
    plan.push({ start: cursor, end: cursor + STUDY_BLOCK_MINUTES });
    cursor += BLOCK_CYCLE;
  }
  const left = to - cursor;
  if (left >= MIN_BLOCK_MINUTES && left < STUDY_BLOCK_MINUTES) {
    plan.push({ start: cursor, end: to });
  }
  return plan;
}

// Packs one day's tasks across one or more time windows ("shifts"). Daily/
// exam mode just passes a single shift; weekend mode can pass several.
function packDayAcrossShifts(date, shifts, queue, queueIndexRef) {
  const tasks = [];
  shifts.forEach(({ start, end }) => {
    for (const block of planBlocksForWindow(start, end)) {
      if (queueIndexRef.i >= queue.length) break;
      const topic = queue[queueIndexRef.i++];
      tasks.push(taskFromTopic(topic, minutesToTime(block.start), minutesToTime(block.end)));
    }
  });
  return { date: dateStr(date), tasks };
}

function totalBlocksForShifts(shifts) {
  return shifts.reduce((sum, { start, end }) => sum + planBlocksForWindow(start, end).length, 0);
}

// mode: "daily" (Mon-Fri) uses the user's onboarding free-time window.
// mode: "weekend" (Sat-Sun) uses the custom `shifts` the user picked on the
// generate form - can be 1, 2, 3+ windows in any part of the day.
function generateWeekTimetable(user, subjects, mode, customShifts) {
  const weightedTopics = buildWeightedTopicList(subjects);
  if (weightedTopics.length === 0) {
    return { days: [], warning: "Add subjects, chapters and topics first." };
  }

  const weekdays = mode === "weekend" ? [0, 6] : [1, 2, 3, 4, 5];
  const numDays = mode === "weekend" ? 2 : 5;
  const shifts =
    mode === "weekend" && customShifts?.length
      ? customShifts
      : [{ start: user.dailyFreeTime.start, end: user.dailyFreeTime.end }];

  const blocksPerDay = totalBlocksForShifts(shifts);
  if (blocksPerDay === 0) {
    return {
      days: [],
      warning: `Your free-time window (${shifts.map((x) => `${x.start}-${x.end}`).join(", ")}) is too short to fit a study block.`,
    };
  }

  const dates = nextDatesForWeekdays(weekdays, numDays);
  const queue = buildRoundRobinQueue(weightedTopics, blocksPerDay * numDays);
  const queueIndexRef = { i: 0 };
  const days = dates.map((date) => packDayAcrossShifts(date, shifts, queue, queueIndexRef));

  return { days, shifts };
}

// Exam-centered: each subject brings its own deadline (exam date) and its
// own chosen syllabus (topics). Hard/low-confidence topics are scheduled
// first; a topic is never scheduled after its own subject's exam date.
function generateExamTimetable(user, examSubjects) {
  const allTopics = [];
  examSubjects.forEach((subject) => {
    subject.topics.forEach((topic) => {
      if (topic.completed) return;
      const weight = confidenceWeight(topic) * difficultyBoost(topic);
      allTopics.push({
        subjectId: subject.subjectId,
        chapterId: topic.chapterId,
        topicId: topic.topicId,
        subjectName: subject.subjectName,
        chapterName: topic.chapterName,
        topicName: topic.topicName,
        confidenceScore: topic.confidenceScore,
        difficulty: topic.difficulty,
        examDate: subject.examDate,
        weight,
      });
    });
  });

  if (allTopics.length === 0) {
    return { days: [], warning: "Select at least one chapter/topic for this exam plan." };
  }

  const shifts = [{ start: user.dailyFreeTime.start, end: user.dailyFreeTime.end }];
  const blocksPerDay = totalBlocksForShifts(shifts);
  if (blocksPerDay === 0) {
    return {
      days: [],
      warning: `Your free-time window (${shifts[0].start}-${shifts[0].end}) is too short to fit a study block.`,
    };
  }

  const overallDeadline = examSubjects.reduce(
    (latest, s) => (new Date(s.examDate) > latest ? new Date(s.examDate) : latest),
    new Date(examSubjects[0].examDate)
  );
  const daysAvailable = Math.max(
    Math.ceil((overallDeadline - new Date()) / (1000 * 60 * 60 * 24)),
    1
  );

  const totalWeight = allTopics.reduce((sum, t) => sum + t.weight, 0);
  const credits = allTopics.map(() => 0);

  const days = [];
  const cursorDate = new Date();

  for (let d = 0; d < daysAvailable; d++) {
    const date = new Date(cursorDate);
    date.setDate(date.getDate() + d);
    const dStr = dateStr(date);

    const eligible = allTopics
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => dStr <= dateStr(new Date(t.examDate)));

    const tasks = [];
    const examBlocks = planBlocksForWindow(shifts[0].start, shifts[0].end);

    for (const block of examBlocks) {
      if (eligible.length === 0) break;
      eligible.forEach(({ idx }) => (credits[idx] += allTopics[idx].weight));

      let best = eligible[0];
      eligible.forEach((e) => {
        if (credits[e.idx] > credits[best.idx]) best = e;
      });

      const topic = allTopics[best.idx];
      tasks.push(taskFromTopic(topic, minutesToTime(block.start), minutesToTime(block.end)));
      credits[best.idx] -= totalWeight / allTopics.length;
    }

    days.push({ date: dStr, tasks });
  }

  return { days, deadline: overallDeadline };
}

// Folds any still-"pending" tasks from past days into today.
function rescheduleMissedTasks(timetable) {
  const today = dateStr(new Date());
  const todayDay = timetable.days.find((d) => d.date === today);
  if (!todayDay) return timetable;

  timetable.days.forEach((day) => {
    if (day.date >= today) return;
    day.tasks.forEach((task) => {
      if (task.status === "pending") {
        task.status = "missed";
        todayDay.tasks.push({
          subjectId: task.subjectId,
          chapterId: task.chapterId,
          topicId: task.topicId,
          subjectName: task.subjectName,
          chapterName: task.chapterName,
          topicName: task.topicName,
          startTime: "TBD",
          endTime: "TBD",
          type: task.type,
          difficulty: task.difficulty,
          status: "pending",
        });
      }
    });
  });

  return timetable;
}

// Called right after a topic is marked completed. Removes every future
// occurrence of that exact topic from the timetable, then re-packs each
// future day so freed slots go to the next-highest-priority remaining
// topics - this is the "reschedule with remaining topics" behavior.
function reflowFutureDaysAfterCompletion(timetable, subjects, completedTopicId) {
  const today = dateStr(new Date());
  const futureDays = timetable.days.filter((d) => d.date > today);
  if (futureDays.length === 0) return timetable;

  futureDays.forEach((day) => {
    day.tasks = day.tasks.filter((t) => String(t.topicId) !== String(completedTopicId));
  });

  const weightedTopics = buildWeightedTopicList(subjects);
  if (weightedTopics.length === 0) return timetable;

  const shifts =
    timetable.mode === "weekend" && timetable.shifts?.length ? timetable.shifts : null;

  futureDays.forEach((day) => {
    const targetCount = shifts ? totalBlocksForShifts(shifts) : day.tasks.length + 1;
    const queue = buildRoundRobinQueue(weightedTopics, Math.max(targetCount - day.tasks.length, 0));
    let cursor = day.tasks.length
      ? timeToMinutes(day.tasks[day.tasks.length - 1].endTime) + (BLOCK_CYCLE - STUDY_BLOCK_MINUTES)
      : 0;
    queue.forEach((topic) => {
      day.tasks.push(taskFromTopic(topic, minutesToTime(cursor), minutesToTime(cursor + STUDY_BLOCK_MINUTES)));
      cursor += BLOCK_CYCLE;
    });
  });

  return timetable;
}

module.exports = {
  generateWeekTimetable,
  generateExamTimetable,
  rescheduleMissedTasks,
  reflowFutureDaysAfterCompletion,
};
