import { ChevronDown, User } from "lucide-react";

export default function UserProfile() {
  return (
    <button className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-100">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#03162F] text-white">
        <User size={20} />
      </div>

      <div className="hidden text-left lg:block">
        <p className="font-semibold text-[#03162F]">
          Alessandro
        </p>

        <p className="text-xs text-slate-500">
          Super Administrator
        </p>
      </div>

      <ChevronDown className="hidden h-4 w-4 text-slate-500 lg:block" />
    </button>
  );
}