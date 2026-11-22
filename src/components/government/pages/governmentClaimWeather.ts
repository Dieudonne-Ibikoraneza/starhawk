import { agroTempToCelsius } from "@/lib/weatherUnits";
export interface HistoricalWeatherDay {
  date: string;
  tempC: number | null;
  humidity: number | null;
  rainfallMm: number | null;
  windKph: number | null;
}
const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
export function normalizeHistoricalWeather(
  response: unknown,
): HistoricalWeatherDay[] {
  let raw = response as any;
  for (
    let i = 0;
    i < 3 && raw && !Array.isArray(raw) && raw.data && !Array.isArray(raw.data);
    i++
  )
    raw = raw.data;
  if (raw?.field_id?.startsWith("mock_")) return [];
  const rows = Array.isArray(raw) ? raw : raw?.data;
  if (!Array.isArray(rows)) return [];
  const groups = new Map<
    string,
    { temp: number[]; humidity: number[]; rain: number[]; wind: number[] }
  >();
  for (const row of rows) {
    const stamp =
      typeof row.dt === "number" ? new Date(row.dt * 1000) : new Date(row.date);
    if (!Number.isFinite(stamp.getTime()) || stamp.getTime() > Date.now())
      continue;
    const date = stamp.toISOString().slice(0, 10),
      group = groups.get(date) ?? {
        temp: [],
        humidity: [],
        rain: [],
        wind: [],
      };
    const temp = finite(row.temp ?? row.main?.temp),
      humidity = finite(row.humidity ?? row.main?.humidity),
      rain = finite(
        typeof row.rain === "number"
          ? row.rain
          : (row.rain?.["3h"] ?? row.rain?.["1h"]),
      ),
      wind = finite(row.wind_speed ?? row.wind?.speed);
    if (temp !== null) group.temp.push(agroTempToCelsius(temp));
    if (humidity !== null && humidity >= 0 && humidity <= 100)
      group.humidity.push(humidity);
    if (rain !== null && rain >= 0) group.rain.push(rain);
    if (wind !== null && wind >= 0) group.wind.push(wind * 3.6);
    groups.set(date, group);
  }
  const avg = (xs: number[]) =>
    xs.length
      ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 10) / 10
      : null;
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, g]) => ({
      date,
      tempC: avg(g.temp),
      humidity: avg(g.humidity),
      rainfallMm: g.rain.length
        ? Math.round(g.rain.reduce((s, v) => s + v, 0) * 10) / 10
        : null,
      windKph: avg(g.wind),
    }));
}
export function claimWeatherView(
  days: HistoricalWeatherDay[],
  claimDate: string,
  forecast: any[],
) {
  const claimDay = claimDate.slice(0, 10),
    end = new Date(claimDay),
    start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 29);
  const from = start.toISOString().slice(0, 10),
    seasonStart = `${end.getUTCFullYear()}-${end.getUTCMonth() < 6 ? "01" : "07"}-01`;
  const monthly = days.filter((d) => d.date >= from && d.date <= claimDay),
    season = days.filter((d) => d.date >= seasonStart && d.date <= claimDay);
  const full = (xs: HistoricalWeatherDay[], begin: string) =>
    xs.length ===
      Math.round((end.getTime() - new Date(begin).getTime()) / 86400000) + 1 &&
    xs.every((d) => d.rainfallMm !== null);
  const monthFull = full(monthly, from),
    seasonFull = full(season, seasonStart),
    sum = (xs: HistoricalWeatherDay[]) =>
      Math.round(xs.reduce((s, d) => s + d.rainfallMm!, 0) * 10) / 10;
  const current = days.find((d) => d.date === claimDay);
  return {
    onClaimDate: { date: claimDay },
    current: {
      tempC: current?.tempC ?? null,
      humidity: current?.humidity ?? null,
      rainfallMm: current?.rainfallMm ?? null,
      windKph: current?.windKph ?? null,
      condition: current
        ? "Recorded weather"
        : "No weather recorded on the claim date",
    },
    historical: monthly.filter(
      (day) =>
        day.date >=
        new Date(end.getTime() - 13 * 86400000).toISOString().slice(0, 10),
    ),
    forecast: forecast.map((p) => ({ ...p, tempC: p.maxTempC })),
    accumulated: {
      rainfall30dMm: monthFull ? sum(monthly) : null,
      rainfallSeasonMm: seasonFull ? sum(season) : null,
      normalSeasonMm: null,
      dryDays30d: monthFull
        ? monthly.filter((d) => d.rainfallMm! < 1).length
        : null,
      maxDailyRainfallMm: monthFull
        ? Math.max(...monthly.map((d) => d.rainfallMm!))
        : null,
      avgTempC:
        monthFull && monthly.every((d) => d.tempC !== null)
          ? Math.round(
              (monthly.reduce((s, d) => s + d.tempC!, 0) / monthly.length) * 10,
            ) / 10
          : null,
    },
  };
}
export function weatherValue(value: number | null | undefined, unit = "") {
  return value == null || !Number.isFinite(value) ? "—" : `${value}${unit}`;
}
