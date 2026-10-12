"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";

const SAVED_SERVICES_KEY = "aeos:saved-customer-services";

export default function SaveCustomerServiceButton({ serviceId }: { serviceId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const current = JSON.parse(window.localStorage.getItem(SAVED_SERVICES_KEY) || "[]");
      setSaved(Array.isArray(current) && current.includes(serviceId));
    } catch {
      setSaved(false);
    }
  }, [serviceId]);

  function toggleSaved() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(SAVED_SERVICES_KEY) || "[]");
      const current: string[] = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
      const next = saved ? current.filter((id) => id !== serviceId) : [...new Set([...current, serviceId])];
      window.localStorage.setItem(SAVED_SERVICES_KEY, JSON.stringify(next));
      setSaved(!saved);
    } catch {
      // Keep the action available if browser storage is disabled.
      setSaved(!saved);
    }
  }

  return (
    <button type="button" onClick={toggleSaved} aria-pressed={saved} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-[#03162F] transition hover:border-[#D4AF37] hover:bg-amber-50">
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Added to saved services" : "Add to saved services"}
    </button>
  );
}
