"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface LoanMonthPickerProps {
  value: string;
  currentMonth: string;
  label: string;
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-ZM", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

export default function LoanMonthPicker({ value, currentMonth, label }: LoanMonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(Number(value.slice(0, 4)));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function choose(month: number) {
    const chosen = `${visibleYear}-${String(month + 1).padStart(2, "0")}`;
    if (chosen > currentMonth) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", chosen);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <span className="mb-2 block text-sm font-medium text-slate-700">Summary month</span>
      <button type="button" onClick={() => { setVisibleYear(Number(value.slice(0, 4))); setOpen(!open); }}
        aria-expanded={open} aria-label={`Choose summary month, currently ${label}`}
        className="flex min-w-52 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm hover:border-slate-400">
        <CalendarDays className="h-4 w-4 text-slate-500" />{label}
      </button>
      {open && <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" aria-label="Previous year" onClick={() => setVisibleYear(visibleYear - 1)} className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
          <span className="font-semibold text-[#03162F]">{visibleYear}</span>
          <button type="button" aria-label="Next year" disabled={visibleYear >= Number(currentMonth.slice(0, 4))} onClick={() => setVisibleYear(visibleYear + 1)} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, month) => {
            const key = `${visibleYear}-${String(month + 1).padStart(2, "0")}`;
            const selected = key === value;
            const disabled = key > currentMonth;
            return <button key={key} type="button" disabled={disabled} onClick={() => choose(month)}
              className={`rounded-lg px-2 py-2.5 text-sm ${selected ? "bg-[#03162F] font-semibold text-white" : "text-slate-700 hover:bg-slate-100"} disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white`}>
              {new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2020, month, 1, 12)))}
            </button>;
          })}
        </div>
        <button type="button" onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("month", currentMonth);
          router.push(`${pathname}?${params.toString()}`);
          setVisibleYear(Number(currentMonth.slice(0, 4)));
          setOpen(false);
        }} className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">{monthLabel(currentMonth)} · Current month</button>
      </div>}
    </div>
  );
}
