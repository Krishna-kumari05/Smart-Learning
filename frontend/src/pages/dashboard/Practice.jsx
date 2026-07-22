import { useState, useEffect } from "react";
import api from "../../api/axios";

const OPTIONS = [
  { id: "youtube", label: "🎥 YouTube videos" },
  { id: "questions", label: "📝 Questions" },
];

export default function Practice() {
  const [option, setOption] = useState("youtube");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Practice</h1>
      <p className="text-parchment/60 mb-6">
        Find the best videos for a topic, or generate exam-style practice questions from your notes.
      </p>

      <div className="flex gap-2 mb-6">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOption(o.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              option === o.id ? "bg-ember text-ink" : "bg-parchment/5 text-parchment/70 hover:bg-parchment/10"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {option === "youtube" ? <YoutubePanel /> : <QuestionsPanel />}
    </div>
  );
}

// ---------------- YouTube panel ----------------

function YoutubePanel() {
  const [topic, setTopic] = useState("");
  const [videos, setVideos] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data } = await api.get("/practice/youtube");
    setHistory(data.queries);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/practice/youtube", { topic });
      setVideos(data.query.videos);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Could not fetch videos.");
    } finally {
      setLoading(false);
    }
  }

  async function openHistoryItem(id) {
    const { data } = await api.get(`/practice/youtube/${id}`);
    setTopic(data.query.topic);
    setVideos(data.query.videos);
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic, e.g. Binary Search Trees"
            className="input"
          />
          <button
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-ember text-ink font-semibold whitespace-nowrap disabled:opacity-60"
          >
            {loading ? "Searching..." : "Find videos"}
          </button>
        </form>

        {error && <p className="text-clay text-sm mb-4">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          {videos?.map((v) => (
            <a
              key={v.videoId}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-parchment/10 overflow-hidden hover:border-ember/40 transition-colors"
            >
              {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-full aspect-video object-cover" />}
              <div className="p-3">
                <p className="text-sm text-parchment/90 line-clamp-2">{v.title}</p>
                <p className="text-xs text-parchment/50 mt-1">{v.channelTitle}</p>
              </div>
            </a>
          ))}
        </div>

        {videos && videos.length === 0 && (
          <p className="text-parchment/50 text-sm">No videos found - try a different phrasing.</p>
        )}
      </div>

      <div>
        <h2 className="text-sm text-parchment/50 uppercase tracking-wide mb-3">Past topics</h2>
        <div className="space-y-1">
          {history.map((h) => (
            <button
              key={h._id}
              onClick={() => openHistoryItem(h._id)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm bg-parchment/5 hover:bg-parchment/10"
            >
              {h.topic}
            </button>
          ))}
          {history.length === 0 && <p className="text-parchment/40 text-sm">No searches yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------- Questions panel ----------------

function QuestionsPanel() {
  const [topicName, setTopicName] = useState("");
  const [pyqFile, setPyqFile] = useState(null);
  const [notesFile, setNotesFile] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [questions, setQuestions] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data } = await api.get("/practice/questions");
    setHistory(data.sets);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!topicName.trim()) return;
    if (!notesFile && !notesText.trim()) {
      setError("Upload notes as a PDF or paste them below.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("topicName", topicName);
      if (pyqFile) formData.append("pyqFile", pyqFile);
      if (notesFile) formData.append("notesFile", notesFile);
      if (notesText.trim()) formData.append("notesText", notesText);

      const { data } = await api.post("/practice/questions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setQuestions(data.practiceSet.questions);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate questions.");
    } finally {
      setLoading(false);
    }
  }

  async function openHistoryItem(id) {
    const { data } = await api.get(`/practice/questions/${id}`);
    setTopicName(data.practiceSet.topicName);
    setQuestions(data.practiceSet.questions);
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <form onSubmit={handleGenerate} className="space-y-3 mb-6">
          <input
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="Topic name, e.g. Thermodynamics"
            className="input"
          />

          <div>
            <label className="block text-sm text-parchment/70 mb-1">
              PYQ (previous year questions) PDF - optional, sets the question style
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPyqFile(e.target.files[0])}
              className="text-sm text-parchment/70"
            />
          </div>

          <div>
            <label className="block text-sm text-parchment/70 mb-1">Notes PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setNotesFile(e.target.files[0])}
              className="text-sm text-parchment/70"
            />
          </div>

          <div>
            <label className="block text-sm text-parchment/70 mb-1">
              ...or paste notes as text instead
            </label>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={4}
              className="input"
              placeholder="Paste your notes here if you don't have a PDF"
            />
          </div>

          {error && <p className="text-clay text-sm">{error}</p>}

          <button
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-ember text-ink font-semibold disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate questions"}
          </button>
        </form>

        {questions && (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-parchment/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide text-parchment/50">
                    {q.type} · {q.difficulty}
                  </span>
                </div>
                <p className="text-parchment/90 mb-2">{q.question}</p>
                {q.options?.length > 0 && (
                  <ul className="text-sm text-parchment/70 list-disc list-inside mb-2">
                    {q.options.map((opt, oi) => (
                      <li key={oi}>{opt}</li>
                    ))}
                  </ul>
                )}
                {q.answer && (
                  <p className="text-sm text-moss">
                    <span className="text-parchment/50">Answer: </span>
                    {q.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm text-parchment/50 uppercase tracking-wide mb-3">Past topics</h2>
        <div className="space-y-1">
          {history.map((h) => (
            <button
              key={h._id}
              onClick={() => openHistoryItem(h._id)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm bg-parchment/5 hover:bg-parchment/10"
            >
              {h.topicName}
            </button>
          ))}
          {history.length === 0 && <p className="text-parchment/40 text-sm">No question sets yet.</p>}
        </div>
      </div>
    </div>
  );
}
