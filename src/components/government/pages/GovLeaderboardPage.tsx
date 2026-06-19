import { useMemo, useState } from "react";
import { Panel, DeltaPill, StatusBadge } from "@/components/government/gov-widgets";
import {
  getAllRegionsByLevel,
  crops,
  seasons,
  allFarmers,
  type RegionRow,
  type Farmer,
} from "@/components/government/gov-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  TrendingUp,
  List,
  Search,
  X,
  ChevronRight,
  User,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = "attention" | "top" | "all";
type SortConfig = { key: keyof RegionRow | "rank"; direction: "asc" | "desc" } | null;

export function GovLeaderboardPage({
  crop,
  season,
  onSectorSelect,
  onCropChange,
}: {
  crop: string;
  season: string;
  onSectorSelect?: (id: string, level: "Sector" | "Cell" | "Village") => void;
  onCropChange?: (crop: string) => void;
}) {
  const [view, setView] = useState<View>("attention");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [query, setQuery] = useState("");

  const [level, setLevel] = useState<"Sector" | "Cell" | "Village">("Sector");
  const regions = useMemo(() => getAllRegionsByLevel(level), [level]);

  const rows = useMemo(() => {
    let list = [...regions];
    if (crop !== "All Crops") list = list.filter((r) => r.dominantCrop === crop);

    if (sortConfig) {
      list.sort((a, b) => {
        const valA = a[sortConfig.key as keyof RegionRow];
        const valB = b[sortConfig.key as keyof RegionRow];
        if (typeof valA === "string" && typeof valB === "string") {
          return sortConfig.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        return 0;
      });
    } else {
      if (view === "attention") {
        list.sort((a, b) => a.change7d - b.change7d || b.activeClaims - a.activeClaims);
      } else if (view === "top") {
        list.sort((a, b) => b.ndvi - a.ndvi || b.insurancePenetration - a.insurancePenetration);
      } else {
        list.sort((a, b) => b.ndvi - a.ndvi);
      }
    }
    return list;
  }, [view, crop, sortConfig, regions]);

  const needle = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!needle) return { sectors: [] as RegionRow[], farmers: [] as Farmer[] };
    const sectors = regions.filter(
      (r) => r.name.toLowerCase().includes(needle) || r.dominantCrop.toLowerCase().includes(needle),
    );
    const farmers = allFarmers
      .filter(
        (f) =>
          f.name.toLowerCase().includes(needle) ||
          f.cell.toLowerCase().includes(needle) ||
          f.village.toLowerCase().includes(needle) ||
          f.crops.join(" ").toLowerCase().includes(needle),
      )
      .slice(0, 8);
    return { sectors, farmers };
  }, [needle, regions]);

  const sectorName = (id: string) => regions.find((r) => r.id === id)?.name ?? id;

  const handleSort = (key: keyof RegionRow | "rank") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else { setSortConfig(null); return; }
    }
    setSortConfig({ key, direction });
  };

  const handleSectorClick = (sectorId: string) => {
    setQuery("");
    onSectorSelect?.(sectorId, level);
  };

  const SortableHeader = ({
    label,
    sortKey,
    className = "",
  }: {
    label: string;
    sortKey: keyof RegionRow | "rank";
    className?: string;
  }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th className={`px-4 py-3 font-medium ${className}`}>
        <button
          onClick={() => handleSort(sortKey)}
          className="flex items-center gap-1.5 uppercase tracking-wide hover:text-foreground focus:outline-none"
        >
          {label}
          {isActive ? (
            sortConfig!.direction === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDown className="h-3 w-3 text-primary" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-30" />
          )}
        </button>
      </th>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={view}
          onValueChange={(v) => { setView(v as View); setSortConfig(null); }}
          className="w-full sm:w-auto"
        >
          <TabsList className="flex w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] justify-start sm:justify-center sm:w-auto p-1">
            <TabsTrigger value="attention" className="gap-1.5 shrink-0 whitespace-nowrap">
              <AlertTriangle className="h-4 w-4" /> Needs Attention
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-1.5 shrink-0 whitespace-nowrap">
              <TrendingUp className="h-4 w-4" /> Top Performers
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5 shrink-0 whitespace-nowrap">
              <List className="h-4 w-4" /> All {level}s
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={level} onValueChange={(val: any) => setLevel(val)}>
            <SelectTrigger className="w-[120px] bg-white border-gray-200 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              {["Sector", "Cell", "Village"].map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={crop} onValueChange={(val) => onCropChange?.(val)}>
            <SelectTrigger className="w-[140px] bg-white border-gray-200 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="All Crops" />
            </SelectTrigger>
            <SelectContent>
              {crops.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by sector, farmer name, cell, village or crop…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {needle && (
          <Panel className="mt-2 p-2">
            {searchResults.sectors.length === 0 && searchResults.farmers.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No matches for "{query}".
              </p>
            ) : (
              <div className="space-y-1">
                {searchResults.sectors.length > 0 && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Sectors
                  </p>
                )}
                {searchResults.sectors.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSectorClick(r.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/60"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-sm font-medium text-foreground">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.dominantCrop} · {r.cultivatedHa.toLocaleString()} ha
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
                {searchResults.farmers.length > 0 && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Farmers
                  </p>
                )}
                {searchResults.farmers.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSectorClick(f.sectorId)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/60"
                  >
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="flex-1 text-sm font-medium text-foreground">{f.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {sectorName(f.sectorId)} · {f.cell}, {f.village}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}
      </div>

      {/* Table */}
      <Panel className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 pl-6 font-medium uppercase tracking-wide">#</th>
                <SortableHeader label="Region" sortKey="name" />
                <SortableHeader label="Cultivated" sortKey="cultivatedHa" />
                <SortableHeader label="Dominant Crop" sortKey="dominantCrop" />
                <SortableHeader label="Avg NDVI" sortKey="ndvi" />
                <SortableHeader label="7D" sortKey="change7d" />
                <SortableHeader label="30D" sortKey="change30d" />
                <SortableHeader label="Insurance" sortKey="insurancePenetration" />
                <SortableHeader label="Claims" sortKey="activeClaims" />
                <SortableHeader label="Risk" sortKey="riskLevel" className="pr-6" />
                <th className="px-4 py-3 pr-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <LeaderRow
                  key={r.id}
                  rank={i + 1}
                  r={r}
                  onOpen={() => handleSectorClick(r.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function LeaderRow({ rank, r, onOpen }: { rank: number; r: RegionRow; onOpen: () => void }) {
  return (
    <tr
      onClick={onOpen}
      className={cn(
        "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40",
      )}
    >
      <td className="px-4 py-3 pl-6 font-mono text-muted-foreground">{rank}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{r.name}</div>
        <div className="text-xs text-muted-foreground">{r.level}</div>
      </td>
      <td className="px-4 py-3 font-mono text-foreground">{r.cultivatedHa.toLocaleString()} ha</td>
      <td className="px-4 py-3 text-foreground">{r.dominantCrop}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-foreground">{r.ndvi.toFixed(2)}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${r.ndvi * 100}%`,
                backgroundColor:
                  r.ndvi < 0.62 ? "#ef4444" : r.ndvi < 0.7 ? "#f59e0b" : "#10b981",
              }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><DeltaPill value={r.change7d} /></td>
      <td className="px-4 py-3"><DeltaPill value={r.change30d} /></td>
      <td className="px-4 py-3 font-mono text-foreground">{r.insurancePenetration}%</td>
      <td className="px-4 py-3 font-mono text-foreground">{r.activeClaims}</td>
      <td className="px-4 py-3 pr-6"><StatusBadge status={r.riskLevel} /></td>
      <td className="px-4 py-3 pr-6 text-right">
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </td>
    </tr>
  );
}

// ─── Farmer Quick-View Dialog (for future farmer search result clicks) ────────

export function FarmerDialog({
  farmer,
  sectorName,
  onClose,
}: {
  farmer: Farmer | null;
  sectorName: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!farmer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {farmer && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{farmer.name}</DialogTitle>
              <DialogDescription>
                {farmer.village} Village · {farmer.cell} Cell · {sectorName} Sector
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <StatCard label="Farmer ID" value={farmer.id} mono />
              <StatCard label="Plots" value={`${farmer.plotsHa} ha`} mono />
              <StatCard label="NDVI" value={farmer.ndvi.toFixed(2)} mono />
              <StatCard label="Insurance" value={farmer.insured ? "Insured" : "Uninsured"} />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Crops cultivated
              </p>
              <div className="flex flex-wrap gap-1.5">
                {farmer.crops.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">Risk level</span>
              <StatusBadge status={farmer.riskLevel} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold text-foreground", mono && "font-mono")}>
        {value}
      </p>
    </div>
  );
}
