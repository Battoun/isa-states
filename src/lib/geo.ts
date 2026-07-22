import type { StateRow } from "@/types/database";

export type Rarity = "commun" | "rare" | "tres_rare" | "legendaire";

export const RARITY_ORDER: Rarity[] = ["commun", "rare", "tres_rare", "legendaire"];

export const RARITY_LABEL: Record<Rarity, string> = {
  commun: "Commun",
  rare: "Rare",
  tres_rare: "Très rare",
  legendaire: "Légendaire",
};

export const RARITY_STYLE: Record<Rarity, string> = {
  commun: "bg-slate-700/50 text-slate-300",
  rare: "bg-sky-500/15 text-sky-400",
  tres_rare: "bg-purple-500/15 text-purple-400",
  legendaire: "bg-amber-500/15 text-amber-400",
};

export const RARITY_EMOJI: Record<Rarity, string> = {
  commun: "⚪",
  rare: "🔵",
  tres_rare: "🟣",
  legendaire: "🟡",
};

// Plate points scale with how hard a state is to spot on this leg of the trip.
export const PLATE_POINTS_BY_RARITY: Record<Rarity, number> = {
  commun: 30,
  rare: 40,
  tres_rare: 60,
  legendaire: 80,
};

// Approximate coordinates of each state capital, used only to rank states by
// distance from the current leg of the roadtrip (Las Vegas hub: CA/AZ/UT/NV).
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.37, lng: -86.3 },
  AK: { lat: 58.3, lng: -134.42 },
  AZ: { lat: 33.45, lng: -112.07 },
  AR: { lat: 34.75, lng: -92.29 },
  CA: { lat: 38.58, lng: -121.49 },
  CO: { lat: 39.74, lng: -104.99 },
  CT: { lat: 41.76, lng: -72.69 },
  DE: { lat: 39.16, lng: -75.52 },
  FL: { lat: 30.44, lng: -84.28 },
  GA: { lat: 33.75, lng: -84.39 },
  HI: { lat: 21.31, lng: -157.86 },
  ID: { lat: 43.62, lng: -116.2 },
  IL: { lat: 39.8, lng: -89.65 },
  IN: { lat: 39.77, lng: -86.16 },
  IA: { lat: 41.59, lng: -93.62 },
  KS: { lat: 39.05, lng: -95.68 },
  KY: { lat: 38.2, lng: -84.87 },
  LA: { lat: 30.45, lng: -91.19 },
  ME: { lat: 44.31, lng: -69.78 },
  MD: { lat: 38.98, lng: -76.49 },
  MA: { lat: 42.36, lng: -71.06 },
  MI: { lat: 42.73, lng: -84.56 },
  MN: { lat: 44.95, lng: -93.09 },
  MS: { lat: 32.3, lng: -90.18 },
  MO: { lat: 38.58, lng: -92.17 },
  MT: { lat: 46.59, lng: -112.04 },
  NE: { lat: 40.81, lng: -96.68 },
  NV: { lat: 39.16, lng: -119.77 },
  NH: { lat: 43.21, lng: -71.54 },
  NJ: { lat: 40.22, lng: -74.76 },
  NM: { lat: 35.69, lng: -105.94 },
  NY: { lat: 42.65, lng: -73.76 },
  NC: { lat: 35.78, lng: -78.64 },
  ND: { lat: 46.81, lng: -100.78 },
  OH: { lat: 39.96, lng: -83.0 },
  OK: { lat: 35.47, lng: -97.52 },
  OR: { lat: 44.94, lng: -123.04 },
  PA: { lat: 40.27, lng: -76.88 },
  RI: { lat: 41.82, lng: -71.41 },
  SC: { lat: 34.0, lng: -81.03 },
  SD: { lat: 44.37, lng: -100.35 },
  TN: { lat: 36.16, lng: -86.78 },
  TX: { lat: 30.27, lng: -97.74 },
  UT: { lat: 40.76, lng: -111.89 },
  VT: { lat: 44.26, lng: -72.58 },
  VA: { lat: 37.54, lng: -77.44 },
  WA: { lat: 47.04, lng: -122.9 },
  WV: { lat: 38.35, lng: -81.63 },
  WI: { lat: 43.07, lng: -89.4 },
  WY: { lat: 41.14, lng: -104.82 },
};

// Las Vegas, NV — central hub for the CA / AZ / UT / NV leg of the roadtrip.
const ROADTRIP_ORIGIN = { lat: 36.1699, lng: -115.1398 };

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface StateRarity {
  rarity: Rarity;
  distanceKm: number;
}

/**
 * Ranks states by great-circle distance from the roadtrip's current hub and
 * splits them into 4 rarity tiers. Hawaii and Alaska are forced to
 * "legendaire" regardless of straight-line distance since they're physically
 * disconnected from the driving route.
 */
export function computeRarityMap(
  states: StateRow[]
): Record<string, StateRarity> {
  const withDistance = states.map((s) => ({
    code: s.code,
    distanceKm: Math.round(haversineKm(ROADTRIP_ORIGIN, STATE_COORDS[s.code])),
  }));

  const sorted = [...withDistance].sort((a, b) => a.distanceKm - b.distanceKm);
  const quartile = Math.ceil(sorted.length / 4);

  const tierByCode = new Map<string, Rarity>();
  sorted.forEach((entry, index) => {
    const tier: Rarity =
      index < quartile
        ? "commun"
        : index < quartile * 2
          ? "rare"
          : index < quartile * 3
            ? "tres_rare"
            : "legendaire";
    tierByCode.set(entry.code, tier);
  });

  // Non-contiguous states: no one drives there, so they stay legendary
  // regardless of where the quartile split would otherwise put them.
  tierByCode.set("HI", "legendaire");
  tierByCode.set("AK", "legendaire");

  const result: Record<string, StateRarity> = {};
  for (const entry of withDistance) {
    result[entry.code] = {
      rarity: tierByCode.get(entry.code) ?? "commun",
      distanceKm: entry.distanceKm,
    };
  }
  return result;
}
