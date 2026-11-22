import { useQuery } from "@tanstack/react-query";
import {
  getClaimsAndLosses,
  getClaimsRegistry,
  getReferenceCrops,
  getReferenceLossCauses,
  getReferenceClaimStatuses,
} from "@/services/governmentApi";
import { GovPageState } from "./GovPageState";
import { label } from "./governmentFormat";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  AlertTriangle,
  Sprout,
  Banknote,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Panel,
  KpiCard,
  StatusBadge,
} from "@/components/government/gov-widgets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GovClaimDetailsPage } from "./GovClaimDetailsPage";

type EpicenterMode = "area" | "claims";

export function GovClaimsPage({
  regionId,
  season,
}: {
  regionId: string;
  season?: string;
}) {
  const [page, setPage] = useState(1);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [crop, setCrop] = useState("All Crops");
  const [insurer, setInsurer] = useState("All Insurers");
  const [status, setStatus] = useState("All Statuses");
  const [cause, setCause] = useState("All Causes");
  const [mode, setMode] = useState<EpicenterMode>("area");

  const reference = useQuery({
    queryKey: ["government", "claim-reference"],
    queryFn: async () => {
      const [causes, statuses, crops] = await Promise.all([
        getReferenceLossCauses(),
        getReferenceClaimStatuses(),
        getReferenceCrops(),
      ]);
      return { causes, statuses, crops };
    },
  });
  const query = useQuery({
    queryKey: [
      "government",
      "claims",
      regionId,
      page,
      status,
      cause,
      crop,
      insurer,
      season,
      sortCol,
      sortDir,
    ],
    queryFn: async () => {
      const [analytics, registry] = await Promise.all([
        getClaimsAndLosses(regionId, season),
        getClaimsRegistry(
          regionId,
          page,
          20,
          status === "All Statuses" ? undefined : status,
          cause === "All Causes" ? undefined : cause,
          {
            crop: crop === "All Crops" ? undefined : crop,
            insurer: insurer === "All Insurers" ? undefined : insurer,
            sort: sortCol ?? undefined,
            direction: sortDir,
            season,
          },
        ),
      ]);
      return { analytics, registry };
    },
  });
  const analytics = query.data?.analytics,
    registry = query.data?.registry;
  const rows = (registry?.data ?? []).map((row) => ({
    ...row,
    farmer: row.farmer,
    region: row.sector || "Not recorded",
    insurer: row.insurerName || "Not recorded",
    cause: label(row.cause),
    status: row.paid ? "Paid" : label(row.status),
  }));
  const sortedRows = rows;
  const totalArea = analytics?.totalAreaLostHa;
  const compensationPaid = analytics?.payouts.totalPaidOut ?? 0;
  const fills = [
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
    "#64748b",
  ];
  const claimCauses = (analytics?.byLossEvent ?? []).map((row, index) => ({
    cause: label(row.type),
    count: row.count,
    area: row.areaLostHa ?? 0,
    fill: fills[index % fills.length],
  }));
  const dataKey = mode === "area" ? "area" : "count";
  const epicenterTotal = claimCauses.reduce(
    (sum, row) => sum + row[dataKey],
    0,
  );
  const crops = [
    { value: "All Crops", label: "All Crops" },
    ...(reference.data?.crops ?? []).map((value) => ({
      value,
      label: label(value),
    })),
  ];
  const claimInsurers = [
    { value: "All Insurers", label: "All Insurers" },
    ...(analytics?.insurers ?? []).map((row) => ({
      value: row.id,
      label: row.name,
    })),
  ];
  const claimStatuses = [
    { value: "All Statuses", label: "All Statuses" },
    ...(reference.data?.statuses ?? []).map((value) => ({
      value,
      label: label(value),
    })),
    { value: "PAID", label: "Paid" },
  ];
  const claimCauseList = [
    { value: "All Causes", label: "All Causes" },
    ...(reference.data?.causes ?? []).map((value) => ({
      value,
      label: label(value),
    })),
  ];
  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortCol(null);
        setSortDir("asc");
      }
    } else {
      setSortCol(col);
      setSortDir("asc");
      setPage(1);
    }
  };

  const SortHeader = ({
    col,
    label,
    align = "left",
  }: {
    col: string;
    label: string;
    align?: string;
  }) => (
    <th
      className={`px-4 py-3 font-medium cursor-pointer hover:bg-gray-50 transition-colors select-none ${align === "right" ? "text-right pr-5" : ""}`}
      onClick={() => handleSort(col)}
    >
      <div
        className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}
      >
        {label}
        {sortCol === col ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </th>
  );

  if (selectedClaimId) {
    return (
      <GovClaimDetailsPage
        claimId={selectedClaimId}
        onBack={() => setSelectedClaimId(null)}
      />
    );
  }

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Claims Filed"
          value={(analytics?.totals.total ?? 0).toLocaleString()}
          icon={AlertTriangle}
          accent="destructive"
        />
        <KpiCard
          label="Area Lost"
          value={
            totalArea?.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            }) ?? "—"
          }
          unit="ha"
          icon={Sprout}
          accent="warning"
        />
        <KpiCard
          label="Total Compensation Paid"
          value={`${(compensationPaid / 1e6).toFixed(1)}M`}
          unit="RWF"
          icon={Banknote}
          accent="primary"
        />
        <KpiCard
          label="Claims Approved"
          value={(analytics?.totals.approved ?? 0).toLocaleString()}
          icon={CheckCircle2}
          accent="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
        <Panel
          title="Disaster Epicenters"
          subtitle={
            mode === "area"
              ? "Damaged area by cause (ha)"
              : "Claims filed by cause"
          }
          className="lg:col-span-1"
          action={
            <div className="flex rounded-lg border border-border bg-card p-0.5">
              <ModeBtn active={mode === "area"} onClick={() => setMode("area")}>
                By Area
              </ModeBtn>
              <ModeBtn
                active={mode === "claims"}
                onClick={() => setMode("claims")}
              >
                By Claims
              </ModeBtn>
            </div>
          }
        >
          <div className="h-56">
            {epicenterTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={claimCauses}
                    dataKey={dataKey}
                    nameKey="cause"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                    style={{ outline: "none" }}
                    activeShape={undefined}
                  >
                    {claimCauses.map((d) => (
                      <Cell
                        key={d.cause}
                        fill={d.fill}
                        style={{ outline: "none" }}
                      />
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
                    formatter={(v: number, name: string) =>
                      mode === "area"
                        ? [`${v.toLocaleString()} ha`, name]
                        : [`${v} claims`, name]
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-center text-sm text-gray-500">
                {mode === "area"
                  ? "No assessed loss-area measurements."
                  : "No claims recorded."}
              </div>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {claimCauses.map((d) => {
              const v = d[dataKey] as number;
              return (
                <span
                  key={d.cause}
                  className="flex items-center gap-1.5 text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: d.fill }}
                  />
                  {d.cause}{" "}
                  {mode === "area"
                    ? `${epicenterTotal ? Math.round((v / epicenterTotal) * 100) : 0}%`
                    : `${epicenterTotal ? Math.round((v / epicenterTotal) * 100) : 0}%`}
                </span>
              );
            })}
          </div>
        </Panel>

        <Panel className="lg:col-span-2 p-0" title="">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Claim Tracking
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Monitor insurer payout speed — intervene if too slow
              </p>
            </div>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-medium text-muted-foreground">
              {rows.length} claims
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
            <FilterSelect
              value={crop}
              onChange={(value) => {
                setCrop(value);
                setPage(1);
              }}
              options={[...crops]}
              width="w-[130px]"
            />
            <FilterSelect
              value={cause}
              onChange={(value) => {
                setCause(value);
                setPage(1);
              }}
              options={[...claimCauseList]}
              width="w-[130px]"
            />
            <FilterSelect
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[...claimStatuses]}
              width="w-[140px]"
            />
            <FilterSelect
              value={insurer}
              onChange={(value) => {
                setInsurer(value);
                setPage(1);
              }}
              options={[...claimInsurers]}
              width="w-[160px]"
            />
          </div>

          <div className="relative mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[1000px] whitespace-nowrap text-sm">
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
                  <tr
                    key={c.id}
                    onClick={() => setSelectedClaimId(c.id)}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40 cursor-pointer"
                  >
                    <td className="px-5 py-3 font-mono text-foreground">
                      {c.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {c.farmer}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.region}
                    </td>
                    <td className="px-4 py-3 text-foreground">{c.cause}</td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {c.areaLostHa?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.insurer}
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No claims match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 p-4 text-sm">
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
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
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
  options: { value: string; label: string }[];
  width: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={options[0]?.label}
        className={cn("cursor-pointer", width)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
