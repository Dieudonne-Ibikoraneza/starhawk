import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  action,
  className,
  onClick,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  children: ReactNode;
}) {
  return (
    <section
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaLabel = "vs last season",
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  accent?: "primary" | "info" | "warning" | "destructive";
}) {
  const accentMap = {
    primary: "text-emerald-600 bg-emerald-50",
    info: "text-blue-600 bg-blue-50",
    warning: "text-amber-600 bg-amber-50",
    destructive: "text-red-600 bg-red-50",
  } as const;

  const valueColorMap = {
    primary: "text-emerald-600",
    info: "text-blue-600",
    warning: "text-amber-600",
    destructive: "text-red-600",
  } as const;

  const glowColorMap = {
    primary: "rgba(16, 185, 129, 0.12)", // emerald
    info: "rgba(37, 99, 235, 0.12)",     // blue
    warning: "rgba(217, 119, 6, 0.12)",  // amber
    destructive: "rgba(220, 38, 38, 0.12)", // red
  } as const;

  const trendUp = (delta ?? 0) > 0;
  const trendDown = (delta ?? 0) < 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300">
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
        style={{ background: `radial-gradient(circle at 30% 0%, ${glowColorMap[accent]}, transparent 60%)` }} 
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", accentMap[accent])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="relative mt-3 flex items-end gap-1.5">
        <span className={cn("text-3xl font-bold tracking-tight tabular-nums", valueColorMap[accent])}>{value}</span>
        {unit && <span className="mb-1 text-sm text-gray-500">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className="relative mt-2 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              trendUp && "bg-green-50 text-green-700",
              trendDown && "bg-red-50 text-red-700",
              !trendUp && !trendDown && "bg-gray-100 text-gray-600",
            )}
          >
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : trendDown ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-gray-500">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}

export function DeltaPill({ value }: { value: number }) {
  const up = value > 0;
  const down = value < 0;
  return (
    <span
      className={cn(
        "font-mono inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
        up && "bg-green-50 text-green-700",
        down && "bg-red-50 text-red-700",
        !up && !down && "bg-gray-100 text-gray-600",
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : down ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}
    </span>
  );
}

const riskStyles: Record<string, string> = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

const statusStyles: Record<string, string> = {
  Active: "bg-green-50 text-green-700 border-green-200",
  Paid: "bg-green-50 text-green-700 border-green-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Pending: "bg-orange-50 text-orange-700 border-orange-200",
  Expired: "bg-gray-100 text-gray-600 border-gray-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Overdue: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = riskStyles[status] ?? statusStyles[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", cls)}>
      {label}
    </span>
  );
}
