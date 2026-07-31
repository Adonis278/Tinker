/**
 * Client API for the study session: ingest material, generate a plan.
 *
 * Mirrors src/lib/tutor.js — the UI never calls fetch directly, so the
 * backend can move without touching a single component.
 */

import { MOCK_TUTOR } from "./env.js";

const BASE = import.meta.env.VITE_FUNCTIONS_BASE ?? "";
const url = (name) => `${BASE}/${name}`;

const SESSION_KEY = "tinker.session";

/* ------------------------------ session ---------------------------- */

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null;
  } catch {
    return null;
  }
}

export function saveSession(patch) {
  const next = { ...(getSession() ?? {}), ...patch };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ------------------------------ ingest ----------------------------- */

/** @returns {Promise<{ok, sourceId?, chunkCount?, embedModel?, message?}>} */
export async function ingestMaterial({ text, title }) {
  if (MOCK_TUTOR) {
    await wait(900);
    return { ok: true, sourceId: "mock-source", chunkCount: Math.max(3, Math.round(text.length / 450)), embedModel: "mock-embed" };
  }
  try {
    const res = await fetch(url("ingest"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, title }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: "network", message: String(err.message ?? err) };
  }
}

/* ------------------------------ course ----------------------------- */

/** @returns {Promise<{ok, courseTitle?, lessons?, sources?, grounded?, modelUsed?}>} */
export async function generateCourse({ topic, learner, sourceId }) {
  if (MOCK_TUTOR) {
    await wait(1400);
    return { ok: true, ...mockCourse(topic, learner), grounded: Boolean(sourceId), modelUsed: "mock", sources: [] };
  }
  try {
    const res = await fetch(url("course"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, learner, sourceId }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: "network", message: String(err.message ?? err) };
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function mockCourse(topic, learner) {
  const anchor = learner?.interests?.[0] ?? "cooking";
  const byAnchor = {
    cooking: "Like scaling a recipe — change one measure and every other measure has to move with it.",
    football: "Like reading a league table — the numbers only mean something next to each other.",
    music: "Like keeping a bar in time — every beat has to account for the same total.",
    farming: "Like planning rows in a field — the spacing decides what the whole yield becomes.",
  };
  return {
    courseTitle: topic.slice(0, 40),
    lessons: [
      { id: "gen-1", order: 1, title: "The core idea", summary: `What ${topic} actually means, stripped back.`, anchor: byAnchor[anchor] ?? byAnchor.cooking, check: "Say it back in your own words — what is this really about?", citations: [] },
      { id: "gen-2", order: 2, title: "How it behaves", summary: "The rules it follows and why they hold.", anchor: byAnchor[anchor] ?? byAnchor.cooking, check: "What would break if that rule stopped applying?", citations: [] },
      { id: "gen-3", order: 3, title: "Using it", summary: "Putting it to work on a real problem.", anchor: byAnchor[anchor] ?? byAnchor.cooking, check: "Where would you reach for this outside a classroom?", citations: [] },
    ],
  };
}
