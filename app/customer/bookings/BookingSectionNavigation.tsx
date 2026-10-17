"use client";

import { useState, type ReactNode } from "react";

export default function BookingSectionNavigation({ upcomingCount, historyCount, upcomingContent, historyContent }: {
  upcomingCount: number;
  historyCount: number;
  upcomingContent: ReactNode;
  historyContent: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const isHistory = activeTab === "history";
  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Booking lists" className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
        <button type="button" role="tab" aria-selected={!isHistory} aria-controls="upcoming-panel" onClick={() => setActiveTab("upcoming")} className={`flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm ${!isHistory ? "bg-[#03162F] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
          Upcoming ({upcomingCount})
        </button>
        <button type="button" role="tab" aria-selected={isHistory} aria-controls="history-panel" onClick={() => setActiveTab("history")} className={`flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm ${isHistory ? "bg-[#03162F] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
          History ({historyCount})
        </button>
        </div>
      </div>
      <section id={isHistory ? "history-panel" : "upcoming-panel"} role="tabpanel" className="pt-7">
        {isHistory ? historyContent : upcomingContent}
      </section>
    </div>
  );
}
