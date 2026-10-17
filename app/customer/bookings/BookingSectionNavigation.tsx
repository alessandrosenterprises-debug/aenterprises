"use client";

export default function BookingSectionNavigation({ upcomingCount, historyCount }: { upcomingCount: number; historyCount: number }) {
  function scrollToSection(id: "upcoming" | "history") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      <div className="grid grid-cols-2 gap-1">
        <button type="button" onClick={() => scrollToSection("upcoming")} aria-controls="upcoming" className="flex items-center justify-center rounded-xl bg-[#03162F] px-3 py-2.5 text-xs font-bold text-white sm:text-sm">
          Upcoming ({upcomingCount})
        </button>
        <button type="button" onClick={() => scrollToSection("history")} aria-controls="history" className="flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 sm:text-sm">
          History ({historyCount})
        </button>
      </div>
    </div>
  );
}
