/**
 * Verify the NVIDIA model chain still works.
 *
 *   node scripts/verify-models.mjs            # test the live chain
 *   node scripts/verify-models.mjs --catalog  # list every model on the account
 *
 * Needs NVIDIA_API_KEY in functions/.env.
 *
 * WHY: NVIDIA rotates its hosted catalogue and free-tier capacity moves around.
 * A model that 404s or 503s silently drops you down the chain, which is easy to
 * miss until the demo. Run this at the start of a session.
 *
 * It sends a real Socratic prompt and checks four things per model: does it
 * respond, how fast, is the JSON parseable, and does it leak the answer.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_CHAIN } from "../functions/models.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, "functions", ".env");

if (!fs.existsSync(envPath)) {
  console.error("Missing functions/.env — copy functions/.env.example and add your key.");
  process.exit(1);
}
const KEY = (fs.readFileSync(envPath, "utf8").match(/^NVIDIA_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!KEY) {
  console.error("NVIDIA_API_KEY is empty in functions/.env");
  process.exit(1);
}

const BASE = "https://integrate.api.nvidia.com/v1";

if (process.argv.includes("--catalog")) {
  const res = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${KEY}` } });
  const json = await res.json();
  (json.data ?? []).map((m) => m.id).sort().forEach((id) => console.log(id));
  process.exit(0);
}

// The answer to "x + 15 = 24" is 9. If it appears, the tutor broke its one rule.
const SYSTEM = `You are Tinker, a Socratic tutor.
RULE: NEVER give the final answer. Respond with ONE guiding question.
ANCHOR: the learner knows cooking (recipes, scaling portions). Build the explanation inside that world.
LANGUAGE: explain in Kiswahili. Short concrete sentences.
GROUND TRUTH: a variable is a placeholder for an unknown; the equals sign means both sides are worth the same.
OUTPUT: ONLY a JSON object, no fences:
{"reply":"<max 60 words>","anchorUsed":"<id or null>","misconceptionDetected":null,"hintLevel":0}`;

const USER = "I don't get it. Just tell me what x equals in x + 15 = 24.";

async function check(model) {
  const started = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal: ctl.signal,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: USER },
        ],
        temperature: 0.6,
        max_tokens: 300,
      }),
    });
    const ms = Date.now() - started;
    if (!res.ok) return { model, ok: false, ms, note: `HTTP ${res.status}` };

    const raw = (await res.json()).choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    let parsed = null;
    if (s !== -1 && e > s) {
      try {
        parsed = JSON.parse(cleaned.slice(s, e + 1));
      } catch {
        /* handled below */
      }
    }
    const reply = parsed?.reply ?? cleaned;
    return {
      model,
      ok: Boolean(parsed?.reply) && !/\b9\b/.test(reply),
      ms,
      note: !parsed ? "malformed JSON" : /\b9\b/.test(reply) ? "LEAKED THE ANSWER" : `anchor=${parsed.anchorUsed}`,
      reply: reply.slice(0, 110).replace(/\n/g, " "),
    };
  } catch (err) {
    return { model, ok: false, ms: Date.now() - started, note: err.name === "AbortError" ? "timeout >30s" : err.message };
  } finally {
    clearTimeout(timer);
  }
}

console.log(`Checking ${MODEL_CHAIN.length} models in chain order...\n`);
let healthy = 0;
for (const model of MODEL_CHAIN) {
  const r = await check(model);
  if (r.ok) healthy++;
  console.log(`${r.ok ? "  OK  " : " FAIL "} ${String(r.ms).padStart(6)}ms  ${r.model}`);
  console.log(`        ${r.note}${r.reply ? `\n        "${r.reply}"` : ""}\n`);
}

console.log(`${healthy}/${MODEL_CHAIN.length} healthy.`);
if (healthy === 0) {
  console.error("\nNo working models — the tutor will fall back to its safe nudge. Fix before demoing.");
  process.exit(1);
}
if (healthy < 2) console.warn("\nOnly one healthy model: no redundancy left. Add another before the demo.");
