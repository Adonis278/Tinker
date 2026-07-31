import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Learn from "./pages/Learn.jsx";
import Study from "./pages/Study.jsx";
import Lesson from "./pages/Lesson.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getUser } from "./lib/store.js";
import { getSession } from "./lib/study.js";

/**
 * SHARED FILE — tell the group chat before you edit this.
 * Routing and the app frame only. Page content belongs in src/pages/.
 *
 * The landing page renders full-bleed with its own header; everything behind
 * onboarding renders inside the app shell, which is phone-width on mobile and
 * a comfortable reading column on desktop rather than a stretched one.
 */
export default function App() {
  const { pathname } = useLocation();
  const user = getUser();
  const session = getSession();

  const isLanding = pathname === "/" && !user;

  if (isLanding) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    );
  }

  const tabs = [
    {
      to: session ? "/study" : "/learn",
      label: "Learn",
      match: (p) => p.startsWith("/learn") || p.startsWith("/study"),
    },
    { to: "/lesson/algebra-01", label: "Algebra", match: (p) => p.startsWith("/lesson") },
    { to: "/dashboard", label: "Progress", match: (p) => p === "/dashboard" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur"
        style={{ borderColor: "rgb(var(--line))" }}
      >
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/" className="focus-ring flex items-center gap-2">
            <span
              aria-hidden="true"
              className="brand-gradient flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-black text-white"
            >
              T
            </span>
            <span className="text-[16px] font-bold tracking-tight" style={{ color: "rgb(var(--ink))" }}>
              Tinker
            </span>
          </Link>
          {user && (
            <nav className="flex gap-1">
              {tabs.map((t) => {
                const on = t.match(pathname);
                return (
                  <Link
                    key={t.label}
                    to={t.to}
                    className="focus-ring rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors"
                    style={
                      on
                        ? { background: "rgb(var(--accent) / 0.10)", color: "rgb(var(--accent-deep))" }
                        : { color: "rgb(var(--ink-soft))" }
                    }
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 bg-white">
        <Routes>
          <Route path="/" element={<Navigate to={session ? "/study" : "/learn"} replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/study" element={<Study />} />
          <Route path="/lesson/:lessonId" element={<Lesson />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
