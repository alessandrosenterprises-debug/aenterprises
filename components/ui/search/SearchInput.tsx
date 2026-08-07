import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
}

export default function SearchInput({
  placeholder = "Search the enterprise...",
}: SearchInputProps) {
  return (
    <div className="relative w-full max-w-lg">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all duration-200 focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-100"
      />
    </div>
  );
}