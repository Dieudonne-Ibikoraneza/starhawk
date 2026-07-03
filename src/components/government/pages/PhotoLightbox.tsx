import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { ClaimPhoto } from "@/lib/gov-data";

/**
 * Full-screen photo lightbox with zoom (buttons + scroll), pan (drag),
 * keyboard navigation and native fullscreen support.
 */
export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: ClaimPhoto[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (dir: number) => {
      onIndex((index + dir + photos.length) % photos.length);
      reset();
    },
    [index, photos.length, onIndex, reset],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(6, s + 0.5));
      if (e.key === "-") setScale((s) => Math.max(1, s - 0.5));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const photo = photos[index];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[2000] flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{photo.caption}</p>
          <p className="text-xs text-white/60">
            {index + 1} / {photos.length}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn label="Zoom out" onClick={() => setScale((s) => Math.max(1, s - 0.5))}>
            <ZoomOut className="h-4 w-4" />
          </IconBtn>
          <span className="w-12 text-center text-xs tabular-nums text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <IconBtn label="Zoom in" onClick={() => setScale((s) => Math.min(6, s + 0.5))}>
            <ZoomIn className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Reset" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Fullscreen" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      {/* Stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          setScale((s) => Math.min(6, Math.max(1, s - Math.sign(e.deltaY) * 0.3)));
        }}
        onMouseDown={(e) => {
          dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onMouseMove={(e) => {
          if (!dragRef.current || scale === 1) return;
          setOffset({
            x: dragRef.current.ox + (e.clientX - dragRef.current.x),
            y: dragRef.current.oy + (e.clientY - dragRef.current.y),
          });
        }}
        onMouseUp={() => (dragRef.current = null)}
        onMouseLeave={() => (dragRef.current = null)}
        style={{ cursor: scale > 1 ? "grab" : "default" }}
      >
        <img
          src={photo.url}
          alt={photo.caption}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />

        <NavBtn side="left" onClick={() => go(-1)}>
          <ChevronLeft className="h-6 w-6" />
        </NavBtn>
        <NavBtn side="right" onClick={() => go(1)}>
          <ChevronRight className="h-6 w-6" />
        </NavBtn>
      </div>

      {/* Thumbnails */}
      <div
        className="flex items-center justify-center gap-2 overflow-x-auto px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              onIndex(i);
              reset();
            }}
            className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
              i === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img src={p.url} alt={p.caption} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function NavBtn({
  side,
  children,
  onClick,
}: {
  side: "left" | "right";
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      {children}
    </button>
  );
}
