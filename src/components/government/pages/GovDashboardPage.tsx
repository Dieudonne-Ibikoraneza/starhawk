import { useState } from "react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  Sprout,
  Activity,
  Wallet,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { KpiCard, Panel } from "@/components/government/gov-widgets";
import { useQuery } from "@tanstack/react-query";
import {
  getRegionLeaderboard,
  getRegionAlerts,
  getRegionTrajectory,
  getSubsidyInvoices,
  type GovernmentAlert,
} from "@/services/governmentApi";
import { GovPageState } from "./GovPageState";
import { GovNdviStatus } from "./GovNdviStatus";
import { label, rwfShort, ndvi as formatNdvi, date } from "./governmentFormat";
import { ndviDeltaPercent } from "./governmentMonitoring";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const severityStyles: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-orange-500",
  info: "bg-blue-500",
};

const severityBorder: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/5",
  warning: "border-orange-500/30 bg-orange-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
};

interface HeatRegion {
  id: string;
  name: string;
  ndvi: number | null;
  dominantCrop: string;
  leastCrop: string;
  riskLevel: string;
  level: string;
}
function heatRisk(ndvi: number | null) {
  return ndvi === null
    ? "unknown"
    : ndvi < 0.5
      ? "high"
      : ndvi < 0.65
        ? "medium"
        : "low";
}
function HeatCell({ r, onClick }: { r: HeatRegion; onClick?: () => void }) {
  const color =
    r.riskLevel === "high"
      ? "bg-red-100 border-red-200 hover:bg-red-200"
      : r.riskLevel === "medium"
        ? "bg-orange-100 border-orange-200 hover:bg-orange-200"
        : r.riskLevel === "low"
          ? "bg-green-100 border-green-200 hover:bg-green-200"
          : "bg-gray-100 border-gray-200";
  const textColor =
    r.riskLevel === "high"
      ? "text-red-900"
      : r.riskLevel === "medium"
        ? "text-orange-900"
        : r.riskLevel === "low"
          ? "text-green-900"
          : "text-gray-700";
  return (
    <button
      onClick={onClick}
      className={`group/cell relative flex aspect-[4/3] flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${color}`}
    >
      <span className={`text-[11px] font-semibold ${textColor}`}>{r.name}</span>
      <div>
        <span className={`font-mono block text-lg font-bold ${textColor}`}>
          {r.ndvi == null ? "No reading" : r.ndvi.toFixed(2)}
        </span>
        <div className="mt-1 flex flex-col gap-0.5">
          <span className={`text-[10px] font-medium opacity-80 ${textColor}`}>
            Most: {r.dominantCrop}
          </span>
          <span className={`text-[10px] font-medium opacity-80 ${textColor}`}>
            Least: {r.leastCrop}
          </span>
        </div>
      </div>
    </button>
  );
}

export function GovDashboardPage({
  regionId,
  season,
  onSectorSelect,
  onFarmerSelect,
}: {
  regionId: string;
  season?: string;
  onSectorSelect?: (id: string, level?: string) => void;
  onFarmerSelect?: (id: string) => void;
}) {
  const [openAlert, setOpenAlert] = useState<GovernmentAlert | null>(null);
  const query = useQuery({
    queryKey: season
      ? ["government", "overview", regionId, season]
      : ["government", "overview", regionId],
    refetchInterval: 60000,
    queryFn: async () => {
      const [leaderboard, trajectory, alerts, billing] = await Promise.all([
        getRegionLeaderboard(regionId, { season }),
        getRegionTrajectory(regionId, season),
        getRegionAlerts(regionId),
        getSubsidyInvoices(regionId, season),
      ]);
      return { leaderboard, trajectory, alerts, billing };
    },
  });
  if (query.isPending || query.error)
    return (
      <GovPageState
        loading={query.isPending}
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  const { leaderboard, trajectory, billing } = query.data;
  const alerts = query.data.alerts ?? [];
  const detail = openAlert;
  const regions: HeatRegion[] = leaderboard.subRegions.map((row) => ({
    id: row.regionId,
    name: row.name,
    level: row.level,
    ndvi: row.ndvi,
    dominantCrop: row.dominantCrop ? label(row.dominantCrop) : "Not recorded",
    leastCrop: row.leastCrop ? label(row.leastCrop) : "Not recorded",
    riskLevel: heatRisk(row.ndvi),
  }));
  const ndviTrend = trajectory?.points ?? [];
  const flagged = regions.filter((row) => row.riskLevel === "high");
  const snapshot = leaderboard.snapshot;
  return (
    <div className="min-w-0 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Insured Farmers"
          value={(
            snapshot.insuredFarmers ??
            Math.round(
              (snapshot.insurancePercent * snapshot.totalFarmers) / 100,
            )
          ).toLocaleString()}
          icon={Users}
          accent="primary"
        />
        <KpiCard
          label="Cultivated Hectares"
          value={snapshot.totalCultivatedHa.toLocaleString()}
          unit="ha"
          icon={Sprout}
          accent="info"
        />
        <KpiCard
          label="Avg. Crop Health (NDVI)"
          value={formatNdvi(snapshot.ndvi.current)}
          delta={ndviDeltaPercent(snapshot.ndvi)}
          deltaLabel="vs 7 days earlier"
          icon={Activity}
          accent="warning"
        />
        <KpiCard
          label="Subsidy Utilized"
          value={rwfShort(billing?.subsidyUtilized ?? 0)}
          unit="RWF"
          icon={Wallet}
          accent="primary"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        {/* NDVI Trajectory Chart */}
        <Panel
          className="overflow-hidden xl:col-span-2"
          title="NDVI Trajectory"
          subtitle="Current season vs. same period last year"
          action={
            <GovNdviStatus
              regionId={regionId}
              metrics={snapshot.ndvi}
              compact
            />
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={ndviTrend}
                margin={{ left: -16, right: 8, top: 8 }}
              >
                <defs>
                  <linearGradient id="cur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    color: "#111827",
                    fontSize: 12,
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#cur)"
                  name="This season"
                />
                <Line
                  type="monotone"
                  dataKey="lastYear"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  name="Last year"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Alert Feed */}
        <Panel
          title="Alert Feed"
          subtitle="Critical events requiring attention"
        >
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {!alerts.length && (
              <p className="py-8 text-center text-sm text-gray-500">
                No recorded alerts in this jurisdiction.
              </p>
            )}
            {alerts.map((a) => {
              const d = a;
              return (
                <button
                  key={a.id}
                  onClick={() => setOpenAlert(a)}
                  className={`group flex gap-3 rounded-xl border bg-background/40 p-3 text-left transition-colors hover:border-primary/40 ${severityBorder[a.severity]}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityStyles[a.severity]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.region} · {a.time ? date(a.time) : "Recorded alert"}
                    </p>
                    {d && d.metrics.affectedFarms > 0 && (
                      <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                        {d.metrics.affectedFarms} farms ·{" "}
                        {d.metrics.affectedAreaHa ?? "—"} ha · {d.metrics.insuredShare}
                        % insured
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        {/* Jurisdiction Heat Map */}
        <Panel
          title="Jurisdiction Heat Map"
          subtitle="Crop health (NDVI) by region — red indicates at-risk zones"
          action={
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-green-200" />
                Healthy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-orange-200" />
                Watch
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-200" />
                At risk
              </span>
            </div>
          }
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" /> {leaderboard.region.name} ·{" "}
            {regions.length} regions ·{" "}
            <span className="text-indigo-500 font-medium ml-1">
              Click on a cell to drill in
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {regions.map((r) => (
              <HeatCell
                key={r.id}
                r={r}
                onClick={() => onSectorSelect?.(r.id, r.level)}
              />
            ))}
          </div>
          {!!flagged.length && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="font-medium">
                {flagged.length} {flagged.length === 1 ? "region" : "regions"}{" "}
                flagged at-risk based on the recorded NDVI readings.
              </span>
            </div>
          )}
          {!regions.length && (
            <p className="py-8 text-center text-sm text-gray-500">
              No child regions in this jurisdiction.
            </p>
          )}
        </Panel>
      </div>

      <Dialog
        open={openAlert !== null}
        onOpenChange={(o) => !o && setOpenAlert(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          {openAlert && detail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${severityStyles[openAlert.severity]}`}
                  />
                  <span className="uppercase tracking-wider">
                    {openAlert.severity} · {openAlert.region} ·{" "}
                    {openAlert.time ? date(openAlert.time) : "Recorded alert"}
                  </span>
                </div>
                <DialogTitle className="text-left">
                  {openAlert.title}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-2 space-y-4 text-sm text-foreground">
                <p className="leading-relaxed">{detail.summary}</p>

                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Impact Assessment
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Affected</p>
                      <p className="mt-0.5 font-mono text-base font-semibold">
                        {detail.metrics.affectedFarms}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Farms</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Area
                      </p>
                      <p className="mt-0.5 font-mono text-base font-semibold">
                        {detail.metrics.affectedAreaHa ?? "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Hectares
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Insured</p>
                      <p className="mt-0.5 font-mono text-base font-semibold">
                        {detail.metrics.insuredShare}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Of affected
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Immediate Actions Recommended
                  </h4>
                  <p className="leading-relaxed text-muted-foreground">
                    {detail.recommendation}
                  </p>
                  {onFarmerSelect && (
                    <button
                      onClick={() => {
                        onFarmerSelect(detail.farmerId);
                        setOpenAlert(null);
                      }}
                      className="mt-3 text-sm font-medium text-primary underline"
                    >
                      Open farmer monitoring profile
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
