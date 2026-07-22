import { useState, useEffect } from "react";
import api from "../../api/axios";

const MODES = [
  { id: "daily", label: "Daily (Mon–Fri)" },
  { id: "exam", label: "Exam-centered" },
  { id: "weekend", label: "Weekend (Sat–Sun)" },
];

export default function Timetable() {
  const [mode, setMode] = useState("daily");
  const [timetable, setTimetable] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [revisionItems, setRevisionItems] = useState([]);
  const [celebration, setCelebration] = useState(null); // { coinsAwarded, newBadges, giftCoins }

  // Exam mode: which subjects/chapters/topics are selected, and each subject's exam date
  const [examSelection, setExamSelection] = useState({}); // subjectId -> { examDate, topicIds:Set }

  // Weekend mode: user-defined shift windows
  const [shifts, setShifts] = useState([{ start: "09:00", end: "12:00" }]);

  useEffect(() => {
    loadTimetable(mode);
    api.get("/subjects").then(({ data }) => setSubjects(data.subjects));
  }, [mode]);

  async function loadTimetable(m) {
    const { data } = await api.get(`/timetable?mode=${m}`);
    setTimetable(data.timetable);
  }

  async function loadRevision() {
    const { data } = await api.get("/revision");
    setRevisionItems(data.items);
    setShowRevision(true);
  }

  // --- Exam mode selection helpers ---
  function toggleTopic(subjectId, topicId) {
    setExamSelection((prev) => {
      const current = prev[subjectId] || { examDate: "", topicIds: new Set() };
      const topicIds = new Set(current.topicIds);
      topicIds.has(topicId) ? topicIds.delete(topicId) : topicIds.add(topicId);
      return { ...prev, [subjectId]: { ...current, topicIds } };
    });
  }

  function toggleChapter(subjectId, chapter) {
    setExamSelection((prev) => {
      const current = prev[subjectId] || { examDate: "", topicIds: new Set() };
      const topicIds = new Set(current.topicIds);
      const allSelected = chapter.topics.every((t) => topicIds.has(t._id));
      chapter.topics.forEach((t) => (allSelected ? topicIds.delete(t._id) : topicIds.add(t._id)));
      return { ...prev, [subjectId]: { ...current, topicIds } };
    });
  }

  function setExamDate(subjectId, examDate) {
    setExamSelection((prev) => ({
      ...prev,
      [subjectId]: { ...(prev[subjectId] || { topicIds: new Set() }), examDate },
    }));
  }

  // --- Weekend shift helpers ---
  function updateShift(index, field, value) {
    setShifts((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }
  function addShift() {
    setShifts((prev) => [...prev, { start: "18:00", end: "20:00" }]);
  }
  function removeShift(index) {
    setShifts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const body = { mode };

      if (mode === "exam") {
        const examSubjects = Object.entries(examSelection)
          .filter(([, sel]) => sel.topicIds.size > 0 && sel.examDate)
          .map(([subjectId, sel]) => ({
            subjectId,
            examDate: sel.examDate,
            topicIds: Array.from(sel.topicIds),
          }));
        if (examSubjects.length === 0) {
          setError("Select at least one topic and set an exam date for at least one subject.");
          setLoading(false);
          return;
        }
        body.examSubjects = examSubjects;
      }

      if (mode === "weekend") {
        body.shifts = shifts;
      }

      const { data } = await api.post("/timetable/generate", body);
      setTimetable(data.timetable);
      if (data.notice) setNotice(data.notice);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate timetable.");
    } finally {
      setLoading(false);
    }
  }

  async function markStatus(dayDate, taskId, status) {
    if (!timetable) return;
    const { data } = await api.patch(
      `/timetable/${timetable._id}/day/${dayDate}/task/${taskId}`,
      { status }
    );
    setTimetable(data.timetable);

    if (status === "completed") {
      setCelebration({
        coinsAwarded: data.coinsAwarded,
        newBadges: data.newBadges,
        giftCoins: data.giftCoins,
      });
      setTimeout(() => setCelebration(null), 4000);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Time-table</h1>
          <p className="text-parchment/60">Weighted toward weak topics, packed into your free time.</p>
        </div>
        <button
          onClick={loadRevision}
          className="text-sm px-4 py-2 rounded-full border border-parchment/20 hover:bg-parchment/5"
        >
          ⭐ Revision list
        </button>
      </div>

      {celebration && (
        <div className="rounded-xl bg-moss/15 border border-moss/30 px-4 py-3 mb-4 text-sm">
          🎉 +{celebration.coinsAwarded} coins earned!
          {celebration.giftCoins > 0 && ` 🎁 Streak gift box: +${celebration.giftCoins} coins!`}
          {celebration.newBadges?.length > 0 &&
            ` 🏅 New badge: ${celebration.newBadges.map((b) => b.name).join(", ")}!`}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === m.id ? "bg-ember text-ink" : "bg-parchment/5 text-parchment/70 hover:bg-parchment/10"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Exam mode: full syllabus tree */}
      {mode === "exam" && (
        <div className="rounded-xl border border-parchment/10 p-4 mb-4 space-y-4 max-h-96 overflow-y-auto">
          {subjects.length === 0 && (
            <p className="text-sm text-parchment/50">Add subjects/chapters/topics in the Subjects tab first.</p>
          )}
          {subjects.map((subject) => {
            const sel = examSelection[subject._id] || { examDate: "", topicIds: new Set() };
            return (
              <div key={subject._id} className="border-b border-parchment/10 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <p className="font-medium text-parchment/90">{subject.name}</p>
                  <input
                    type="date"
                    value={sel.examDate}
                    onChange={(e) => setExamDate(subject._id, e.target.value)}
                    className="px-2 py-1 rounded bg-parchment/5 border border-parchment/15 text-xs"
                  />
                </div>
                {subject.chapters.map((chapter) => {
                  const allSelected = chapter.topics.every((t) => sel.topicIds.has(t._id));
                  return (
                    <div key={chapter._id} className="ml-3 mb-2">
                      <label className="flex items-center gap-2 text-sm text-parchment/80 mb-1">
                        <input
                          type="checkbox"
                          checked={allSelected && chapter.topics.length > 0}
                          onChange={() => toggleChapter(subject._id, chapter)}
                        />
                        {chapter.name} <span className="text-parchment/40">(whole chapter)</span>
                      </label>
                      <div className="ml-6 flex flex-wrap gap-3">
                        {chapter.topics.map((topic) => (
                          <label key={topic._id} className="flex items-center gap-1 text-xs text-parchment/60">
                            <input
                              type="checkbox"
                              checked={sel.topicIds.has(topic._id)}
                              onChange={() => toggleTopic(subject._id, topic._id)}
                              disabled={topic.completed}
                            />
                            {topic.name}
                            {topic.difficulty === "hard" && <span className="text-clay">●</span>}
                            {topic.completed && <span className="text-moss">✓</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <p className="text-xs text-parchment/50">
            ● marks topics you flagged "hard" in Subjects - these get scheduled earliest.
          </p>
        </div>
      )}

      {/* Weekend mode: shift picker */}
      {mode === "weekend" && (
        <div className="rounded-xl border border-parchment/10 p-4 mb-4">
          <p className="text-sm text-parchment/70 mb-2">Pick your free-time shifts for Sat/Sun:</p>
          <div className="space-y-2">
            {shifts.map((shift, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={shift.start}
                  onChange={(e) => updateShift(i, "start", e.target.value)}
                  className="input"
                />
                <span className="text-parchment/40">to</span>
                <input
                  type="time"
                  value={shift.end}
                  onChange={(e) => updateShift(i, "end", e.target.value)}
                  className="input"
                />
                {shifts.length > 1 && (
                  <button onClick={() => removeShift(i)} className="text-clay text-sm">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addShift}
            className="mt-2 text-sm px-3 py-1.5 rounded bg-parchment/10 hover:bg-parchment/15"
          >
            + Add another shift
          </button>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-5 py-2.5 rounded-full bg-ember text-ink font-semibold hover:bg-ember/90 disabled:opacity-60 mb-4"
      >
        {loading ? "Generating..." : "Generate / Regenerate"}
      </button>

      {error && <p className="text-clay text-sm mb-4">{error}</p>}
      {notice && <p className="text-moss text-sm mb-4">{notice}</p>}

      {!timetable?.days?.length && !error && (
        <p className="text-parchment/50">No timetable yet for this mode - click Generate.</p>
      )}

      <div className="space-y-4">
        {timetable?.days?.map((day) => (
          <div key={day.date} className="rounded-xl border border-parchment/10 p-4">
            <p className="font-medium text-parchment/90 mb-3">{day.date}</p>
            <div className="space-y-2">
              {day.tasks.map((task) => (
                <div
                  key={task._id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    task.status === "completed"
                      ? "bg-moss/10"
                      : task.status === "missed"
                      ? "bg-clay/10"
                      : "bg-parchment/5"
                  }`}
                >
                  <div>
                    <span className="text-parchment/50">
                      {task.startTime}–{task.endTime}
                    </span>{" "}
                    <span className="text-parchment/90">{task.topicName}</span>{" "}
                    <span className="text-parchment/50">
                      ({task.subjectName} · {task.chapterName}) · {task.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {task.status !== "completed" && (
                      <button
                        onClick={() => markStatus(day.date, task._id, "completed")}
                        className="text-xs px-2 py-1 rounded bg-moss/20 hover:bg-moss/30"
                      >
                        Complete
                      </button>
                    )}
                    {task.status === "pending" && (
                      <button
                        onClick={() => markStatus(day.date, task._id, "missed")}
                        className="text-xs px-2 py-1 rounded bg-clay/20 hover:bg-clay/30"
                      >
                        Missed
                      </button>
                    )}
                    {task.status === "completed" && <span className="text-xs text-moss">✓ Done</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showRevision && (
        <div className="fixed inset-0 bg-ink/80 flex items-center justify-center p-6 z-50">
          <div className="bg-ink border border-parchment/20 rounded-2xl max-w-md w-full max-h-[70vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Revision list</h2>
              <button onClick={() => setShowRevision(false)} className="text-parchment/60">
                ✕
              </button>
            </div>
            {revisionItems.length === 0 && (
              <p className="text-parchment/50 text-sm">
                Star a topic in the Subjects tab to save it here for later review.
              </p>
            )}
            <ul className="space-y-2">
              {revisionItems.map((item) => (
                <li key={item._id} className="text-sm px-3 py-2 rounded-lg bg-parchment/5">
                  <span className="text-parchment/90">{item.topicName}</span>{" "}
                  <span className="text-parchment/50">
                    ({item.subjectName} · {item.chapterName})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
