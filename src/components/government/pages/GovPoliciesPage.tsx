import { useQuery } from "@tanstack/react-query";
import {
  getPoliciesAnalytics,
  getPolicyRegistry,
} from "@/services/governmentApi";
import { GovPageState } from "./GovPageState";
import { date, label, money, rwfShort } from "./governmentFormat";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Panel, KpiCard } from "@/components/government/gov-widgets";
import {
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  ShieldCheck,
  FileText,
  FileWarning,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

export function GovPoliciesPage({
  regionId,
  season,
}: {
  regionId: string;
  season?: string;
}) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  type PolicyRow = {
    id: string;
    holder: string;
    sector: string;
    crop: string;
    sumInsured: number | null;
    expiry: string;
    status: string;
  };
  type SortConfig = { key: keyof PolicyRow; direction: "asc" | "desc" } | null;
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const query = useQuery({
    queryKey: [
      "government",
      "policies",
      regionId,
      page,
      statusFilter,
      season,
      sortConfig?.key,
      sortConfig?.direction,
    ],
    queryFn: async () => {
      const [analytics, registry] = await Promise.all([
        getPoliciesAnalytics(regionId, season),
        getPolicyRegistry(regionId, page, 20, statusFilter || undefined, {
          season,
          sort: sortConfig?.key === "id" ? "policyNumber" : sortConfig?.key,
          direction: sortConfig?.direction,
        }),
      ]);
      return { analytics, registry };
    },
  });
  const analytics = query.data?.analytics;
  const registry = query.data?.registry;
  const sortedPolicies: PolicyRow[] = (registry?.data ?? []).map((policy) => ({
    id: policy.policyNumber,
    holder: policy.holder,
    sector: policy.sector || "Not recorded",
    crop: label(policy.crop),
    sumInsured: policy.sumInsured,
    expiry: date(policy.endDate),
    status: label(policy.status),
  }));
  const genderTotal = (analytics?.genderBreakdown ?? []).reduce(
    (sum, row) => sum + row.count,
    0,
  );
  const genderData = (analytics?.genderBreakdown ?? []).map((row) => ({
    name: row.gender,
    value: genderTotal ? Math.round((row.count / genderTotal) * 100) : 0,
    color:
      row.gender === "Female"
        ? "#10b981"
        : row.gender === "Male"
          ? "#0ea5e9"
          : "#94a3b8",
  }));
  const ageData = analytics?.ageBreakdown ?? [];
  const cropAdoptionData = (analytics?.cropBreakdown ?? []).map((row) => ({
    crop: label(row.crop),
    policies: row.count,
  }));
  const handleSort = (key: keyof PolicyRow) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
    setPage(1);
  };

  const SortableHeader = ({
    label,
    sortKey,
    className = "",
  }: {
    label: string;
    sortKey: keyof PolicyRow;
    className?: string;
  }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th className={`px-4 py-3 font-medium ${className}`}>
        <button
          onClick={() => handleSort(sortKey)}
          className="flex items-center gap-1.5 uppercase tracking-wide hover:text-gray-900 focus:outline-none"
        >
          {label}
          {isActive ? (
            sortConfig.direction === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 text-gray-400" />
          )}
        </button>
      </th>
    );
  };

  if (query.isPending || query.error)
    return (
      <GovPageState
        loading={query.isPending}
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  return (
    <div className="flex flex-col space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Sum Insured"
          value={rwfShort(analytics?.totalSumInsured ?? 0)}
          unit="RWF"
          icon={Wallet}
          accent="primary"
        />
        <KpiCard
          label="Active Policies"
          value={(analytics?.totals.active ?? 0).toLocaleString()}
          icon={ShieldCheck}
          accent="primary"
        />
        <KpiCard
          label="Active vs Expired"
          value={`${analytics?.totals.active ?? 0}/${analytics?.totals.expired ?? 0}`}
          icon={FileText}
          accent="info"
        />
        <KpiCard
          label="Coverage Gaps"
          value={(analytics?.coverageGaps ?? 0).toLocaleString()}
          unit="farms"
          icon={FileWarning}
          accent="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gender Donut Chart */}
        <Panel
          title="Adoption by Gender"
          subtitle="Equitable access tracking"
          className="lg:col-span-1"
        >
          <div className="flex h-[280px] flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#111827", fontWeight: 500 }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              {genderData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-600">
                    {item.name} {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Age Bar Chart */}
        <Panel
          title="Adoption by Age Group"
          subtitle="Policy adoption rate (%)"
          className="lg:col-span-2"
        >
          <div className="h-[280px] w-full pt-4">
            {!ageData.length ? (
              <p className="grid h-full place-items-center text-sm text-gray-500">
                No recorded birth dates for age-group analysis.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={ageData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="age"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f9fafb" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ color: "#111827", fontWeight: 500 }}
                    formatter={(value: number) => [
                      `${value}%`,
                      "Adoption Rate",
                    ]}
                  />
                  <Bar
                    dataKey="rate"
                    fill="#0ea5e9" // sky-500 matching the screenshot
                    radius={[4, 4, 0, 0]}
                    barSize={80}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      {/* Adoption by Crop Chart */}
      <Panel title="Adoption by Crop" subtitle="Active policies per crop type">
        <div className="h-[280px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={cropAdoptionData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="crop"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <RechartsTooltip
                cursor={{ fill: "#f9fafb" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ color: "#111827", fontWeight: 500 }}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  "Active Policies",
                ]}
              />
              <Bar
                dataKey="policies"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={80}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Active Policy Registry Table */}
      <Panel
        title="Active Policy Registry"
        subtitle={`${registry?.total ?? 0} policies shown`}
        action={
          <select
            aria-label="Filter policy status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="">All statuses</option>
            {[
              "ACTIVE",
              "EXPIRED",
              "SCHEDULED",
              "UNVERIFIED",
              "PENDING_ACCEPTANCE",
              "DECLINED",
              "CANCELLED",
              "NEEDS_CORRECTION",
            ].map((value) => (
              <option value={value} key={value}>
                {label(value)}
              </option>
            ))}
          </select>
        }
      >
        <div className="relative max-w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] whitespace-nowrap text-sm">
            <thead>
              <tr className="group border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <SortableHeader
                  label="Policy ID"
                  sortKey="id"
                  className="pl-6"
                />
                <SortableHeader label="Holder" sortKey="holder" />
                <SortableHeader label="Sector" sortKey="sector" />
                <SortableHeader label="Crop" sortKey="crop" />
                <SortableHeader label="Sum Insured" sortKey="sumInsured" />
                <SortableHeader label="Expiry" sortKey="expiry" />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  className="pr-6"
                />
              </tr>
            </thead>
            <tbody>
              {!sortedPolicies.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No policies match this season and status.
                  </td>
                </tr>
              )}
              {sortedPolicies.map((policy, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="py-3 px-4 pl-6 font-medium text-gray-900">
                    {policy.id}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{policy.holder}</td>
                  <td className="py-3 px-4 text-gray-600">{policy.sector}</td>
                  <td className="py-3 px-4 text-gray-600">{policy.crop}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {policy.sumInsured?.toLocaleString() ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{policy.expiry}</td>
                  <td className="py-3 px-4 pr-6">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        policy.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                          : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/10"
                      }`}
                    >
                      {policy.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {Math.max(1, registry?.totalPages ?? 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= (registry?.totalPages ?? 1)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </Panel>
    </div>
  );
}
