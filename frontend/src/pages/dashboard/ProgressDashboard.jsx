import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function ProgressDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/progress").then(({ data }) => setData(data));
  }, []);

  if (!data) return <p className="text-parchment/60">Loading...</p>;

  const { today, week, totals } = data;
  const todayPct = today.tasksTotal > 0 ? Math.round((today.tasksCompleted / today.tasksTotal) * 100) : 0;
  const maxWeekCount = Math.max(...week.map((w) => w.count), 1);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Progress</h1>

      {/* Overall ring + today's snapshot */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-parchment/10 p-6 flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F4EFE633" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#E8A33D" strokeWidth="10"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - todayPct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xl font-semibold">{todayPct}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-parchment/60">Today's progress</p>
            <p className="font-display text-lg font-semibold mt-1">
              {today.tasksCompleted}/{today.tasksTotal} tasks done
            </p>
            <p className="text-sm text-ember mt-1">+{today.pointsEarnedToday} points earned today</p>
          </div>
        </div>

        <div className="rounded-2xl border border-parchment/10 p-6 flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-parchment/60">🔥 Current streak</span>
            <span className="font-semibold">{totals.currentStreak} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-parchment/60">✅ Topics completed</span>
            <span className="font-semibold">{totals.topicsCompletedTotal}/{totals.topicsTotal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-parchment/60">🪙 Coins</span>
            <span className="font-semibold">{totals.coins}</span>
          </div>
        </div>
      </div>

      {/* Weekly histogram */}
      <div className="rounded-2xl border border-parchment/10 p-6">
        <p className="text-sm text-parchment/60 mb-4">Tasks completed - last 7 days</p>
        <div className="flex items-end justify-between gap-2 h-40">
          {week.map((w) => (
            <div key={w.date} className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-full rounded-t-md bg-ember/70"
                style={{ height: `${Math.max((w.count / maxWeekCount) * 100, w.count > 0 ? 8 : 2)}%` }}
                title={`${w.count} tasks`}
              />
              <span className="text-xs text-parchment/50">{w.label}</span>
              <span className="text-xs text-parchment/70">{w.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
