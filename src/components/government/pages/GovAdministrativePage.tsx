import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Layers,
  Sprout,
  MapPinned,
} from "lucide-react";
import { getRegionLeaderboard } from "@/services/governmentApi";
import {
  KpiCard,
  Panel,
  DeltaPill,
  StatusBadge,
} from "@/components/government/gov-widgets";
import { GovBreadcrumb } from "./GovBreadcrumb";
import { regionBreadcrumbItems, regionHref } from "./governmentLeaderboard";
import { GovPageState } from "./GovPageState";
import { GovFarmerTable } from "./GovFarmerTable";
import { GovNdviStatus } from "./GovNdviStatus";
import { label } from "./governmentFormat";
export function GovAdministrativePage({
  regionId,
  rootRegionId,
  onBack,
  onRegionSelect,
  onFarmerSelect,
  season,
}: {
  regionId: string;
  season?: string;
  rootRegionId?: string;
  onBack?: () => void;
  onRegionSelect?: (id: string) => void;
  onFarmerSelect?: (id: string) => void;
}) {
  const query = useQuery({
    queryKey: season
      ? ["government", "leaderboard", regionId, "", season]
      : ["government", "leaderboard", regionId],
    queryFn: () => getRegionLeaderboard(regionId, { season }),
    refetchInterval: 60000,
  });
  if (query.isPending || query.error)
    return (
      <GovPageState
        loading={query.isPending}
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  const data = query.data,
    { region, snapshot, subRegions, farmers, cropBreakdown } = data;
  const level = label(region.level),
    child =
      (
        {
          COUNTRY: "Provinces",
          PROVINCE: "Districts",
          DISTRICT: "Sectors",
          SECTOR: "Cells",
          CELL: "Villages",
          VILLAGE: "Farmers",
        } as Record<string, string>
      )[region.level] ?? "Regions";
  const villageCount = subRegions.reduce(
    (sum, row) => sum + row.subRegionCount,
    0,
  );
  const rows = [
    [
      "Avg NDVI",
      snapshot.ndvi.current == null
        ? "No reading"
        : snapshot.ndvi.current.toFixed(2),
    ],
    ["Insurance penetration", `${snapshot.insurancePercent}%`],
    ["Active claims", snapshot.activeClaims],
    [
      "Dominant crop",
      snapshot.dominantCrop
        ? label(snapshot.dominantCrop.crop)
        : "No recorded crops",
    ],
  ];
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <GovBreadcrumb
          items={regionBreadcrumbItems(data, rootRegionId)}
          onNavigate={
            onRegionSelect
              ? (target) => target.id && onRegionSelect(target.id)
              : undefined
          }
        />
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {region.name}
          {region.name.toLowerCase().endsWith(level.toLowerCase())
            ? ""
            : ` ${level}`}
        </h1>
        <p className="text-gray-500">
          {level} overview —{" "}
          {region.level === "PROVINCE"
            ? "districts, sectors, farmers & crop mix"
            : region.level === "DISTRICT"
              ? "sectors, cells, farmers & crop mix"
              : region.level === "SECTOR"
                ? "cells, villages, farmers & crop mix"
                : region.level === "CELL"
                  ? "villages, farmers & crop mix"
                  : "farmers & crop mix"}
        </p>
      </div>
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${region.level === "VILLAGE" ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}
      >
        <KpiCard
          label="Registered Farmers"
          value={snapshot.totalFarmers.toLocaleString()}
          icon={Users}
        />
        <KpiCard
          label="Insured"
          value={`${snapshot.insurancePercent}%`}
          icon={ShieldCheck}
          accent="info"
        />
        {region.level !== "VILLAGE" && (
          <KpiCard
            label={region.level === "SECTOR" ? "Cells / Villages" : child}
            value={
              region.level === "SECTOR"
                ? `${subRegions.length} / ${villageCount}`
                : String(subRegions.length)
            }
            icon={Layers}
            accent="warning"
          />
        )}
        <KpiCard
          label="Cultivated"
          value={snapshot.totalCultivatedHa.toLocaleString()}
          unit="ha"
          icon={Sprout}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title={`${level} Snapshot`}
          className="xl:col-span-1"
          action={
            <GovNdviStatus
              regionId={regionId}
              metrics={snapshot.ndvi}
              compact
            />
          }
        >
          <dl className="space-y-3 text-sm">
            {rows.slice(0, 1).map(([name, value]) => (
              <SnapshotRow key={name} label={String(name)}>
                {value}
              </SnapshotRow>
            ))}
            <SnapshotRow label="7-day change">
              <DeltaPill value={snapshot.ndvi.change7d} />
            </SnapshotRow>
            <SnapshotRow label="30-day change">
              <DeltaPill value={snapshot.ndvi.change30d} />
            </SnapshotRow>
            {rows.slice(1).map(([name, value]) => (
              <SnapshotRow key={name} label={String(name)}>
                {value}
              </SnapshotRow>
            ))}
            <SnapshotRow label="Risk level">
              <StatusBadge status={snapshot.riskLevel.toLowerCase()} />
            </SnapshotRow>
          </dl>
        </Panel>
        <Panel
          title="Crop Mix"
          subtitle="Cultivated area by crop (ha)"
          className="xl:col-span-2"
        >
          <div className="space-y-4">
            {cropBreakdown.map((crop, index) => (
              <div key={crop.crop}>
                <div className="mb-1.5 flex justify-between gap-3 text-sm">
                  <span className="font-medium">{label(crop.crop)}</span>
                  <span className="font-mono text-gray-500">
                    {crop.totalHa.toLocaleString()} ha
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${["bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-teal-500"][index % 5]}`}
                    style={{
                      width: `${snapshot.totalCultivatedHa ? (crop.totalHa / snapshot.totalCultivatedHa) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!cropBreakdown.length && (
              <p className="py-10 text-center text-sm text-gray-500">
                No cultivated plots on record.
              </p>
            )}
          </div>
        </Panel>
      </div>
      {region.level !== "VILLAGE" && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <MapPinned className="h-5 w-5 text-primary" />
            {child}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {subRegions.map((row) => (
              <a
                key={row.regionId}
                href={regionHref(row.regionId)}
                onClick={(event) => {
                  if (
                    onRegionSelect &&
                    event.button === 0 &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    onRegionSelect(row.regionId);
                  }
                }}
                className="block min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{row.name}</h3>
                    <p className="text-xs text-gray-500">
                      {row.subRegionCount
                        ? `${row.subRegionCount} ${region.level === "PROVINCE" ? "sectors" : region.level === "DISTRICT" ? "cells" : "villages"} · `
                        : ""}
                      {row.farmerCount} farmers
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-primary">
                    {row.ndvi == null ? "—" : row.ndvi.toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.subRegions?.slice(0, 3).map((node) => (
                    <span
                      key={node.regionId}
                      className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {node.name} · {node.farmerCount}
                    </span>
                  ))}
                  {row.subRegionCount > 3 && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-gray-500">
                      +{row.subRegionCount - 3} more
                    </span>
                  )}
                </div>
                <div className="mt-3 flex justify-between gap-2 text-xs text-gray-500">
                  <span>{row.cultivatedHa.toLocaleString()} ha cultivated</span>
                  <span>{row.insuredPercent}% insured</span>
                </div>
              </a>
            ))}
          </div>
          {!subRegions.length && (
            <p className="py-5 text-sm text-gray-500">
              No {child.toLowerCase()} recorded.
            </p>
          )}
        </section>
      )}
      <GovFarmerTable
        regionId={regionId}
        farmers={farmers}
        onFarmerSelect={onFarmerSelect}
        locationFilter={
          region.level === "SECTOR"
            ? "cell"
            : region.level === "CELL"
              ? "village"
              : undefined
        }
      />
    </div>
  );
}
function SnapshotRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-mono font-medium">{children}</dd>
    </div>
  );
}
