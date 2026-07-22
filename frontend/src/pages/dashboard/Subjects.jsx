import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [chapterInputs, setChapterInputs] = useState({});
  const [topicInputs, setTopicInputs] = useState({});

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const { data } = await api.get("/subjects");
    setSubjects(data.subjects);
  }

  async function addSubject(e) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    await api.post("/subjects", { name: newSubjectName });
    setNewSubjectName("");
    loadSubjects();
  }

  async function updateExamDate(subjectId, examDate) {
    await api.patch(`/subjects/${subjectId}`, { examDate });
    loadSubjects();
  }

  async function addChapter(subjectId) {
    const name = chapterInputs[subjectId];
    if (!name?.trim()) return;
    await api.post(`/subjects/${subjectId}/chapters`, { name });
    setChapterInputs((prev) => ({ ...prev, [subjectId]: "" }));
    loadSubjects();
  }

  function updateTopicInput(chapterId, field, value) {
    setTopicInputs((prev) => ({ ...prev, [chapterId]: { ...prev[chapterId], [field]: value } }));
  }

  async function addTopic(subjectId, chapterId) {
    const input = topicInputs[chapterId] || {};
    if (!input.name?.trim()) return;
    await api.post(`/subjects/${subjectId}/chapters/${chapterId}/topics`, {
      name: input.name,
      difficulty: input.difficulty || "medium",
      deadline: input.deadline || null,
    });
    setTopicInputs((prev) => ({ ...prev, [chapterId]: { name: "", difficulty: "medium", deadline: "" } }));
    loadSubjects();
  }

  async function updateTopicField(subjectId, chapterId, topicId, field, value) {
    await api.patch(`/subjects/${subjectId}/chapters/${chapterId}/topics/${topicId}`, {
      [field]: value,
    });
    loadSubjects();
  }

  async function deleteSubject(subjectId) {
    await api.delete(`/subjects/${subjectId}`);
    loadSubjects();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Subjects</h1>
      <p className="text-parchment/60 mb-6">
        Star a topic (⭐) to save it in Time-table → Revision. Confidence drives scheduling;
        difficulty sets coins earned (easy 10 · medium 20 · hard 50); an exam date on the subject
        feeds exam-centered mode.
      </p>

      <form onSubmit={addSubject} className="flex gap-2 mb-8 max-w-md">
        <input
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="New subject, e.g. Data Structures"
          className="input"
        />
        <button className="px-5 py-3 rounded-lg bg-ember text-ink font-semibold whitespace-nowrap">
          Add
        </button>
      </form>

      <div className="space-y-6">
        {subjects.map((subject) => (
          <div key={subject._id} className="rounded-xl border border-parchment/10 p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-display text-xl font-semibold">{subject.name}</h2>
              <div className="flex items-center gap-3">
                <label className="text-xs text-parchment/50">Exam date:</label>
                <input
                  type="date"
                  value={subject.examDate ? subject.examDate.split("T")[0] : ""}
                  onChange={(e) => updateExamDate(subject._id, e.target.value)}
                  className="px-2 py-1 rounded bg-parchment/5 border border-parchment/15 text-xs"
                />
                <button onClick={() => deleteSubject(subject._id)} className="text-sm text-clay hover:underline">
                  Delete
                </button>
              </div>
            </div>

            {subject.chapters.map((chapter) => (
              <div key={chapter._id} className="ml-2 mb-4 pl-4 border-l border-parchment/10">
                <p className="font-medium text-parchment/90 mb-2">{chapter.name}</p>

                <ul className="space-y-2 mb-3">
                  {chapter.topics.map((topic) => (
                    <li key={topic._id} className="flex flex-wrap items-center gap-2 text-sm">
                      <button
                        onClick={() =>
                          updateTopicField(subject._id, chapter._id, topic._id, "starred", !topic.starred)
                        }
                        className={`text-base ${topic.starred ? "text-ember" : "text-parchment/25"}`}
                        title="Star for revision"
                      >
                        ★
                      </button>
                      <span
                        className={`flex-1 min-w-[100px] ${
                          topic.completed ? "text-parchment/40 line-through" : "text-parchment/70"
                        }`}
                      >
                        {topic.name}
                      </span>
                      {topic.completed && <span className="text-xs text-moss">Done</span>}
                      <select
                        value={topic.difficulty}
                        onChange={(e) =>
                          updateTopicField(subject._id, chapter._id, topic._id, "difficulty", e.target.value)
                        }
                        className="bg-parchment/5 border border-parchment/15 rounded px-2 py-1 text-xs"
                      >
                        <option value="easy">Easy · 10🪙</option>
                        <option value="medium">Medium · 20🪙</option>
                        <option value="hard">Hard · 50🪙</option>
                      </select>
                      <select
                        value={topic.confidenceScore}
                        onChange={(e) =>
                          updateTopicField(
                            subject._id,
                            chapter._id,
                            topic._id,
                            "confidenceScore",
                            Number(e.target.value)
                          )
                        }
                        className="bg-parchment/5 border border-parchment/15 rounded px-2 py-1 text-xs"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            Confidence {n}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  <input
                    value={topicInputs[chapter._id]?.name || ""}
                    onChange={(e) => updateTopicInput(chapter._id, "name", e.target.value)}
                    placeholder="New topic"
                    className="flex-1 min-w-[140px] px-3 py-1.5 rounded bg-parchment/5 border border-parchment/15 text-sm"
                  />
                  <select
                    value={topicInputs[chapter._id]?.difficulty || "medium"}
                    onChange={(e) => updateTopicInput(chapter._id, "difficulty", e.target.value)}
                    className="px-2 py-1.5 rounded bg-parchment/5 border border-parchment/15 text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button
                    onClick={() => addTopic(subject._id, chapter._id)}
                    className="px-3 py-1.5 rounded bg-parchment/10 text-sm hover:bg-parchment/15"
                  >
                    + Topic
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-2 mt-2">
              <input
                value={chapterInputs[subject._id] || ""}
                onChange={(e) => setChapterInputs((prev) => ({ ...prev, [subject._id]: e.target.value }))}
                placeholder="New chapter"
                className="flex-1 px-3 py-1.5 rounded bg-parchment/5 border border-parchment/15 text-sm"
              />
              <button
                onClick={() => addChapter(subject._id)}
                className="px-3 py-1.5 rounded bg-parchment/10 text-sm hover:bg-parchment/15"
              >
                + Chapter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
