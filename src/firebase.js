/**
 * OWNER: P4 (Platform).
 *
 * Deliberately inert while VITE_USE_MOCKS=true so the app runs with zero setup.
 * P4 fills in .env, flips the flag, and wires store.js to these exports.
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export let app = null;
export let auth = null;
export let db = null;
let analytics = null;

if (!USE_MOCKS) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  isSupported().then((ok) => {
    if (ok) analytics = getAnalytics(app);
  });
}

/** Anonymous-first: never blocks the learner with a signup wall. */
export async function ensureSignedIn() {
  if (USE_MOCKS) return { uid: "mock-user" };
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/**
 * Single analytics entry point. Call this, not logEvent, so mock mode stays silent.
 * Events we care about: onboarding_complete, lesson_start, quiz_submit,
 * tutor_message, misconception_detected, anchor_used, lesson_complete.
 */
export function track(event, params = {}) {
  if (USE_MOCKS) {
    console.debug("[track]", event, params);
    return;
  }
  if (analytics) logEvent(analytics, event, params);
}
