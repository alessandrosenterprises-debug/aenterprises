"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";

interface AEExportMenuProps {
  onCSV?: () => void;
  onExcel?: () => void;
  onPDF?: () => void;
}

export function AEExportMenu({
  onCSV,
  onExcel,
  onPDF,
}: AEExportMenuProps) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <div
      className="relative"
      ref={menuRef}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 transition hover:bg-slate-100"
      >
        <Download size={18} />

        Export

        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <button
            onClick={() => {
              setOpen(false);
              onCSV?.();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100"
          >
            <FileText size={18} />

            CSV
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onExcel?.();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100"
          >
            <FileSpreadsheet size={18} />

            Excel (.xlsx)
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onPDF?.();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100"
          >
            <FileText size={18} />

            PDF Report
          </button>
        </div>
      )}
    </div>
  );
}