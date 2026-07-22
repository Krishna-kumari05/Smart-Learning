import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function PomodoroTimer({ selectedTopic, onSessionLogged }) {
  const [mode, setMode] = useState("focus"); // "focus" | "break"
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function handleComplete() {
    clearInterval(intervalRef.current);
    setRunning(false);

    try {
      await api.post("/sessions", {
        subjectId: selectedTopic?.subjectId,
        subjectName: selectedTopic?.subjectName || "",
        chapterName: selectedTopic?.chapterName || "",
        topicName: selectedTopic?.topicName || "",
        type: mode,
        durationMinutes: mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES,
      });
      onSessionLogged?.();
    } catch (err) {
      console.error("Could not log session", err);
    }

    // Auto-switch mode and reset the clock
    const nextMode = mode === "focus" ? "break" : "focus";
    setMode(nextMode);
    setSecondsLeft((nextMode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60);
  }

  function toggle() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft((mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60);
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const totalSeconds = (mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative w-56 h-56">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#F4EFE633" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={mode === "focus" ? "#E8A33D" : "#5C7A5C"}
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold">
            {minutes}:{seconds}
          </span>
          <span className="text-sm text-parchment/50 mt-1 uppercase tracking-wide">
            {mode === "focus" ? "Focus" : "Break"}
          </span>
        </div>
      </div>

      {selectedTopic?.topicName && (
        <p className="text-parchment/70 text-sm text-center">
          Studying: <span className="text-parchment">{selectedTopic.topicName}</span>
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={toggle}
          className="px-6 py-2.5 rounded-full bg-ember text-ink font-semibold hover:bg-ember/90 transition-colors"
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-full border border-parchment/20 text-parchment/70 hover:text-parchment transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
