import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Wallet, TrendingUp, PiggyBank, Receipt } from "lucide-react";
import {
  KpiCard,
  Panel,
  StatusBadge,
} from "@/components/government/gov-widgets";
import { useQuery } from "@tanstack/react-query";
import {
  getSubsidyInvoices,
  type SubsidyInvoice,
} from "@/services/governmentApi";
import { GovPageState } from "./GovPageState";
import { GovInvoicePage } from "./GovInvoicePage";
import { label, money as rwf, rwfShort } from "./governmentFormat";

import { Button } from "@/components/ui/button";

export function GovSubsidiesPage({
  regionId,
  season,
}: {
  regionId: string;
  season?: string;
}) {
  const [selected, setSelected] = useState<SubsidyInvoice | null>(null);
  const query = useQuery({
    queryKey: ["government", "subsidy-invoices", regionId, season],
    queryFn: () => getSubsidyInvoices(regionId, season),
  });
  if (query.isPending || query.error)
    return (
      <GovPageState
        loading={query.isPending}
        error={query.error}
        retry={() => query.refetch()}
      />
    );
  const data = query.data;
  const invoiceData = data.invoices;
  const invoice = selected;
  if (invoice)
    return (
      <GovInvoicePage
        invoice={invoice}
        regionId={regionId}
        onBack={() => setSelected(null)}
        onUpdated={setSelected}
      />
    );
  const utilizedPct = data.utilizationPercent;
  const subsidyByCrop = data.cropBreakdown.map((row) => ({
    crop: label(row.crop),
    amount: row.amount / 1e6,
  }));
  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Budget Allocated"
          value={
            data.budgetAllocated == null ? "—" : rwfShort(data.budgetAllocated)
          }
          unit="RWF"
          icon={PiggyBank}
          accent="info"
        />
        <KpiCard
          label="Subsidy Utilized"
          value={rwfShort(data.subsidyUtilized)}
          unit="RWF"
          icon={Wallet}
          accent="primary"
        />
        <KpiCard
          label="Remaining"
          value={data.remaining == null ? "—" : rwfShort(data.remaining)}
          unit="RWF"
          icon={TrendingUp}
          accent="warning"
        />
        <KpiCard
          label="Pending Invoices"
          value={String(data.pendingInvoices)}
          icon={Receipt}
          accent="destructive"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
        <Panel
          title="Budget Utilization"
          subtitle="Allocated vs utilized this season"
        >
          <div className="flex items-end justify-between">
            <span className="font-mono-nums text-4xl font-bold text-foreground">
              {utilizedPct == null ? "—" : `${utilizedPct}%`}
            </span>
            <span className="text-sm text-muted-foreground">
              {rwfShort(data.subsidyUtilized)} /{" "}
              {data.budgetAllocated == null
                ? "Not allocated"
                : rwfShort(data.budgetAllocated)}
            </span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${Math.max(0, Math.min(100, utilizedPct ?? 0))}%`,
              }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {data.remaining == null
              ? "No allocation has been recorded for this season."
              : `${rwf(data.remaining)} remaining for ${season ?? "this season"} disbursements.`}
          </p>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subsidy rate</span>
              <span className="text-foreground">
                {data.subsidyRate * 100}% of premium
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Farms covered</span>
              <span className="font-mono-nums text-foreground">
                {data.farmsCovered.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active insurers</span>
              <span className="text-foreground">{data.activeInsurers}</span>
            </div>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Subsidy by Crop"
          subtitle="Spending breakdown (millions RWF)"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subsidyByCrop} margin={{ left: -20, right: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="crop"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6", opacity: 0.8 }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#111827", fontWeight: 500 }}
                  formatter={(value: number, name: string) => [
                    `${value}M RWF`,
                    name === "amount" ? "Subsidy" : name,
                  ]}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-2">
        <Panel className="p-0" title="">
          <div className="px-5 pt-5">
            <h3 className="text-base font-semibold text-foreground">
              Aggregated Invoices
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Insurers bill the government for its {data.subsidyRate * 100}%
              share of the total premium
            </p>
          </div>
          <div className="relative mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[960px] whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Insurer</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Farms Covered</th>
                  <th className="px-4 py-3 font-medium">Total Premium (RWF)</th>
                  <th className="px-4 py-3 font-medium">
                    Gov. Share {data.subsidyRate * 100}% (RWF)
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {!invoiceData.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No subsidy invoices or unbilled policies for this season.
                    </td>
                  </tr>
                )}
                {invoiceData.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelected(inv)}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40 cursor-pointer"
                  >
                    <td className="px-5 py-3 font-mono text-foreground">
                      <button
                        className="hover:underline"
                        onClick={() => setSelected(inv)}
                      >
                        {inv.status === "NOT_ISSUED"
                          ? "Draft statement"
                          : `INV-${inv.id.slice(-8).toUpperCase()}`}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {inv.insurerName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {inv.season}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {inv.farmsCovered.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {rwf(inv.premiumTotal)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">
                      {rwf(inv.subsidyAmount)}
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <StatusBadge
                        status={
                          inv.status === "NOT_ISSUED"
                            ? "Not issued"
                            : inv.overdue
                              ? "Overdue"
                              : label(inv.status)
                        }
                      />
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
