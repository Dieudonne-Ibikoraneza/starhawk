import type { GovBreadcrumbProps } from "./GovBreadcrumb";
import type { RegionLeaderboard } from "@/services/governmentApi";

type RegionRow = RegionLeaderboard["subRegions"][number];
export type RankingMode = "all" | "attention" | "performers";

export const farmerTableColumns = [
  ["name", "Farmer"],
  ["province", "Province"],
  ["district", "District"],
  ["sector", "Sector"],
  ["cell", "Cell"],
  ["village", "Village"],
  ["crops", "Crops"],
  ["farmCount", "Farms"],
  ["cultivatedHa", "Cultivated (ha)"],
  ["ndvi", "NDVI"],
  ["insured", "Insured"],
  ["activeClaims", "Open claims"],
  ["riskLevel", "Risk"],
  ["phone", "Phone"],
  ["email", "Email"],
] as const;

export function farmerTableCsv(rows: RegionLeaderboard["farmers"]) {
  return [
    farmerTableColumns.map(([, title]) => title),
    ...rows.map((farmer) =>
      farmerTableColumns.map(([key]) => {
        const value = farmer[key];
        if (Array.isArray(value)) return value.join(", ");
        if (typeof value === "boolean") return value ? "Yes" : "No";
        return value ?? null;
      }),
    ),
  ];
}

export function regionHref(regionId: string, farmerId?: string) {
  return `/government/leaderboard?region=${encodeURIComponent(regionId)}${farmerId ? `&farmer=${encodeURIComponent(farmerId)}` : ""}`;
}

export function filterRegionRows(
  regions: RegionRow[],
  options: {
    search: string;
    crop: string;
    ranking: RankingMode;
    sort: { key: keyof RegionRow; desc: boolean };
  },
) {
  const { search, crop, ranking, sort } = options;
  return regions
    .filter(
      (region) =>
        region.name.toLowerCase().includes(search.toLowerCase()) &&
        (crop === "all" || region.dominantCrop === crop) &&
        (ranking !== "attention" ||
          region.riskLevel === "HIGH" ||
          region.riskLevel === "MEDIUM") &&
        (ranking !== "performers" || region.riskLevel === "LOW"),
    )
    .sort((a, b) => {
      const av = a[sort.key],
        bv = b[sort.key];
      // Unavailable readings stay last in both ascending and descending rankings.
      if (av == null) return bv == null ? a.name.localeCompare(b.name) : 1;
      if (bv == null) return -1;
      const riskOrder: Record<string, number> = {
        UNKNOWN: 0,
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
      };
      const result =
        sort.key === "riskLevel"
          ? (riskOrder[String(av)] ?? 0) - (riskOrder[String(bv)] ?? 0)
          : typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
      return (sort.desc ? -result : result) || a.name.localeCompare(b.name);
    });
}

export function regionBreadcrumbItems(
  data: Pick<RegionLeaderboard, "region" | "ancestors">,
  rootRegionId?: string,
): GovBreadcrumbProps["items"] {
  const path = [...(data.ancestors ?? []), data.region];
  const rootIndex = path.findIndex(
    (region) => region.regionId === rootRegionId,
  );
  return path.slice(Math.max(0, rootIndex)).map((region) => ({
    level: (region.level.charAt(0) +
      region.level
        .slice(1)
        .toLowerCase()) as GovBreadcrumbProps["items"][number]["level"],
    id: region.regionId,
    name: region.name,
    href: regionHref(region.regionId),
  }));
}
