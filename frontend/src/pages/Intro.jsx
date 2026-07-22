import { useNavigate } from "react-router-dom";

export default function Intro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Signature element: a focus ring, echoing the Pomodoro timer that anchors the whole app */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[3px] border-ember/20" />
      <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full border-[3px] border-moss/20" />

      <div className="relative flex flex-col items-center text-center max-w-xl">
        <div className="w-16 h-16 rounded-full border-2 border-ember mb-8 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-ember" />
        </div>

        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-tight">
          Your study buddy.
        </h1>
        <p className="mt-4 text-parchment/70 text-lg font-body">
          One place to plan, track, and actually finish your syllabus —
          built around how you study, not a generic timetable.
        </p>

        <button
          onClick={() => navigate("/auth")}
          className="mt-10 px-8 py-3 rounded-full bg-ember text-ink font-semibold
                     hover:bg-ember/90 transition-colors duration-150"
        >
          Start
        </button>
      </div>
    </div>
  );
}
