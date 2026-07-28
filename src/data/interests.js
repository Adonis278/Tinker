/**
 * OWNER: P3 (Content).
 * The "Your World" picker. P1 renders these; P2 injects the chosen ids into the prompt.
 * Keep ids lowercase and stable — they are stored on the user profile and used in prompts.
 */
export const INTEREST_DOMAINS = [
  { id: "cooking", label: "Cooking", emoji: "\u{1F373}" },
  { id: "football", label: "Football", emoji: "⚽" },
  { id: "music", label: "Music", emoji: "\u{1F3B5}" },
  { id: "fiction", label: "Stories & Books", emoji: "\u{1F4D6}" },
  { id: "farming", label: "Farming", emoji: "\u{1F33E}" },
  { id: "trading", label: "Business & Trading", emoji: "\u{1F4B0}" },
  { id: "gaming", label: "Gaming", emoji: "\u{1F3AE}" },
  { id: "fashion", label: "Fashion", emoji: "\u{1F457}" },
  { id: "cars", label: "Cars & Machines", emoji: "\u{1F697}" },
  { id: "faith", label: "Faith & Community", emoji: "\u{1F91D}" },
];

export const LANGUAGES = [
  { code: "en", label: "English", strategy: "direct" },
  { code: "sw", label: "Kiswahili", strategy: "direct" },
  { code: "hi", label: "हिन्दी (Hindi)", strategy: "direct" },
  { code: "yo", label: "Yorùbá", strategy: "pivot" },
  { code: "sn", label: "chiShona", strategy: "pivot" },
];

export const AGE_BANDS = ["12-16", "17-22", "23-28"];
