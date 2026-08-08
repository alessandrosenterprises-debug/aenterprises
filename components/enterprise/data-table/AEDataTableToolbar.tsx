"use client";

import {
  Download,
  RefreshCw,
} from "lucide-react";

import { AESearchInput } from "@/components/enterprise/search";

interface AEDataTableToolbarProps {
  children?: React.ReactNode;
  search: string;
  setSearch: (value: string) => void;
}

export default function AEDataTableToolbar({
  children,
  search,
  setSearch,
}: AEDataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full lg:max-w-md">
        <AESearchInput
  value={search}
  onChange={setSearch}
  placeholder="Search..."
/>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 transition hover:bg-slate-100"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

        <button
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 transition hover:bg-slate-100"
        >
          <Download size={18} />
          Export
        </button>

        {children}
      </div>
    </div>
  );
}