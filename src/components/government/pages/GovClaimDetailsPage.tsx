import {
  normalizeHistoricalWeather,
  claimWeatherView,
  weatherValue,
} from "./governmentClaimWeather";
import { useQuery } from "@tanstack/react-query";
import { normalizeNdvi, normalizeForecast } from "./governmentMonitoring";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Home,
  ChevronRight,
  Sprout,
  Gauge,
  Layers,
  Info,
  CloudRain,
  ClipboardCheck,
  FileText,
  Download,
  User,
  Ruler,
  CalendarDays,
  MapPin,
  Images,
  Expand,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Bar,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Panel,
  StatusBadge,
  KpiCard,
} from "@/components/government/gov-widgets";
import { FieldMap, NdviLegend } from "./FieldMap";
import { PhotoLightbox } from "./PhotoLightbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rwf, rwfShort, fileUrl } from "./governmentFormat";
import type { LatLng, NdviCell, ClaimPhoto } from "./governmentTypes";
import { getClaimDetail } from "@/services/governmentApi";
import {
  getFieldTrend,
  getWeatherForecast,
  getHistoricalWeather,
} from "@/services/farmsApi";

interface ClaimDetailResponse {
  claim: {
    id: string;
    cause: string;
    claimType: string;
    status: string;
    filedAt: string;
    lossEventDate: string | null;
    lossDescription: string | null;
    payoutAmount: number | null;
    rejectionReason: string | null;
    damagePhotos: string[];
  };
  farm: {
    id: string;
    name: string | null;
    cropType: string;
    areaHa: number | null;
    sowingDate: string | null;
    location: { type: string; coordinates: [number, number] } | null;
    boundary: { type: string; coordinates: number[][][] } | null;
    status: string;
  } | null;
  farmer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    sector?: string | null;
  } | null;
  policy: {
    id: string;
    policyNumber: string;
    coverageAmount: number | null;
    premiumAmount: number;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  insurer: { id: string; name: string; email: string } | null;
  assessment: {
    id: string;
    assessorName: string | null;
    riskScore: number | null;
    verdict: string | null;
    observations: string[];
    notes: string | null;
    photoUrls: string[];
    completedAt: string | null;
    status: string;
    damageArea?: number | null;
    ndviBefore?: number | null;
    ndviAfter?: number | null;
    weatherImpactAnalysis?: string | null;
    reports?: { pdfType: string; pdfUrl: string }[];
  } | null;
}

function ndviColor(v: number): string {
  if (v < 0.3) return "#b91c1c";
  if (v < 0.45) return "#ea580c";
  if (v < 0.55) return "#eab308";
  if (v < 0.68) return "#84cc16";
  if (v < 0.8) return "#22c55e";
  return "#15803d";
}

function formatEnumLabel(value: string): string {
  return typeof value === "string" && value
    ? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")
    : "Not recorded";
}

function geoPolygonToLatLng(
  boundary: ClaimDetailResponse["farm"]["boundary"],
): LatLng[] {
  if (!boundary?.coordinates?.[0]) return [];
  return boundary.coordinates[0].map(([lon, lat]) => ({ lat, lng: lon }));
}

export function GovClaimDetailsPage({
  claimId,
  onBack,
}: {
  claimId: string;
  onBack: () => void;
}) {
  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    color: "hsl(var(--foreground))",
  };

  const detailQuery = useQuery({
    queryKey: ["government", "claim", claimId],
    queryFn: () => getClaimDetail(claimId) as Promise<ClaimDetailResponse>,
  });
  const detail = detailQuery.data;
  const loading = detailQuery.isPending;
  const error = detailQuery.error?.message;
  const farmId = detail?.farm?.id;
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);
  const today = new Date();
  const past = new Date(today);
  past.setDate(today.getDate() - 90);
  const future = new Date(today);
  future.setDate(today.getDate() + 6);
  const ndviQuery = useQuery({
    queryKey: ["government", "farm-ndvi", farmId],
    queryFn: async () =>
      normalizeNdvi(
        await getFieldTrend(farmId!, "NDVI", iso(past), iso(today)),
      ),
    enabled: !!farmId && !!detail?.farm?.boundary,
    retry: false,
  });
  const [activeTab, setActiveTab] = useState("field");
  const claimDate = (
    detail?.claim.lossEventDate ??
    detail?.claim.filedAt ??
    iso(today)
  ).slice(0, 10);
  const claimDateValid = Number.isFinite(new Date(claimDate).getTime());
  const historyStart = claimDateValid
    ? `${new Date(claimDate).getUTCFullYear()}-${new Date(claimDate).getUTCMonth() < 6 ? "01" : "07"}-01`
    : iso(today);
  const weatherHistoryQuery = useQuery({
    queryKey: ["government", "claim-weather-history", farmId, claimDate],
    queryFn: async () =>
      normalizeHistoricalWeather(
        await getHistoricalWeather(farmId!, historyStart, claimDate),
      ),
    enabled:
      activeTab === "weather" &&
      !!farmId &&
      !!detail?.farm?.location &&
      claimDateValid,
    retry: false,
  });
  const weatherQuery = useQuery({
    queryKey: ["government", "farm-weather", farmId],
    queryFn: async () =>
      normalizeForecast(
        await getWeatherForecast(farmId!, iso(today), iso(future)),
      ),
    enabled: activeTab === "weather" && !!farmId && !!detail?.farm?.location,
    retry: false,
  });
  const ndviHistory = ndviQuery.data ?? [];
  const forecast = weatherQuery.data ?? [];
  const weatherError = weatherQuery.error?.message;
  const [lightbox, setLightbox] = useState<number | null>(null);

  const photos: ClaimPhoto[] = useMemo(() => {
    if (!detail) return [];
    const damage = (detail.claim.damagePhotos ?? []).map((url, i) => ({
      id: `damage-${i}`,
      url: fileUrl(url),
      caption: `Damage photo ${i + 1}`,
    }));
    const assessment = (detail.assessment?.photoUrls ?? []).map((url, i) => ({
      id: `assessment-${i}`,
      url: fileUrl(url),
      caption: `Assessment photo ${i + 1}`,
    }));
    return [...damage, ...assessment];
  }, [detail]);

  const weather = claimWeatherView(
    weatherHistoryQuery.data ?? [],
    claimDateValid ? claimDate : iso(today),
    forecast,
  );
  const reports = detail?.assessment?.reports ?? [];
  const latestNdvi = ndviHistory.length
    ? ndviHistory[ndviHistory.length - 1].ndvi
    : null;

  const boundaryLatLng = useMemo(
    () => geoPolygonToLatLng(detail?.farm?.boundary ?? null),
    [detail],
  );
  const centerLatLng: LatLng | null = detail?.farm?.location?.coordinates
    ? {
        lat: detail.farm.location.coordinates[1],
        lng: detail.farm.location.coordinates[0],
      }
    : null;
  const ndviCells: NdviCell[] = useMemo(() => {
    if (!boundaryLatLng.length || latestNdvi == null) return [];
    return [
      {
        id: "field",
        polygon: boundaryLatLng,
        ndvi: latestNdvi,
        color: ndviColor(latestNdvi),
      },
    ];
  }, [boundaryLatLng, latestNdvi]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Claim not found</h2>
          <p className="text-muted-foreground">
            {error || "This claim record does not exist."}
          </p>
        </div>
        <button onClick={onBack} className="text-primary underline self-start">
          Back to claims
        </button>
        <button
          onClick={() => detailQuery.refetch()}
          className="text-primary underline self-start"
        >
          Try again
        </button>
      </div>
    );
  }

  const { claim, farm, farmer, policy, insurer, assessment } = detail;

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="break-all text-2xl font-bold tracking-tight">
            Claim {claim.id}
          </h2>
          <p className="text-muted-foreground">
            {formatEnumLabel(claim.cause)} loss ·{" "}
            {farm?.cropType ? formatEnumLabel(farm.cropType) : "Unknown crop"} ·{" "}
            {farmer?.sector ? `${farmer.sector} Sector` : "Sector not recorded"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
        >
          <ArrowLeft className="h-4 w-4" /> Claims
        </button>
      </div>

      <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" /> Claims & Losses
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="break-all font-medium text-foreground">
          {claim.id}
        </span>
      </nav>

      {/* KPIs */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Area Lost"
          value={
            assessment?.damageArea == null ? "—" : String(assessment.damageArea)
          }
          unit="ha"
          icon={Sprout}
          accent="warning"
        />
        <KpiCard
          label="Verified Loss"
          value={
            assessment?.damageArea != null &&
            farm?.areaHa > 0 &&
            assessment.damageArea <= farm.areaHa
              ? String(Math.round((assessment.damageArea / farm.areaHa) * 100))
              : "—"
          }
          unit="%"
          icon={Gauge}
          accent="destructive"
        />
        <KpiCard
          label="Claim Value"
          value={
            claim.payoutAmount == null ? "—" : rwfShort(claim.payoutAmount)
          }
          unit="RWF"
          icon={Layers}
          accent="info"
        />
        <KpiCard
          label="Plot NDVI"
          value={latestNdvi == null ? "—" : latestNdvi.toFixed(2)}
          icon={Layers}
          accent={
            latestNdvi != null && latestNdvi < 0.5 ? "destructive" : "primary"
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={formatEnumLabel(claim.status)} />
        <span className="text-sm text-muted-foreground">
          Filed {new Date(claim.filedAt).toLocaleDateString()}
        </span>
        {insurer && (
          <>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              Insurer: {insurer.name}
            </span>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card p-1">
          <TabsTrigger value="field" className="gap-1.5">
            <Info className="h-4 w-4" /> Field Info
          </TabsTrigger>
          <TabsTrigger value="weather" className="gap-1.5">
            <CloudRain className="h-4 w-4" /> Weather
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileText className="h-4 w-4" /> Reports
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <ClipboardCheck className="h-4 w-4" /> Overview
          </TabsTrigger>
        </TabsList>

        {/* FIELD INFO */}
        <TabsContent value="field" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="Field Information"
              subtitle="Basic details of the affected field"
              className="lg:col-span-1"
            >
              {!farm ? (
                <p className="text-sm text-muted-foreground">
                  No farm record linked to this claim.
                </p>
              ) : (
                <dl className="space-y-3 text-sm">
                  <FieldRow icon={Layers} label="Field name">
                    <span className="text-right text-foreground">
                      {farm.name ?? "Unnamed"}
                    </span>
                  </FieldRow>
                  <FieldRow icon={User} label="Farmer">
                    <span className="text-right text-foreground">
                      {farmer?.name ?? "Unknown"}
                    </span>
                  </FieldRow>
                  <FieldRow icon={Sprout} label="Crop type">
                    <span className="text-foreground">
                      {formatEnumLabel(farm.cropType)}
                    </span>
                  </FieldRow>
                  <FieldRow icon={Ruler} label="Field size">
                    <span className="font-mono-nums text-foreground">
                      {farm.areaHa != null
                        ? `${farm.areaHa.toFixed(1)} ha`
                        : "—"}
                    </span>
                  </FieldRow>
                  <FieldRow icon={CalendarDays} label="Sowing date">
                    <span className="font-mono-nums text-foreground">
                      {farm.sowingDate
                        ? new Date(farm.sowingDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </FieldRow>
                  {centerLatLng && (
                    <FieldRow icon={MapPin} label="Location">
                      <span className="font-mono-nums text-right text-foreground">
                        {centerLatLng.lat.toFixed(4)},{" "}
                        {centerLatLng.lng.toFixed(4)}
                      </span>
                    </FieldRow>
                  )}
                  <FieldRow icon={Gauge} label="Plot NDVI">
                    <span className="font-mono-nums text-foreground">
                      {latestNdvi != null
                        ? latestNdvi.toFixed(2)
                        : "No recent reading"}
                    </span>
                  </FieldRow>
                </dl>
              )}
            </Panel>

            <Panel
              title="Field Location & NDVI Map"
              subtitle="Boundary + latest satellite NDVI reading"
              className="lg:col-span-2"
            >
              {centerLatLng && boundaryLatLng.length > 0 ? (
                <>
                  <FieldMap
                    center={centerLatLng}
                    boundary={boundaryLatLng}
                    ndviCells={ndviCells}
                    className="h-[360px]"
                  />
                  <div className="mt-3">
                    <NdviLegend />
                  </div>
                </>
              ) : (
                <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                  No boundary geometry available for this field.
                </div>
              )}
            </Panel>
          </div>

          <Panel
            title="Loss Description"
            subtitle={`${formatEnumLabel(claim.cause)} damage report`}
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              {claim.lossDescription ||
                "No description provided by the farmer."}
            </p>
          </Panel>

          <Panel
            title="Photographic Evidence"
            subtitle="Field photos attached to this claim — click to zoom & view fullscreen"
            action={
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Images className="h-4 w-4" /> {photos.length} photos
              </span>
            }
          >
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No photos have been attached to this claim.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setLightbox(i)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
                  >
                    <img
                      src={p.url}
                      alt={p.caption}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 right-2 truncate text-left text-[11px] font-medium text-white">
                      {p.caption}
                    </span>
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Expand className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* WEATHER */}
        <TabsContent value="weather" className="mt-4 space-y-4">
          {(!farm?.location || weatherError || weatherHistoryQuery.error) && (
            <p className="rounded-xl border p-3 text-sm text-muted-foreground">
              {!farm?.location
                ? "No location coordinates are recorded for this field."
                : (weatherError ?? weatherHistoryQuery.error?.message)}
            </p>
          )}
          {(weatherQuery.isFetching || weatherHistoryQuery.isFetching) && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading available weather observations…
            </p>
          )}
          <Panel
            title="Current Conditions"
            subtitle={`As recorded on the claim date (${weather.onClaimDate.date})`}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <WeatherStat
                icon={Thermometer}
                label="Temperature"
                value={weatherValue(weather.current.tempC, "°C")}
              />
              <WeatherStat
                icon={Droplets}
                label="Humidity"
                value={weatherValue(weather.current.humidity, "%")}
              />
              <WeatherStat
                icon={CloudRain}
                label="Rainfall"
                value={weatherValue(weather.current.rainfallMm, " mm")}
              />
              <WeatherStat
                icon={Wind}
                label="Wind"
                value={weatherValue(weather.current.windKph, " km/h")}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Condition:{" "}
              <span className="text-foreground">
                {weather.current.condition}
              </span>
            </p>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Historical Weather"
              subtitle="14 days leading up to the claim (rainfall & temperature)"
            >
              {!weather.historical.length && (
                <p className="text-sm text-muted-foreground">
                  No recorded historical weather is available.
                </p>
              )}
              <div className="h-64 min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={weather.historical}
                    margin={{ left: -18, right: 8, top: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d.slice(5)}
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="l"
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="r"
                      orientation="right"
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <ReferenceLine
                      yAxisId="l"
                      x={weather.onClaimDate.date}
                      stroke="var(--color-destructive)"
                      strokeDasharray="4 3"
                      label={{
                        value: "Claim",
                        fill: "var(--color-destructive)",
                        fontSize: 10,
                        position: "top",
                      }}
                    />
                    <Bar
                      yAxisId="l"
                      dataKey="rainfallMm"
                      name="Rainfall (mm)"
                      fill="var(--color-chart-2)"
                      radius={[3, 3, 0, 0]}
                    />
                    <Line
                      yAxisId="r"
                      type="monotone"
                      dataKey="tempC"
                      name="Temp (°C)"
                      stroke="var(--color-chart-3)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel
              title="7-Day Forecast"
              subtitle="Projected rainfall & temperature"
            >
              {!weather.forecast.length && (
                <p className="text-sm text-muted-foreground">
                  No forecast readings are available.
                </p>
              )}
              <div className="h-64 min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={weather.forecast}
                    margin={{ left: -18, right: 8, top: 8 }}
                  >
                    <defs>
                      <linearGradient id="fcRain" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--color-chart-2)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-chart-2)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d.slice(5)}
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="rain"
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="temp"
                      orientation="right"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      yAxisId="rain"
                      type="monotone"
                      dataKey="rainfallMm"
                      name="Rainfall (mm)"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      fill="url(#fcRain)"
                    />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="tempC"
                      name="Max Temp (°C)"
                      stroke="var(--color-chart-3)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel
            title="Accumulated Statistics"
            subtitle="Season-to-date and 30-day aggregates"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <AccStat
                label="Rain (30d)"
                value={weatherValue(weather.accumulated.rainfall30dMm, " mm")}
              />
              <AccStat
                label="Season rain"
                value={weatherValue(
                  weather.accumulated.rainfallSeasonMm,
                  " mm",
                )}
              />
              <AccStat
                label="Normal season"
                value={weatherValue(weather.accumulated.normalSeasonMm, " mm")}
              />
              <AccStat
                label="Dry days (30d)"
                value={weatherValue(weather.accumulated.dryDays30d, "")}
              />
              <AccStat
                label="Max daily rain"
                value={weatherValue(
                  weather.accumulated.maxDailyRainfallMm,
                  " mm",
                )}
              />
              <AccStat
                label="Avg temp"
                value={weatherValue(weather.accumulated.avgTempC, "°C")}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Totals require complete daily observations for the period.
              Normal-season rainfall is unavailable without recorded
              climatology.
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Panel
            title="Attached Reports"
            subtitle="All documents provided for this claim"
            action={
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-4 w-4" /> {reports.length} files
              </span>
            }
          >
            <div className="space-y-2.5">
              {reports.map((report, index) => (
                <div
                  key={`${report.pdfUrl}-${index}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {formatEnumLabel(report.pdfType)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {assessment?.assessorName ?? "Assessor not recorded"}
                    </p>
                  </div>
                  <a
                    href={fileUrl(report.pdfUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/50"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              ))}
              {!reports.length && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No reports are attached to this claim.
                </p>
              )}
            </div>
          </Panel>
        </TabsContent>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Assessment Verdict" className="lg:col-span-1">
              {!assessment ? (
                <p className="text-sm text-muted-foreground">
                  No assessment has been completed for this claim yet.
                </p>
              ) : (
                <>
                  <dl className="space-y-3 text-sm">
                    <FieldRow icon={User} label="Assessor">
                      <span className="text-foreground">
                        {assessment.assessorName ?? "Unassigned"}
                      </span>
                    </FieldRow>
                    <FieldRow icon={CalendarDays} label="Completed">
                      <span className="font-mono-nums text-foreground">
                        {assessment.completedAt
                          ? new Date(
                              assessment.completedAt,
                            ).toLocaleDateString()
                          : "—"}
                      </span>
                    </FieldRow>
                    <FieldRow icon={Gauge} label="Risk score">
                      <span className="font-mono-nums text-foreground">
                        {assessment.riskScore ?? "—"}
                      </span>
                    </FieldRow>
                    <FieldRow icon={Ruler} label="Damage area">
                      <span>
                        {assessment.damageArea == null
                          ? "—"
                          : `${assessment.damageArea} ha`}
                      </span>
                    </FieldRow>
                    <FieldRow icon={Activity} label="NDVI before / after">
                      <span>
                        {assessment.ndviBefore ?? "—"} /{" "}
                        {assessment.ndviAfter ?? "—"}
                      </span>
                    </FieldRow>
                    <FieldRow icon={ClipboardCheck} label="Status">
                      <StatusBadge
                        status={formatEnumLabel(assessment.status)}
                      />
                    </FieldRow>
                  </dl>
                  {assessment.verdict && (
                    <p className="mt-4 rounded-xl border border-border bg-background/40 p-3 text-sm text-foreground">
                      {assessment.verdict}
                    </p>
                  )}
                </>
              )}
            </Panel>

            <Panel
              title="Comprehensive Assessment Notes"
              subtitle="Attached field findings"
              className="lg:col-span-2"
            >
              {assessment?.observations?.length ? (
                <ul className="space-y-3">
                  {assessment.observations.map((n, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No observations recorded.
                </p>
              )}
              {assessment?.notes && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {assessment.notes}
                </p>
              )}
              {assessment?.weatherImpactAnalysis && (
                <div className="mt-4 text-sm">
                  <h4 className="font-semibold">Weather impact</h4>
                  <p className="mt-1 text-muted-foreground">
                    {assessment.weatherImpactAnalysis}
                  </p>
                </div>
              )}
              {claim.status === "REJECTED" && claim.rejectionReason && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>Rejection reason:</strong> {claim.rejectionReason}
                  </span>
                </div>
              )}
            </Panel>
          </div>
        </TabsContent>
      </Tabs>

      {lightbox !== null &&
        createPortal(
          <PhotoLightbox
            photos={photos}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onIndex={setLightbox}
          />,
          document.body,
        )}
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" /> {label}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

function WeatherStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="font-mono-nums mt-1.5 text-xl font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}

function AccStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono-nums mt-1 text-lg font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}
