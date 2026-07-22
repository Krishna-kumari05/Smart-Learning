import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import api from "../api/axios";

const TABS = [
  { to: "/dashboard", label: "Home", end: true },
  { to: "/dashboard/timetable", label: "Time-table" },
  { to: "/dashboard/streaks", label: "Streaks" },
  { to: "/dashboard/rewards", label: "Rewards" },
  { to: "/dashboard/progress", label: "Progress" },
  { to: "/dashboard/subjects", label: "Subjects" },
  { to: "/dashboard/practice", label: "Practice" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [badgeName, setBadgeName] = useState(null);

  useEffect(() => {
    api.get("/streak").then(({ data }) => {
      if (data.displayedBadge) {
        const badge = data.badgeCatalog.find((b) => b.id === data.displayedBadge);
        setBadgeName(badge?.name || null);
      } else {
        setBadgeName(null);
      }
    });
  }, []);

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-parchment/10 px-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto py-4">
          <button
            onClick={() => navigate("/dashboard/rewards")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            title="Change your avatar in Rewards"
          >
            <Avatar avatarId={user?.avatar} name={user?.name} size="lg" />
            <div className="text-left">
              <span className="font-display text-lg font-semibold block">
                {user?.name ? `Hi, ${user.name}` : "Study Buddy"}
              </span>
              {badgeName && <span className="text-xs text-ember">{badgeName}</span>}
            </div>
          </button>

          <button onClick={handleLogout} className="text-sm text-parchment/60 hover:text-parchment">
            Log out
          </button>
        </div>

        <nav className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-ember text-parchment"
                    : "border-transparent text-parchment/50 hover:text-parchment/80"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
