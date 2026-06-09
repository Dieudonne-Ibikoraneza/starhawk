import { useMemo, useState } from "react";
import { Panel, DeltaPill, StatusBadge } from "@/components/government/gov-widgets";
import { regions, crops, seasons, type RegionRow } from "@/components/government/gov-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, List, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

type View = "attention" | "top" | "all";
type SortConfig = { key: keyof RegionRow | "rank"; direction: "asc" | "desc" } | null;

export function GovLeaderboardPage({ crop, season }: { crop: string; season: string }) {
  const [view, setView] = useState<View>("attention");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const rows = useMemo(() => {
    let list = [...regions];
    if (crop !== "All Crops") list = list.filter((r) => r.dominantCrop === crop);

    if (sortConfig) {
      list.sort((a, b) => {
        let valA = a[sortConfig.key as keyof RegionRow];
        let valB = b[sortConfig.key as keyof RegionRow];

        if (sortConfig.key === "rank") {
          return sortConfig.direction === "asc" ? -1 : 1; 
        }

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
  }, [view, crop, sortConfig]);

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

  const SortableHeader = ({ label, sortKey, className = "" }: { label: string, sortKey: keyof RegionRow | "rank", className?: string }) => {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(v) => { setView(v as View); setSortConfig(null); }} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 sm:w-auto h-10">
            <TabsTrigger value="attention" className="gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <AlertTriangle className="h-4 w-4" /> Needs Attention
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <TrendingUp className="h-4 w-4" /> Top Performers
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <List className="h-4 w-4" /> All Sectors
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Panel className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="group border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium pl-6 uppercase tracking-wide">#</th>
                <SortableHeader label="Region" sortKey="name" />
                <SortableHeader label="Cultivated" sortKey="cultivatedHa" />
                <SortableHeader label="Dominant Crop" sortKey="dominantCrop" />
                <SortableHeader label="Avg NDVI" sortKey="ndvi" />
                <SortableHeader label="7d" sortKey="change7d" />
                <SortableHeader label="30d" sortKey="change30d" />
                <SortableHeader label="Insurance" sortKey="insurancePenetration" />
                <SortableHeader label="Claims" sortKey="activeClaims" />
                <SortableHeader label="Risk" sortKey="riskLevel" className="pr-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <LeaderRow key={r.id} rank={i + 1} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function LeaderRow({ rank, r }: { rank: number; r: RegionRow }) {
  return (
    <tr className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-gray-500 pl-6">{rank}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{r.name}</div>
        <div className="text-xs text-gray-500">{r.level}</div>
      </td>
      <td className="px-4 py-3 font-mono text-gray-900">{r.cultivatedHa.toLocaleString()} ha</td>
      <td className="px-4 py-3 text-gray-900">{r.dominantCrop}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-gray-900">{r.ndvi.toFixed(2)}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{ 
                width: `${r.ndvi * 100}%`, 
                backgroundColor: r.ndvi < 0.62 ? "#ef4444" : r.ndvi < 0.7 ? "#f59e0b" : "#10b981" 
              }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><DeltaPill value={r.change7d} /></td>
      <td className="px-4 py-3"><DeltaPill value={r.change30d} /></td>
      <td className="px-4 py-3 font-mono text-gray-900">{r.insurancePenetration}%</td>
      <td className="px-4 py-3 font-mono text-gray-900">{r.activeClaims}</td>
      <td className="px-4 py-3 pr-6"><StatusBadge status={r.riskLevel} /></td>
    </tr>
  );
}
