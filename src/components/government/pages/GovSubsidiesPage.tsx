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
import { KpiCard, Panel, StatusBadge } from "@/components/government/gov-widgets";
import { invoices, subsidyByCrop, subsidyBudget, rwf } from "@/components/government/gov-data";

export function GovSubsidiesPage() {
  const utilizedPct = Math.round((subsidyBudget.utilized / subsidyBudget.allocated) * 100);

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Budget Allocated" value={`${subsidyBudget.allocated}M`} unit="RWF" icon={PiggyBank} accent="info" />
        <KpiCard label="Subsidy Utilized" value={`${subsidyBudget.utilized}M`} unit="RWF" delta={9} icon={Wallet} accent="primary" />
        <KpiCard label="Remaining" value={`${subsidyBudget.allocated - subsidyBudget.utilized}M`} unit="RWF" icon={TrendingUp} accent="warning" />
        <KpiCard label="Pending Invoices" value="2" icon={Receipt} accent="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
        <Panel title="Budget Utilization" subtitle="Allocated vs utilized this season">
          <div className="flex items-end justify-between">
            <span className="font-mono-nums text-4xl font-bold text-foreground">{utilizedPct}%</span>
            <span className="text-sm text-muted-foreground">{subsidyBudget.utilized}M / {subsidyBudget.allocated}M</span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${utilizedPct}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {subsidyBudget.allocated - subsidyBudget.utilized}M RWF remaining for Season A disbursements.
          </p>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subsidy rate</span><span className="text-foreground">40% of premium</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Farms covered</span><span className="font-mono-nums text-foreground">17,710</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Active insurers</span><span className="text-foreground">3</span></div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Subsidy by Crop" subtitle="Spending breakdown (millions RWF)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subsidyByCrop} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="crop" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#111827", fontWeight: 500 }}
                  formatter={(value: number, name: string) => [`${value}M RWF`, name === "amount" ? "Subsidy" : name]}
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
            <h3 className="text-base font-semibold text-foreground">Aggregated Invoices</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Insurers bill the government for its 40% share of the total premium</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Insurer</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Farms Covered</th>
                  <th className="px-4 py-3 font-medium">Total Premium (RWF)</th>
                  <th className="px-4 py-3 font-medium">Gov. Share 40% (RWF)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-foreground">{inv.id}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{inv.insurer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.period}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{inv.farmsCovered.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{rwf(inv.subsidyAmount / 0.4)}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{rwf(inv.subsidyAmount)}</td>
                    <td className="px-4 py-3 pr-5"><StatusBadge status={inv.status} /></td>
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
