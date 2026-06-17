// Starhawk — Government Command Center mock data.
// All values are illustrative aggregates for a District Agriculture Officer
// overseeing Gasabo District (Kigali City). Currency: RWF.

export type Trend = "up" | "down" | "flat";

export interface RegionRow {
  id: string;
  name: string;
  level: "Sector" | "Cell";
  cultivatedHa: number;
  dominantCrop: string;
  ndvi: number; // 0-1 health index
  change7d: number; // NDVI delta over 7 days
  change30d: number;
  insurancePenetration: number; // %
  activeClaims: number;
  riskLevel: "low" | "medium" | "high";
}

export const regions: RegionRow[] = [
  { id: "r1", name: "Gisozi", level: "Sector", cultivatedHa: 1240, dominantCrop: "Maize", ndvi: 0.74, change7d: 0.03, change30d: 0.06, insurancePenetration: 68, activeClaims: 4, riskLevel: "low" },
  { id: "r2", name: "Kacyiru", level: "Sector", cultivatedHa: 980, dominantCrop: "Beans", ndvi: 0.71, change7d: 0.01, change30d: 0.02, insurancePenetration: 72, activeClaims: 6, riskLevel: "low" },
  { id: "r3", name: "Remera", level: "Sector", cultivatedHa: 1520, dominantCrop: "Maize", ndvi: 0.69, change7d: -0.02, change30d: 0.0, insurancePenetration: 64, activeClaims: 9, riskLevel: "medium" },
  { id: "r4", name: "Kinyinya", level: "Sector", cultivatedHa: 2110, dominantCrop: "Rice", ndvi: 0.58, change7d: -0.09, change30d: -0.14, insurancePenetration: 51, activeClaims: 23, riskLevel: "high" },
  { id: "r5", name: "Ndera", level: "Sector", cultivatedHa: 1780, dominantCrop: "Cassava", ndvi: 0.62, change7d: -0.06, change30d: -0.08, insurancePenetration: 47, activeClaims: 17, riskLevel: "high" },
  { id: "r6", name: "Rusororo", level: "Sector", cultivatedHa: 2440, dominantCrop: "Maize", ndvi: 0.76, change7d: 0.04, change30d: 0.07, insurancePenetration: 70, activeClaims: 5, riskLevel: "low" },
  { id: "r7", name: "Jabana", level: "Sector", cultivatedHa: 1330, dominantCrop: "Beans", ndvi: 0.66, change7d: -0.03, change30d: -0.04, insurancePenetration: 58, activeClaims: 11, riskLevel: "medium" },
  { id: "r8", name: "Gatsata", level: "Sector", cultivatedHa: 760, dominantCrop: "Vegetables", ndvi: 0.73, change7d: 0.02, change30d: 0.03, insurancePenetration: 61, activeClaims: 3, riskLevel: "low" },
  { id: "r9", name: "Bumbogo", level: "Sector", cultivatedHa: 1990, dominantCrop: "Rice", ndvi: 0.6, change7d: -0.07, change30d: -0.11, insurancePenetration: 44, activeClaims: 19, riskLevel: "high" },
  { id: "r10", name: "Nduba", level: "Sector", cultivatedHa: 1420, dominantCrop: "Cassava", ndvi: 0.7, change7d: 0.01, change30d: 0.02, insurancePenetration: 55, activeClaims: 7, riskLevel: "medium" },
];

export const crops = ["All Crops", "Maize", "Beans", "Rice", "Cassava", "Vegetables"] as const;
export const seasons = ["Season A 2026", "Season B 2025", "Season A 2025"] as const;

// NDVI trajectory — current season vs last year (12 weeks)
export const ndviTrend = Array.from({ length: 12 }, (_, i) => {
  const week = `W${i + 1}`;
  const base = 0.55 + Math.sin(i / 3) * 0.06 + i * 0.012;
  return {
    week,
    current: +(base).toFixed(3),
    lastYear: +(base - 0.04 - Math.cos(i / 4) * 0.02).toFixed(3),
  };
});

export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  region: string;
  time: string;
}

export const alerts: AlertItem[] = [
  { id: "a1", severity: "critical", title: "Drought alert — NDVI dropped 14% in 30 days", region: "Kinyinya Sector", time: "12 min ago" },
  { id: "a2", severity: "critical", title: "Spike in flood claims (19 new this week)", region: "Bumbogo Sector", time: "1 hr ago" },
  { id: "a3", severity: "warning", title: "Insurance penetration below 50% threshold", region: "Ndera Sector", time: "3 hrs ago" },
  { id: "a4", severity: "warning", title: "Pest outbreak risk flagged on maize plots", region: "Jabana Sector", time: "5 hrs ago" },
  { id: "a5", severity: "info", title: "Season A subsidy disbursement completed", region: "Gasabo District", time: "Yesterday" },
  { id: "a6", severity: "info", title: "New agronomist team deployed", region: "Remera Sector", time: "Yesterday" },
];

export interface ClaimRow {
  id: string;
  farmer: string;
  region: string;
  crop: string;
  cause: "Drought" | "Flood" | "Pest" | "Hail";
  value: number;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  filed: string;
  insurer: string;
}

export const claims: ClaimRow[] = [
  { id: "CLM-2041", farmer: "J. Uwimana", region: "Kinyinya", crop: "Rice", cause: "Drought", value: 1850000, status: "Pending", filed: "2026-06-08", insurer: "Radiant Yacu" },
  { id: "CLM-2042", farmer: "E. Mukamana", region: "Bumbogo", crop: "Rice", cause: "Flood", value: 2400000, status: "Approved", filed: "2026-06-07", insurer: "Prime Insurance" },
  { id: "CLM-2043", farmer: "P. Habimana", region: "Ndera", crop: "Cassava", cause: "Pest", value: 720000, status: "Paid", filed: "2026-06-05", insurer: "Sanlam" },
  { id: "CLM-2044", farmer: "C. Niyonsaba", region: "Kinyinya", crop: "Rice", cause: "Drought", value: 1320000, status: "Pending", filed: "2026-06-09", insurer: "Radiant Yacu" },
  { id: "CLM-2045", farmer: "A. Ingabire", region: "Jabana", crop: "Beans", cause: "Hail", value: 540000, status: "Rejected", filed: "2026-06-04", insurer: "Prime Insurance" },
  { id: "CLM-2046", farmer: "D. Bizimana", region: "Bumbogo", crop: "Rice", cause: "Flood", value: 2810000, status: "Approved", filed: "2026-06-06", insurer: "Sanlam" },
  { id: "CLM-2047", farmer: "M. Uwase", region: "Remera", crop: "Maize", cause: "Drought", value: 980000, status: "Paid", filed: "2026-06-02", insurer: "Radiant Yacu" },
  { id: "CLM-2048", farmer: "S. Nkurunziza", region: "Nduba", crop: "Cassava", cause: "Pest", value: 610000, status: "Pending", filed: "2026-06-09", insurer: "Prime Insurance" },
];

export const claimCauses = [
  { cause: "Drought", count: 60, fill: "var(--color-chart-3)" },
  { cause: "Flood", count: 30, fill: "var(--color-chart-2)" },
  { cause: "Pest", count: 7, fill: "var(--color-chart-1)" },
  { cause: "Hail", count: 3, fill: "var(--color-chart-5)" },
];

export interface PolicyRow {
  id: string;
  holder: string;
  region: string;
  crop: string;
  sumInsured: number;
  status: "Active" | "Expired";
  expiry: string;
  gender: "F" | "M";
}

export const policies: PolicyRow[] = [
  { id: "POL-8801", holder: "J. Uwimana", region: "Kinyinya", crop: "Rice", sumInsured: 3200000, status: "Active", expiry: "2026-12-31", gender: "F" },
  { id: "POL-8802", holder: "E. Mukamana", region: "Bumbogo", crop: "Rice", sumInsured: 2800000, status: "Active", expiry: "2026-12-31", gender: "F" },
  { id: "POL-8803", holder: "P. Habimana", region: "Ndera", crop: "Cassava", sumInsured: 1500000, status: "Active", expiry: "2026-11-30", gender: "M" },
  { id: "POL-8804", holder: "C. Niyonsaba", region: "Gisozi", crop: "Maize", sumInsured: 2100000, status: "Active", expiry: "2026-12-31", gender: "M" },
  { id: "POL-8805", holder: "A. Ingabire", region: "Jabana", crop: "Beans", sumInsured: 980000, status: "Expired", expiry: "2026-05-01", gender: "F" },
  { id: "POL-8806", holder: "D. Bizimana", region: "Rusororo", crop: "Maize", sumInsured: 2600000, status: "Active", expiry: "2026-12-31", gender: "M" },
  { id: "POL-8807", holder: "M. Uwase", region: "Remera", crop: "Maize", sumInsured: 1750000, status: "Active", expiry: "2026-10-15", gender: "F" },
  { id: "POL-8808", holder: "S. Nkurunziza", region: "Nduba", crop: "Cassava", sumInsured: 1340000, status: "Expired", expiry: "2026-04-20", gender: "M" },
];

export const policyAdoptionByGender = [
  { group: "Female", value: 54, fill: "var(--color-chart-1)" },
  { group: "Male", value: 46, fill: "var(--color-chart-2)" },
];

export const policyAdoptionByAge = [
  { group: "18-30", value: 18 },
  { group: "31-45", value: 41 },
  { group: "46-60", value: 28 },
  { group: "60+", value: 13 },
];

export interface InvoiceRow {
  id: string;
  insurer: string;
  period: string;
  farmsCovered: number;
  subsidyAmount: number;
  status: "Paid" | "Pending" | "Overdue";
  issued: string;
}

export const invoices: InvoiceRow[] = [
  { id: "INV-2026-06", insurer: "Radiant Yacu", period: "Jun 2026", farmsCovered: 4120, subsidyAmount: 184000000, status: "Pending", issued: "2026-06-01" },
  { id: "INV-2026-05", insurer: "Prime Insurance", period: "May 2026", farmsCovered: 3380, subsidyAmount: 142500000, status: "Paid", issued: "2026-05-01" },
  { id: "INV-2026-05B", insurer: "Sanlam", period: "May 2026", farmsCovered: 2210, subsidyAmount: 96800000, status: "Paid", issued: "2026-05-01" },
  { id: "INV-2026-04", insurer: "Radiant Yacu", period: "Apr 2026", farmsCovered: 3990, subsidyAmount: 171200000, status: "Overdue", issued: "2026-04-01" },
  { id: "INV-2026-04B", insurer: "Prime Insurance", period: "Apr 2026", farmsCovered: 3010, subsidyAmount: 128400000, status: "Paid", issued: "2026-04-01" },
];

export const subsidyByCrop = [
  { crop: "Maize", amount: 312 },
  { crop: "Rice", amount: 248 },
  { crop: "Beans", amount: 156 },
  { crop: "Cassava", amount: 98 },
  { crop: "Vegetables", amount: 64 },
];

export const subsidyBudget = { allocated: 1200, utilized: 878 }; // in millions RWF

export function rwf(value: number): string {
  return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(value);
}

export function rwfShort(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return `${value}`;
}

// ──────────────────────────────────────────────────────────────────────────
// SEASON COMPARISON LAYER
// ──────────────────────────────────────────────────────────────────────────

export interface RegionNode {
  id: string;
  name: string;
  districts?: { id: string; name: string }[];
}

export const provinceTree: RegionNode[] = [
  {
    id: "kigali",
    name: "Kigali City",
    districts: [
      { id: "gasabo", name: "Gasabo" },
      { id: "kicukiro", name: "Kicukiro" },
      { id: "nyarugenge", name: "Nyarugenge" },
    ],
  },
  {
    id: "eastern",
    name: "Eastern Province",
    districts: [
      { id: "nyagatare", name: "Nyagatare" },
      { id: "kayonza", name: "Kayonza" },
      { id: "bugesera", name: "Bugesera" },
      { id: "ngoma", name: "Ngoma" },
    ],
  },
  {
    id: "western",
    name: "Western Province",
    districts: [
      { id: "rubavu", name: "Rubavu" },
      { id: "rusizi", name: "Rusizi" },
      { id: "karongi", name: "Karongi" },
    ],
  },
  {
    id: "northern",
    name: "Northern Province",
    districts: [
      { id: "musanze", name: "Musanze" },
      { id: "gicumbi", name: "Gicumbi" },
      { id: "burera", name: "Burera" },
    ],
  },
  {
    id: "southern",
    name: "Southern Province",
    districts: [
      { id: "huye", name: "Huye" },
      { id: "muhanga", name: "Muhanga" },
      { id: "nyamagabe", name: "Nyamagabe" },
    ],
  },
];

export const compareSeasons = [
  "Season A 2026",
  "Season B 2025",
  "Season A 2025",
  "Season B 2024",
  "Season A 2024",
] as const;

export type CompareSeason = (typeof compareSeasons)[number];

export type ConceptKey =
  | "ndvi"
  | "insurance"
  | "yield"
  | "claims"
  | "subsidy"
  | "cultivated";

export interface ConceptDef {
  key: ConceptKey;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
}

export const concepts: ConceptDef[] = [
  { key: "ndvi",      label: "Crop Health (NDVI)",       unit: "index",   higherIsBetter: true,  format: (v) => v.toFixed(2) },
  { key: "insurance", label: "Insurance Penetration",    unit: "%",       higherIsBetter: true,  format: (v) => `${Math.round(v)}%` },
  { key: "yield",     label: "Avg Yield",                unit: "t/ha",    higherIsBetter: true,  format: (v) => `${v.toFixed(1)} t/ha` },
  { key: "claims",    label: "Active Claims",            unit: "claims",  higherIsBetter: false, format: (v) => `${Math.round(v)}` },
  { key: "subsidy",   label: "Subsidy Utilized",         unit: "M RWF",   higherIsBetter: true,  format: (v) => `${Math.round(v)}M` },
  { key: "cultivated",label: "Cultivated Area",          unit: "ha",      higherIsBetter: true,  format: (v) => `${Math.round(v).toLocaleString()} ha` },
];

export type ConceptValues = Record<ConceptKey, number>;

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const seasonDrift: Record<CompareSeason, number> = {
  "Season A 2026": 0.0,
  "Season B 2025": -0.04,
  "Season A 2025": -0.07,
  "Season B 2024": -0.11,
  "Season A 2024": -0.15,
};

export function getConceptValues(scopeId: string, season: CompareSeason): ConceptValues {
  const seed = hashSeed(scopeId);
  const drift = seasonDrift[season] ?? 0;
  const scale = scopeId === "national" ? 12 : provinceTree.some((p) => p.id === scopeId) ? 3 : 1;

  const ndvi = +(0.58 + seed * 0.18 + drift).toFixed(2);
  const insurance = Math.max(20, Math.round(40 + seed * 45 + drift * 120));
  const yieldVal = +(2.2 + seed * 2.6 + drift * 5).toFixed(1);
  const claims = Math.max(0, Math.round((40 + seed * 90) * (1 - drift * 2) * (scale / 3)));
  const subsidy = Math.round((90 + seed * 160) * scale * (1 + drift));
  const cultivated = Math.round((1200 + seed * 1800) * scale);

  return { ndvi, insurance, yield: yieldVal, claims, subsidy, cultivated };
}

export function scopeLabel(scopeId: string): string {
  if (scopeId === "national") return "All Rwanda";
  const prov = provinceTree.find((p) => p.id === scopeId);
  if (prov) return prov.name;
  for (const p of provinceTree) {
    const d = p.districts?.find((d) => d.id === scopeId);
    if (d) return `${d.name} District`;
  }
  return scopeId;
}

export function pctChange(a: number, b: number): number {
  if (a === 0) return b === 0 ? 0 : 100;
  return ((b - a) / Math.abs(a)) * 100;
}

// ──────────────────────────────────────────────────────────────────────────
// SECTOR DETAIL LAYER
// Drill down from a sector (leaderboard row) into its cells, villages, and
// individual farmers registered there — with illustrative descriptive stats.
// ──────────────────────────────────────────────────────────────────────────

export interface Farmer {
  id: string;
  name: string;
  sectorId: string;
  cell: string;
  village: string;
  crops: string[];
  plotsHa: number;
  insured: boolean;
  ndvi: number;
  riskLevel: "low" | "medium" | "high";
}

export interface VillageNode {
  name: string;
  farmers: number;
  cultivatedHa: number;
}

export interface CellNode {
  name: string;
  villages: VillageNode[];
  farmers: number;
  cultivatedHa: number;
  ndvi: number;
  insurancePenetration: number;
}

export interface SectorDetail {
  sector: RegionRow;
  cells: CellNode[];
  farmers: Farmer[];
  stats: {
    totalFarmers: number;
    insuredFarmers: number;
    totalCells: number;
    totalVillages: number;
    cropMix: { crop: string; ha: number }[];
  };
}

const FIRST_NAMES = ["J.", "E.", "P.", "C.", "A.", "D.", "M.", "S.", "T.", "B.", "F.", "G.", "L.", "R.", "V."];
const SURNAMES = [
  "Uwimana", "Mukamana", "Habimana", "Niyonsaba", "Ingabire", "Bizimana", "Uwase",
  "Nkurunziza", "Mukandayisenga", "Hakizimana", "Nshimiyimana", "Uwineza", "Munyaneza",
  "Iradukunda", "Tuyishime", "Mugisha", "Cyizere", "Byiringiro", "Gatete", "Umutoni",
];
const CELL_NAMES = ["Kabuye", "Nyabugogo", "Karama", "Gikondo", "Rwampara", "Kanombe", "Murama", "Bweramvura"];
const VILLAGE_NAMES = ["Akabuga", "Kanyinya", "Ruhango", "Gitega", "Nyakabanda", "Cyahafi", "Rebero", "Kimisagara"];
const CROP_POOL = ["Maize", "Beans", "Rice", "Cassava", "Vegetables", "Irish Potato", "Soybean"];

function seededInt(seed: string, min: number, max: number): number {
  return min + Math.floor(hashSeed(seed) * (max - min + 1));
}

function pickRandom<T>(arr: T[], seed: string): T {
  return arr[Math.floor(hashSeed(seed) * arr.length)];
}

/** Builds a deterministic detail tree for a given sector id. */
export function getSectorDetail(sectorId: string): SectorDetail | null {
  const sector = regions.find((r) => r.id === sectorId);
  if (!sector) return null;

  const numCells = seededInt(sectorId + "cells", 3, 5);
  const cells: CellNode[] = [];
  const farmers: Farmer[] = [];

  for (let c = 0; c < numCells; c++) {
    const cellName = CELL_NAMES[(seededInt(sectorId + "c" + c, 0, 1000) + c) % CELL_NAMES.length];
    const numVillages = seededInt(sectorId + cellName + "v", 2, 4);
    const villages: VillageNode[] = [];

    for (let v = 0; v < numVillages; v++) {
      const villageName = VILLAGE_NAMES[(seededInt(sectorId + cellName + v, 0, 1000) + v) % VILLAGE_NAMES.length];
      const vFarmers = seededInt(sectorId + cellName + villageName + "f", 4, 9);
      const vHa = seededInt(sectorId + cellName + villageName + "ha", 40, 180);
      villages.push({ name: villageName, farmers: vFarmers, cultivatedHa: vHa });

      for (let f = 0; f < vFarmers; f++) {
        const fseed = sectorId + cellName + villageName + f;
        const name = `${pickRandom(FIRST_NAMES, fseed + "fn")} ${pickRandom(SURNAMES, fseed + "sn")}`;
        const numCrops = seededInt(fseed + "nc", 1, 3);
        const cropSet = new Set<string>();
        for (let k = 0; k < numCrops; k++) cropSet.add(pickRandom(CROP_POOL, fseed + "crop" + k));
        const ndvi = +(0.5 + hashSeed(fseed + "ndvi") * 0.35).toFixed(2);
        farmers.push({
          id: `${sectorId}-F${farmers.length + 1}`,
          name,
          sectorId,
          cell: cellName,
          village: villageName,
          crops: [...cropSet],
          plotsHa: +(0.5 + hashSeed(fseed + "ha") * 4).toFixed(1),
          insured: hashSeed(fseed + "ins") < sector.insurancePenetration / 100,
          ndvi,
          riskLevel: ndvi < 0.6 ? "high" : ndvi < 0.7 ? "medium" : "low",
        });
      }
    }

    const cellFarmers = villages.reduce((s, v) => s + v.farmers, 0);
    const cellHa = villages.reduce((s, v) => s + v.cultivatedHa, 0);
    cells.push({
      name: cellName,
      villages,
      farmers: cellFarmers,
      cultivatedHa: cellHa,
      ndvi: +(sector.ndvi + (hashSeed(sectorId + cellName) - 0.5) * 0.12).toFixed(2),
      insurancePenetration: Math.max(
        20,
        Math.min(95, sector.insurancePenetration + seededInt(sectorId + cellName + "ins", -12, 12)),
      ),
    });
  }

  const cropMixMap = new Map<string, number>();
  for (const f of farmers) {
    const per = f.plotsHa / f.crops.length;
    for (const crop of f.crops) cropMixMap.set(crop, (cropMixMap.get(crop) ?? 0) + per);
  }
  const cropMix = [...cropMixMap.entries()]
    .map(([crop, ha]) => ({ crop, ha: Math.round(ha) }))
    .sort((a, b) => b.ha - a.ha);

  const villageCount = cells.reduce((s, c) => s + c.villages.length, 0);

  return {
    sector,
    cells,
    farmers,
    stats: {
      totalFarmers: farmers.length,
      insuredFarmers: farmers.filter((f) => f.insured).length,
      totalCells: cells.length,
      totalVillages: villageCount,
      cropMix,
    },
  };
}

/** Flattened farmer index across all sectors — used for global name search. */
export const allFarmers: Farmer[] = regions.flatMap((r) => getSectorDetail(r.id)?.farmers ?? []);

