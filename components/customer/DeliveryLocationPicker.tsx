"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { LocateFixed, MapPin, Minus, Plus } from "lucide-react";

const TILE_SIZE = 256;
const MAP_WIDTH = 640;
const MAP_HEIGHT = 280;
const DEFAULT_CENTER = { latitude: -15.4167, longitude: 28.2833 };

function project(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function unproject(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    longitude: (x / scale) * 360 - 180,
    latitude: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / scale))) * 180) / Math.PI,
  };
}

export default function DeliveryLocationPicker({
  latitude,
  longitude,
  onChange,
  theme = "dark",
  title = "Pin your delivery location",
  description = "Tap the map or use your current location.",
  compact = false,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
  theme?: "light" | "dark";
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  const isLight = theme === "light";
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(14);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [mapSize, setMapSize] = useState({ width: MAP_WIDTH, height: MAP_HEIGHT });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);

  const mapCenter = useMemo(
    () => latitude !== null && longitude !== null ? { latitude, longitude } : center,
    [center, latitude, longitude],
  );

  const map = useMemo(() => {
    const centerPx = project(mapCenter.latitude, mapCenter.longitude, zoom);
    const left = centerPx.x - mapSize.width / 2;
    const top = centerPx.y - mapSize.height / 2;
    const firstX = Math.floor(left / TILE_SIZE) - 1;
    const firstY = Math.floor(top / TILE_SIZE) - 1;
    const lastX = Math.floor((left + mapSize.width) / TILE_SIZE) + 1;
    const lastY = Math.floor((top + mapSize.height) / TILE_SIZE) + 1;
    const tiles = [] as { key: string; x: number; y: number; left: number; top: number }[];
    const count = 2 ** zoom;
    for (let y = firstY; y <= lastY; y += 1) {
      for (let x = firstX; x <= lastX; x += 1) {
        const wrappedX = ((x % count) + count) % count;
        if (y < 0 || y >= count) continue;
        tiles.push({ key: `${zoom}-${wrappedX}-${y}`, x: wrappedX, y, left: x * TILE_SIZE - left, top: y * TILE_SIZE - top });
      }
    }
    const pin = latitude !== null && longitude !== null
      ? project(latitude, longitude, zoom)
      : null;
    return {
      tiles,
      pin: pin ? { left: pin.x - left, top: pin.y - top } : null,
    };
  }, [mapCenter, latitude, longitude, mapSize, zoom]);

  function selectPoint(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerPx = project(mapCenter.latitude, mapCenter.longitude, zoom);
    const point = unproject(
      centerPx.x - mapSize.width / 2 + (event.clientX - rect.left),
      centerPx.y - mapSize.height / 2 + (event.clientY - rect.top),
      zoom,
    );
    const selected = { latitude: Math.max(-85, Math.min(85, point.latitude)), longitude: point.longitude };
    onChange(selected.latitude, selected.longitude);
    setLocationError("");
    setLocationAccuracy(null);
  }

  function startMapGesture(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: 0, y: 0, moved: false };
    setDragOffset({ x: 0, y: 0 });
  }

  function moveMapGesture(event: PointerEvent<HTMLDivElement>) {
    const activeDrag = drag.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    const x = event.clientX - activeDrag.startX;
    const y = event.clientY - activeDrag.startY;
    activeDrag.x = x;
    activeDrag.y = y;
    activeDrag.moved = activeDrag.moved || Math.abs(x) + Math.abs(y) > 5;
    setDragOffset({ x, y });
  }

  function finishMapGesture(event: PointerEvent<HTMLDivElement>) {
    const activeDrag = drag.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragOffset({ x: 0, y: 0 });

    if (!activeDrag.moved) {
      selectPoint(event);
      return;
    }

    const centerPx = project(mapCenter.latitude, mapCenter.longitude, zoom);
    const selected = unproject(centerPx.x - activeDrag.x, centerPx.y - activeDrag.y, zoom);
    const nextLatitude = Math.max(-85, Math.min(85, selected.latitude));
    onChange(nextLatitude, selected.longitude);
    setCenter({ latitude: nextLatitude, longitude: selected.longitude });
    setLocationAccuracy(null);
    setLocationError("");
  }

  function cancelMapGesture(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragOffset({ x: 0, y: 0 });
  }

  function useCurrentLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location isn’t available in this browser. Tap the map to place a pin.");
      return;
    }
    setLocating(true);
    let watchId: number | null = null;
    let bestAccuracy = Number.POSITIVE_INFINITY;
    let finished = false;
    let bestPosition: GeolocationPosition | null = null;

    const finish = (message = "") => {
      if (finished) return;
      finished = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);
      if (bestPosition) {
        const { latitude: nextLatitude, longitude: nextLongitude, accuracy } = bestPosition.coords;
        onChange(nextLatitude, nextLongitude);
        setCenter({ latitude: nextLatitude, longitude: nextLongitude });
        setZoom(17);
        setLocationAccuracy(accuracy);
      }
      setLocationError(message);
      setLocating(false);
    };

    const timer = window.setTimeout(() => {
      if (bestPosition) {
        finish(bestAccuracy > 150
          ? `Your phone reported an approximate location (±${Math.round(bestAccuracy)} m). Move outdoors or tap the map to refine it.`
          : "");
      } else {
        finish("Couldn’t get a fresh GPS fix. Check that Location is enabled and allowed for this site, or tap the map to place a pin.");
      }
    }, 20000);

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (position.coords.accuracy < bestAccuracy) {
            bestPosition = position;
            bestAccuracy = position.coords.accuracy;
            if (bestAccuracy <= 60) finish();
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            finish("Location permission was denied. Allow location for this site in your browser settings, then try again.");
          } else if (bestPosition) {
            finish(bestAccuracy > 150
              ? `Your phone reported an approximate location (±${Math.round(bestAccuracy)} m). Move outdoors or tap the map to refine it.`
              : "");
          } else {
            finish("Couldn’t get a fresh GPS fix. Check that Location is enabled, or tap the map to place a pin.");
          }
        },
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 },
      );
    } catch {
      finish("Location couldn’t be started. Check your browser’s location permission, or tap the map to place a pin.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>{title}</p>
          <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-white/55"}`}>{description}</p>
        </div>
        <button type="button" onClick={useCurrentLocation} disabled={locating} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${isLight ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-white/15 bg-white/10 text-white hover:bg-white/15"}`}>
          <LocateFixed className="h-4 w-4" />{locating ? "Finding you…" : "Use my location"}
        </button>
      </div>

      <div
        ref={(element) => {
          if (!element) return;
          const { width, height } = element.getBoundingClientRect();
          if (width > 0 && (width !== mapSize.width || height !== mapSize.height)) setMapSize({ width, height });
        }}
        role="button"
        tabIndex={0}
        aria-label="Drag to move the map, or tap to place a location pin"
        onPointerDown={startMapGesture}
        onPointerMove={moveMapGesture}
        onPointerUp={finishMapGesture}
        onPointerCancel={cancelMapGesture}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const point = project(mapCenter.latitude, mapCenter.longitude, zoom);
            const selected = unproject(point.x, point.y, zoom);
            onChange(selected.latitude, selected.longitude);
            setCenter({ latitude: selected.latitude, longitude: selected.longitude });
            setLocationAccuracy(null);
          }
        }}
        className={`relative w-full touch-none cursor-grab overflow-hidden rounded-xl border bg-slate-200 active:cursor-grabbing ${compact ? "h-[150px] sm:h-[180px]" : "h-[220px] sm:h-[280px]"} ${isLight ? "border-slate-200" : "border-white/15"}`}
      >
        <div className="pointer-events-none absolute inset-0" style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}>
          {map.tiles.map((tile) => (
            // OpenStreetMap tile service, with required attribution shown below.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={tile.key} src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`} alt="" draggable={false} className="pointer-events-none absolute max-w-none select-none" style={{ width: TILE_SIZE, height: TILE_SIZE, left: tile.left, top: tile.top }} />
          ))}
          {map.pin && <span className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full drop-shadow-md" style={{ left: map.pin.left, top: map.pin.top }}><MapPin className="h-9 w-9 fill-rose-600 text-white" /></span>}
        </div>
        <div className="absolute right-2 top-2 z-20 flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow">
          <button type="button" aria-label="Zoom in" onClick={(event) => { event.stopPropagation(); setZoom((value) => Math.min(18, value + 1)); }} className="p-2 text-slate-700 hover:bg-slate-100"><Plus className="h-4 w-4" /></button>
          <button type="button" aria-label="Zoom out" onClick={(event) => { event.stopPropagation(); setZoom((value) => Math.max(3, value - 1)); }} className="border-t border-slate-200 p-2 text-slate-700 hover:bg-slate-100"><Minus className="h-4 w-4" /></button>
        </div>
        <span className="absolute bottom-1 left-1 z-10 rounded bg-white/85 px-1.5 py-0.5 text-[10px] text-slate-700">© OpenStreetMap contributors</span>
      </div>

      {latitude !== null && longitude !== null
        ? <p className={`text-xs ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>Location pinned: {latitude.toFixed(6)}, {longitude.toFixed(6)}{locationAccuracy !== null ? ` · GPS accuracy ±${Math.round(locationAccuracy)} m` : ""}</p>
        : <p className={`text-xs ${isLight ? "text-amber-700" : "text-amber-200"}`}>No map pin selected yet.</p>}
      {locationError && <p role="status" className={`text-xs ${isLight ? "text-amber-700" : "text-amber-200"}`}>{locationError}</p>}
    </div>
  );
}
