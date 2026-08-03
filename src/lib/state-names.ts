// =============================================================================
// State Name Normalization
// =============================================================================
// The GeoJSON (geoBoundaries) and our static datasets don't always spell state
// names identically. This module provides a single canonical form so the
// choropleth color-join never silently fails.
//
// Verified against the actual geoBoundaries NGA ADM1 file (37 features):
//   - GeoJSON uses "Abuja Federal Capital Territory"
//   - Our datasets use "Federal Capital Territory"
//   - All 36 states match exactly.
//
// If you swap the GeoJSON source, re-verify names by running:
//   node -e "const fs=require('fs'); const g=JSON.parse(fs.readFileSync('./public/geo/nigeria-states.geojson','utf8')); console.log(g.features.map(f=>f.properties.shapeName).sort().join('\n'))"
// =============================================================================

/**
 * Maps GeoJSON shapeName → canonical dataset stateName.
 * Only entries that DIFFER need to be listed; everything else passes through.
 */
const GEOJSON_TO_CANONICAL: Record<string, string> = {
  "Abuja Federal Capital Territory": "Federal Capital Territory",
};

/**
 * Optional alias map for other known spelling variants, in case a different
 * data source is added later. Left extensible on purpose.
 */
const KNOWN_ALIASES: Record<string, string> = {
  Nassarawa: "Nasarawa",
  "Cross-River": "Cross River",
  "Akwa-Ibom": "Akwa Ibom",
  FCT: "Federal Capital Territory",
  "FCT Abuja": "Federal Capital Territory",
  Abuja: "Federal Capital Territory",
};

/**
 * Convert a raw GeoJSON shapeName into the canonical name used by our datasets.
 */
export function canonicalStateName(rawName: string): string {
  const trimmed = rawName.trim();
  if (GEOJSON_TO_CANONICAL[trimmed]) return GEOJSON_TO_CANONICAL[trimmed];
  if (KNOWN_ALIASES[trimmed]) return KNOWN_ALIASES[trimmed];
  return trimmed;
}

/**
 * Build a lookup Map from a StateDataset's states array, keyed by canonical
 * name, for O(1) joins during rendering.
 */
export function buildStateValueMap(
  states: { stateName: string; value: number | null }[]
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const s of states) {
    map.set(canonicalStateName(s.stateName), s.value);
  }
  return map;
}