import type { FarmerDetail } from "@/services/governmentApi";
import { date, label } from "./governmentFormat";
export interface FarmerPlanting {
  id: string;
  crop: string;
  season: string;
  plantedOn: string;
  expectedHarvest: string;
  areaHa: number;
  insured: boolean;
  status: string;
}
export interface FarmerPolicy {
  id: string;
  crop: string;
  insurer: string;
  sumInsured: number;
  premium: number;
  govShare: number | null;
  expiry: string;
  status: string;
}
export interface FarmerClaim {
  id: string;
  recordId: string;
  crop: string;
  cause: string;
  filed: string;
  areaLostHa: number | null;
  payout: number | null;
  insurer: string;
  status: string;
}
export interface FarmerAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  time: string;
}
export function farmerProfileView(data: FarmerDetail) {
  const { farmer, farms, policies, claims, totals } = data;
  const portfolio = new Map<string, number>();
  for (const farm of farms)
    portfolio.set(
      label(farm.cropType),
      (portfolio.get(label(farm.cropType)) ?? 0) + (farm.areaHa ?? 0),
    );
  const missing = "Not recorded";
  return {
    farmer: {
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone ?? "",
      registeredOn: farmer.registeredAt ? date(farmer.registeredAt) : missing,
      riskLevel: (farmer.riskLevel ?? "UNKNOWN").toLowerCase(),
    },
    sectorName: farmer.sector ?? missing,
    identity: {
      nationalId: farmer.nationalId ?? missing,
      cooperative: missing,
      province: farmer.province ?? missing,
      district: farmer.district ?? missing,
      sector: farmer.sector ?? missing,
      cell: farmer.cell ?? missing,
      village: farmer.village ?? missing,
    },
    portfolio: [...portfolio].map(([crop, areaHa]) => ({
      crop,
      areaHa: Math.round(areaHa * 100) / 100,
      share: totals.totalAreaHa
        ? Math.round((areaHa / totals.totalAreaHa) * 100)
        : 0,
    })),
    ndviSeries: (data.ndviSeries ?? []).map((point) => ({
      week: date(point.date),
      farmer: point.farmer,
      sectorAvg: point.sectorAvg,
    })),
    claimsHistory: claims.map((claim) => ({
      id: claim.id,
      recordId: claim.id,
      crop: label(claim.crop),
      cause: label(claim.cause),
      filed: date(claim.filedAt),
      areaLostHa: claim.areaLostHa ?? null,
      payout: claim.payoutAmount,
      insurer: claim.insurerName ?? missing,
      status: label(claim.status),
    })) satisfies FarmerClaim[],
    alerts: (data.alerts ?? []).map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      detail: alert.summary,
      time: alert.time ? date(alert.time) : missing,
    })) satisfies FarmerAlert[],
    plantings: farms.map((farm) => ({
      id: farm.id,
      crop: label(farm.cropType),
      season: farm.sowingDate
        ? `Season ${new Date(farm.sowingDate).getUTCMonth() < 6 ? "A" : "B"} ${new Date(farm.sowingDate).getUTCFullYear()}`
        : missing,
      plantedOn: date(farm.sowingDate),
      expectedHarvest: farm.expectedHarvestDate
        ? date(farm.expectedHarvestDate)
        : missing,
      areaHa: farm.areaHa ?? 0,
      insured: farm.insured === true,
      status: label(farm.status),
    })) satisfies FarmerPlanting[],
    policies: policies.map((policy) => ({
      id: policy.policyNumber,
      crop: label(policy.crop),
      insurer: policy.insurerName ?? missing,
      sumInsured: policy.coverageAmount ?? 0,
      premium: policy.premiumAmount,
      govShare: policy.govShare ?? null,
      expiry: date(policy.endDate),
      status: label(policy.status),
    })) satisfies FarmerPolicy[],
    totals: {
      plantings: totals.totalFarms,
      insuredPlantings: totals.insuredFarms,
      cultivatedAreaHa: totals.totalAreaHa,
      sumInsured:
        totals.totalSumInsured ??
        policies
          .filter((policy) => policy.status === "ACTIVE")
          .reduce((sum, policy) => sum + (policy.coverageAmount ?? 0), 0),
      totalPayout: totals.totalPayout,
      openClaims: totals.openClaims,
    },
  };
}
