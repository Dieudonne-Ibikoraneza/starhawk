import { useMemo, useState } from "react";
import { Panel, KpiCard } from "@/components/government/gov-widgets";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { PiggyBank, Wallet, TrendingUp, Receipt, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export function GovSubsidiesPage() {
  const cropSubsidyData = [
    { crop: "Maize", subsidy: 320 },
    { crop: "Rice", subsidy: 250 },
    { crop: "Beans", subsidy: 150 },
    { crop: "Cassava", subsidy: 90 },
    { crop: "Vegetables", subsidy: 60 },
  ];

  const invoicesData = [
    { invoice: "INV-2026-06", insurer: "Radiant Yacu", period: "Jun 2026", farms: 4120, subsidy: 184000000, issued: "2026-06-01", status: "Pending" },
    { invoice: "INV-2026-05", insurer: "Prime Insurance", period: "May 2026", farms: 3380, subsidy: 142500000, issued: "2026-05-01", status: "Paid" },
    { invoice: "INV-2026-05B", insurer: "Sanlam", period: "May 2026", farms: 2210, subsidy: 96800000, issued: "2026-05-01", status: "Paid" },
    { invoice: "INV-2026-04", insurer: "Radiant Yacu", period: "Apr 2026", farms: 3990, subsidy: 171200000, issued: "2026-04-01", status: "Overdue" },
    { invoice: "INV-2026-04B", insurer: "Prime Insurance", period: "Apr 2026", farms: 3010, subsidy: 128400000, issued: "2026-04-01", status: "Paid" },
  ];

  type InvoiceRow = typeof invoicesData[0];
  type SortConfig = { key: keyof InvoiceRow; direction: "asc" | "desc" } | null;

  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const sortedInvoices = useMemo(() => {
    let list = [...invoicesData];
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

  const handleSort = (key: keyof InvoiceRow) => {
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

  const SortableHeader = ({ label, sortKey, className = "" }: { label: string, sortKey: keyof InvoiceRow, className?: string }) => {
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
          label="Budget Allocated"
          value="1200M RWF"
          icon={PiggyBank}
          accent="info"
        />
        <KpiCard
          label="Subsidy Utilized"
          value="878M RWF"
          delta={0.09}
          deltaLabel="vs last period"
          icon={Wallet}
          accent="primary"
        />
        <KpiCard
          label="Remaining"
          value="322M RWF"
          icon={TrendingUp}
          accent="warning"
        />
        <KpiCard
          label="Pending Invoices"
          value="2"
          icon={Receipt}
          accent="destructive"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Budget Utilization */}
        <Panel title="Budget Utilization" subtitle="Allocated vs utilized this season" className="lg:col-span-1">
          <div className="flex flex-col gap-6 pt-2">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-4xl font-bold tracking-tight text-gray-900">73%</span>
                <span className="text-sm font-medium text-gray-500">878M / 1200M</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "73%" }} />
              </div>
              <p className="mt-3 text-sm text-gray-500">
                322M RWF remaining for Season A disbursements.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                <span className="text-gray-500">Subsidy rate</span>
                <span className="font-medium text-gray-900">40% of premium</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                <span className="text-gray-500">Farms covered</span>
                <span className="font-medium text-gray-900">17,710</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                <span className="text-gray-500">Active insurers</span>
                <span className="font-medium text-gray-900">3</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Subsidy by Crop */}
        <Panel title="Subsidy by Crop" subtitle="Spending breakdown (millions RWF)" className="lg:col-span-2">
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={cropSubsidyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
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
                  domain={[0, 320]}
                  ticks={[0, 80, 160, 240, 320]}
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
                  formatter={(value: number, name: string) => [`${value}M`, name]}
                />
                <Bar 
                  dataKey="subsidy" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                  name="Subsidy"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Aggregated Invoices Table */}
      <Panel title="Aggregated Invoices" subtitle="Insurers billing the government for the subsidized premium portion">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="group border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <SortableHeader label="Invoice" sortKey="invoice" className="pl-6" />
                <SortableHeader label="Insurer" sortKey="insurer" />
                <SortableHeader label="Period" sortKey="period" />
                <SortableHeader label="Farms Covered" sortKey="farms" />
                <SortableHeader label="Subsidy (RWF)" sortKey="subsidy" />
                <SortableHeader label="Issued" sortKey="issued" />
                <SortableHeader label="Status" sortKey="status" className="pr-6" />
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((inv, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="py-4 px-4 pl-6 font-medium text-gray-900">{inv.invoice}</td>
                  <td className="py-4 px-4 text-gray-600">{inv.insurer}</td>
                  <td className="py-4 px-4 text-gray-600">{inv.period}</td>
                  <td className="py-4 px-4 text-gray-600">{inv.farms.toLocaleString()}</td>
                  <td className="py-4 px-4 text-gray-600">{inv.subsidy.toLocaleString()}</td>
                  <td className="py-4 px-4 text-gray-600">{inv.issued}</td>
                  <td className="py-4 px-4 pr-6">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                      inv.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 
                      'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                    }`}>
                      {inv.status}
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
