import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Globe,
  GitCompareArrows,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/government/gov-widgets";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  compareSeasons,
  concepts,
  getConceptValues,
  pctChange,
  provinceTree,
  scopeLabel,
  type CompareSeason,
  type ConceptDef,
} from "@/components/government/gov-data";

// ─── Accent palette (matches crop-watch-command) ──────────────────────────────

type Accent = {
  bar: string;
  text: string;
  dot: string;
  ring: string;
  glow: string;
};

const SIDE_ACCENTS: Accent[] = [
  { bar: "#3b82f6", text: "text-blue-600",   dot: "bg-blue-500",   ring: "ring-blue-200",   glow: "from-blue-50"   },
  { bar: "#10b981", text: "text-emerald-600", dot: "bg-emerald-500", ring: "ring-emerald-200", glow: "from-emerald-50" },
  { bar: "#f59e0b", text: "text-amber-600",  dot: "bg-amber-500",  ring: "ring-amber-200",  glow: "from-amber-50"  },
];

const SIDE_LABELS = ["Side A", "Side B", "Side C"];

interface Side {
  scope: string;
  season: CompareSeason;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function GovSeasonComparePage() {
  const [sides, setSides] = useState<(Side | null)[]>([null, null]);
  const maxSides = 3;

  // Keep within maxSides when state changes externally
  useEffect(() => {
    setSides((prev) =>
      prev.length > maxSides ? prev.slice(0, maxSides) : prev
    );
  }, [maxSides]);

  const selected = sides.filter((s): s is Side => Boolean(s));
  const anySelected = selected.length > 0;

  function updateSide(index: number, side: Side | null) {
    setSides((prev) => prev.map((s, i) => (i === index ? side : s)));
  }

  function addSide() {
    setSides((prev) => (prev.length < maxSides ? [...prev, null] : prev));
  }

  function removeSlot(index: number) {
    setSides((prev) =>
      prev.length <= 2
        ? prev.map((s, i) => (i === index ? null : s))
        : prev.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${sides.length}, minmax(0, 1fr))` }}
      >
        {sides.map((side, i) => (
          <SideSelector
            key={i}
            accent={SIDE_ACCENTS[i]}
            label={SIDE_LABELS[i]}
            side={side}
            onChange={(s) => updateSide(i, s)}
            onClear={() => removeSlot(i)}
            removable={sides.length > 2 || Boolean(side)}
          />
        ))}
      </div>

      {sides.length < maxSides && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={addSide}
            className="cursor-pointer gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add comparison
          </Button>
        </div>
      )}

      {!anySelected ? (
        <EmptyState />
      ) : (
        <>
          {/* Section label */}
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
              General
            </span>
          </div>

          {/* Metric rows */}
          <Panel className="overflow-hidden p-0">
            <div className="divide-y divide-gray-100">
              {concepts.map((c) => (
                <ComparisonRow key={c.key} concept={c} sides={sides} />
              ))}
            </div>
          </Panel>

          {/* Bar chart (only when ≥2 sides selected) */}
          {selected.length >= 2 && (
            <Panel
              title="Concept Breakdown"
              subtitle="Normalized index (%) across selected regions & seasons"
            >
              <ComparisonChart sides={sides} />
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
        <GitCompareArrows className="h-7 w-7" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-gray-900">
        Select a region to begin
      </h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Choose a region and a season on any side above. Its data appears
        instantly — add up to three regions to compare head to head.
      </p>
    </div>
  );
}

// ─── Region picker ─────────────────────────────────────────────────────────────

function RegionSelect({
  value,
  onValueChange,
  placeholder,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value ?? ""} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 min-w-[120px] flex-1 truncate rounded-lg border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 hover:bg-gray-50 shadow-sm transition-colors">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="national">All Rwanda</SelectItem>
        {provinceTree.map((p) => (
          <SelectGroup key={p.id}>
            <SelectLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{p.name}</SelectLabel>
            <SelectItem value={p.id}>{p.name} (all)</SelectItem>
            {p.districts?.map((d) => (
              <SelectItem key={d.id} value={d.id} className="pl-6 text-gray-600">
                {d.name} District
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Season picker ─────────────────────────────────────────────────────────────

function SeasonSelect({
  value,
  onValueChange,
}: {
  value: CompareSeason;
  onValueChange: (v: CompareSeason) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as CompareSeason)}>
      <SelectTrigger className="h-9 min-w-[120px] flex-1 truncate rounded-lg border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 hover:bg-gray-50 shadow-sm transition-colors">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {compareSeasons.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Side selector card ────────────────────────────────────────────────────────

function SideSelector({
  accent,
  label,
  side,
  onChange,
  onClear,
  removable,
}: {
  accent: Accent;
  label: string;
  side: Side | null;
  onChange: (s: Side) => void;
  onClear: () => void;
  removable: boolean;
}) {
  const [draftSeason, setDraftSeason] = useState<CompareSeason>(compareSeasons[0]);
  const season = side?.season ?? draftSeason;

  function setSeason(s: CompareSeason) {
    setDraftSeason(s);
    if (side) onChange({ ...side, season: s });
  }

  function setRegion(scope: string) {
    onChange({ scope, season });
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5 transition-all shadow-sm",
        side
          ? cn("border-transparent shadow-md ring-1", accent.ring)
          : "border-gray-200"
      )}
    >
      {/* Gradient glow when active */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent",
          side ? accent.glow : "from-transparent"
        )}
      />

      {/* Top row: label + clear button */}
      <div className="relative flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider",
            side ? accent.text : "text-gray-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              side ? accent.dot : "bg-gray-300"
            )}
          />
          {label}
        </span>
        {removable && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            className="z-10 inline-flex cursor-pointer items-center rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Region + season display */}
      <div className="relative mt-4 flex flex-col items-center text-center">
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full bg-gray-50 transition-colors",
            side ? accent.text : "text-gray-400"
          )}
        >
          {side?.scope === "national" ? (
            <Globe className="h-5 w-5" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </span>
        <h3 className="mt-3 line-clamp-1 text-base font-semibold text-gray-900">
          {side ? scopeLabel(side.scope) : "No region"}
        </h3>
        <span className="mt-1 line-clamp-1 text-xs text-gray-400">{season}</span>
      </div>

      {/* Pickers */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <RegionSelect value={side?.scope} onValueChange={setRegion} placeholder="Region…" />
        <SeasonSelect value={season} onValueChange={setSeason} />
      </div>
    </div>
  );
}

// ─── Comparison row ────────────────────────────────────────────────────────────

function ComparisonRow({
  concept,
  sides,
}: {
  concept: ConceptDef;
  sides: (Side | null)[];
}) {
  const values = sides.map((s) =>
    s ? getConceptValues(s.scope, s.season)[concept.key] : null
  );
  const present = values.filter((v): v is number => v !== null);
  const max = Math.max(...present, 0) || 1;
  const best = present.length
    ? concept.higherIsBetter
      ? Math.max(...present)
      : Math.min(...present)
    : null;

  const baselineIdx = values.findIndex((v) => v !== null);
  const baseline = baselineIdx >= 0 ? (values[baselineIdx] as number) : null;

  return (
    <div className="px-6 py-4 transition-colors hover:bg-gray-50">
      <div className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
        {concept.label.replace(/ \(.*\)/, "")}
      </div>
      <div
        className="grid items-center gap-4"
        style={{ gridTemplateColumns: `repeat(${sides.length}, minmax(0, 1fr))` }}
      >
        {sides.map((s, i) => {
          const v = values[i];
          const accent = SIDE_ACCENTS[i];
          if (v === null) {
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 opacity-40">
                <span className="font-mono text-2xl font-bold text-gray-400">—</span>
                <div className="h-1.5 w-full max-w-[140px] rounded-full bg-gray-100" />
              </div>
            );
          }
          const isBest = best !== null && v === best;
          const change =
            i !== baselineIdx && baseline !== null ? pctChange(baseline, v) : null;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums",
                  isBest ? "text-gray-900" : "text-gray-400"
                )}
              >
                {concept.format(v)}
              </span>
              {change !== null && Math.abs(change) >= 0.5 ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    change > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  {change > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(change).toFixed(0)}%
                </span>
              ) : (
                <span className="h-[18px]" />
              )}
              <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(v / max) * 100}%`, background: accent.bar }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bar chart ─────────────────────────────────────────────────────────────────

function ComparisonChart({ sides }: { sides: (Side | null)[] }) {
  const selected = sides
    .map((s, i) => ({ side: s, i }))
    .filter((x): x is { side: Side; i: number } => Boolean(x.side));

  const valuesBySide = selected.map((x) =>
    getConceptValues(x.side.scope, x.side.season)
  );

  const data = useMemo(
    () =>
      concepts.map((c) => {
        const raw = valuesBySide.map((v) => v[c.key]);
        const max = Math.max(...raw, 0) || 1;
        const row: Record<string, number | string> = {
          concept: c.label.replace(/ \(.*\)/, ""),
        };
        selected.forEach((x, idx) => {
          row[`s${x.i}`] = +((raw[idx] / max) * 100).toFixed(1);
          row[`raw${x.i}`] = c.format(raw[idx]);
        });
        return row;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(selected.map((x) => ({ ...x.side, i: x.i })))]
  );

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }} barGap={2}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="concept"
            stroke="#9ca3af"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-12}
            dy={8}
            height={48}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip
            cursor={{ fill: "#f9fafb", opacity: 0.8 }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              color: "#111827",
              fontSize: 12,
            }}
            formatter={(_v, name, item) => {
              const key = String(name).replace(/^.*#/, "");
              const p = item.payload as Record<string, string>;
              return [
                p[`raw${key}`],
                scopeLabel(
                  selected.find((x) => `s${x.i}` === item.dataKey)?.side
                    .scope ?? ""
                ),
              ];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => String(value).replace(/#\d+$/, "")}
          />
          {selected.map((x) => (
            <Bar
              key={x.i}
              dataKey={`s${x.i}`}
              name={`${scopeLabel(x.side.scope)} · ${x.side.season}#${x.i}`}
              radius={[4, 4, 0, 0]}
            >
              {data.map((_, di) => (
                <Cell key={di} fill={SIDE_ACCENTS[x.i].bar} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
