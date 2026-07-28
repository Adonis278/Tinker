/**
 * OWNER: P2.
 *
 * WHY THIS EXISTS: Llama/Qwen write acceptable Kiswahili and Hindi, but they are
 * weak on Yoruba and Shona and will produce confident nonsense. For those we let
 * the model reason in English (where it is strong) and translate the learner-facing
 * text with Google Translate (which genuinely supports them).
 *
 * Trade-off we accept: translation flattens some nuance. We surface this to the
 * client as `translated: true` rather than pretending it didn't happen.
 */

const ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

/** direct = model writes the language itself. pivot = write English, then translate. */
export const LANGUAGE_STRATEGY = {
  en: "direct",
  sw: "direct",
  hi: "direct",
  yo: "pivot",
  sn: "pivot",
};

export function strategyFor(code) {
  return LANGUAGE_STRATEGY[code] ?? "direct";
}

/** Language the MODEL should write in, given the learner's language. */
export function writeLanguageFor(code) {
  const names = { en: "English", sw: "Kiswahili", hi: "Hindi", yo: "Yoruba", sn: "Shona" };
  return strategyFor(code) === "pivot" ? "English" : (names[code] ?? "English");
}

/** Treat empty and the "unset" placeholder as "no key configured". */
function usable(apiKey) {
  return Boolean(apiKey) && apiKey !== "unset";
}

export async function translate(text, target, apiKey) {
  // No key yet? Return the English text untouched rather than failing the
  // learner. `translated: false` tells the UI not to claim a translation.
  if (!usable(apiKey)) return { text, translated: false };
  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target, format: "text" }),
    });
    if (!res.ok) return { text, translated: false };
    const json = await res.json();
    const out = json?.data?.translations?.[0]?.translatedText;
    return out ? { text: out, translated: true } : { text, translated: false };
  } catch {
    // Never fail the learner over a translation. Fall back to English.
    return { text, translated: false };
  }
}
