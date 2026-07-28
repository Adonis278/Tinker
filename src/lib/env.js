/**
 * OWNER: P4 (Platform).
 *
 * Mock switches, split so each workstream can go live independently.
 *
 *   VITE_USE_MOCKS   master default for everything
 *   VITE_MOCK_STORE  override just the storage layer  (P4)
 *   VITE_MOCK_TUTOR  override just the AI tutor       (P2)
 *
 * Why split: P4 can put real Firebase behind the app while P2's endpoint is
 * still mocked, and vice versa. Neither of us has to wait for the other to
 * finish before we can test against something real.
 *
 * Unset means "inherit the master flag", which defaults to true — so a fresh
 * clone with no .env is fully mocked and runs with zero setup.
 */

function flag(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return String(value) !== "false";
}

export const USE_MOCKS = flag(import.meta.env.VITE_USE_MOCKS, true);
export const MOCK_STORE = flag(import.meta.env.VITE_MOCK_STORE, USE_MOCKS);
export const MOCK_TUTOR = flag(import.meta.env.VITE_MOCK_TUTOR, USE_MOCKS);
