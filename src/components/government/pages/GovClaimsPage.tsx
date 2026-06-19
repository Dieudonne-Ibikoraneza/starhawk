import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, Sprout, Banknote, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Panel, KpiCard, StatusBadge } from "@/components/government/gov-widgets";
import {
  claims,
  claimCauses,
  claimInsurers,
  claimStatuses,
  claimCauseList,
  crops,
} from "@/components/government/gov-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type EpicenterMode = "area" | "claims";

export function GovClaimsPage() {
  const [crop, setCrop] = useState("All Crops");
  const [insurer, setInsurer] = useState("All Insurers");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [status, setStatus] = useState("All Statuses");
  const [cause, setCause] = useState("All Causes");
  const [mode, setMode] = useState<EpicenterMode>("area");

  const rows = useMemo(
    () =>
      claims.filter(
        (c) =>
          (crop === "All Crops" || c.crop === crop) &&
          (insurer === "All Insurers" || c.insurer === insurer) &&
          (status === "All Statuses" || c.status === status) &&
          (cause === "All Causes" || c.cause === cause),
      ),
    [crop, insurer, status, cause],
  );

  const totalArea = claims.reduce((s, c) => s + c.areaLostHa, 0);
  const compensationPaid = claims
    .filter((c) => c.status === "Paid")
    .reduce((s, c) => s + c.value, 0);

  const dataKey = mode === "area" ? "area" : "count";
  const epicenterTotal = claimCauses.reduce((s, d) => s + (d[dataKey] as number), 0);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortCol(null); setSortDir("asc"); }
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      let valA = (a as any)[sortCol];
      let valB = (b as any)[sortCol];
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortCol, sortDir]);

  const SortHeader = ({ col, label, align = "left" }: { col: string, label: string, align?: string }) => (
    <th 
      className={`px-4 py-3 font-medium cursor-pointer hover:bg-gray-50 transition-colors select-none ${align === "right" ? "text-right pr-5" : ""}`}
      onClick={() => handleSort(col)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        {sortCol === col ? (
          sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </th>
  );

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Claims Filed" value="1,284" delta={18} icon={AlertTriangle} accent="destructive" />
        <KpiCard label="Area Lost" value={totalArea.toLocaleString(undefined, { maximumFractionDigits: 0 })} unit="ha" delta={12} icon={Sprout} accent="warning" />
        <KpiCard label="Total Compensation Paid" value={`${(compensationPaid / 1e6).toFixed(1)}M`} unit="RWF" delta={8} icon={Banknote} accent="primary" />
        <KpiCard label="Claims Approved" value="842" delta={4} icon={CheckCircle2} accent="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
        <Panel
          title="Disaster Epicenters"
          subtitle={mode === "area" ? "Damaged area by cause (ha)" : "Claims filed by cause"}
          className="lg:col-span-1"
          action={
            <div className="flex rounded-lg border border-border bg-card p-0.5">
              <ModeBtn active={mode === "area"} onClick={() => setMode("area")}>By Area</ModeBtn>
              <ModeBtn active={mode === "claims"} onClick={() => setMode("claims")}>By Claims</ModeBtn>
            </div>
          }
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={claimCauses} dataKey={dataKey} nameKey="cause" innerRadius={48} outerRadius={80} paddingAngle={3} style={{ outline: "none" }} activeShape={undefined}>
                  {claimCauses.map((d) => (
                    <Cell key={d.cause} fill={d.fill} style={{ outline: "none" }} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#111827", fontWeight: 500 }}
                  formatter={(v: number, name: string) => (mode === "area" ? [`${v.toLocaleString()} ha`, name] : [`${v}%`, name])}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {claimCauses.map((d) => {
              const v = d[dataKey] as number;
              return (
                <span key={d.cause} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.fill }} />
                  {d.cause}{" "}
                  {mode === "area"
                    ? `${Math.round((v / epicenterTotal) * 100)}%`
                    : `${v}%`}
                </span>
              );
            })}
          </div>
        </Panel>

        <Panel className="lg:col-span-2 p-0" title="">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Claim Tracking</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Monitor insurer payout speed — intervene if too slow</p>
            </div>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-medium text-muted-foreground">{rows.length} claims</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
            <FilterSelect value={crop} onChange={setCrop} options={[...crops]} width="w-[130px]" />
            <FilterSelect value={cause} onChange={setCause} options={[...claimCauseList]} width="w-[130px]" />
            <FilterSelect value={status} onChange={setStatus} options={[...claimStatuses]} width="w-[140px]" />
            <FilterSelect value={insurer} onChange={setInsurer} options={[...claimInsurers]} width="w-[160px]" />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <SortHeader col="id" label="Claim ID" />
                  <SortHeader col="farmer" label="Farmer" />
                  <SortHeader col="region" label="Sector" />
                  <SortHeader col="cause" label="Cause" />
                  <SortHeader col="areaLostHa" label="Area Lost (ha)" />
                  <SortHeader col="insurer" label="Insurer" />
                  <SortHeader col="status" label="Status" align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-foreground">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{c.farmer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.region}</td>
                    <td className="px-4 py-3 text-foreground">{c.cause}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{c.areaLostHa.toFixed(1)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.insurer}</td>
                    <td className="px-4 py-3 pr-5"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No claims match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  width: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("cursor-pointer", width)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
