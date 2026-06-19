import { useEffect, useMemo, useState } from "react";
import { Panel, DeltaPill, StatusBadge, KpiCard } from "@/components/government/gov-widgets";
import {
  getSectorDetail,
  type CellNode,
  type Farmer,
} from "@/components/government/gov-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FarmerDialog } from "./GovLeaderboardPage";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  MapPinned,
  Sprout,
  Search,
  Layers,
  ChevronRight,
  ChevronLeft,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function GovSectorPage({
  sectorId,
  onBack,
  onCellSelect,
  onNavigate,
  onFarmerSelect,
}: {
  sectorId: string;
  onBack: () => void;
  onCellSelect?: (cellId: string) => void;
  onNavigate?: (target: { level: "Leaderboard" | "Sector" | "Cell" | "Village" | "Farmer"; id?: string }) => void;
  onFarmerSelect?: (farmerId: string) => void;
}) {
  const detail = useMemo(() => getSectorDetail(sectorId), [sectorId]);

  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold">Sector not found</h2>
        <p className="mt-2 text-muted-foreground">This sector does not exist.</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          Back to leaderboard
        </button>
      </div>
    );
  }

  const { sector, cells, farmers, stats } = detail;
  const insuredPct = Math.round((stats.insuredFarmers / stats.totalFarmers) * 100);

  // Deterministic deltas vs last season based on stats
  const registeredDelta = 4 + (stats.totalFarmers % 7);
  const insuredDelta = 2 + (insuredPct % 9);
  const cultivatedDelta = -3 + (sector.cultivatedHa % 9);

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <nav className="flex flex-nowrap items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1 max-w-full">
          <button
            onClick={() => onNavigate?.({ level: "Leaderboard" })}
            className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0"
          >
            <Home className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-foreground truncate max-w-[100px] sm:max-w-none shrink-0">{sector.name}</span>
        </nav>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{sector.name} Sector</h1>
        <p className="text-muted-foreground">{sector.level} overview — cells, villages, farmers & crop mix</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard label="Registered Farmers" value={stats.totalFarmers.toLocaleString()} delta={registeredDelta} deltaLabel="vs last season" icon={Users} accent="primary" />
        <KpiCard label="Insured" value={`${insuredPct}%`} delta={insuredDelta} deltaLabel="vs last season" icon={ShieldCheck} accent="info" />
        <KpiCard label="Cells / Villages" value={`${stats.totalCells} / ${stats.totalVillages}`} icon={Layers} accent="warning" />
        <KpiCard label="Cultivated" value={sector.cultivatedHa.toLocaleString()} unit="ha" delta={cultivatedDelta} deltaLabel="vs last season" icon={Sprout} accent="primary" />
      </div>

      {/* Descriptive overview */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Sector Snapshot" className="xl:col-span-1">
          <dl className="space-y-3 text-sm">
            <Row label="Avg NDVI">
              <span className="font-mono font-semibold text-foreground">{sector.ndvi.toFixed(2)}</span>
            </Row>
            <Row label="7-day change"><DeltaPill value={sector.change7d} /></Row>
            <Row label="30-day change"><DeltaPill value={sector.change30d} /></Row>
            <Row label="Insurance penetration">
              <span className="font-mono text-foreground">{sector.insurancePenetration}%</span>
            </Row>
            <Row label="Active claims">
              <span className="font-mono text-foreground">{sector.activeClaims}</span>
            </Row>
            <Row label="Dominant crop">
              <span className="text-foreground">{sector.dominantCrop}</span>
            </Row>
            <Row label="Risk level"><StatusBadge status={sector.riskLevel} /></Row>
          </dl>
        </Panel>

        <Panel title="Crop Mix" subtitle="Cultivated area by crop (ha)" className="xl:col-span-2">
          <CropMix data={stats.cropMix} />
        </Panel>
      </div>

      {/* Cells & villages */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <MapPinned className="h-5 w-5 text-primary" /> Cells
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cells.map((cell) => (
            <CellCard key={cell.id} cell={cell} onClick={() => onCellSelect?.(cell.id)} />
          ))}
        </div>
      </div>

      {/* Farmers */}
      <FarmersTable farmers={farmers} cells={cells} sectorName={sector.name} onFarmerSelect={onFarmerSelect} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function getCropColorClass(crop: string): string {
  switch (crop.toLowerCase()) {
    case "maize":
      return "bg-amber-500";
    case "beans":
      return "bg-emerald-500";
    case "rice":
      return "bg-blue-500";
    case "cassava":
      return "bg-purple-500";
    case "vegetables":
      return "bg-green-500";
    case "wheat":
      return "bg-yellow-600";
    case "sorghum":
      return "bg-indigo-500";
    case "potatoes":
    case "irish potato":
      return "bg-orange-500";
    case "bananas":
      return "bg-yellow-400";
    case "coffee":
      return "bg-rose-700";
    case "tea":
      return "bg-teal-600";
    default:
      return "bg-primary";
  }
}

function CropMix({ data }: { data: { crop: string; ha: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const max = data[0]?.ha || 1;
  return (
    <div className="space-y-3">
      {data.map((c, i) => (
        <div key={c.crop} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium text-foreground">{c.crop}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-[width] duration-700 ease-out", getCropColorClass(c.crop))}
              style={{ width: mounted ? `${(c.ha / max) * 100}%` : "0%", transitionDelay: `${i * 80}ms` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-sm text-muted-foreground">{c.ha} ha</span>
        </div>
      ))}
    </div>
  );
}

function CellCard({ cell, onClick }: { cell: CellNode; onClick?: () => void }) {
  return (
    <Panel 
      className={cn("p-4", onClick && "cursor-pointer transition-colors hover:bg-secondary/40")}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{cell.name} Cell</h3>
          <p className="text-xs text-muted-foreground">{cell.villages.length} villages · {cell.farmers} farmers</p>
        </div>
        <span className="font-mono text-sm font-semibold text-primary">{cell.ndvi.toFixed(2)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {cell.villages.slice(0, 3).map((v) => (
          <span key={v.id} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {v.name} · {v.farmers}
          </span>
        ))}
        {cell.villages.length > 3 && (
          <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-xs text-muted-foreground font-semibold">
            +{cell.villages.length - 3} more
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{cell.cultivatedHa} ha cultivated</span>
        <span>{cell.insurancePenetration}% insured</span>
      </div>
    </Panel>
  );
}

const PAGE_SIZE = 20;

function FarmersTable({ farmers, cells, sectorName, onFarmerSelect }: { farmers: Farmer[]; cells: CellNode[]; sectorName: string; onFarmerSelect?: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [cell, setCell] = useState("All Cells");
  const [ins, setIns] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Farmer | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return farmers.filter((f) => {
      if (cell !== "All Cells" && f.cell !== cell) return false;
      if (ins === "insured" && !f.insured) return false;
      if (ins === "uninsured" && f.insured) return false;
      if (needle && !f.name.toLowerCase().includes(needle) && !f.crops.join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [farmers, q, cell, ins]);

  useEffect(() => setPage(1), [q, cell, ins]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Users className="h-5 w-5 text-primary" /> Registered Farmers
          <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-normal text-muted-foreground">{filtered.length}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search farmer or crop…"
              className="w-44 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Select value={cell} onValueChange={setCell}>
            <SelectTrigger className="w-[140px] cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All Cells">All Cells</SelectItem>
              {[...new Set(cells.map((c) => c.name))].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ins} onValueChange={setIns}>
            <SelectTrigger className="w-[130px] cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="insured">Insured</SelectItem>
              <SelectItem value="uninsured">Uninsured</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Panel className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 pl-6 font-medium">Farmer</th>
                <th className="px-4 py-3 font-medium">Cell</th>
                <th className="px-4 py-3 font-medium">Village</th>
                <th className="px-4 py-3 font-medium">Crops</th>
                <th className="px-4 py-3 font-medium">Plots</th>
                <th className="px-4 py-3 font-medium">NDVI</th>
                <th className="px-4 py-3 font-medium">Insured</th>
                <th className="px-4 py-3 pr-6 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => onFarmerSelect?.(f.id)}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3 pl-6 font-medium text-foreground">{f.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.cell}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.village}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {f.crops.map((c) => (
                        <span key={c} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground">{f.plotsHa} ha</td>
                  <td className="px-4 py-3 font-mono text-foreground">{f.ndvi.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {f.insured ? (
                      <span className="text-emerald-500 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-500 font-medium">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 pr-6"><StatusBadge status={f.riskLevel} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No farmers match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Showing <span className="font-mono text-foreground">{start}–{end}</span> of{" "}
              <span className="font-mono text-foreground">{filtered.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-muted-foreground">Page {safePage} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}
