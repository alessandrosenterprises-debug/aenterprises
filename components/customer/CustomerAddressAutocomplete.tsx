"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";

export interface AddressPlaceSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

export default function CustomerAddressAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: AddressPlaceSuggestion) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<AddressPlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3 || query === selectedValue) {
      const timer = window.setTimeout(() => { setSuggestions([]); setLoading(false); }, 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: query, limit: "6", lang: "en", lat: "-15.4167", lon: "28.2833", zoom: "12" });
        const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Location suggestions are temporarily unavailable.");
        const result = await response.json() as { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Record<string, string | undefined> }> };
        const places = (result.features ?? []).flatMap((feature) => {
          const coordinates = feature.geometry?.coordinates;
          if (!coordinates || coordinates.length < 2) return [];
          const props = feature.properties ?? {};
          const locality = [props.street, props.housenumber, props.district, props.city, props.state, props.country].filter(Boolean).join(", ");
          const name = [props.name, locality].filter(Boolean).join(", ");
          const latitude = Number(coordinates[1]);
          const longitude = Number(coordinates[0]);
          return name && Number.isFinite(latitude) && Number.isFinite(longitude) ? [{ label: name, latitude, longitude }] : [];
        });
        setSuggestions(places);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setError(requestError instanceof Error ? requestError.message : "Location suggestions are temporarily unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [selectedValue, value]);

  function choose(place: AddressPlaceSuggestion) {
    setSelectedValue(place.label);
    setSuggestions([]);
    setError("");
    onChange(place.label);
    onSelect(place);
  }

  return <div className="relative">
    <label className="block text-xs font-bold text-slate-600">{label}<span className="relative mt-1.5 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={value} autoComplete="off" onChange={(event) => { setSelectedValue(""); setError(""); onChange(event.target.value); }} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-10 text-base text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 sm:text-sm" placeholder={placeholder} />{loading && <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#9A7412]" />}</span></label>
    {(suggestions.length > 0 || error) && <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">{suggestions.map((place) => <button key={`${place.label}-${place.latitude}-${place.longitude}`} type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => choose(place)} className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-3 text-left text-xs text-slate-700 last:border-0 hover:bg-amber-50"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7412]" /><span className="min-w-0"><span className="block font-bold">{place.label}</span><span className="mt-0.5 block text-[10px] text-slate-400">Select to set the address and pin this location on the map</span></span></button>)}{error && <p className="px-3 py-2 text-xs text-amber-700">{error}</p>}</div>}
    {loading && suggestions.length === 0 && <p className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500 shadow-lg">Looking for nearby places…</p>}
  </div>;
}
