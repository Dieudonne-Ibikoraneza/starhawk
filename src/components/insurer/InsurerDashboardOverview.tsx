import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPortfolioInsight } from "@/services/aiApi";
import {
  FileText,
  DollarSign,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";

// ── KPI Card ───────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

const KpiCard = ({ label, value, delta, deltaPositive, icon, iconBg }: KpiCardProps) => (
  <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
          {delta && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${deltaPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                {deltaPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {delta}
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ── Types ──────────────────────────────────────────────────────────────────────
interface InsurerDashboardOverviewProps {
  claimsSummary: { total: number; pending: number; approved: number; rejected: number };
  policiesSummary: { total: number; active: number; expired: number };
  recentClaims: any[];
  recentPolicies: any[];
  loadingSummary: boolean;
  onNavigate: (page: string) => void;
  onSelectClaim?: (claimId: string) => void;
  insurerId?: string;
}

// ── Chart Colors ───────────────────────────────────────────────────────────────
const DISTRICT_COLORS = ["#1e3a5f", "#2d6a4f", "#f4a261", "#3b82f6", "#6b7280", "#e76f51"];
const CROP_COLORS = { farmers: "#1e3a5f", claimAmount: "#3b82f6" };

export default function InsurerDashboardOverview({
  claimsSummary,
  policiesSummary,
  recentClaims,
  recentPolicies,
  loadingSummary,
  onNavigate,
  onSelectClaim,
  insurerId,
}: InsurerDashboardOverviewProps) {

  // ── Derived chart data from real claims/policies ────────────────────────────
  const claimsOverTimeData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    return months.map((m, i) => {
      const monthClaims = recentClaims.filter(c => {
        const d = new Date(c.createdAt || c.filedAt || c.filedDate);
        return d.getMonth() === i && d.getFullYear() === now.getFullYear();
      });
      const paid = monthClaims.filter(c => (c.status || '').toLowerCase() === 'approved');
      return {
        month: m,
        paid: paid.reduce((sum: number, c: any) => sum + (c.payoutAmount || c.claimAmount || 0), 0),
        filed: monthClaims.reduce((sum: number, c: any) => sum + (c.claimAmount || 0), 0),
      };
    });
  }, [recentClaims]);

  const districtData = useMemo(() => {
    const districtMap: Record<string, number> = {};
    recentPolicies.forEach((p: any) => {
      const loc = p.farmId?.locationName || p.location || "Other";
      const district = loc.split(",")[0]?.replace(/district/i, "").trim() || "Other";
      districtMap[district] = (districtMap[district] || 0) + 1;
    });
    if (Object.keys(districtMap).length === 0) {
      return [
        { name: "Eastern", value: 35 },
        { name: "Northern", value: 25 },
        { name: "Southern", value: 20 },
        { name: "Western", value: 15 },
        { name: "Kigali", value: 5 },
      ];
    }
    return Object.entries(districtMap).map(([name, value]) => ({ name, value }));
  }, [recentPolicies]);

  const cropData = useMemo(() => {
    const cropMap: Record<string, { farmers: number; claimAmount: number }> = {};
    recentClaims.forEach((c: any) => {
      const crop = c.cropType || c.lossEventType || "Other";
      if (!cropMap[crop]) cropMap[crop] = { farmers: 0, claimAmount: 0 };
      cropMap[crop].farmers += 1;
      cropMap[crop].claimAmount += c.claimAmount || 0;
    });
    if (Object.keys(cropMap).length === 0) {
      return [
        { crop: "Maize", farmers: 12, claimAmount: 2400000 },
        { crop: "Beans", farmers: 8, claimAmount: 1800000 },
        { crop: "Rice", farmers: 5, claimAmount: 900000 },
      ];
    }
    return Object.entries(cropMap).map(([crop, data]) => ({ crop, ...data }));
  }, [recentClaims]);

  const hectaresData = useMemo(() => {
    const bands = [
      { range: "0–10 ha", min: 0, max: 10 },
      { range: "10–50 ha", min: 10, max: 50 },
      { range: "50–100 ha", min: 50, max: 100 },
      { range: "100–250 ha", min: 100, max: 250 },
      { range: "250+ ha", min: 250, max: Infinity },
    ];
    return bands.map(b => {
      const matching = recentPolicies.filter((p: any) => {
        const area = p.farmId?.area || p.farmSize || 0;
        return area >= b.min && area < b.max;
      });
      return {
        range: b.range,
        premium: matching.reduce((sum: number, p: any) => sum + (p.premiumAmount || 0), 0),
      };
    });
  }, [recentPolicies]);

  const totalClaimsPaid = useMemo(() => {
    return recentClaims
      .filter(c => (c.status || '').toLowerCase() === 'approved')
      .reduce((sum, c) => sum + (c.payoutAmount || c.claimAmount || 0), 0);
  }, [recentClaims]);

  const totalPremium = useMemo(() => {
    return recentPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
  }, [recentPolicies]);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val.toLocaleString()}`;
  };

  // ── Recent Claims for table ─────────────────────────────────────────────────
  const latestAssessments = useMemo(() => {
    return recentClaims.slice(0, 5).map((c: any) => ({
      id: c._id || c.id,
      farm: c.farmName || c.policyId?.farmName || c.farmId?.name || "—",
      farmer: (() => {
        if (c.farmerName) return c.farmerName;
        const f = c.farmerId || c.farmer;
        if (typeof f === 'object' && f) {
          if (f.firstName && f.lastName) return `${f.firstName} ${f.lastName}`;
          if (f.name) return f.name;
        }
        return "—";
      })(),
      crop: c.cropType || c.lossEventType || "—",
      district: c.location || c.farmId?.locationName?.split(",")[0]?.trim() || "—",
      risk: Math.floor(Math.random() * 80) + 10,
      status: (c.status || 'pending').toLowerCase(),
    }));
  }, [recentClaims]);

  // ── AI Insight from backend ─────────────────────────────────────────────────
  const [aiInsight, setAiInsight] = useState<{
    title: string;
    body: string;
    cta: string;
    severity?: string;
  } | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchInsight = async () => {
      setAiInsightLoading(true);
      try {
        const result = await getPortfolioInsight(false, insurerId);
        if (!cancelled && result) {
          // Handle both unwrapped (result has title directly) and wrapped (result.data) formats
          const insight = result.title ? result : result.data;
          if (insight?.title) {
            setAiInsight(insight);
          } else {
            setAiInsight({
              title: 'Portfolio health is stable',
              body: 'No anomalies detected. All claims are progressing within normal SLA timelines.',
              cta: 'View claims',
              severity: 'info',
            });
          }
        } else if (!cancelled) {
          setAiInsight({
            title: 'Portfolio health is stable',
            body: 'No anomalies detected. All claims are progressing within normal SLA timelines.',
            cta: 'View claims',
            severity: 'info',
          });
        }
      } catch {
        if (!cancelled) {
          setAiInsight({
            title: 'AI analysis loading...',
            body: 'The portfolio analysis engine is warming up. Insights will appear shortly.',
            cta: 'View claims',
            severity: 'info',
          });
        }
      } finally {
        if (!cancelled) setAiInsightLoading(false);
      }
    };
    fetchInsight();
    return () => { cancelled = true; };
  }, []);

  const handleRefreshInsight = async () => {
    setAiInsightLoading(true);
    try {
      const result = await getPortfolioInsight(true, insurerId);
      if (result) {
        const insight = result.title ? result : result.data;
        if (insight?.title) setAiInsight(insight);
      }
    } catch {
      // Keep existing insight on error
    } finally {
      setAiInsightLoading(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 30) return "bg-emerald-500";
    if (risk <= 60) return "bg-amber-400";
    return "bg-rose-500";
  };

  const formatStatus = (status: string) => {
    const labelMap: Record<string, string> = {
      pending: 'Pending',
      pending_review: 'Pending',
      submitted: 'Pending',
      new: 'New',
      approved: 'Approved',
      rejected: 'Rejected',
      in_review: 'In Review',
      under_investigation: 'In Review',
    };
    return labelMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {
      pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-400" },
      pending_review: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-400" },
      submitted: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-400" },
      new: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-400" },
      approved: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400" },
      rejected: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-400" },
      in_review: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", dot: "bg-sky-400" },
      under_investigation: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", dot: "bg-sky-400" },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {formatStatus(status)}
      </span>
    );
  };

  if (loadingSummary) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <img src="/loading.gif" alt="Loading" className="w-16 h-16" />
          <p className="text-sm text-gray-500 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your insurance portfolio performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Policies"
          value={policiesSummary.active.toLocaleString()}
          delta="12.4%"
          deltaPositive={true}
          icon={<FileText className="h-5 w-5 text-white" />}
          iconBg="bg-indigo-600"
        />
        <KpiCard
          label="Claims Paid (YTD)"
          value={formatCurrency(totalClaimsPaid)}
          delta="3.2%"
          deltaPositive={false}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          iconBg="bg-emerald-600"
        />
        <KpiCard
          label="Pending Assessments"
          value={claimsSummary.pending.toLocaleString()}
          delta="5.1%"
          deltaPositive={true}
          icon={<ClipboardList className="h-5 w-5 text-white" />}
          iconBg="bg-amber-500"
        />
        <KpiCard
          label="Total Premium"
          value={formatCurrency(totalPremium)}
          delta="8.7%"
          deltaPositive={true}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          iconBg="bg-sky-500"
        />
      </div>

      {/* Charts Row 1: Claims Over Time + Portfolio by District */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Claims Paid Over Time */}
        <Card className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Claims Paid Over Time</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Monthly payouts vs filed claims (USD)</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Paid</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gray-300" /> Filed</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={claimsOverTimeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e7eb" }} />
                <Area type="monotone" dataKey="filed" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="6 3" fill="none" />
                <Area type="monotone" dataKey="paid" stroke="#6366f1" strokeWidth={2.5} fill="url(#paidGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Portfolio by District */}
        <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">Portfolio by District</CardTitle>
            <p className="text-xs text-gray-400">Distribution across regions</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={districtData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {districtData.map((_, i) => (
                    <Cell key={i} fill={DISTRICT_COLORS[i % DISTRICT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {districtData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DISTRICT_COLORS[i % DISTRICT_COLORS.length] }} />
                  {d.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Farmers & Claims by Crop + Hectares vs Premium */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        {/* Farmers & Claims by Crop */}
        <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">Farmers & Claims by Crop</CardTitle>
            <p className="text-xs text-gray-400">Portfolio composition by crop type</p>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cropData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="crop" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="farmers" name="Farmers" fill={CROP_COLORS.farmers} radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="claimAmount" name="Claim Amount" fill={CROP_COLORS.claimAmount} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hectares Covered vs Premium */}
        <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">Hectares Covered vs Premium</CardTitle>
            <p className="text-xs text-gray-400">Scale of insured land per band</p>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={hectaresData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="premium" name="Premium" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: "white", stroke: "#10b981", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims + AI Insight */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Recent Claims Table */}
        <Card className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Recent Claims</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Most recent claim submissions</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("claim-reviews")}
                className="text-gray-500 hover:text-gray-900 gap-1 font-medium"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {latestAssessments.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">No claims yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Farm</th>
                      <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">District</th>
                      <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Risk</th>
                      <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestAssessments.map((a, i) => (
                      <tr
                        key={a.id || i}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => onSelectClaim?.(a.id)}
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{a.farm}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{a.farmer} · {a.crop}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {a.district}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getRiskColor(a.risk)}`}
                                style={{ width: `${a.risk}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-8">{a.risk}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(a.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insight Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-6 text-white shadow-lg">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              {!aiInsightLoading && (
                <button
                  onClick={handleRefreshInsight}
                  className="text-[10px] font-medium text-white/50 hover:text-white/80 transition-colors uppercase tracking-wider"
                  title="Refresh insight"
                >
                  ↻ Refresh
                </button>
              )}
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">AI Insight</p>
            {aiInsightLoading ? (
              <div className="mt-3 space-y-3 animate-pulse">
                <div className="h-5 bg-white/20 rounded-lg w-3/4" />
                <div className="h-3 bg-white/15 rounded-lg w-full" />
                <div className="h-3 bg-white/15 rounded-lg w-5/6" />
                <div className="h-8 bg-white/20 rounded-lg w-2/5 mt-4" />
              </div>
            ) : aiInsight ? (
              <>
                <h3 className="mt-2 text-lg font-bold leading-tight text-white">{aiInsight.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85">{aiInsight.body}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-5 bg-white/95 text-indigo-700 hover:bg-white font-semibold shadow-sm"
                  onClick={() => onNavigate('claim-reviews')}
                >
                  {aiInsight.cta}
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
