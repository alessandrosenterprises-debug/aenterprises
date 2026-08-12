"use client";

import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { AEExportMenu } from "@/components/enterprise";
import { AESearchInput } from "@/components/enterprise/search";

interface AEDataTableToolbarProps {
  children?: ReactNode;

  filters?: ReactNode;

  search: string;

  setSearch: (value: string) => void;

  onCSV?: () => void;

  onExcel?: () => void;

  onPDF?: () => void;
}

export default function AEDataTableToolbar({
  children,
  filters,
  search,
  setSearch,
  onCSV,
  onExcel,
  onPDF,
}: AEDataTableToolbarProps) {
  const router = useRouter();

  return (
    <div className="space-y-4 border-b border-slate-200 p-5">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="w-full lg:max-w-md">
          <AESearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <button
            type="button"
            onClick={() => router.refresh()}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 transition hover:bg-slate-100"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <AEExportMenu
            onCSV={onCSV}
            onExcel={onExcel}
            onPDF={onPDF}
          />

          {children}

        </div>

      </div>

      {filters && (
        <div className="flex flex-wrap gap-3">
          {filters}
        </div>
      )}

    </div>
  );
}