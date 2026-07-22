import { useState, useEffect } from "react";
import api from "../../api/axios";
import PomodoroTimer from "../../components/PomodoroTimer";

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    loadSubjects();
    loadRecentSessions();
  }, []);

  async function loadSubjects() {
    const { data } = await api.get("/subjects");
    setSubjects(data.subjects);
  }

  async function loadRecentSessions() {
    const { data } = await api.get("/sessions");
    setRecentSessions(data.sessions.slice(0, 5));
  }

  function handleTopicPick(e) {
    const [subjectId, chapterName, topicName] = e.target.value.split("|||");
    const subject = subjects.find((s) => s._id === subjectId);
    setSelectedTopic({ subjectId, subjectName: subject?.name, chapterName, topicName });
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Today</h1>
      <p className="text-parchment/60 mb-6">Pick a topic, then start your focus block.</p>

      <div className="max-w-xs">
        <select onChange={handleTopicPick} className="input" defaultValue="">
          <option value="" disabled>
            Choose a topic
          </option>
          {subjects.map((subject) =>
            subject.chapters.map((chapter) =>
              chapter.topics.map((topic) => (
                <option
                  key={topic._id}
                  value={`${subject._id}|||${chapter.name}|||${topic.name}`}
                >
                  {subject.name} — {chapter.name} — {topic.name}
                </option>
              ))
            )
          )}
        </select>
      </div>

      {subjects.length === 0 && (
        <p className="text-parchment/50 text-sm mt-2">
          No topics yet — add subjects and topics in the Subjects tab first.
        </p>
      )}

      <PomodoroTimer selectedTopic={selectedTopic} onSessionLogged={loadRecentSessions} />

      {recentSessions.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm text-parchment/50 uppercase tracking-wide mb-2">
            Recent sessions
          </h2>
          <ul className="space-y-1">
            {recentSessions.map((s) => (
              <li key={s._id} className="text-sm text-parchment/70">
                {s.type === "focus" ? "🎯" : "☕"} {s.durationMinutes} min
                {s.topicName ? ` — ${s.topicName}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
