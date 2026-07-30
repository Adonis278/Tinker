import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Onboarding from "./pages/Onboarding.jsx";
import Lesson from "./pages/Lesson.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getUser } from "./lib/store.js";

/**
 * SHARED FILE — tell the group chat before you edit this.
 * Routing only. Page content belongs in src/pages/.
 */
export default function App() {
  const user = getUser();
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-white shadow-sm">
      <header className="flex items-center justify-between border-b px-4">
        <Link to="/" className="flex min-h-[44px] items-center text-lg font-bold text-brand-navy">
          Tinker
        </Link>
        {user && (
          <nav className="flex gap-4 text-sm">
            <Link
              to="/lesson/algebra-01"
              className={`flex min-h-[44px] items-center ${
                pathname.startsWith("/lesson") ? "font-semibold text-brand-blue" : "text-slate-500"
              }`}
            >
              Learn
            </Link>
            <Link
              to="/dashboard"
              className={`flex min-h-[44px] items-center ${
                pathname === "/dashboard" ? "font-semibold text-brand-blue" : "text-slate-500"
              }`}
            >
              Progress
            </Link>
          </nav>
        )}
      </header>

      {/* flex column so a page using h-full + flex-1 (Onboarding) can actually
          stretch — a percentage height against an auto-height flex item
          collapses, which left Onboarding's footer floating mid-screen. */}
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/lesson/algebra-01" replace /> : <Onboarding />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/lesson/:lessonId" element={<Lesson />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
