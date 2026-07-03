import { useMemo, useState } from "react";
import { ArrowLeft, Home, ChevronRight, Sprout, Gauge, Layers, Info, CloudRain, FileText, ClipboardCheck, User, Ruler, CalendarDays, MapPin, Images, Expand, Thermometer, Droplets, Wind, FileSearch, ArrowRight, Activity, Map, ArrowRightCircle } from "lucide-react";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Bar, Line, AreaChart, Area } from "recharts";
import { Panel, StatusBadge, KpiCard } from "@/components/government/gov-widgets";
import { FieldMap, NdviLegend } from "./FieldMap";
import { PhotoLightbox } from "./PhotoLightbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClaimDetail, rwf } from "@/components/government/gov-data";

export function GovClaimDetailsPage({ claimId, onBack }: { claimId: string, onBack: () => void }) {
  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--foreground)",
  };
  const detail = useMemo(() => getClaimDetail(claimId), [claimId]);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!detail) {
    return (
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Claim not found</h2>
          <p className="text-muted-foreground">This claim record does not exist.</p>
        </div>
        <button onClick={onBack} className="text-primary underline self-start">Back to claims</button>
      </div>
    );
  }

  const { claim, field, lossDescription, photos, weather, reports, assessment } = detail;

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Claim {claim.id}</h2>
          <p className="text-muted-foreground">{claim.cause} loss · {field.cropType} · {claim.region} Sector</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
        >
          <ArrowLeft className="h-4 w-4" /> Claims
        </button>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground">
          <Home className="h-3.5 w-3.5" /> Claims & Losses
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{claim.id}</span>
      </nav>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Area Lost" value={claim.areaLostHa.toFixed(1)} unit="ha" icon={Sprout} accent="warning" />
        <KpiCard label="Verified Loss" value={`${assessment.lossPct}`} unit="%" icon={Gauge} accent="destructive" />
        <KpiCard label="Claim Value" value={rwf(claim.value)} unit="RWF" icon={Layers} accent="info" />
        <KpiCard label="Plot NDVI" value={field.plotNdvi.toFixed(2)} icon={Layers} accent={field.plotNdvi < 0.5 ? "destructive" : "primary"} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={claim.status} />
        <span className="text-sm text-muted-foreground">Filed {claim.filed}</span>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">Insurer: {claim.insurer}</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="field" className="mt-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card p-1">
          <TabsTrigger value="field" className="gap-1.5"><Info className="h-4 w-4" /> Field Info</TabsTrigger>
          <TabsTrigger value="weather" className="gap-1.5"><CloudRain className="h-4 w-4" /> Weather</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><FileText className="h-4 w-4" /> Reports</TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5"><ClipboardCheck className="h-4 w-4" /> Overview</TabsTrigger>
        </TabsList>

        {/* FIELD INFO */}
        <TabsContent value="field" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Field Information" subtitle="Basic details of the affected field" className="lg:col-span-1">
              <dl className="space-y-3 text-sm">
                <FieldRow icon={Layers} label="Field name"><span className="text-right text-foreground">{field.name}</span></FieldRow>
                <FieldRow icon={User} label="Farmer">
                  <span className="text-right text-foreground">{field.farmerName}</span>
                </FieldRow>
                <FieldRow icon={Sprout} label="Crop type"><span className="text-foreground">{field.cropType}</span></FieldRow>
                <FieldRow icon={Ruler} label="Field size"><span className="font-mono-nums text-foreground">{field.sizeHa} ha</span></FieldRow>
                <FieldRow icon={CalendarDays} label="Sowing date"><span className="font-mono-nums text-foreground">{field.sowingDate}</span></FieldRow>
                <FieldRow icon={MapPin} label="Location"><span className="font-mono-nums text-right text-foreground">{field.center.lat.toFixed(4)}, {field.center.lng.toFixed(4)}</span></FieldRow>
                <FieldRow icon={Gauge} label="Plot NDVI"><span className="font-mono-nums text-foreground">{field.plotNdvi.toFixed(2)}</span></FieldRow>
              </dl>
            </Panel>

            <Panel title="Field Location & NDVI Map" subtitle="Boundary + satellite NDVI overlay" className="lg:col-span-2">
              <FieldMap
                center={field.center}
                boundary={field.boundary}
                ndviCells={field.ndviCells}
                className="h-[360px]"
              />
              <div className="mt-3">
                <NdviLegend />
              </div>
            </Panel>
          </div>

          <Panel title="Loss Description" subtitle={`${claim.cause} damage report`}>
            <p className="text-sm leading-relaxed text-muted-foreground">{lossDescription}</p>
          </Panel>

          <Panel
            title="Photographic Evidence"
            subtitle="Field photos attached to this loss — click to zoom & view fullscreen"
            action={<span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Images className="h-4 w-4" /> {photos.length} photos</span>}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setLightbox(i)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
                >
                  <img src={p.url} alt={p.caption} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 right-2 truncate text-left text-[11px] font-medium text-white">{p.caption}</span>
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Expand className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </TabsContent>

        {/* WEATHER */}
        <TabsContent value="weather" className="mt-4 space-y-4">
          <Panel title="Current Conditions" subtitle={`As recorded on the claim date (${weather.onClaimDate.date})`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <WeatherStat icon={Thermometer} label="Temperature" value={`${weather.current.tempC}°C`} />
              <WeatherStat icon={Droplets} label="Humidity" value={`${weather.current.humidity}%`} />
              <WeatherStat icon={CloudRain} label="Rainfall" value={`${weather.current.rainfallMm} mm`} />
              <WeatherStat icon={Wind} label="Wind" value={`${weather.current.windKph} km/h`} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Condition: <span className="text-foreground">{weather.current.condition}</span></p>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Historical Weather" subtitle="14 days leading up to the claim (rainfall & temperature)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weather.historical} margin={{ left: -18, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="l" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="r" orientation="right" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <ReferenceLine yAxisId="l" x={weather.onClaimDate.date} stroke="var(--color-destructive)" strokeDasharray="4 3" label={{ value: "Claim", fill: "var(--color-destructive)", fontSize: 10, position: "top" }} />
                    <Bar yAxisId="l" dataKey="rainfallMm" name="Rainfall (mm)" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="r" type="monotone" dataKey="tempC" name="Temp (°C)" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="7-Day Forecast" subtitle="Projected rainfall & temperature">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weather.forecast} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="fcRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="rainfallMm" name="Rainfall (mm)" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#fcRain)" />
                    <Line type="monotone" dataKey="tempC" name="Temp (°C)" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title="Accumulated Statistics" subtitle="Season-to-date and 30-day aggregates">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <AccStat label="Rain (30d)" value={`${weather.accumulated.rainfall30dMm} mm`} />
              <AccStat label="Season rain" value={`${weather.accumulated.rainfallSeasonMm} mm`} />
              <AccStat label="Normal season" value={`${weather.accumulated.normalSeasonMm} mm`} />
              <AccStat label="Dry days (30d)" value={`${weather.accumulated.dryDays30d}`} />
              <AccStat label="Max daily rain" value={`${weather.accumulated.maxDailyRainfallMm} mm`} />
              <AccStat label="Avg temp" value={`${weather.accumulated.avgTempC}°C`} />
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Season rainfall vs normal</span>
                <span className="font-mono-nums">{Math.round((weather.accumulated.rainfallSeasonMm / weather.accumulated.normalSeasonMm) * 100)}% of normal</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${weather.accumulated.rainfallSeasonMm < weather.accumulated.normalSeasonMm ? "bg-warning" : "bg-info"}`}
                  style={{ width: `${Math.min(100, (weather.accumulated.rainfallSeasonMm / weather.accumulated.normalSeasonMm) * 100)}%` }}
                />
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="mt-4">
          <Panel
            title="Attached Reports"
            subtitle="All documents provided for this claim"
            action={<span className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="h-4 w-4" /> {reports.length} files</span>}
          >
            <div className="space-y-2.5">
              {reports.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.type} · {r.pages} pages · {(r.sizeKb / 1024).toFixed(1)} MB · {r.author} · {r.date}
                    </p>
                  </div>
                  <button className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Assessment Verdict" className="lg:col-span-1">
              <dl className="space-y-3 text-sm">
                <FieldRow icon={User} label="Assessor"><span className="text-foreground">{assessment.assessor}</span></FieldRow>
                <FieldRow icon={CalendarDays} label="Inspected"><span className="font-mono-nums text-foreground">{assessment.inspectedOn}</span></FieldRow>
                <FieldRow icon={Gauge} label="Verified loss"><span className="font-mono-nums text-foreground">{assessment.lossPct}%</span></FieldRow>
                <FieldRow icon={ClipboardCheck} label="Status"><StatusBadge status={claim.status} /></FieldRow>
              </dl>
              <p className="mt-4 rounded-xl border border-border bg-background/40 p-3 text-sm text-foreground">{assessment.verdict}</p>
            </Panel>

            <Panel title="Comprehensive Assessment Notes" subtitle="Attached field notes & findings" className="lg:col-span-2">
              <ul className="space-y-3">
                {assessment.notes.map((n, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{i + 1}</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-info/20 bg-info/10 p-3 text-sm text-info">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{assessment.recommendation}</span>
              </div>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>

      {lightbox !== null && (
        <PhotoLightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
      )}
    </div>
  );
}

function FieldRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" /> {label}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

function WeatherStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="font-mono-nums mt-1.5 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function AccStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono-nums mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
