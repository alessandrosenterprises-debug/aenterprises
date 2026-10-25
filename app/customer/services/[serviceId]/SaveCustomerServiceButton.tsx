"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSyncExternalStore } from "react";

const SAVED_SERVICES_KEY = "aeos:saved-customer-services";
const SAVED_SERVICES_EVENT = "aeos:saved-customer-services-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SAVED_SERVICES_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SAVED_SERVICES_EVENT, callback);
  };
}

function getSavedSnapshot(serviceId: string) {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(SAVED_SERVICES_KEY) || "[]");
    return Array.isArray(stored) && stored.includes(serviceId);
  } catch {
    return false;
  }
}

export default function SaveCustomerServiceButton({ serviceId }: { serviceId: string }) {
  const saved = useSyncExternalStore(subscribe, () => getSavedSnapshot(serviceId), () => false);

  function toggleSaved() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(SAVED_SERVICES_KEY) || "[]");
      const current: string[] = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
      const next = saved ? current.filter((id) => id !== serviceId) : [...new Set([...current, serviceId])];
      window.localStorage.setItem(SAVED_SERVICES_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(SAVED_SERVICES_EVENT));
    } catch {
      // The control remains available, but persistence requires browser storage.
    }
  }

  return (
    <button type="button" onClick={toggleSaved} aria-pressed={saved} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-[#03162F] transition hover:border-[#D4AF37] hover:bg-amber-50">
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Added to saved services" : "Add to saved services"}
    </button>
  );
}
