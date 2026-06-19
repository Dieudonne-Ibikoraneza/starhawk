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
  GitCompareArrows,
  Globe,
  GripVertical,
  Info,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/government/gov-widgets";
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

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Accent palette --------------------------------------------------------
type Accent = {
  bar: string;
  text: string;
  dot: string;
  ring: string;
  glow: string;
  headerBg: string;
};

const SIDE_ACCENTS: Accent[] = [
  { bar: "#3b82f6", text: "text-blue-600",    dot: "bg-blue-500",    ring: "ring-blue-200",    glow: "from-blue-50",    headerBg: "bg-blue-50/60"    },
  { bar: "#10b981", text: "text-emerald-600", dot: "bg-emerald-500", ring: "ring-emerald-200", glow: "from-emerald-50", headerBg: "bg-emerald-50/60" },
  { bar: "#f59e0b", text: "text-amber-600",   dot: "bg-amber-500",   ring: "ring-amber-200",   glow: "from-amber-50",   headerBg: "bg-amber-50/60"   },
];

const SIDE_LABELS = ["Side A", "Side B", "Side C"];
const MAX_SIDES = 3;

interface Side {
  scope: string;
  season: CompareSeason;
}

interface SideSlot {
  id: string;
  side: Side | null;
}

// --- Main page -----------------------------------------------------------------

export function GovSeasonComparePage() {
  const [slots, setSlots] = useState<SideSlot[]>([
    { id: "slot-0", side: null },
    { id: "slot-1", side: null },
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setSlots((prev) => (prev.length > MAX_SIDES ? prev.slice(0, MAX_SIDES) : prev));
  }, []);

  const sides = slots.map(s => s.side);
  const selected = sides.filter((s): s is Side => Boolean(s));
  const anySelected = selected.length > 0;

  function updateSide(id: string, side: Side | null) {
    setSlots((prev) => prev.map(s => (s.id === id ? { ...s, side } : s)));
  }

  function addSide() {
    setSlots((prev) => {
      if (prev.length >= MAX_SIDES) return prev;
      // create a unique id based on timestamp so react keys are stable
      return [...prev, { id: `slot-${Date.now()}`, side: null }];
    });
  }

  function removeSlot(id: string) {
    setSlots((prev) =>
      prev.length <= 2
        ? prev.map((s) => (s.id === id ? { ...s, side: null } : s))
        : prev.filter((s) => s.id !== id)
    );
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSlots((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }

  const activeSlotIndex = activeId ? slots.findIndex(s => s.id === activeId) : null;
  const activeSlot = activeId ? slots.find(s => s.id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          <strong>Side A is the base reference</strong> — all percentage changes (↑ / ↓) on Side B
          and C are calculated relative to Side A. Drag the cards left or right to change which
          side acts as the baseline.
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-3 md:gap-0 md:grid-cols-[repeat(14,minmax(0,1fr))]">
          <div className="hidden md:flex col-span-2 pr-1 flex-col items-center justify-center">
            <button
              onClick={addSide}
              disabled={slots.length >= MAX_SIDES}
              className={cn(
                "flex flex-col items-center justify-center gap-3 text-indigo-400 transition-all",
                slots.length >= MAX_SIDES
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer hover:text-indigo-600 hover:scale-105"
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-current">
                <Plus className="h-6 w-6" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight px-2">
                {slots.length >= MAX_SIDES ? "Max reached" : "Add comparison"}
              </span>
            </button>
          </div>

          <SortableContext
            items={slots.map(s => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            {slots.map((slot, i) => {
              const paddingClass = i === slots.length - 1 ? "md:pl-1" : "md:px-1";
              const colSpanClass = slots.length === 2 ? "md:col-span-6" : slots.length === 3 ? "md:col-span-4" : "md:col-span-12";

              return (
                <div key={slot.id} className={cn("col-span-1", colSpanClass, paddingClass, i === 2 ? "hidden md:block" : "")}>
                  <SortableSideSelector
                    id={slot.id}
                    accent={SIDE_ACCENTS[i]}
                    label={SIDE_LABELS[i]}
                    isReference={i === 0}
                    side={slot.side}
                    onChange={(s) => updateSide(slot.id, s)}
                    onClear={() => removeSlot(slot.id)}
                    removable={slots.length > 2 || Boolean(slot.side)}
                  />
                </div>
              );
            })}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeSlot && activeSlotIndex !== null ? (
            <SideSelector
              accent={SIDE_ACCENTS[activeSlotIndex]}
              label={SIDE_LABELS[activeSlotIndex]}
              isReference={activeSlotIndex === 0}
              side={activeSlot.side}
              onChange={() => {}}
              onClear={() => {}}
              removable={slots.length > 2 || Boolean(activeSlot.side)}
              isDragging={true}
              isOverlay={true}
              dragListeners={{}}
              dragAttributes={{}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Data table + chart */}
      {!anySelected ? (
        <EmptyState />
      ) : (
        <div className="mt-8 space-y-8">
          <div>
            {["General", "Agricultural", "Financial"].map(category => {
              const categoryConcepts = concepts.filter(c => c.category === category);
              return (
                <div key={category} className="mb-8 last:mb-0">
                  <div className="mb-4 text-center text-[13px] font-bold uppercase tracking-widest text-gray-500">
                    {category}
                  </div>
                  <div className="flex flex-col gap-y-0.5">
                    {categoryConcepts.map((c, rowIdx) => {
                      
                      const isLast = rowIdx === categoryConcepts.length - 1;
                const allValues = sides.map((side) =>
                  side ? getConceptValues(side.scope, side.season)[c.key] : null
                );
                const present = allValues.filter((v): v is number => v !== null);
                const best = present.length
                  ? c.higherIsBetter
                    ? Math.max(...present)
                    : Math.min(...present)
                  : null;
                const baselineVal =
                  allValues[0] !== null && allValues[0] !== undefined
                    ? (allValues[0] as number)
                    : null;

                const isFirst = rowIdx === 0;
                

                return (
                  <div
                    key={c.key}
                    className={cn(
                      "flex flex-col md:flex-row items-stretch transition-colors",
                      "bg-white border-x border-b border-gray-200 px-4 py-3 hover:bg-gray-50/50",
                      isFirst && "rounded-t-2xl border-t",
                      isLast && "rounded-b-2xl",
                      "md:bg-transparent md:border-0 md:p-0 md:hover:bg-transparent md:gap-2"
                    )}
                  >
                    <div className="order-2 md:order-1 flex items-center justify-center md:justify-start px-2 pt-3 pb-1 md:py-3 md:pr-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 md:text-gray-500 text-center md:text-left md:w-[220px] md:shrink-0">
                      {c.label.replace(/ \(.*\)/, "")}
                    </div>
                    <div className="order-1 md:order-2 flex flex-1 items-stretch gap-1.5 md:gap-2">
                    {sides.map((side, i) => {
                      const v = allValues[i];
                      const isBest = best !== null && v !== null && v !== undefined && v === best;
                      const change =
                        i !== 0 && baselineVal !== null && v !== null && v !== undefined
                          ? pctChange(baselineVal, v)
                          : null;
                      
                      return (
                        <div key={i} className={cn(
                          "flex-1 flex flex-col",
                          i === 2 ? "hidden md:flex" : "flex"
                        )}>
                          <div
                            className={cn(
                              "flex flex-1 gap-1 md:gap-2",
                              "flex-col sm:flex-row",
                              i === 0 
                                ? "items-start sm:items-center sm:justify-start md:justify-center md:items-center" 
                                : "items-end sm:items-center sm:justify-end md:justify-center md:items-center",
                              "md:border md:border-gray-200 md:bg-white md:px-3 md:py-3 md:transition-colors md:hover:bg-gray-50/50",
                              isFirst && "md:rounded-t-2xl",
                              isLast && "md:rounded-b-2xl"
                            )}
                          >
                            {sides[i] === null || sides[i] === undefined || v === null || v === undefined ? (
                              <span className="text-sm text-gray-300">�</span>
                            ) : (
                              <>
                                <span
                                  className={cn(
                                    "font-mono text-sm font-bold tabular-nums",
                                    isBest ? "text-gray-900" : "text-gray-500",
                                    i === 0 ? "text-left" : "text-right"
                                  )}
                                >
                                  {c.format(v)}
                                </span>
                                {change !== null && Math.abs(change) >= 0.5 && (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold",
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
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>


          {selected.length >= 2 && (
            <Panel title="Concept Breakdown" subtitle="Normalized index (%) across selected regions & seasons">
              <ComparisonChart sides={sides} />
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

// --- Empty state ---------------------------------------------------------------

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

// --- Region picker -------------------------------------------------------------

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

// --- Season picker -------------------------------------------------------------

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

// --- Sortable Side Selector Wrapper --------------------------------------------

function SortableSideSelector(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <SideSelector
        {...props}
        isDragging={isDragging}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

// --- Side selector card --------------------------------------------------------

function SideSelector({
  accent,
  label,
  isReference,
  side,
  onChange,
  onClear,
  removable,
  isDragging,
  isOverlay,
  dragListeners,
  dragAttributes,
}: {
  accent: Accent;
  label: string;
  isReference: boolean;
  side: Side | null;
  onChange: (s: Side) => void;
  onClear: () => void;
  removable: boolean;
  isDragging: boolean;
  isOverlay?: boolean;
  dragListeners: any;
  dragAttributes: any;
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
      {...dragListeners}
      {...dragAttributes}
      className={cn(
        "relative h-full flex flex-col overflow-hidden rounded-2xl border bg-white p-3 md:p-5 transition-all shadow-sm cursor-grab active:cursor-grabbing select-none outline-none focus:outline-none",
        isOverlay && "scale-105 z-50 shadow-2xl ring-[1.5px] ring-indigo-400",
        side ? cn("border-transparent shadow-md ring-[1.5px]", accent.ring) : "border-gray-200"
      )}
    >
      {/* Gradient glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent",
          side ? accent.glow : "from-transparent"
        )}
      />

      {/* Top row: grip + label + BASE badge + clear */}
      <div className="relative flex items-center gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
        <div className="flex flex-1 items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap",
              side ? accent.text : "text-gray-400"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", side ? accent.dot : "bg-gray-300")} />
            {label}
          </span>
          {isReference && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-600">
              Base
            </span>
          )}
        </div>
        {removable && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            aria-label="Clear selection"
            className="z-10 inline-flex cursor-pointer items-center rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Region display */}
      <div className="relative mt-3 md:mt-4 flex-1 flex flex-col items-center justify-center text-center">
        <span
          className={cn(
            "grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-full bg-gray-50 transition-colors",
            side ? accent.text : "text-gray-400"
          )}
        >
          {side?.scope === "national" ? <Globe className="h-4 w-4 md:h-5 md:w-5" /> : <MapPin className="h-4 w-4 md:h-5 md:w-5" />}
        </span>
        <h3 className="mt-2 md:mt-3 line-clamp-1 text-sm md:text-base font-semibold text-gray-900">
          {side ? scopeLabel(side.scope) : "No region"}
        </h3>
        <span className="mt-0.5 md:mt-1 line-clamp-1 text-[10px] md:text-xs text-gray-400">{season}</span>
      </div>

      {/* Pickers */}
      <div 
        className="relative mt-3 md:mt-4 flex flex-wrap items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <RegionSelect value={side?.scope} onValueChange={setRegion} placeholder="Region..." />
        <SeasonSelect value={season} onValueChange={setSeason} />
      </div>
    </div>
  );
}

// --- Bar chart -----------------------------------------------------------------

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
            interval="preserveStartEnd"
            angle={-35}
            textAnchor="end"
            dy={8}
            height={60}
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
              name={`${scopeLabel(x.side.scope)} — ${x.side.season}#${x.i}`}
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
