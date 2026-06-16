import { useMemo, useState } from "react";
import { Panel, KpiCard } from "@/components/government/gov-widgets";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Wallet, CheckCircle, XCircle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export function GovClaimsPage() {
  const causeData = [
    { name: "Drought", value: 60, color: "#f59e0b" }, // amber-500
    { name: "Flood", value: 30, color: "#0ea5e9" },   // sky-500
    { name: "Pest", value: 10, color: "#10b981" },    // emerald-500
  ];

  const claimsData = [
    { id: "CLM-2041", farmer: "J. Uwimana", sector: "Kinyinya", cause: "Drought", value: 1850000, insurer: "Radiant Yacu", status: "Pending" },
    { id: "CLM-2042", farmer: "E. Mukamana", sector: "Bumbogo", cause: "Flood", value: 2400000, insurer: "Prime Insurance", status: "Approved" },
    { id: "CLM-2043", farmer: "P. Habimana", sector: "Ndera", cause: "Pest", value: 720000, insurer: "Sanlam", status: "Paid" },
  ];

  type ClaimRow = typeof claimsData[0];
  type SortConfig = { key: keyof ClaimRow; direction: "asc" | "desc" } | null;

  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const sortedClaims = useMemo(() => {
    let list = [...claimsData];
    if (sortConfig !== null) {
      list.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (typeof valA === "string" && typeof valB === "string") {
          return sortConfig.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        
        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        
        return 0;
      });
    }
    return list;
  }, [sortConfig]);

  const handleSort = (key: keyof ClaimRow) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ label, sortKey, className = "" }: { label: string, sortKey: keyof ClaimRow, className?: string }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th className={`px-4 py-3 font-medium ${className}`}>
        <button 
          onClick={() => handleSort(sortKey)}
          className="flex items-center gap-1.5 uppercase tracking-wide hover:text-gray-900 focus:outline-none"
        >
          {label}
          {isActive ? (
            sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 text-gray-400" />
          )}
        </button>
      </th>
    );
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Claims Filed"
          value="1,284"
          delta={0.18}
          deltaLabel="vs last period"
          icon={AlertTriangle}
          accent="destructive"
        />
        <KpiCard
          label="Est. Loss Value"
          value="1235M RWF"
          delta={0.12}
          deltaLabel="vs last period"
          icon={Wallet}
          accent="warning"
        />
        <KpiCard
          label="Claims Approved"
          value="842"
          delta={0.04}
          deltaLabel="vs last period"
          icon={CheckCircle}
          accent="primary"
        />
        <KpiCard
          label="Claims Rejected"
          value="118"
          icon={XCircle}
          accent="destructive"
        />
      </div>

      {/* Charts & Tables Row */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Disaster Epicenters Donut Chart */}
        <Panel title="Disaster Epicenters" subtitle="Claims grouped by cause" className="lg:col-span-1">
          <div className="flex h-[320px] flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={causeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {causeData.map((entry, index) => (
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
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-4 px-4">
              {causeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-gray-600">
                    {item.name} {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Claim Tracking Table */}
        <Panel title="Claim Tracking" subtitle="Monitor insurer payout speed — intervene if too slow" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="group border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <SortableHeader label="Claim ID" sortKey="id" className="pl-6" />
                  <SortableHeader label="Farmer" sortKey="farmer" />
                  <SortableHeader label="Sector" sortKey="sector" />
                  <SortableHeader label="Cause" sortKey="cause" />
                  <SortableHeader label="Value (RWF)" sortKey="value" />
                  <SortableHeader label="Insurer" sortKey="insurer" />
                  <SortableHeader label="Status" sortKey="status" className="pr-6" />
                </tr>
              </thead>
              <tbody>
                {sortedClaims.map((claim, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="py-4 px-4 pl-6 font-medium text-gray-900">{claim.id}</td>
                    <td className="py-4 px-4 text-gray-600">{claim.farmer}</td>
                    <td className="py-4 px-4 text-gray-600">{claim.sector}</td>
                    <td className="py-4 px-4 text-gray-600">{claim.cause}</td>
                    <td className="py-4 px-4 text-gray-600">{claim.value.toLocaleString()}</td>
                    <td className="py-4 px-4 text-gray-600">{claim.insurer}</td>
                    <td className="py-4 px-4 pr-6">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        claim.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                        claim.status === 'Approved' ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20' : 
                        'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
