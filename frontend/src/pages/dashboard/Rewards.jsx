import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/Avatar";

export default function Rewards() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await api.get("/rewards");
    setData(data);
  }

  async function unlockAvatar(avatarId, cost) {
    setError("");
    try {
      await api.post("/rewards/unlock-avatar", { avatarId });
      await equipAvatar(avatarId);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not unlock avatar");
    }
  }

  async function equipAvatar(avatarId) {
    const { data: res } = await api.patch("/user/avatar", { avatarId });
    setUser((u) => ({ ...u, avatar: res.avatar }));
  }

  async function unlockTheme(themeId, cost) {
    setError("");
    try {
      await api.post("/rewards/unlock-theme", { themeId });
      await equipTheme(themeId);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not unlock theme");
    }
  }

  async function equipTheme(themeId) {
    const { data: res } = await api.patch("/user/theme", { themeId });
    setUser((u) => ({ ...u, activeTheme: res.activeTheme }));
  }

  if (!data) return <p className="text-parchment/60">Loading...</p>;

  const nextGiftAt = (Math.floor(data.currentStreak / 7) + 1) * 7;
  const daysToGift = nextGiftAt - data.currentStreak;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Rewards</h1>

      {/* Coins hero card */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-ember/20 to-ember/5 border border-ember/20 flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-parchment/60">Your coins</p>
          <p className="font-display text-4xl font-semibold text-ember mt-1">{data.coins}</p>
          <p className="text-sm text-parchment/50 mt-1">Keep completing tasks to earn more.</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-ember/20 flex items-center justify-center text-3xl">
          🪙
        </div>
      </div>

      {/* Streak + gift box */}
      <div className="rounded-2xl p-6 border border-parchment/10 flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-parchment/60">Streak</p>
          <p className="font-display text-2xl font-semibold mt-1">
            {data.currentStreak} days <span className="text-parchment/40 text-base">🔥</span>
          </p>
          <p className="text-sm text-parchment/50 mt-1">Best: {data.longestStreak} days</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-parchment/60">Next gift box</p>
          <p className="text-sm text-parchment/80 mt-1">
            {daysToGift} day{daysToGift !== 1 ? "s" : ""} to go 🎁
          </p>
        </div>
      </div>

      {error && <p className="text-clay text-sm mb-4">{error}</p>}

      {/* Avatar shop */}
      <h2 className="font-display text-lg font-semibold mb-3">Avatars</h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-8">
        {data.avatarCatalog.map((item) => {
          const unlocked = data.unlockedAvatars.includes(item.id);
          const equipped = data.avatar === item.id;
          return (
            <div key={item.id} className="flex flex-col items-center gap-2">
              <Avatar avatarId={item.id} name={user?.name} size="lg" />
              <p className="text-xs text-parchment/70 text-center">{item.name}</p>
              {equipped ? (
                <span className="text-xs text-moss">Equipped</span>
              ) : unlocked ? (
                <button
                  onClick={() => equipAvatar(item.id)}
                  className="text-xs px-2 py-1 rounded bg-parchment/10 hover:bg-parchment/15"
                >
                  Equip
                </button>
              ) : (
                <button
                  onClick={() => unlockAvatar(item.id, item.cost)}
                  className="text-xs px-2 py-1 rounded bg-ember/20 text-ember hover:bg-ember/30"
                >
                  {item.cost} 🪙
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Theme shop */}
      <h2 className="font-display text-lg font-semibold mb-3">Themes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {data.themeCatalog.map((item) => {
          const unlocked = data.unlockedThemes.includes(item.id);
          const equipped = data.activeTheme === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-parchment/10 p-4 flex flex-col items-center gap-2"
            >
              <div className={`w-full h-10 rounded-md theme-swatch-${item.id}`} />
              <p className="text-sm text-parchment/80">{item.name}</p>
              {equipped ? (
                <span className="text-xs text-moss">Active</span>
              ) : unlocked ? (
                <button
                  onClick={() => equipTheme(item.id)}
                  className="text-xs px-2 py-1 rounded bg-parchment/10 hover:bg-parchment/15 w-full"
                >
                  Apply
                </button>
              ) : (
                <button
                  onClick={() => unlockTheme(item.id, item.cost)}
                  className="text-xs px-2 py-1 rounded bg-ember/20 text-ember hover:bg-ember/30 w-full"
                >
                  {item.cost} 🪙
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <h2 className="font-display text-lg font-semibold mb-3">Recent rewards</h2>
      <div className="space-y-2">
        {data.recentEvents.map((event) => (
          <div
            key={event._id}
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-parchment/5 text-sm"
          >
            <span className="text-parchment/80">{event.description}</span>
            <span className={event.amount >= 0 ? "text-moss" : "text-clay"}>
              {event.amount >= 0 ? "+" : ""}
              {event.amount} 🪙
            </span>
          </div>
        ))}
        {data.recentEvents.length === 0 && (
          <p className="text-parchment/50 text-sm">No activity yet — complete a task to start earning.</p>
        )}
      </div>
    </div>
  );
}
