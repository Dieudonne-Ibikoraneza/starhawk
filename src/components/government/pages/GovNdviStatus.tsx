import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshRegionNdvi, type NdviMetrics } from "@/services/governmentApi";
import { ndviRefreshMessage } from "./governmentMonitoring";
import { date } from "./governmentFormat";

export function GovNdviStatus({
  regionId,
  metrics,
  compact = false,
}: {
  regionId: string;
  metrics: NdviMetrics;
  compact?: boolean;
}) {
  const client = useQueryClient();
  const refresh = useMutation({
    mutationFn: () => refreshRegionNdvi(regionId),
    onSuccess: () =>
      client.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "government" &&
          ["leaderboard", "overview"].includes(String(query.queryKey[1])),
      }),
  });
  if (compact)
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span
          className="hidden sm:inline"
          title={`7D compared farms: ${metrics.comparison7dFarmCount ?? 0}; 30D: ${metrics.comparison30dFarmCount ?? 0}`}
        >
          {metrics.observedAt
            ? `Observed ${date(metrics.observedAt)}`
            : "No NDVI readings"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Refresh NDVI history"
          title={
            metrics.observedAt
              ? `Latest observation ${date(metrics.observedAt)}`
              : "Retrieve available satellite history"
          }
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          <RefreshCw
            className={`h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`}
          />
          <span className="sr-only">Refresh NDVI history</span>
        </Button>
        <span
          role="status"
          aria-live="polite"
          className={refresh.error ? "basis-full text-red-600" : "sr-only"}
        >
          {refresh.error?.message ??
            (refresh.data ? ndviRefreshMessage(refresh.data) : "")}
        </span>
      </div>
    );
  return (
    <section
      aria-label="NDVI observation status"
      className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 basis-full text-xs text-gray-600 sm:flex-1 sm:basis-0">
          <p className="font-medium text-gray-800">
            {metrics.observedAt
              ? `Latest NDVI observation: ${date(metrics.observedAt)}`
              : metrics.current == null
                ? "No NDVI readings recorded."
                : "NDVI comparison dates are unavailable."}
          </p>
          {metrics.stale && (
            <p className="mt-1 text-amber-700">
              The latest observation is older than 14 days.
            </p>
          )}
          <p className="mt-1">
            7D and 30D changes use earlier dated readings. Missing history
            appears as —.
          </p>
          {metrics.source === "FARM_OBSERVATIONS" && (
            <p className="mt-1">
              Compared farms: 7D · {metrics.comparison7dFarmCount ?? 0}, 30D ·{" "}
              {metrics.comparison30dFarmCount ?? 0}.
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={refresh.isPending}
          aria-busy={refresh.isPending}
          onClick={() => refresh.mutate()}
          className="w-full shrink-0 sm:w-auto"
        >
          <RefreshCw
            aria-hidden="true"
            className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`}
          />
          {refresh.isPending ? "Refreshing NDVI…" : "Refresh NDVI history"}
        </Button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 text-xs text-gray-600"
      >
        {refresh.isPending
          ? "Retrieving available satellite history…"
          : refresh.error
            ? refresh.error.message
            : refresh.data
              ? ndviRefreshMessage(refresh.data)
              : "Changes compare the same farms using readings on or before the 7-day and 30-day dates."}
      </p>
    </section>
  );
}
