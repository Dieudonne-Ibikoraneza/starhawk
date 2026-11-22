import { useState } from "react";
import { Download, Users } from "lucide-react";
import { Panel } from "@/components/government/gov-widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RegionLeaderboard } from "@/services/governmentApi";
import {
  farmerTableColumns,
  farmerTableCsv,
  regionHref,
} from "./governmentLeaderboard";
import { downloadCsv, label, ndvi } from "./governmentFormat";
export function GovFarmerTable({
  regionId,
  farmers,
  onFarmerSelect,
  locationFilter,
  onlyFarmerIds,
  onClearFilter,
}: {
  regionId: string;
  farmers: RegionLeaderboard["farmers"];
  onFarmerSelect?: (id: string) => void;
  locationFilter?: "cell" | "village";
  onlyFarmerIds?: string[];
  onClearFilter?: () => void;
}) {
  const [search, setSearch] = useState(""),
    [insurance, setInsurance] = useState("all"),
    [location, setLocation] = useState("all"),
    [page, setPage] = useState(1);
  const filtered = farmers.filter(
    (f) =>
      (!onlyFarmerIds || onlyFarmerIds.includes(f.id)) &&
      `${f.name} ${f.email ?? ""} ${f.phone ?? ""} ${f.province ?? ""} ${f.district ?? ""} ${f.sector ?? ""} ${f.cell ?? ""} ${f.village ?? ""} ${f.crops?.join(" ") ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (insurance === "all" ||
        (insurance === "insured" ? f.insured : !f.insured)) &&
      (!locationFilter || location === "all" || f[locationFilter] === location),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20)),
    currentPage = Math.min(page, pages);
  const locations = locationFilter
    ? [
        ...new Set(
          farmers
            .map((f) => f[locationFilter])
            .filter((value): value is string => !!value),
        ),
      ].sort()
    : [];
  return (
    <section id="registered-farmers" className="min-w-0 scroll-mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Users className="h-5 w-5 text-primary" /> Registered farmers{" "}
          <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-normal text-gray-500">
            {filtered.length}
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(`${regionId}-farmers.csv`, farmerTableCsv(filtered))
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export farmers
        </Button>
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search farmers"
          placeholder="Search farmers by name, crop, email or phone…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full bg-white sm:max-w-md"
        />
        {locationFilter && (
          <select
            aria-label={`Filter farmers by ${locationFilter}`}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm sm:w-auto"
          >
            <option value="all">All {locationFilter}s</option>
            {locations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Filter farmers by insurance"
          value={insurance}
          onChange={(e) => {
            setInsurance(e.target.value);
            setPage(1);
          }}
          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm sm:w-auto"
        >
          <option value="all">All farmers</option>
          <option value="insured">Insured</option>
          <option value="uninsured">Uninsured</option>
        </select>
        {onlyFarmerIds && (
          <Button variant="outline" onClick={onClearFilter}>
            Show all farmers
          </Button>
        )}
      </div>
      <p id="farmer-table-scroll-hint" className="text-xs text-gray-500">
        ID registration location · Scroll horizontally to see the complete
        location and contact details.
      </p>
      <Panel className="overflow-hidden p-0">
        <div
          className="relative w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          role="region"
          aria-label="Farmer table, horizontally scrollable"
          aria-describedby="farmer-table-scroll-hint"
          tabIndex={0}
        >
          <table
            className="w-full min-w-[1700px] whitespace-nowrap text-left text-sm"
            aria-label="Registered farmers"
          >
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                {farmerTableColumns.map(([key, title]) => (
                  <th key={key} scope="col" className="px-4 py-3 font-medium">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * 20, currentPage * 20)
                .map((f) => (
                  <tr
                    key={f.id}
                    onClick={
                      onFarmerSelect
                        ? (e) => {
                            if (!(e.target as HTMLElement).closest("a,button"))
                              onFarmerSelect(f.id);
                          }
                        : undefined
                    }
                    className="cursor-pointer border-b last:border-0 hover:bg-secondary/40"
                  >
                    {farmerTableColumns.map(([key]) => (
                      <td key={key} className="px-4 py-4 align-top">
                        {key === "name" ? (
                          <a
                            className="font-semibold text-indigo-700 hover:underline"
                            href={regionHref(regionId, f.id)}
                            onClick={(e) => {
                              if (
                                onFarmerSelect &&
                                e.button === 0 &&
                                !e.metaKey &&
                                !e.ctrlKey &&
                                !e.shiftKey &&
                                !e.altKey
                              ) {
                                e.preventDefault();
                                onFarmerSelect(f.id);
                              }
                            }}
                          >
                            {f.name}
                          </a>
                        ) : key === "crops" ? (
                          f.crops?.map(label).join(", ") || "—"
                        ) : key === "ndvi" ? (
                          ndvi(f.ndvi)
                        ) : key === "insured" ? (
                          f.insured == null ? (
                            "—"
                          ) : f.insured ? (
                            "Yes"
                          ) : (
                            "No"
                          )
                        ) : key === "riskLevel" ? (
                          f.riskLevel && f.riskLevel !== "UNKNOWN" ? (
                            label(f.riskLevel)
                          ) : (
                            "No reading"
                          )
                        ) : key === "cultivatedHa" ? (
                          (f.cultivatedHa?.toLocaleString() ?? "—")
                        ) : [
                            "province",
                            "district",
                            "sector",
                            "cell",
                            "village",
                          ].includes(key) ? (
                          f[key] || "Not recorded"
                        ) : (
                          (f[key] ?? "—")
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              {!filtered.length && (
                <tr>
                  <td
                    colSpan={farmerTableColumns.length}
                    className="p-8 text-center text-gray-500"
                  >
                    No farmers match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t p-3 text-sm">
          <span>
            {filtered.length} {filtered.length === 1 ? "farmer" : "farmers"}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </Panel>
    </section>
  );
}
