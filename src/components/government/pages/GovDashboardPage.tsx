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
import { Users, Sprout, Activity, Wallet, AlertTriangle, MapPin } from "lucide-react";
import { KpiCard, Panel } from "@/components/government/gov-widgets";
import { regions, ndviTrend, alerts } from "@/components/government/gov-data";

const severityStyles: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-orange-500",
  info: "bg-blue-500",
};

function HeatCell({ r }: { r: (typeof regions)[number] }) {
  const color =
    r.riskLevel === "high"
      ? "bg-red-100 border-red-200 hover:bg-red-200"
      : r.riskLevel === "medium"
        ? "bg-orange-100 border-orange-200 hover:bg-orange-200"
        : "bg-green-100 border-green-200 hover:bg-green-200";
        
  const textColor =
    r.riskLevel === "high"
      ? "text-red-900"
      : r.riskLevel === "medium"
        ? "text-orange-900"
        : "text-green-900";

  return (
    <div className={`group/cell relative flex aspect-[4/3] flex-col justify-between rounded-xl border p-3 text-left transition-colors ${color}`}>
      <span className={`text-[11px] font-semibold ${textColor}`}>{r.name}</span>
      <div>
        <span className={`font-mono block text-lg font-bold ${textColor}`}>{r.ndvi.toFixed(2)}</span>
        <span className={`text-[10px] font-medium opacity-80 ${textColor}`}>{r.dominantCrop}</span>
      </div>
    </div>
  );
}

export function GovDashboardPage() {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Insured Farmers" value="28,410" delta={6} icon={Users} accent="primary" />
        <KpiCard label="Cultivated Hectares" value="15,570" unit="ha" delta={2} icon={Sprout} accent="info" />
        <KpiCard label="Avg. Crop Health (NDVI)" value="0.67" delta={-4} icon={Activity} accent="warning" />
        <KpiCard label="Subsidy Utilized" value="878M" unit="RWF" delta={9} icon={Wallet} accent="primary" />
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        {/* NDVI Trajectory Chart */}
        <Panel
          className="xl:col-span-2"
          title="NDVI Trajectory"
          subtitle="Current season vs. same period last year"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ndviTrend} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="cur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="week" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0.4, 0.85]} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    color: "#111827",
                    fontSize: 12,
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                />
                <Area type="monotone" dataKey="current" stroke="#4f46e5" strokeWidth={2.5} fill="url(#cur)" name="This season" />
                <Line type="monotone" dataKey="lastYear" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Last year" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Alert Feed */}
        <Panel title="Alert Feed" subtitle="Critical events requiring attention">
          <div className="flex flex-col gap-3">
            {alerts.map((a) => (
              <div key={a.id} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityStyles[a.severity]}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug text-gray-900">{a.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{a.region} · {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        {/* Jurisdiction Heat Map */}
        <Panel
          title="Jurisdiction Heat Map"
          subtitle="Crop health (NDVI) by sector — red indicates at-risk zones"
          action={
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-200" />Healthy</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange-200" />Watch</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-200" />At risk</span>
            </div>
          }
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" /> Gasabo District · {regions.length} sectors
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {regions.map((r) => (
              <HeatCell key={r.id} r={r} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="font-medium">3 sectors flagged at-risk — Kinyinya NDVI dropped 14% in 30 days. Dispatch agronomists.</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
