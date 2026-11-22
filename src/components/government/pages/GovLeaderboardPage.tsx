import { useMemo, useState } from "react";
import {
  Panel,
  DeltaPill,
  StatusBadge,
} from "@/components/government/gov-widgets";
import { useQuery } from "@tanstack/react-query";
import {
  getRegionLeaderboard,
  type RegionLeaderboard,
} from "@/services/governmentApi";
import { GovPageState } from "./GovPageState";
import { GovBreadcrumb } from "./GovBreadcrumb";
import { GovFarmerTable } from "./GovFarmerTable";
import { GovNdviStatus } from "./GovNdviStatus";
import { regionBreadcrumbItems, regionHref } from "./governmentLeaderboard";
import { label as formatLabel } from "./governmentFormat";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Farmer = RegionLeaderboard["farmers"][number];
type View = "attention" | "top" | "all";
type RegionRow = RegionLeaderboard["subRegions"][number] & {
  id: string;
  insurancePenetration: number;
  dominantCropLabel: string;
};
type SortConfig = {
  key: keyof RegionRow | "rank";
  direction: "asc" | "desc";
} | null;
export function GovLeaderboardPage({
  regionId,
  rootRegionId,
  onRegionSelect,
  onFarmerSelect,
  onBack,
  season,
}: {
  regionId: string;
  rootRegionId?: string;
  onRegionSelect?: (id: string) => void;
  onFarmerSelect?: (id: string) => void;
  onBack?: () => void;
  season?: string;
}) {
  const [selectedLevel, setSelectedLevel] = useState(""),
    [crop, setCrop] = useState("All Crops"),
    [page, setPage] = useState(1),
    [unassignedOnly, setUnassignedOnly] = useState(false);
  const result = useQuery({
    queryKey:
      selectedLevel || season
        ? ["government", "leaderboard", regionId, selectedLevel, season]
        : ["government", "leaderboard", regionId],
    queryFn: () =>
      getRegionLeaderboard(regionId, {
        level: selectedLevel || undefined,
        season,
      }),
    refetchInterval: 60000,
  });
  const data = result.data;
  const levels = [
    "COUNTRY",
    "PROVINCE",
    "DISTRICT",
    "SECTOR",
    "CELL",
    "VILLAGE",
  ];
  const available = levels.slice(
    Math.max(0, levels.indexOf(data?.region.level ?? "COUNTRY") + 1),
  );
  const level = selectedLevel || available[0] || "VILLAGE";
  const levelTitle = formatLabel(level);
  const regions: RegionRow[] = (data?.subRegions ?? []).map((row) => ({
    ...row,
    id: row.regionId,
    insurancePenetration: row.insuredPercent,
    dominantCropLabel: row.dominantCrop ? formatLabel(row.dominantCrop) : "—",
  }));
  const allFarmers = useMemo(() => data?.farmers ?? [], [data?.farmers]);
  const crops = [
    "All Crops",
    ...new Set(
      regions.flatMap((row) =>
        row.dominantCrop ? [formatLabel(row.dominantCrop)] : [],
      ),
    ),
  ];
  const [view, setView] = useState<View>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    let list = [...regions];
    if (crop !== "All Crops")
      list = list.filter((r) => r.dominantCropLabel === crop);

    if (sortConfig) {
      list.sort((a, b) => {
        const valA = a[sortConfig.key as keyof RegionRow];
        const valB = b[sortConfig.key as keyof RegionRow];
        if (valA == null) return valB == null ? 0 : 1;
        if (valB == null) return -1;
        if (typeof valA === "string" && typeof valB === "string") {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        return 0;
      });
    } else {
      if (view === "attention") {
        list.sort(
          (a, b) =>
            (a.change7d ?? Infinity) - (b.change7d ?? Infinity) ||
            (b.activeClaims ?? 0) - (a.activeClaims ?? 0),
        );
      } else if (view === "top") {
        list.sort(
          (a, b) =>
            (b.ndvi ?? -Infinity) - (a.ndvi ?? -Infinity) ||
            b.insurancePenetration - a.insurancePenetration,
        );
      } else {
        list.sort((a, b) => (b.ndvi ?? -Infinity) - (a.ndvi ?? -Infinity));
      }
    }
    return list;
  }, [view, crop, sortConfig, regions]);

  const needle = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!needle) return { sectors: [] as RegionRow[], farmers: [] as Farmer[] };
    const sectors = regions.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.dominantCropLabel.toLowerCase().includes(needle),
    );
    const farmers = allFarmers
      .filter(
        (f) =>
          f.name.toLowerCase().includes(needle) ||
          (f.cell ?? "").toLowerCase().includes(needle) ||
          (f.village ?? "").toLowerCase().includes(needle) ||
          (f.crops ?? []).join(" ").toLowerCase().includes(needle),
      )
      .slice(0, 8);
    return { sectors, farmers };
  }, [needle, regions, allFarmers]);

  const handleSort = (key: keyof RegionRow | "rank") => {
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

  const handleSectorClick = (sectorId: string) => {
    setQuery("");
    if (onRegionSelect) onRegionSelect(sectorId);
    else window.location.assign(regionHref(sectorId));
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

  if (result.isPending || result.error)
    return (
      <GovPageState
        loading={result.isPending}
        error={result.error}
        retry={() => result.refetch()}
      />
    );
  const totalPages = Math.max(1, Math.ceil(rows.length / 20));
  const currentPage = Math.min(page, totalPages);
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <GovBreadcrumb
          items={regionBreadcrumbItems(data!, rootRegionId)}
          onNavigate={
            onRegionSelect
              ? (target) => target.id && onRegionSelect(target.id)
              : undefined
          }
        />
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>
      {!!data?.unassignedFarmerIds?.length && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {data.unassignedFarmerIds.length}{" "}
          {data.unassignedFarmerIds.length === 1
            ? "farmer has"
            : "farmers have"}{" "}
          no confirmed {levelTitle.toLowerCase()} assignment. They remain
          included in {data.region.name}'s totals and farmer list.{" "}
          <a
            href="#registered-farmers"
            onClick={() => setUnassignedOnly(true)}
            className="font-semibold underline"
          >
            View these farmers
          </a>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={view}
          onValueChange={(v) => {
            setView(v as View);
            setSortConfig(null);
          }}
          className="w-full sm:w-auto"
        >
          <TabsList className="flex w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] justify-start sm:justify-center sm:w-auto p-1">
            <TabsTrigger
              value="attention"
              className="gap-1.5 shrink-0 whitespace-nowrap"
            >
              <AlertTriangle className="h-4 w-4" /> Needs Attention
            </TabsTrigger>
            <TabsTrigger
              value="top"
              className="gap-1.5 shrink-0 whitespace-nowrap"
            >
              <TrendingUp className="h-4 w-4" /> Top Performers
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="gap-1.5 shrink-0 whitespace-nowrap"
            >
              <List className="h-4 w-4" /> All {levelTitle}s
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={level}
            onValueChange={(value) => {
              setSelectedLevel(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[120px] bg-white border-gray-200 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              {available.map((l) => (
                <SelectItem key={l} value={l}>
                  {formatLabel(l)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={crop}
            onValueChange={(value) => {
              setCrop(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] bg-white border-gray-200 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="All Crops" />
            </SelectTrigger>
            <SelectContent>
              {crops.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={`Search by ${levelTitle.toLowerCase()}, farmer name, cell, village or crop…`}
            aria-label="Search regions or farmers"
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
            {searchResults.sectors.length === 0 &&
            searchResults.farmers.length === 0 ? (
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
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {r.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.dominantCropLabel} · {r.cultivatedHa.toLocaleString()}{" "}
                      ha
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
                    onClick={() => onFarmerSelect?.(f.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/60"
                  >
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {f.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {f.sector ?? "Not recorded"} · {f.cell ?? "Not recorded"},{" "}
                      {f.village ?? "Not recorded"}
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
      {data.region.level !== "VILLAGE" && (
        <Panel className="overflow-hidden p-0">
          <div className="relative max-w-full overflow-x-auto overscroll-x-contain">
            <table
              aria-label={`${levelTitle}s leaderboard`}
              className="w-full min-w-[1100px] whitespace-nowrap text-sm"
            >
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 pl-6 font-medium uppercase tracking-wide">
                    #
                  </th>
                  <SortableHeader label="Region" sortKey="name" />
                  <SortableHeader label="Cultivated" sortKey="cultivatedHa" />
                  <SortableHeader
                    label="Dominant Crop"
                    sortKey="dominantCrop"
                  />
                  <SortableHeader label="Avg NDVI" sortKey="ndvi" />
                  <SortableHeader label="7D" sortKey="change7d" />
                  <SortableHeader label="30D" sortKey="change30d" />
                  <SortableHeader
                    label="Insurance"
                    sortKey="insurancePenetration"
                  />
                  <SortableHeader label="Claims" sortKey="activeClaims" />
                  <SortableHeader
                    label="Risk"
                    sortKey="riskLevel"
                    className="pr-6"
                  />
                  <th className="px-4 py-3 pr-6" />
                </tr>
              </thead>
              <tbody>
                {!rows.length && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-10 text-center text-muted-foreground"
                    >
                      {data.subRegions.length
                        ? "No regions match these filters."
                        : "This region has no child regions."}
                    </td>
                  </tr>
                )}
                {rows
                  .slice((currentPage - 1) * 20, currentPage * 20)
                  .map((r, i) => (
                    <LeaderRow
                      key={r.id}
                      rank={(currentPage - 1) * 20 + i + 1}
                      r={r}
                      onOpen={() => handleSectorClick(r.id)}
                    />
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <GovNdviStatus
              regionId={regionId}
              metrics={data!.snapshot.ndvi}
              compact
            />
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                {rows.length} {levelTitle.toLowerCase()}s · {currentPage} /{" "}
                {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </Panel>
      )}
      <GovFarmerTable
        regionId={regionId}
        farmers={allFarmers}
        onFarmerSelect={onFarmerSelect}
        onlyFarmerIds={unassignedOnly ? data?.unassignedFarmerIds : undefined}
        onClearFilter={() => setUnassignedOnly(false)}
      />
    </div>
  );
}

function LeaderRow({
  rank,
  r,
  onOpen,
}: {
  rank: number;
  r: RegionRow;
  onOpen: () => void;
}) {
  return (
    <tr
      onClick={onOpen}
      className={cn(
        "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40",
      )}
    >
      <td className="px-4 py-3 pl-6 font-mono text-muted-foreground">{rank}</td>
      <td className="px-4 py-3">
        <a
          href={regionHref(r.id)}
          onClick={(event) => {
            event.stopPropagation();
            if (
              event.button === 0 &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              onOpen();
            }
          }}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {r.name}
        </a>
        <div className="text-xs text-muted-foreground">{r.level}</div>
      </td>
      <td className="px-4 py-3 font-mono text-foreground">
        {r.cultivatedHa.toLocaleString()} ha
      </td>
      <td className="px-4 py-3 text-foreground">{r.dominantCropLabel}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-foreground">
            {r.ndvi == null ? "No reading" : r.ndvi.toFixed(2)}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${r.ndvi == null ? 0 : Math.max(0, Math.min(100, r.ndvi * 100))}%`,
                backgroundColor:
                  r.ndvi < 0.62
                    ? "#ef4444"
                    : r.ndvi < 0.7
                      ? "#f59e0b"
                      : "#10b981",
              }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <DeltaPill value={r.change7d} />
      </td>
      <td className="px-4 py-3">
        <DeltaPill value={r.change30d} />
      </td>
      <td className="px-4 py-3 font-mono text-foreground">
        {r.insurancePenetration}%
      </td>
      <td className="px-4 py-3 font-mono text-foreground">{r.activeClaims}</td>
      <td className="px-4 py-3 pr-6">
        <StatusBadge status={(r.riskLevel ?? "UNKNOWN").toLowerCase()} />
      </td>
      <td className="px-4 py-3 pr-6 text-right">
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </td>
    </tr>
  );
}

// ─── Farmer Quick-View Dialog (for future farmer search result clicks) ────────
