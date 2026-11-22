import { useEffect, useState, type ComponentType } from "react";
import type { LatLng, NdviCell } from "./governmentTypes";

interface FieldMapProps {
  center: LatLng;
  boundary: LatLng[];
  ndviCells: NdviCell[];
  className?: string;
}

/**
 * SSR-safe wrapper: the actual react-leaflet map (which touches `window` at
 * import time) is dynamically imported only in the browser.
 */
export function FieldMap(props: FieldMapProps) {
  const [Impl, setImpl] = useState<ComponentType<FieldMapProps> | null>(null);

  useEffect(() => {
    let active = true;
    import("./FieldMapImpl").then((m) => {
      if (active) setImpl(() => m.FieldMap);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!Impl) {
    return (
      <div className={props.className}>
        <div className="grid h-full w-full place-items-center rounded-xl border border-border bg-secondary text-sm text-muted-foreground">
          Loading map…
        </div>
      </div>
    );
  }

  return <Impl {...props} />;
}

/** Legend for the NDVI colour ramp used on the field map. */
export function NdviLegend() {
  const steps = [
    { c: "#b91c1c", l: "<0.30 Severe" },
    { c: "#ea580c", l: "0.30–0.45" },
    { c: "#eab308", l: "0.45–0.55" },
    { c: "#84cc16", l: "0.55–0.68" },
    { c: "#22c55e", l: "0.68–0.80" },
    { c: "#15803d", l: ">0.80 Vigorous" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
      {steps.map((s) => (
        <span key={s.l} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: s.c }}
          />
          {s.l}
        </span>
      ))}
    </div>
  );
}
