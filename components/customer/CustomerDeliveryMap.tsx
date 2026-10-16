"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bike, MapPin, Store } from "lucide-react";

type Point = { lat: number; lon: number };
const TILE = 256;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function project(point: Point, zoom: number) {
  const world = TILE * 2 ** zoom;
  const lat = clamp(point.lat, -85.0511, 85.0511) * Math.PI / 180;
  return { x: (point.lon + 180) / 360 * world, y: (1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * world };
}

function unproject(x: number, y: number, zoom: number): Point {
  const world = TILE * 2 ** zoom;
  return { lon: x / world * 360 - 180, lat: 180 / Math.PI * Math.atan(Math.sinh(Math.PI - 2 * Math.PI * y / world)) };
}

export default function CustomerDeliveryMap({
  storeName,
  store,
  rider,
  destination,
}: {
  storeName: string;
  store: Point | null;
  rider: Point | null;
  destination: Point;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 300 });

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.max(320, entry.contentRect.width), height: Math.max(240, entry.contentRect.height) });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const map = useMemo(() => {
    const points = [store, rider, destination].filter((point): point is Point => Boolean(point));
    const maxZoomPointPixels = points.map((point) => project(point, 18));
    const minX = Math.min(...maxZoomPointPixels.map((point) => point.x));
    const maxX = Math.max(...maxZoomPointPixels.map((point) => point.x));
    const minY = Math.min(...maxZoomPointPixels.map((point) => point.y));
    const maxY = Math.max(...maxZoomPointPixels.map((point) => point.y));
    const spanX = Math.max(80, maxX - minX);
    const spanY = Math.max(80, maxY - minY);
    const fit = Math.min((size.width - 96) / spanX, (size.height - 96) / spanY, 1);
    const zoom = clamp(18 + Math.floor(Math.log2(Math.max(fit, 1 / 64))), 8, 18);
    const center = unproject((minX + maxX) / 2 / 2 ** (18 - zoom), (minY + maxY) / 2 / 2 ** (18 - zoom), zoom);
    const centerPx = project(center, zoom);
    const topLeft = { x: centerPx.x - size.width / 2, y: centerPx.y - size.height / 2 };
    const columns = Math.ceil(size.width / TILE) + 2;
    const rows = Math.ceil(size.height / TILE) + 2;
    const firstTileX = Math.floor(topLeft.x / TILE);
    const firstTileY = Math.floor(topLeft.y / TILE);
    const tileCount = 2 ** zoom;
    const tiles = [] as { key: string; x: number; y: number; left: number; top: number }[];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = firstTileX + column;
        const y = firstTileY + row;
        if (y < 0 || y >= tileCount) continue;
        tiles.push({ key: `${zoom}-${x}-${y}`, x: ((x % tileCount) + tileCount) % tileCount, y, left: x * TILE - topLeft.x, top: y * TILE - topLeft.y });
      }
    }
    const position = (point: Point) => {
      const pixel = project(point, zoom);
      return { x: size.width / 2 + pixel.x - centerPx.x, y: size.height / 2 + pixel.y - centerPx.y };
    };
    return { zoom, tiles, position, route: [store, rider, destination].filter((point): point is Point => Boolean(point)).map(position) };
  }, [destination, rider, size, store]);

  const destinationPosition = map.position(destination);
  const storePosition = store ? map.position(store) : null;
  const riderPosition = rider ? map.position(rider) : null;

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9A7412]">{storeName === "Collection point" ? "Collection to delivery" : "Store to your location"}</p><p className="mt-0.5 text-sm font-bold text-[#03162F]">{storeName || "Store location"} → Delivery address</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">{rider ? "Rider moving live" : "Route preview"}</span></div>
    <div ref={mapRef} className="relative h-[300px] w-full overflow-hidden bg-slate-100 sm:h-[360px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- OSM tiles use position-specific URLs, so next/image optimization is not applicable. */}
      {map.tiles.map((tile) => <img key={tile.key} src={`https://tile.openstreetmap.org/${map.zoom}/${tile.x}/${tile.y}.png`} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute max-w-none select-none" style={{ width: TILE, height: TILE, left: tile.left, top: tile.top }} />)}
      {map.route.length > 1 && <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full"><polyline points={map.route.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#03162F" strokeWidth="4" strokeDasharray="8 7" strokeLinecap="round" strokeLinejoin="round" opacity=".75" /></svg>}
      {storePosition && <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: storePosition.x, top: storePosition.y }}><span className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[#D4AF37] text-[#03162F] shadow-lg">{storeName === "Collection point" ? <MapPin className="h-4 w-4" /> : <Store className="h-4 w-4" />}</span><span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#03162F] px-2 py-1 text-[10px] font-bold text-white shadow">{storeName || "Store"}</span></div>}
      {riderPosition && <div className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: riderPosition.x, top: riderPosition.y }}><span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-blue-700 text-white shadow-lg ring-4 ring-blue-300/50"><Bike className="h-5 w-5" /></span><span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-blue-800 px-2 py-1 text-[10px] font-bold text-white shadow">Rider</span></div>}
      <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: destinationPosition.x, top: destinationPosition.y }}><span className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-rose-600 text-white shadow-lg"><MapPin className="h-5 w-5" /></span><span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-rose-700 px-2 py-1 text-[10px] font-bold text-white shadow">Your location</span></div>
      <span className="absolute bottom-1 right-1 z-40 rounded bg-white/90 px-1.5 py-0.5 text-[9px] text-slate-600">© OpenStreetMap contributors</span>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-3 text-[11px] font-semibold text-slate-600"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />{storeName === "Collection point" ? "Collection point" : "Store"}</span><span className="inline-flex items-center gap-1.5"><Bike className="h-3.5 w-3.5 text-blue-700" />Rider</span><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-rose-600" />Your location</span></div>
    {!store && <p className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">The pickup location isn’t set yet. The rider and delivery destination will still appear here.</p>}
  </div>;
}
