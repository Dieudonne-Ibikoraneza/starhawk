import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge, KpiCard, Panel } from "@/components/government/gov-widgets";
import {
  getFarmerProfile,
  rwf,
  type FarmerPlanting,
  type FarmerPolicy,
  type FarmerClaim,
  type FarmerAlert,
} from "@/components/government/gov-data";
import {
  ArrowLeft,
  Home,
  ChevronRight,
  Sprout,
  ShieldCheck,
  MapPinned,
  Phone,
  CalendarDays,
  IdCard,
  Layers,
  Wheat,
  Users,
  Activity,
  FileWarning,
  BellRing,
  CircleAlert,
  TriangleAlert,
  Info,
  CreditCard,
} from "lucide-react";

export function GovFarmerPage({
  farmerId,
  onBack,
  onNavigate,
}: {
  farmerId: string;
  onBack: () => void;
  onNavigate?: (target: { level: "Leaderboard" | "Sector" | "Cell" | "Village" | "Farmer"; id?: string }) => void;
}) {
  const profile = useMemo(() => getFarmerProfile(farmerId), [farmerId]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-bold text-foreground">Farmer not found</h2>
        <p className="mt-2 text-muted-foreground">This farmer record does not exist.</p>
        <button onClick={onBack} className="mt-4 text-primary underline">Go back</button>
      </div>
    );
  }

  const { farmer, sectorName, identity, portfolio, ndviSeries, claimsHistory, alerts, plantings, policies, totals } = profile;
  const insuredPct = totals.plantings === 0 ? 0 : Math.round((totals.insuredPlantings / totals.plantings) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{farmer.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {identity.village} Village · {identity.cell} Cell · {sectorName} Sector · {identity.district} District
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-emerald-500/40 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="mb-6">
        <GovBreadcrumb 
          items={[
            { level: "Leaderboard", name: "Leaderboard" },
            { level: "Sector", id: farmer.sectorId, name: sectorName },
            { level: "Cell", id: farmer.cellId, name: identity.cell },
            { level: "Village", id: farmer.villageId, name: identity.village },
            { level: "Farmer", id: farmer.id, name: farmer.name }
          ]} 
          onNavigate={onNavigate} 
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Cultivated Area" value={totals.cultivatedAreaHa.toLocaleString()} unit="ha" icon={Layers} accent="warning" />
        <KpiCard label="Insured Plantings" value={`${insuredPct}`} unit="%" icon={ShieldCheck} accent="info" />
        <KpiCard label="Total Sum Insured" value={rwf(totals.sumInsured)} unit="RWF" icon={Wheat} />
        <KpiCard label="Payouts Received" value={rwf(totals.totalPayout)} unit="RWF" icon={CreditCard} accent={totals.openClaims > 0 ? "destructive" : "primary"} />
      </div>

      {/* Identity & Crop Portfolio */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3 items-start">
        <Panel title="Farmer Identity & Location" subtitle="Profile, contact & administrative location" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <Row icon={IdCard} label="National ID">
              <span className="font-mono-nums text-gray-700">{identity.nationalId}</span>
            </Row>
            <Row icon={Sprout} label="Farmer ID">
              <span className="font-mono-nums text-gray-700">{farmer.id}</span>
            </Row>
            <Row icon={Phone} label="Phone">
              <a href={`tel:${farmer.phone.replace(/\s/g, "")}`} className="font-mono-nums text-emerald-400 hover:text-emerald-300">
                {farmer.phone}
              </a>
            </Row>
            <Row icon={Users} label="Cooperative">
              <span className="text-right text-gray-700">{identity.cooperative}</span>
            </Row>
            <Row icon={MapPinned} label="Location">
              <span className="text-right text-gray-700">
                {identity.province} › {identity.district} › {identity.sector} › {identity.cell} › {identity.village}
              </span>
            </Row>
            <Row icon={CalendarDays} label="Registered">
              <span className="font-mono-nums text-gray-700">{farmer.registeredOn}</span>
            </Row>
            <Row icon={Activity} label="Risk level">
              <StatusBadge status={farmer.riskLevel} />
            </Row>
          </dl>
        </Panel>

        {/* Land & Crop Portfolio */}
        <Panel title="Land & Crop Portfolio" subtitle={`${totals.cultivatedAreaHa} ha across ${portfolio.length} crop${portfolio.length === 1 ? "" : "s"}`} className="lg:col-span-2">
          <div className="space-y-4">
            {portfolio.map((p) => (
              <div key={p.crop}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-gray-700">
                    <Wheat className="h-4 w-4 text-emerald-500" /> {p.crop}
                  </span>
                  <span className="font-mono-nums text-gray-500">{p.areaHa} ha · {p.share}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${p.share}%` }}
                  />
                </div>
              </div>
            ))}
            {portfolio.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-9000">No cultivated plots on record.</p>
            )}
          </div>
        </Panel>
      </div>

      {/* Plot Health (NDVI) */}
      <Panel
        title="Real-time Plot Health (NDVI)"
        subtitle="This farmer's plots vs. the sector average — last 12 weeks"
        className="mt-4"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ndviSeries} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="farmerNdviDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0.3, 0.95]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  color: "#f8fafc",
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="farmer" stroke="#10b981" strokeWidth={2.5} fill="url(#farmerNdviDark)" name="Your plots" />
              <Line type="monotone" dataKey="sectorAvg" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Sector average" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Your plots</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-slate-500" /> Sector average</span>
        </div>
      </Panel>

      {/* Targeted Risk Alerts */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-lg font-semibold text-gray-900">
        <BellRing className="h-5 w-5 text-amber-500" /> Targeted Risk Alerts
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">{alerts.length}</span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
      </div>

      {/* Policies */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-lg font-semibold text-gray-900">
        <ShieldCheck className="h-5 w-5 text-emerald-500" /> Policy & Coverage Status
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">{policies.length}</span>
      </h2>
      <Panel className="p-0 overflow-hidden">
        <PoliciesTable policies={policies} />
      </Panel>

      {/* Claims & Payout History */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-lg font-semibold text-gray-900">
        <FileWarning className="h-5 w-5 text-red-500" /> Claims & Payout History
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">{claimsHistory.length}</span>
      </h2>
      <Panel className="p-0 overflow-hidden">
        <ClaimsTable claims={claimsHistory} />
      </Panel>

      {/* Plantings */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-lg font-semibold text-gray-900">
        <Sprout className="h-5 w-5 text-emerald-500" /> Planting History
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">{plantings.length}</span>
      </h2>
      <Panel className="p-0 overflow-hidden">
        <PlantingsTable plantings={plantings} />
      </Panel>
    </div>
  );
}

// Dark variations of shared components
function Panel({ title, subtitle, className = "", children }: any) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 sm:p-5 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}


function Row({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
      <dt className="flex shrink-0 items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4 text-gray-9000" /> {label}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

const alertStyles = {
  critical: { wrap: "border-red-500/30 bg-red-500/5", icon: "text-red-500", Icon: CircleAlert },
  warning: { wrap: "border-amber-500/30 bg-amber-500/5", icon: "text-amber-500", Icon: TriangleAlert },
  info: { wrap: "border-blue-500/30 bg-blue-500/5", icon: "text-blue-500", Icon: Info },
} as const;

function AlertCard({ alert }: { alert: FarmerAlert }) {
  const s = alertStyles[alert.severity];
  const Icon = s.Icon;
  return (
    <div className={`rounded-2xl border p-4 ${s.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.icon}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
          <p className="mt-1 text-xs text-gray-600">{alert.detail}</p>
          <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-9000">{alert.time}</p>
        </div>
      </div>
    </div>
  );
}

function statusTone(status: FarmerPlanting["status"]) {
  if (status === "Growing") return "text-blue-400";
  if (status === "Harvested") return "text-emerald-400";
  return "text-red-400";
}

function PlantingsTable({ plantings }: { plantings: FarmerPlanting[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Crop</th>
            <th className="px-4 py-3 font-medium">Season</th>
            <th className="px-4 py-3 font-medium">Planted</th>
            <th className="px-4 py-3 font-medium">Harvest</th>
            <th className="px-4 py-3 font-medium">Area</th>
            <th className="px-4 py-3 font-medium">Insured</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {plantings.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{p.crop}</td>
              <td className="px-4 py-3 text-gray-600">{p.season}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-700">{p.plantedOn}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-500">{p.expectedHarvest}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-900">{p.areaHa} ha</td>
              <td className="px-4 py-3">
                {p.insured ? (
                  <span className="text-emerald-400 font-medium">Yes</span>
                ) : (
                  <span className="text-gray-9000 font-medium">No</span>
                )}
              </td>
              <td className={`px-4 py-3 font-medium ${statusTone(p.status)}`}>{p.status}</td>
            </tr>
          ))}
          {plantings.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-gray-9000">No plantings on record.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClaimsTable({ claims }: { claims: FarmerClaim[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Claim ID</th>
            <th className="px-4 py-3 font-medium">Crop</th>
            <th className="px-4 py-3 font-medium">Cause</th>
            <th className="px-4 py-3 font-medium">Filed</th>
            <th className="px-4 py-3 font-medium">Area Lost</th>
            <th className="px-4 py-3 font-medium">Payout</th>
            <th className="px-4 py-3 font-medium">Insurer</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-mono-nums font-medium text-gray-700">{c.id}</td>
              <td className="px-4 py-3 text-gray-900">{c.crop}</td>
              <td className="px-4 py-3 text-gray-600">{c.cause}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-500">{c.filed}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-900">{c.areaLostHa} ha</td>
              <td className="px-4 py-3 font-mono-nums text-gray-900">{c.payout > 0 ? `${rwf(c.payout)} RWF` : "—"}</td>
              <td className="px-4 py-3 text-gray-500">{c.insurer}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${c.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
          {claims.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-gray-9000">No claims filed — no recorded crop losses.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PoliciesTable({ policies }: { policies: FarmerPolicy[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Policy ID</th>
            <th className="px-4 py-3 font-medium">Crop</th>
            <th className="px-4 py-3 font-medium">Insurer</th>
            <th className="px-4 py-3 font-medium">Sum Insured</th>
            <th className="px-4 py-3 font-medium">Premium</th>
            <th className="px-4 py-3 font-medium">Gov. 40%</th>
            <th className="px-4 py-3 font-medium">Expiry</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-mono-nums font-medium text-gray-700">{p.id}</td>
              <td className="px-4 py-3 text-gray-900">{p.crop}</td>
              <td className="px-4 py-3 text-gray-600">{p.insurer}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-900">{rwf(p.sumInsured)}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-900">{rwf(p.premium)}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-500">{rwf(p.govShare)}</td>
              <td className="px-4 py-3 font-mono-nums text-gray-500">{p.expiry}</td>
              <td className="px-4 py-3">
                <span className={p.status === "Active" ? "text-emerald-400 font-medium" : "text-gray-9000"}>{p.status}</span>
              </td>
            </tr>
          ))}
          {policies.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-gray-9000">No insurance policies on record.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
