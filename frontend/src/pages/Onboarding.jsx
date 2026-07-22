import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ENERGY_OPTIONS = [
  { value: "early_morning", label: "Early morning (5–8 AM)" },
  { value: "morning", label: "Morning (8–12 PM)" },
  { value: "afternoon", label: "Afternoon (12–5 PM)" },
  { value: "evening", label: "Evening (5–9 PM)" },
  { value: "night", label: "Night (9 PM–1 AM)" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    branch: "",
    collegeStart: "",
    collegeEnd: "",
    freeTimeStart: "",
    freeTimeEnd: "",
    mostEnergeticTime: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/user/onboarding", {
        name: form.name,
        branch: form.branch,
        collegeTime: { start: form.collegeStart, end: form.collegeEnd },
        dailyFreeTime: { start: form.freeTimeStart, end: form.freeTimeEnd },
        mostEnergeticTime: form.mostEnergeticTime,
      });
      setUser(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save your details. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="font-display text-3xl font-semibold">Let's personalize this</h2>
          <p className="text-parchment/60 mt-1">
            This decides when your hardest subjects get scheduled.
          </p>
        </div>

        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="input"
            placeholder="Krishna"
          />
        </Field>

        <Field label="Branch / course">
          <input
            required
            value={form.branch}
            onChange={(e) => update("branch", e.target.value)}
            className="input"
            placeholder="B.Tech CSE"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="College starts">
            <input
              type="time"
              required
              value={form.collegeStart}
              onChange={(e) => update("collegeStart", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="College ends">
            <input
              type="time"
              required
              value={form.collegeEnd}
              onChange={(e) => update("collegeEnd", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Free time from">
            <input
              type="time"
              required
              value={form.freeTimeStart}
              onChange={(e) => update("freeTimeStart", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Free time until">
            <input
              type="time"
              required
              value={form.freeTimeEnd}
              onChange={(e) => update("freeTimeEnd", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="When are you most focused?">
          <select
            required
            value={form.mostEnergeticTime}
            onChange={(e) => update("mostEnergeticTime", e.target.value)}
            className="input"
          >
            <option value="" disabled>
              Choose a time of day
            </option>
            {ENERGY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-ember text-ink font-semibold
                     hover:bg-ember/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Continue to dashboard"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-parchment/70 mb-1">{label}</label>
      {children}
    </div>
  );
}
