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
