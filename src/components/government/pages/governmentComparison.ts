import type { SeasonMetrics } from "@/services/governmentApi";
export type ConceptKey =
  | "cultivated"
  | "ndvi"
  | "yield"
  | "insurance"
  | "claims"
  | "subsidy";
export interface ConceptDef {
  key: ConceptKey;
  label: string;
  unit: string;
  category: "General" | "Agricultural" | "Financial";
  higherIsBetter: boolean;
  format: (value: number) => string;
}
export type ConceptValues = Record<ConceptKey, number | null>;
export const concepts: ConceptDef[] = [
  {
    key: "cultivated",
    label: "Cultivated Area",
    unit: "ha",
    category: "General",
    higherIsBetter: true,
    format: (v) =>
      `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`,
  },
  {
    key: "ndvi",
    label: "Crop Health (NDVI)",
    unit: "index",
    category: "Agricultural",
    higherIsBetter: true,
    format: (v) => v.toFixed(2),
  },
  {
    key: "yield",
    label: "Avg Yield",
    unit: "t/ha",
    category: "Agricultural",
    higherIsBetter: true,
    format: (v) => `${v.toFixed(1)} t/ha`,
  },
  {
    key: "insurance",
    label: "Insurance Penetration",
    unit: "%",
    category: "Financial",
    higherIsBetter: true,
    format: (v) => `${Math.round(v)}%`,
  },
  {
    key: "claims",
    label: "Active Claims",
    unit: "claims",
    category: "Financial",
    higherIsBetter: false,
    format: (v) => Math.round(v).toLocaleString(),
  },
  {
    key: "subsidy",
    label: "Subsidy Utilized",
    unit: "M RWF",
    category: "Financial",
    higherIsBetter: true,
    format: (v) => `${Number(v.toFixed(2)).toLocaleString()}M`,
  },
];
export function comparisonValues(value: SeasonMetrics): ConceptValues {
  return {
    cultivated: value.cultivatedHa ?? null,
    ndvi: value.ndvi.avg,
    yield: value.avgYield ?? null,
    insurance: value.insurancePenetration,
    claims: value.claims.active ?? null,
    subsidy: value.subsidyUtilized == null ? null : value.subsidyUtilized / 1e6,
  };
}
export function pctChange(base: number, value: number) {
  return !Number.isFinite(base) || !Number.isFinite(value) || base === 0
    ? null
    : ((value - base) / Math.abs(base)) * 100;
}
