import { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Streaks() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month: 0-11
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await api.get("/streak");
    setData(data);
  }

  async function handleProtect() {
    setError("");
    try {
      await api.post("/streak/protect");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not protect streak.");
    }
  }

  async function setDisplayedBadge(badgeId) {
    await api.patch("/streak/badge", { badgeId });
    load();
  }

  const activeDateSet = useMemo(
    () => new Set((data?.activityDates || []).map((a) => a.date)),
    [data]
  );

  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr, active: activeDateSet.has(dateStr) });
    }
    return cells;
  }, [viewMonth, activeDateSet]);

  function changeMonth(delta) {
    setViewMonth((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      return { year, month };
    });
  }

  if (!data) return <p className="text-parchment/60">Loading...</p>;

  const earnedBadges = data.badgeCatalog.filter((b) => data.badges.includes(b.id));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Streaks</h1>

      {/* Hero streak card */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-clay/20 to-ember/10 border border-ember/20 mb-4">
        <p className="text-sm text-parchment/60">Current streak</p>
        <p className="font-display text-4xl font-semibold mt-1">
          🔥 {data.currentStreak} {data.currentStreak === 1 ? "day" : "days"}
        </p>
        <p className="text-sm text-parchment/60 mt-1">Keep it up - you're on fire!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-parchment/10 p-4">
          <p className="text-xs text-parchment/50">🏆 Longest streak</p>
          <p className="font-display text-2xl font-semibold mt-1">{data.longestStreak} days</p>
        </div>
        <div className="rounded-xl border border-parchment/10 p-4">
          <p className="text-xs text-parchment/50">📅 Total active days</p>
          <p className="font-display text-2xl font-semibold mt-1">{data.totalActiveDays} days</p>
        </div>
      </div>

      {/* Streak protector */}
      <div className="rounded-xl border border-parchment/10 p-4 mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-parchment/80 font-medium">🛡️ Protect your streak</p>
          <p className="text-xs text-parchment/50">
            Missed yesterday? Spend {data.streakProtectCost} coins to keep your streak alive.
          </p>
        </div>
        <button
          onClick={handleProtect}
          className="text-sm px-4 py-2 rounded-full bg-ember/20 text-ember hover:bg-ember/30"
        >
          Use protector ({data.coins} 🪙 available)
        </button>
      </div>
      {error && <p className="text-clay text-sm mb-4">{error}</p>}

      {/* Calendar */}
      <div className="rounded-xl border border-parchment/10 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeMonth(-1)} className="text-parchment/60 px-2">‹</button>
          <p className="font-medium">{MONTH_NAMES[viewMonth.month]} {viewMonth.year}</p>
          <button onClick={() => changeMonth(1)} className="text-parchment/60 px-2">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-parchment/50 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, i) =>
            cell ? (
              <div
                key={cell.dateStr}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                  cell.active ? "bg-ember/20" : "bg-parchment/5"
                }`}
                title={cell.dateStr}
              >
                {cell.active ? "🔥" : cell.day}
              </div>
            ) : (
              <div key={`empty-${i}`} />
            )
          )}
        </div>
      </div>

      {/* Badges */}
      <h2 className="font-display text-lg font-semibold mb-3">Badges</h2>
      <p className="text-sm text-parchment/60 mb-3">
        {earnedBadges.length}/{data.badgeCatalog.length} earned - pick one to show under your avatar.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data.badgeCatalog.map((badge) => {
          const earned = data.badges.includes(badge.id);
          const displayed = data.displayedBadge === badge.id;
          return (
            <button
              key={badge.id}
              onClick={() => earned && setDisplayedBadge(displayed ? null : badge.id)}
              disabled={!earned}
              className={`rounded-xl border p-3 text-left ${
                earned
                  ? displayed
                    ? "border-ember bg-ember/10"
                    : "border-parchment/15 hover:bg-parchment/5"
                  : "border-parchment/5 opacity-40"
              }`}
            >
              <p className="text-sm font-medium">{badge.name}</p>
              <p className="text-xs text-parchment/50">{badge.days} active days</p>
              {displayed && <p className="text-xs text-ember mt-1">Displayed</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
