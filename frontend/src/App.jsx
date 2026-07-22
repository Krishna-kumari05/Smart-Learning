import { Routes, Route } from "react-router-dom";

import Intro from "./pages/Intro";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/dashboard/Home";
import Timetable from "./pages/dashboard/Timetable";
import Streaks from "./pages/dashboard/Streaks";
import Rewards from "./pages/dashboard/Rewards";
import ProgressDashboard from "./pages/dashboard/ProgressDashboard";
import Subjects from "./pages/dashboard/Subjects";
import Practice from "./pages/dashboard/Practice";
import PrivateRoute from "./context/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <Onboarding />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="streaks" element={<Streaks />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="progress" element={<ProgressDashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="practice" element={<Practice />} />
      </Route>
    </Routes>
  );
}
