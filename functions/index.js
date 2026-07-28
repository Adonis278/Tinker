/**
 * OWNER: P2 (logic) / P4 (deploy).
 * Firebase Cloud Functions v2 adapter around the platform-agnostic core.
 *
 * NOTE FOR P4: outbound calls to NVIDIA/Google need the Firebase BLAZE plan.
 * On the free Spark plan this function will fail with a network error.
 * See docs/ARCHITECTURE.md §7 for the Cloudflare Workers alternative.
 *
 * Local run:  firebase emulators:start --only functions
 * Deploy:     firebase deploy --only functions
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { handleTutorRequest } from "./tutor-core.js";

const NVIDIA_API_KEY = defineSecret("NVIDIA_API_KEY");
const GOOGLE_TRANSLATE_API_KEY = defineSecret("GOOGLE_TRANSLATE_API_KEY");

export const tutor = onRequest(
  // 120s is headroom, not a target: the chain abandons each model after 10s,
  // so a full 4-model walk plus a translate hop still lands well inside this.
  { cors: true, secrets: [NVIDIA_API_KEY, GOOGLE_TRANSLATE_API_KEY], timeoutSeconds: 120, memory: "256MiB" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }
    const result = await handleTutorRequest(req.body, {
      NVIDIA_API_KEY: NVIDIA_API_KEY.value(),
      GOOGLE_TRANSLATE_API_KEY: GOOGLE_TRANSLATE_API_KEY.value(),
    });
    res.status(200).json(result);
  }
);
