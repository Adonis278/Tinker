/**
 * OWNER: P2 (logic) / P4 (deploy).
 * Firebase Cloud Functions v2 adapters around the platform-agnostic core.
 *
 * Local run:  firebase emulators:start --only functions
 * Deploy:     firebase deploy --only functions
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { handleTutorRequest, handleIngestRequest, handleCourseRequest } from "./tutor-core.js";

const NVIDIA_API_KEY = defineSecret("NVIDIA_API_KEY");
const GOOGLE_TRANSLATE_API_KEY = defineSecret("GOOGLE_TRANSLATE_API_KEY");

if (!getApps().length) initializeApp();
const db = getFirestore();

const opts = {
  cors: true,
  secrets: [NVIDIA_API_KEY, GOOGLE_TRANSLATE_API_KEY],
  timeoutSeconds: 120,
  memory: "512MiB",
};

const env = () => ({
  NVIDIA_API_KEY: NVIDIA_API_KEY.value(),
  GOOGLE_TRANSLATE_API_KEY: GOOGLE_TRANSLATE_API_KEY.value(),
});

/* ---------------- Firestore-backed vector storage ----------------- */
/*
 * One doc per chunk. A 2048-dim vector is ~30 kB serialised, so packing a
 * whole source into a single document would run at the 1 MB limit around
 * 30 chunks — a subcollection has no such ceiling.
 */

async function saveChunks(chunks, meta) {
  const sourceRef = db.collection("sources").doc();
  await sourceRef.set({ ...meta, chunkCount: chunks.length, createdAt: FieldValue.serverTimestamp() });

  // 500 writes per batch is the Firestore limit; chunk the chunking.
  for (let i = 0; i < chunks.length; i += 400) {
    const batch = db.batch();
    for (const c of chunks.slice(i, i + 400)) {
      batch.set(sourceRef.collection("chunks").doc(c.id), { text: c.text, embedding: c.embedding });
    }
    await batch.commit();
  }
  return sourceRef.id;
}

async function loadChunks(sourceId) {
  const snap = await db.collection("sources").doc(sourceId).collection("chunks").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

const deps = { saveChunks, loadChunks };

/* ------------------------------ routes ---------------------------- */

function post(handler) {
  return onRequest(opts, async (req, res) => {
    if (req.method === "OPTIONS") return void res.status(204).send("");
    if (req.method !== "POST") return void res.status(405).json({ error: "POST only" });
    res.status(200).json(await handler(req.body, env(), deps));
  });
}

export const tutor = post(handleTutorRequest);
export const ingest = post(handleIngestRequest);
export const course = post(handleCourseRequest);
