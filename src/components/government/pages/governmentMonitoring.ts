import type { NdviRefreshResult } from "@/services/governmentApi";
import { agroTempToCelsius, extractAgroForecastRows } from "@/lib/weatherUnits";
export function normalizeNdvi(
  response: unknown,
): { date: string; ndvi: number }[] {
  const raw = response as { data?: unknown };
  const entries = Array.isArray(response) ? response : raw?.data;
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(
      (p) => p?.date && typeof p.ndvi === "number" && Number.isFinite(p.ndvi),
    )
    .map((p) => ({
      date: String(p.date),
      ndvi: Math.round(p.ndvi * 1000) / 1000,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function normalizeForecast(response: unknown) {
  const outer = response as { data?: unknown; field_id?: string };
  const payload = (
    outer && !Array.isArray(outer.data) && typeof outer.data === "object"
      ? outer.data
      : outer
  ) as { field_id?: string };
  // The shared weather service marks generated fallbacks with mock_ field IDs.
  if (payload?.field_id?.startsWith("mock_")) return [];
  const buckets = new Map<
    string,
    { temps: number[]; rain: number; description: string }
  >();
  for (const item of extractAgroForecastRows(response)) {
    const e = item as {
      dt?: number;
      main?: { temp?: number; temp_min?: number; temp_max?: number };
      rain?: { "3h"?: number; "1h"?: number };
      weather?: { description?: string }[];
    };
    if (!Number.isFinite(e?.dt)) continue;
    const date = new Date(e.dt * 1000).toISOString().slice(0, 10);
    const bucket = buckets.get(date) ?? {
      temps: [],
      rain: 0,
      description: e.weather?.[0]?.description ?? "",
    };
    for (const temp of [
      e.main?.temp_min ?? e.main?.temp,
      e.main?.temp_max ?? e.main?.temp,
    ]) {
      if (typeof temp === "number" && Number.isFinite(temp))
        bucket.temps.push(agroTempToCelsius(temp));
    }
    bucket.rain += e.rain?.["3h"] ?? e.rain?.["1h"] ?? 0;
    buckets.set(date, bucket);
  }
  return [...buckets.entries()]
    .filter(([, b]) => b.temps.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      minTempC: Math.round(Math.min(...b.temps) * 10) / 10,
      maxTempC: Math.round(Math.max(...b.temps) * 10) / 10,
      rainfallMm: Math.round(b.rain * 10) / 10,
      description: b.description,
    }));
}

/** Percentage change uses the historical baseline, including when current NDVI is zero. */
export function ndviDeltaPercent(metrics: {
  current: number | null;
  change7d: number | null;
  baseline7d?: number | null;
}) {
  if (metrics.current == null || metrics.change7d == null) return undefined;
  const baseline =
    metrics.baseline7d === undefined
      ? metrics.current - metrics.change7d
      : metrics.baseline7d;
  if (baseline == null || baseline <= 0 || !Number.isFinite(baseline))
    return undefined;
  return Math.round((metrics.change7d / baseline) * 100);
}

export function ndviRefreshMessage(result: NdviRefreshResult) {
  if (result.unavailableFarms)
    return `Satellite history could not be retrieved for ${result.unavailableFarms} ${result.unavailableFarms === 1 ? "farm" : "farms"}. Saved readings are retained; retry later.`;
  if (result.remainingFarms)
    return `Updated ${result.updatedFarms} farms. ${result.remainingFarms} farms still need history; refresh again to continue.`;
  if (result.updatedFarms)
    return `Satellite history updated for ${result.updatedFarms} ${result.updatedFarms === 1 ? "farm" : "farms"}.`;
  if (result.emptyFarms)
    return "No satellite readings are available for these fields yet.";
  if (result.cachedFarms)
    return "Satellite history was checked recently; using saved readings.";
  return "No fields linked to satellite monitoring in this region.";
}
