/**
 * OWNER: P3. Mock region data backing the dashboard's territorial stat.
 * Shape frozen in docs/ARCHITECTURE.md section 3: { name, masteryPct, learnerCount }.
 */

export const REGIONS = [
  { id: "lagos", name: "Lagos", masteryPct: 14, learnerCount: 2481 },
  { id: "nairobi", name: "Nairobi", masteryPct: 22, learnerCount: 1867 },
  { id: "harare", name: "Harare", masteryPct: 9, learnerCount: 743 },
  { id: "accra", name: "Accra", masteryPct: 18, learnerCount: 1204 },
  { id: "mumbai", name: "Mumbai", masteryPct: 27, learnerCount: 3392 },
  { id: "kampala", name: "Kampala", masteryPct: 12, learnerCount: 615 },
];

export function getRegionById(id) {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}
cat > src/data/regions.js << 'EOF'
/**
 * OWNER: P3. Mock region data backing the dashboard's territorial stat.
 * Shape frozen in docs/ARCHITECTURE.md section 3: { name, masteryPct, learnerCount }.
 */

export const REGIONS = [
  { id: "lagos", name: "Lagos", masteryPct: 14, learnerCount: 2481 },
  { id: "nairobi", name: "Nairobi", masteryPct: 22, learnerCount: 1867 },
  { id: "harare", name: "Harare", masteryPct: 9, learnerCount: 743 },
  { id: "accra", name: "Accra", masteryPct: 18, learnerCount: 1204 },
  { id: "mumbai", name: "Mumbai", masteryPct: 27, learnerCount: 3392 },
  { id: "kampala", name: "Kampala", masteryPct: 12, learnerCount: 615 },
];

export function getRegionById(id) {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}
