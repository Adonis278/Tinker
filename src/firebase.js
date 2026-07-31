/**
 * OWNER: P4 (Platform).
 *
 * Firebase init, anonymous auth, and the single analytics entry point.
 * Stays inert while the storage layer is mocked, so a fresh clone with no
 * .env still runs.
 *
 * Note on the web apiKey: Firebase web config is PUBLIC by design — it ships
 * in the browser bundle of every Firebase app and identifies the project, it
 * does not grant access. The real security boundary is firestore.rules.
 * Server-side secrets (NVIDIA, Translate) live in functions/.env and never here.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { MOCK_STORE } from "./lib/env.js";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const configured = Boolean(config.apiKey && config.projectId);
export const live = !MOCK_STORE && configured;

export let app = null;
export let auth = null;
export let db = null;
let analytics = null;

if (live) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  isSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(app);
    })
    .catch(() => {});
} else if (!MOCK_STORE && !configured) {
  console.warn("[firebase] VITE_MOCK_STORE is off but config is missing — staying on local storage.");
}

/**
 * Anonymous-first: a learner never hits a signup wall. Resolves with the user
 * (real or a stand-in when mocked) and never rejects — auth failing must not
 * take the app down.
 */
export async function ensureSignedIn() {
  if (!live) return { uid: "local-user" };
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn("[firebase] anonymous sign-in failed, continuing locally", err);
    return { uid: "local-user" };
  }
}

export function onUser(cb) {
  if (!live) return () => {};
  return onAuthStateChanged(auth, cb);
}

/**
 * Sign in with Google.
 *
 * If the learner is already here anonymously we LINK rather than replace, so
 * the progress they built before signing in survives — losing it at the moment
 * someone commits to an account is the worst possible time to lose it.
 */
export async function signInWithGoogle() {
  if (!live) return { ok: false, error: "auth-unavailable" };
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const current = auth.currentUser;
    if (current?.isAnonymous) {
      try {
        const cred = await linkWithPopup(current, provider);
        return { ok: true, user: cred.user, upgraded: true };
      } catch (err) {
        // Already-in-use means this Google account has its own history; sign
        // into that instead of stranding the learner.
        if (err?.code !== "auth/credential-already-in-use") throw err;
      }
    }
    const cred = await signInWithPopup(auth, provider);
    return { ok: true, user: cred.user, upgraded: false };
  } catch (err) {
    if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
      return { ok: false, error: "cancelled" };
    }
    console.warn("[firebase] Google sign-in failed", err);
    return { ok: false, error: err?.code ?? "unknown" };
  }
}

export async function signOut() {
  if (live) await fbSignOut(auth);
}

export function currentAccount() {
  if (!live || !auth.currentUser) return null;
  const u = auth.currentUser;
  return {
    uid: u.uid,
    isAnonymous: u.isAnonymous,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
  };
}

/**
 * Single analytics entry point — call this, never logEvent directly, so mock
 * mode stays silent and the event list stays greppable.
 *
 * Events: onboarding_complete · lesson_start · quiz_submit · tutor_message
 *         misconception_detected · anchor_used · lesson_complete
 */
export function track(event, params = {}) {
  if (!live || !analytics) {
    console.debug("[track]", event, params);
    return;
  }
  try {
    logEvent(analytics, event, params);
  } catch (err) {
    console.debug("[track] failed", event, err);
  }
}
