"use client";

import { Search } from "lucide-react";

interface AESearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function AESearchInput({
  placeholder = "Search...",
  value = "",
  onChange,
}: AESearchInputProps) {
  return (
    <div className="relative w-full">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          py-2.5
          pl-10
          pr-4
          text-slate-900
          outline-none
          transition-all
          duration-200
          focus:border-[#D4AF37]
          focus:ring-2
          focus:ring-[#D4AF37]/30
        "
      />
    </div>
  );
}