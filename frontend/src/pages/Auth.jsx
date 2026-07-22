import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const { data } = await api.post(endpoint, { email, password });
      login(data.token, data.user);

      // New users go through onboarding; returning users go straight to the dashboard
      if (mode === "signup" || !data.user.onboardingComplete) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
  console.error("Axios Error:", err);

  if (err.response) {
    console.error("Response Data:", err.response.data);
    console.error("Status:", err.response.status);
  }

  setError(err.response?.data?.message || err.message);
}finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h2 className="font-display text-3xl font-semibold text-center mb-1">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-parchment/60 text-center mb-8">
          {mode === "signup"
            ? "Sign up once, log in as many times as you need."
            : "Log in to pick up where you left off."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-parchment/70 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-parchment/5 border border-parchment/15
                         focus:border-ember outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-parchment/70 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-parchment/5 border border-parchment/15
                         focus:border-ember outline-none"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-clay text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-ember text-ink font-semibold
                       hover:bg-ember/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Sign up" : "Log in"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="mt-6 text-sm text-parchment/60 hover:text-parchment w-full text-center"
        >
          {mode === "signup"
            ? "Already have an account? Log in"
            : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
