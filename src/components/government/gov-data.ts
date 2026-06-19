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
export const SUBSIDY_RATE = 0.4;
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
  areaLostHa: number;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  filed: string;
  insurer: string;
}

export const claims: ClaimRow[] = [
  { id: "CLM-2041", farmer: "J. Uwimana", region: "Kinyinya", crop: "Rice", cause: "Drought", value: 1850000, areaLostHa: 12.5, status: "Pending", filed: "2026-06-08", insurer: "Radiant Yacu" },
  { id: "CLM-2042", farmer: "E. Mukamana", region: "Bumbogo", crop: "Rice", cause: "Flood", value: 2400000, areaLostHa: 18.1, status: "Approved", filed: "2026-06-07", insurer: "Prime Insurance" },
  { id: "CLM-2043", farmer: "P. Habimana", region: "Ndera", crop: "Cassava", cause: "Pest", value: 720000, areaLostHa: 5.2, status: "Paid", filed: "2026-06-05", insurer: "Sanlam" },
  { id: "CLM-2044", farmer: "C. Niyonsaba", region: "Kinyinya", crop: "Rice", cause: "Drought", value: 1320000, areaLostHa: 9.7, status: "Pending", filed: "2026-06-09", insurer: "Radiant Yacu" },
  { id: "CLM-2045", farmer: "A. Ingabire", region: "Jabana", crop: "Beans", cause: "Hail", value: 540000, areaLostHa: 3.4, status: "Rejected", filed: "2026-06-04", insurer: "Prime Insurance" },
  { id: "CLM-2046", farmer: "D. Bizimana", region: "Bumbogo", crop: "Rice", cause: "Flood", value: 2810000, areaLostHa: 21.6, status: "Approved", filed: "2026-06-06", insurer: "Sanlam" },
  { id: "CLM-2047", farmer: "M. Uwase", region: "Remera", crop: "Maize", cause: "Drought", value: 980000, areaLostHa: 7.1, status: "Paid", filed: "2026-06-02", insurer: "Radiant Yacu" },
  { id: "CLM-2048", farmer: "S. Nkurunziza", region: "Nduba", crop: "Cassava", cause: "Pest", value: 610000, areaLostHa: 4.5, status: "Pending", filed: "2026-06-09", insurer: "Prime Insurance" },
];

// Disaster epicenters by cause — sized either by share of claims or share of damaged area.
export const claimCauses = [
  { cause: "Drought", count: 60, area: 1840, fill: "#f59e0b" }, // amber
  { cause: "Flood", count: 30, area: 2210, fill: "#0ea5e9" },   // sky
  { cause: "Pest", count: 7, area: 420, fill: "#10b981" },      // emerald
  { cause: "Hail", count: 3, area: 180, fill: "#8b5cf6" },      // violet
];

export const claimInsurers = ["All Insurers", "Radiant Yacu", "Prime Insurance", "Sanlam"] as const;
export const claimStatuses = ["All Statuses", "Pending", "Approved", "Paid", "Rejected"] as const;
export const claimCauseList = ["All Causes", "Drought", "Flood", "Pest", "Hail"] as const;

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
  status: "Paid" | "Pending" | "Overdue" | "Rejected";
  issued: string;
  dueDate?: string;
  totalPremium?: number;
  subsidyRate?: number;
  paymentMethod?: string;
  breakdown?: { category: string; farms: number; amount: number }[];
  pdfUrl?: string;
}

export const invoices: InvoiceRow[] = [
  { 
    id: "INV-2026-06", insurer: "Radiant Yacu", period: "Jun 2026", farmsCovered: 4120, subsidyAmount: 184000000, status: "Pending", issued: "2026-06-01", 
    dueDate: "2026-06-15", totalPremium: 460000000, subsidyRate: 0.4, paymentMethod: "Bank Transfer", 
    breakdown: [{ category: "Maize", farms: 2120, amount: 94000000 }, { category: "Rice", farms: 2000, amount: 90000000 }],
    pdfUrl: "/assets/invoice-mockup.png"
  },
  { 
    id: "INV-2026-05", insurer: "Prime Insurance", period: "May 2026", farmsCovered: 3380, subsidyAmount: 142500000, status: "Paid", issued: "2026-05-01",
    dueDate: "2026-05-15", totalPremium: 356250000, subsidyRate: 0.4, paymentMethod: "Central Bank Transfer",
    breakdown: [{ category: "Beans", farms: 1800, amount: 72500000 }, { category: "Vegetables", farms: 1580, amount: 70000000 }],
    pdfUrl: "/assets/invoice-mockup.png"
  },
  { 
    id: "INV-2026-05B", insurer: "Sanlam", period: "May 2026", farmsCovered: 2210, subsidyAmount: 96800000, status: "Paid", issued: "2026-05-01",
    dueDate: "2026-05-15", totalPremium: 242000000, subsidyRate: 0.4, paymentMethod: "Central Bank Transfer",
    breakdown: [{ category: "Cassava", farms: 2210, amount: 96800000 }],
    pdfUrl: "/assets/invoice-mockup.png"
  },
  { 
    id: "INV-2026-04", insurer: "Radiant Yacu", period: "Apr 2026", farmsCovered: 3990, subsidyAmount: 171200000, status: "Overdue", issued: "2026-04-01",
    dueDate: "2026-04-15", totalPremium: 428000000, subsidyRate: 0.4, paymentMethod: "Pending Resolution",
    breakdown: [{ category: "Maize", farms: 3990, amount: 171200000 }],
    pdfUrl: "/assets/invoice-mockup.png"
  },
  { 
    id: "INV-2026-04B", insurer: "Prime Insurance", period: "Apr 2026", farmsCovered: 3010, subsidyAmount: 128400000, status: "Paid", issued: "2026-04-01",
    dueDate: "2026-04-15", totalPremium: 321000000, subsidyRate: 0.4, paymentMethod: "Central Bank Transfer",
    breakdown: [{ category: "Rice", farms: 3010, amount: 128400000 }],
    pdfUrl: "/assets/invoice-mockup.png"
  },
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
  | "cultivated"
  | "farmers"
  | "policiesIssued"
  | "sumInsured"
  | "areaLost"
  | "compensationPaid";

export interface ConceptDef {
  key: ConceptKey;
  label: string;
  category: string;
  unit: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
}

export const concepts: ConceptDef[] = [
  { key: "ndvi",      label: "Crop Health (NDVI)",       category: "Agricultural", unit: "index",   higherIsBetter: true,  format: (v) => v.toFixed(2) },
  { key: "insurance", label: "Insurance Penetration",    category: "Financial",    unit: "%",       higherIsBetter: true,  format: (v) => `${Math.round(v)}%` },
  { key: "yield",     label: "Avg Yield",                category: "Agricultural", unit: "t/ha",    higherIsBetter: true,  format: (v) => `${v.toFixed(1)} t/ha` },
  { key: "claims",    label: "Active Claims",            category: "Financial",    unit: "claims",  higherIsBetter: false, format: (v) => `${Math.round(v)}` },
  { key: "subsidy",   label: "Subsidy Utilized",         category: "Financial",    unit: "M RWF",   higherIsBetter: true,  format: (v) => `${Math.round(v)}M` },
  { key: "cultivated",label: "Cultivated Area",          category: "General",      unit: "ha",      higherIsBetter: true,  format: (v) => `${Math.round(v).toLocaleString()} ha` },
  { key: "farmers",   label: "Registered Farmers",       category: "General",      unit: "farmers", higherIsBetter: true,  format: (v) => `${Math.round(v).toLocaleString()}` },
  { key: "policiesIssued",  label: "Active Policies",         category: "Financial",    unit: "policies", higherIsBetter: true,  format: (v) => `${Math.round(v).toLocaleString()}` },
  { key: "sumInsured",      label: "Total Sum Insured",       category: "Financial",    unit: "M RWF",    higherIsBetter: true,  format: (v) => `${Math.round(v)}M` },
  { key: "compensationPaid",label: "Compensation Paid",       category: "Financial",    unit: "M RWF",    higherIsBetter: false, format: (v) => `${Math.round(v)}M` },
  { key: "areaLost",        label: "Disaster Area Lost",      category: "Agricultural", unit: "ha",       higherIsBetter: false, format: (v) => `${Math.round(v).toLocaleString()} ha` },

];

export type ConceptValues = Record<ConceptKey, number>;

function pick<T>(arr: readonly T[] | T[], seed: string): T {
  return arr[Math.floor(hashSeed(seed) * arr.length)];
}

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
  const farmers = Math.round((500 + seed * 900) * scale);
  const policiesIssued = Math.round((300 + seed * 800) * scale * (1 + drift));
  const sumInsured = Math.round(policiesIssued * (1.2 + seed * 0.8));
  const areaLost = Math.round((15 + seed * 60) * (1 - drift * 2) * scale);
  const compensationPaid = Math.round(areaLost * (0.5 + seed * 0.3));


  return { ndvi, insurance, yield: yieldVal, claims, subsidy, cultivated, farmers, policiesIssued, sumInsured, areaLost, compensationPaid };
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
  villageId: string;
  cellId: string;
  phone: string;
  registeredOn: string;
  crops: string[];
  plotsHa: number;
  insured: boolean;
  ndvi: number;
  riskLevel: "low" | "medium" | "high";
}

export interface VillageNode {
  id: string;
  name: string;
  farmers: number;
  cultivatedHa: number;
}

export interface CellNode {
  id: string;
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
    const cellId = `${sectorId}-c${c}`;
    const cellName = CELL_NAMES[(seededInt(sectorId + "c" + c, 0, 1000) + c) % CELL_NAMES.length];
    const numVillages = seededInt(sectorId + cellName + "v", 2, 4);
    const villages: VillageNode[] = [];

    for (let v = 0; v < numVillages; v++) {
      const villageId = `${cellId}-v${v}`;
      const villageName = VILLAGE_NAMES[(seededInt(sectorId + cellName + v, 0, 1000) + v) % VILLAGE_NAMES.length];
      const vFarmers = seededInt(sectorId + cellName + villageName + "f", 4, 9);
      const vHa = seededInt(sectorId + cellName + villageName + "ha", 40, 180);
      villages.push({ id: villageId, name: villageName, farmers: vFarmers, cultivatedHa: vHa });

      for (let f = 0; f < vFarmers; f++) {
        const fseed = sectorId + cellName + villageName + f;
        const name = `${pickRandom(FIRST_NAMES, fseed + "fn")} ${pickRandom(SURNAMES, fseed + "sn")}`;
        const numCrops = seededInt(fseed + "nc", 1, 3);
        const cropSet = new Set<string>();
        for (let k = 0; k < numCrops; k++) cropSet.add(pickRandom(CROP_POOL, fseed + "crop" + k));
        const ndvi = +(0.5 + hashSeed(fseed + "ndvi") * 0.35).toFixed(2);

        const phone = `+250 7${seededInt(fseed + "ph0", 2, 9)}${seededInt(fseed + "ph1", 0, 9)} ${String(seededInt(fseed + "ph2", 100, 999))} ${String(seededInt(fseed + "ph3", 100, 999))}`;
        const regYear = seededInt(fseed + "ry", 2021, 2025);
        const regMonth = String(seededInt(fseed + "rm", 1, 12)).padStart(2, "0");
        const regDay = String(seededInt(fseed + "rd", 1, 28)).padStart(2, "0");

        farmers.push({
          phone,
          registeredOn: `${regYear}-${regMonth}-${regDay}`,
          cellId,
          villageId,
          id: `${sectorId}-F${farmers.length + 1}`,
          name,
          sectorId,
          cell: cellName,
          cellId,
          village: villageName,
          villageId,
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
      id: cellId,
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

export function getAllRegionsByLevel(level: "Sector" | "Cell" | "Village"): RegionRow[] {
  if (level === "Sector") return regions;

  const result: RegionRow[] = [];
  for (const sector of regions) {
    const detail = getSectorDetail(sector.id);
    if (!detail) continue;

    if (level === "Cell") {
      for (const c of detail.cells) {
        result.push({
          id: c.id,
          name: c.name,
          level: "Cell",
          cultivatedHa: c.cultivatedHa,
          dominantCrop: sector.dominantCrop,
          ndvi: c.ndvi,
          change7d: +(sector.change7d + (hashSeed(c.id + "7d") - 0.5) * 0.05).toFixed(2),
          change30d: +(sector.change30d + (hashSeed(c.id + "30d") - 0.5) * 0.05).toFixed(2),
          insurancePenetration: c.insurancePenetration,
          activeClaims: Math.floor(sector.activeClaims * (c.farmers / detail.stats.totalFarmers)),
          riskLevel: c.ndvi < 0.6 ? "high" : c.ndvi < 0.7 ? "medium" : "low",
        });
      }
    } else if (level === "Village") {
      for (const c of detail.cells) {
        for (const v of c.villages) {
          const vNdvi = +(c.ndvi + (hashSeed(v.id + "ndvi") - 0.5) * 0.08).toFixed(2);
          result.push({
            id: v.id,
            name: v.name,
            level: "Village",
            cultivatedHa: v.cultivatedHa,
            dominantCrop: sector.dominantCrop,
            ndvi: vNdvi,
            change7d: +(sector.change7d + (hashSeed(v.id + "7d") - 0.5) * 0.08).toFixed(2),
            change30d: +(sector.change30d + (hashSeed(v.id + "30d") - 0.5) * 0.08).toFixed(2),
            insurancePenetration: c.insurancePenetration,
            activeClaims: Math.floor(sector.activeClaims * (v.farmers / detail.stats.totalFarmers)),
            riskLevel: vNdvi < 0.6 ? "high" : vNdvi < 0.7 ? "medium" : "low",
          });
        }
      }
    }
  }
  return result;
}

export interface CellDetail {
  cell: RegionRow;
  villages: VillageNode[];
  farmers: Farmer[];
  stats: {
    totalFarmers: number;
    insuredFarmers: number;
    totalVillages: number;
    cropMix: { crop: string; ha: number }[];
  };
  sectorId: string;
  sectorName: string;
}

export function getCellDetail(cellId: string): CellDetail | null {
  const sectorId = cellId.split("-")[0];
  const sectorDetail = getSectorDetail(sectorId);
  if (!sectorDetail) return null;

  const cellNode = sectorDetail.cells.find(c => c.id === cellId);
  if (!cellNode) return null;

  const cellRow = getAllRegionsByLevel("Cell").find(c => c.id === cellId)!;
  const farmers = sectorDetail.farmers.filter(f => f.cell === cellNode.name);

  const cropMixMap = new Map<string, number>();
  for (const f of farmers) {
    const per = f.plotsHa / f.crops.length;
    for (const crop of f.crops) cropMixMap.set(crop, (cropMixMap.get(crop) ?? 0) + per);
  }
  const cropMix = [...cropMixMap.entries()]
    .map(([crop, ha]) => ({ crop, ha: Math.round(ha) }))
    .sort((a, b) => b.ha - a.ha);

  return {
    cell: cellRow,
    villages: cellNode.villages,
    farmers,
    stats: {
      totalFarmers: cellNode.farmers,
      insuredFarmers: farmers.filter(f => f.insured).length,
      totalVillages: cellNode.villages.length,
      cropMix,
    },
    sectorId,
    sectorName: sectorDetail.sector.name
  };
}

export interface VillageDetail {
  village: RegionRow;
  farmers: Farmer[];
  stats: {
    totalFarmers: number;
    insuredFarmers: number;
    cropMix: { crop: string; ha: number }[];
  };
  cellId: string;
  cellName: string;
  sectorId: string;
  sectorName: string;
}

export function getVillageDetail(villageId: string): VillageDetail | null {
  const parts = villageId.split("-");
  const sectorId = parts[0];
  const cellId = parts[0] + "-" + parts[1];
  
  const cellDetail = getCellDetail(cellId);
  if (!cellDetail) return null;

  const villageNode = cellDetail.villages.find(v => v.id === villageId);
  if (!villageNode) return null;

  const villageRow = getAllRegionsByLevel("Village").find(v => v.id === villageId)!;
  const farmers = cellDetail.farmers.filter(f => f.village === villageNode.name);

  const cropMixMap = new Map<string, number>();
  for (const f of farmers) {
    const per = f.plotsHa / f.crops.length;
    for (const crop of f.crops) cropMixMap.set(crop, (cropMixMap.get(crop) ?? 0) + per);
  }
  const cropMix = [...cropMixMap.entries()]
    .map(([crop, ha]) => ({ crop, ha: Math.round(ha) }))
    .sort((a, b) => b.ha - a.ha);

  return {
    village: villageRow,
    farmers,
    stats: {
      totalFarmers: villageNode.farmers,
      insuredFarmers: farmers.filter(f => f.insured).length,
      cropMix,
    },
    cellId,
    cellName: cellDetail.cell.name,
    sectorId,
    sectorName: cellDetail.sectorName,
  };
}

/** Flattened farmer index across all sectors — used for global name search. */
export const allFarmers: Farmer[] = regions.flatMap((r) => getSectorDetail(r.id)?.farmers ?? []);


// --------------------------------------------------------------------------
// FARMER PROFILE LAYER
// Deep, deterministic per-farmer detail: plantings (with planting dates,
// season, area & insurance status) and the insurance policies covering them.
// ──────────────────────────────────────────────────────────────────────────

export interface FarmerPlanting {
  id: string;
  crop: string;
  season: string;
  plantedOn: string;
  expectedHarvest: string;
  areaHa: number;
  insured: boolean;
  policyId?: string;
  status: "Growing" | "Harvested" | "Failed";
  expectedYieldT: number;
}

export interface FarmerPolicy {
  id: string;
  crop: string;
  insurer: string;
  sumInsured: number;
  premium: number;
  govShare: number;
  status: "Active" | "Expired";
  startDate: string;
  expiry: string;
}

export interface FarmerIdentity {
  nationalId: string;
  cooperative: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

export interface FarmerCropPortfolio {
  crop: string;
  areaHa: number;
  share: number; // % of cultivated area
}

export interface FarmerNdviPoint {
  week: string;
  farmer: number;
  sectorAvg: number;
}

export interface FarmerClaim {
  id: string;
  crop: string;
  cause: "Drought" | "Flood" | "Pest" | "Hail";
  filed: string;
  areaLostHa: number;
  payout: number;
  status: "Pending" | "Approved" | "Paid" | "Rejected";
  insurer: string;
}

export interface FarmerAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  time: string;
}

export interface FarmerProfile {
  farmer: Farmer;
  sectorName: string;
  identity: FarmerIdentity;
  portfolio: FarmerCropPortfolio[];
  ndviSeries: FarmerNdviPoint[];
  claimsHistory: FarmerClaim[];
  alerts: FarmerAlert[];
  plantings: FarmerPlanting[];
  policies: FarmerPolicy[];
  totals: {
    plantings: number;
    insuredPlantings: number;
    totalAreaHa: number;
    cultivatedAreaHa: number;
    sumInsured: number;
    totalPayout: number;
    openClaims: number;
  };
}

const PLANTING_SEASONS = ["Season A 2026", "Season B 2025", "Season A 2025"] as const;
const INSURERS = ["Radiant Yacu", "Prime Insurance", "Sanlam"] as const;
const COOPERATIVES = [
  "COAMV Twiyubake",
  "Abahuzamugambi Coop",
  "Imbaraga Farmers Coop",
  "Tuzamurane Coop",
  "Indatwa Agri Coop",
  "Dukundane Coop",
];
const CAUSES = ["Drought", "Flood", "Pest", "Hail"] as const;

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Looks up a single farmer by id across all sectors. */
export function getFarmer(farmerId: string): Farmer | null {
  return allFarmers.find((f) => f.id === farmerId) ?? null;
}

/** Builds a deterministic, share-ready profile for a single farmer. */
export function getFarmerProfile(farmerId: string): FarmerProfile | null {
  const farmer = getFarmer(farmerId);
  if (!farmer) return null;

  const plantings: FarmerPlanting[] = [];
  const policies: FarmerPolicy[] = [];

  farmer.crops.forEach((crop, ci) => {
    PLANTING_SEASONS.forEach((season, si) => {
      // Not every crop is planted every season.
      const pseed = `${farmer.id}${crop}${season}`;
      if (si > 0 && hashSeed(pseed + "skip") < 0.45) return;

      const seasonYear = season.slice(-4);
      const baseMonth = season.startsWith("Season A") ? 9 : 2; // A=Sept, B=Feb
      const month = String(baseMonth).padStart(2, "0");
      const day = String(seededInt(pseed + "day", 1, 26)).padStart(2, "0");
      const plantedOn = `${seasonYear}-${month}-${day}`;
      const growDays = seededInt(pseed + "grow", 95, 140);
      const expectedHarvest = addDays(plantedOn, growDays);
      const areaHa = +(0.3 + hashSeed(pseed + "area") * (farmer.plotsHa - 0.2)).toFixed(1);

      const insured = farmer.insured && hashSeed(pseed + "ins") < 0.7;
      const isCurrent = season === "Season A 2026";
      const status: FarmerPlanting["status"] = isCurrent
        ? "Growing"
        : hashSeed(pseed + "fail") < 0.12
          ? "Failed"
          : "Harvested";

      let policyId: string | undefined;
      if (insured) {
        policyId = `POL-${farmer.id.replace(/[^0-9]/g, "")}${ci}${si}`;
        const sumInsured = Math.round((600000 + hashSeed(pseed + "sum") * 2600000) / 1000) * 1000;
        const premium = Math.round((sumInsured * (0.06 + hashSeed(pseed + "prem") * 0.04)) / 100) * 100;
        policies.push({
          id: policyId,
          crop,
          insurer: pick([...INSURERS], pseed + "insurer"),
          sumInsured,
          premium,
          govShare: Math.round(premium * SUBSIDY_RATE),
          status: isCurrent ? "Active" : "Expired",
          startDate: plantedOn,
          expiry: addDays(plantedOn, 240),
        });
      }

      plantings.push({
        id: `${farmer.id}-P${plantings.length + 1}`,
        crop,
        season,
        plantedOn,
        expectedHarvest,
        areaHa,
        insured,
        policyId,
        status,
        expectedYieldT: +(areaHa * (2 + hashSeed(pseed + "yield") * 3)).toFixed(1),
      });
    });
  });

  plantings.sort((a, b) => (a.plantedOn < b.plantedOn ? 1 : -1));

  const sector = regions.find((r) => r.id === farmer.sectorId);
  const sectorName = sector?.name ?? farmer.sectorId;

  // Identity & location (all illustrative sectors sit in Gasabo, Kigali City).
  const identity: FarmerIdentity = {
    nationalId: `1 ${seededInt(farmer.id + "nid0", 1985, 2002)} 8 ${String(seededInt(farmer.id + "nid1", 1000000, 9999999))} ${seededInt(farmer.id + "nid2", 0, 9)} ${seededInt(farmer.id + "nid3", 10, 99)}`,
    cooperative: pick(COOPERATIVES, farmer.id + "coop"),
    province: "Kigali City",
    district: "Gasabo",
    sector: sectorName,
    cell: farmer.cell,
    village: farmer.village,
  };

  // Crop portfolio — total cultivated area split by crop (current plantings).
  const current = plantings.filter((p) => p.status === "Growing");
  const portfolioBase = current.length > 0 ? current : plantings;
  const portMap = new Map<string, number>();
  for (const p of portfolioBase) portMap.set(p.crop, (portMap.get(p.crop) ?? 0) + p.areaHa);
  const cultivatedAreaHa = +[...portMap.values()].reduce((s, v) => s + v, 0).toFixed(1);
  const portfolio: FarmerCropPortfolio[] = [...portMap.entries()]
    .map(([crop, areaHa]) => ({
      crop,
      areaHa: +areaHa.toFixed(1),
      share: cultivatedAreaHa === 0 ? 0 : Math.round((areaHa / cultivatedAreaHa) * 100),
    }))
    .sort((a, b) => b.areaHa - a.areaHa);

  // NDVI trajectory for this farmer's plots vs the sector average (12 weeks).
  const sectorNdvi = sector?.ndvi ?? 0.65;
  const ndviSeries: FarmerNdviPoint[] = Array.from({ length: 12 }, (_, i) => {
    const wseed = farmer.id + "w" + i;
    const wobble = (hashSeed(wseed) - 0.5) * 0.06;
    const trend = (i - 6) * 0.004 * (farmer.ndvi - 0.6) * 10;
    const farmerVal = Math.max(0.3, Math.min(0.92, farmer.ndvi + wobble + trend));
    const sectorVal = Math.max(0.3, Math.min(0.92, sectorNdvi + (hashSeed(wseed + "s") - 0.5) * 0.04 + (i - 6) * 0.002));
    return { week: `W${i + 1}`, farmer: +farmerVal.toFixed(3), sectorAvg: +sectorVal.toFixed(3) };
  });

  // Claims & payout history — failed plantings or weather-hit insured crops.
  const claimsHistory: FarmerClaim[] = [];
  plantings.forEach((p, idx) => {
    const cseed = farmer.id + p.id;
    const hasClaim = p.status === "Failed" || (p.insured && hashSeed(cseed + "claim") < 0.3);
    if (!hasClaim) return;
    const cause = pick([...CAUSES], cseed + "cause");
    const areaLostHa = +(p.areaHa * (0.3 + hashSeed(cseed + "loss") * 0.7)).toFixed(1);
    const roll = hashSeed(cseed + "status");
    const isCurrent = p.season === "Season A 2026";
    const status: FarmerClaim["status"] = isCurrent
      ? roll < 0.5
        ? "Pending"
        : "Approved"
      : roll < 0.7
        ? "Paid"
        : roll < 0.85
          ? "Approved"
          : "Rejected";
    const payout =
      status === "Rejected"
        ? 0
        : Math.round((areaLostHa * (220000 + hashSeed(cseed + "pay") * 180000)) / 1000) * 1000;
    claimsHistory.push({
      id: `CLM-${farmer.id.replace(/[^0-9]/g, "")}${idx}`,
      crop: p.crop,
      cause,
      filed: addDays(p.plantedOn, seededInt(cseed + "fd", 40, 120)),
      areaLostHa,
      payout,
      status,
      insurer: pick([...INSURERS], cseed + "ins"),
    });
  });
  claimsHistory.sort((a, b) => (a.filed < b.filed ? 1 : -1));

  // Targeted risk alerts for this farmer's location & crop health.
  const alerts: FarmerAlert[] = [];
  if (farmer.ndvi < 0.62) {
    alerts.push({
      id: farmer.id + "al1",
      severity: "critical",
      title: "Sharp NDVI decline detected",
      detail: `Crop health on your plots dropped below the drought-stress threshold in ${farmer.village} Village.`,
      time: "2 hrs ago",
    });
  }
  if ((sector?.change7d ?? 0) < -0.04) {
    alerts.push({
      id: farmer.id + "al2",
      severity: "warning",
      title: "Severe weather incoming",
      detail: `Heavy rainfall & flood risk forecast for ${sectorName} Sector over the next 72 hours.`,
      time: "5 hrs ago",
    });
  }
  if (!farmer.insured) {
    alerts.push({
      id: farmer.id + "al3",
      severity: "warning",
      title: "Plots are uninsured",
      detail: "Enroll before the season cut-off to qualify for the 40% government premium subsidy.",
      time: "Yesterday",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      id: farmer.id + "al0",
      severity: "info",
      title: "No active threats",
      detail: `Conditions in ${farmer.village} Village are stable. Crop health is tracking the sector average.`,
      time: "Today",
    });
  }

  const totalPayout = claimsHistory.filter((c) => c.status === "Paid").reduce((s, c) => s + c.payout, 0);
  const openClaims = claimsHistory.filter((c) => c.status === "Pending" || c.status === "Approved").length;

  return {
    farmer,
    sectorName,
    identity,
    portfolio,
    ndviSeries,
    claimsHistory,
    alerts,
    plantings,
    policies,
    totals: {
      plantings: plantings.length,
      insuredPlantings: plantings.filter((p) => p.insured).length,
      totalAreaHa: +plantings.reduce((s, p) => s + p.areaHa, 0).toFixed(1),
      cultivatedAreaHa,
      sumInsured: policies.reduce((s, p) => s + p.sumInsured, 0),
      totalPayout,
      openClaims,
    },
  };
}

