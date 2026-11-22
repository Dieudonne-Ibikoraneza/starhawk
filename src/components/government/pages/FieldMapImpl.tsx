import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip as LTooltip,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng, NdviCell } from "./governmentTypes";

/**
 * Client-only satellite field map. Renders the field boundary plus a
 * sampled NDVI colour grid over the plot. SSR-safe via a mounted guard.
 */
export function FieldMap({
  center,
  boundary,
  ndviCells,
  className,
}: {
  center: LatLng;
  boundary: LatLng[];
  ndviCells: NdviCell[];
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [showNdvi, setShowNdvi] = useState(true);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={className}>
        <div className="grid h-full w-full place-items-center rounded-xl bg-secondary text-sm text-muted-foreground">
          Loading map…
        </div>
      </div>
    );
  }

  const boundaryPos = boundary.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={16}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", background: "#0b0f14" }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Street">
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {showNdvi &&
            ndviCells.map((c) => (
              <Polygon
                key={c.id}
                positions={c.polygon.map(
                  (p) => [p.lat, p.lng] as [number, number],
                )}
                pathOptions={{
                  color: c.color,
                  weight: 0.5,
                  fillColor: c.color,
                  fillOpacity: 0.55,
                }}
              >
                <LTooltip sticky>NDVI {c.ndvi.toFixed(2)}</LTooltip>
              </Polygon>
            ))}

          <Polygon
            positions={boundaryPos}
            pathOptions={{
              color: "#38bdf8",
              weight: 3,
              fill: false,
              dashArray: "6 4",
            }}
          >
            <LTooltip sticky>Field boundary</LTooltip>
          </Polygon>
        </MapContainer>

        {ndviCells.length > 0 && (
          <button
            onClick={() => setShowNdvi((v) => !v)}
            className="absolute left-3 top-3 z-[1000] cursor-pointer rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur transition-colors hover:border-primary/50"
          >
            {showNdvi ? "Hide NDVI" : "Show NDVI"}
          </button>
        )}
      </div>
    </div>
  );
}

export default FieldMap;
