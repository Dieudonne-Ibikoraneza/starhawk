import { useMemo, useState } from "react";
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
import { Wallet, ShieldCheck, FileText, FileWarning, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export function GovPoliciesPage() {
  const genderData = [
    { name: "Female", value: 54, color: "#10b981" }, // emerald-500
    { name: "Male", value: 46, color: "#0ea5e9" },   // sky-500
  ];

  const ageData = [
    { age: "18-30", rate: 18 },
    { age: "31-45", rate: 42 },
    { age: "46-60", rate: 28 },
    { age: "60+", rate: 12 },
  ];

  const policiesData = [
    { id: "POL-8801", holder: "J. Uwimana", sector: "Kinyinya", crop: "Rice", sumInsured: 3200000, expiry: "2026-12-31", status: "Active" },
    { id: "POL-8802", holder: "E. Mukamana", sector: "Bumbogo", crop: "Rice", sumInsured: 2800000, expiry: "2026-12-31", status: "Active" },
    { id: "POL-8803", holder: "P. Habimana", sector: "Ndera", crop: "Cassava", sumInsured: 1500000, expiry: "2026-11-30", status: "Active" },
    { id: "POL-8804", holder: "C. Niyonsaba", sector: "Gisozi", crop: "Maize", sumInsured: 2100000, expiry: "2026-12-31", status: "Active" },
    { id: "POL-8805", holder: "A. Ingabire", sector: "Jabana", crop: "Beans", sumInsured: 980000, expiry: "2026-05-01", status: "Expired" },
    { id: "POL-8806", holder: "D. Bizimana", sector: "Rusororo", crop: "Maize", sumInsured: 2600000, expiry: "2026-12-31", status: "Active" },
    { id: "POL-8807", holder: "M. Uwase", sector: "Remera", crop: "Maize", sumInsured: 1750000, expiry: "2026-10-15", status: "Active" },
    { id: "POL-8808", holder: "S. Nkurunziza", sector: "Nduba", crop: "Cassava", sumInsured: 1340000, expiry: "2026-04-20", status: "Expired" },
  ];

  type PolicyRow = typeof policiesData[0];
  type SortConfig = { key: keyof PolicyRow; direction: "asc" | "desc" } | null;

  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const sortedPolicies = useMemo(() => {
    let list = [...policiesData];
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
  };

  const SortableHeader = ({ label, sortKey, className = "" }: { label: string, sortKey: keyof PolicyRow, className?: string }) => {
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
          label="Total Sum Insured"
          value="0.02B RWF"
          icon={Wallet}
          accent="primary"
        />
        <KpiCard
          label="Active Policies"
          value="24,180"
          delta={0.05}
          deltaLabel="vs last period"
          icon={ShieldCheck}
          accent="primary"
        />
        <KpiCard
          label="Active vs Expired"
          value="6/2"
          icon={FileText}
          accent="info"
        />
        <KpiCard
          label="Coverage Gaps"
          value="4,230"
          unit="farms"
          delta={-0.03}
          deltaLabel="vs last period"
          icon={FileWarning}
          accent="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gender Donut Chart */}
        <Panel title="Adoption by Gender" subtitle="Equitable access tracking" className="lg:col-span-1">
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
                  formatter={(value: number) => [`${value}%`, "Adoption"]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              {genderData.map((item) => (
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

        {/* Age Bar Chart */}
        <Panel title="Adoption by Age Group" subtitle="Policy adoption rate (%)" className="lg:col-span-2">
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
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
                  domain={[0, 60]}
                  ticks={[0, 15, 30, 45, 60]}
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
                  formatter={(value: number) => [`${value}%`, "Adoption Rate"]}
                />
                <Bar 
                  dataKey="rate" 
                  fill="#0ea5e9" // sky-500 matching the screenshot
                  radius={[4, 4, 0, 0]}
                  barSize={80}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Active Policy Registry Table */}
      <Panel title="Active Policy Registry" subtitle="8 policies shown">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="group border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <SortableHeader label="Policy ID" sortKey="id" className="pl-6" />
                <SortableHeader label="Holder" sortKey="holder" />
                <SortableHeader label="Sector" sortKey="sector" />
                <SortableHeader label="Crop" sortKey="crop" />
                <SortableHeader label="Sum Insured" sortKey="sumInsured" />
                <SortableHeader label="Expiry" sortKey="expiry" />
                <SortableHeader label="Status" sortKey="status" className="pr-6" />
              </tr>
            </thead>
            <tbody>
              {sortedPolicies.map((policy, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 px-4 pl-6 font-medium text-gray-900">{policy.id}</td>
                  <td className="py-3 px-4 text-gray-600">{policy.holder}</td>
                  <td className="py-3 px-4 text-gray-600">{policy.sector}</td>
                  <td className="py-3 px-4 text-gray-600">{policy.crop}</td>
                  <td className="py-3 px-4 text-gray-600">{policy.sumInsured.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{policy.expiry}</td>
                  <td className="py-3 px-4 pr-6">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      policy.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                      'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                    }`}>
                      {policy.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
