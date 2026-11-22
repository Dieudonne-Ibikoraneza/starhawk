import { FILE_SERVER_URL } from "@/config/api";
export function label(value?: string | null) {
  return value
    ? value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
}
export function money(value?: number | null) {
  return value == null ? "—" : `${value.toLocaleString()} RWF`;
}
export function date(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}
export function ndvi(value?: number | null) {
  return value == null ? "No reading" : value.toFixed(3);
}
export function downloadCsv(
  filename: string,
  rows: (string | number | null)[][],
) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          let value = String(cell ?? "");
          if (/^[=+@\-\t\r]/.test(value)) value = "'" + value;
          return '"' + value.replace(/"/g, '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function rwf(value: number): string {
  return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(
    value,
  );
}
export function rwfShort(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return String(value);
}

export function fileUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${FILE_SERVER_URL.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
}

export function governmentDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  return ["year", "month", "day"]
    .map((key) => parts.find((part) => part.type === key)!.value)
    .join("-");
}
