import { Bell, Mail, Settings } from "lucide-react";

import SearchInput from "@/components/ui/search/SearchInput";
import UserProfile from "./UserProfile";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

      <div>
        <h1 className="text-2xl font-bold text-[#03162F]">
          Dashboard
        </h1>
      </div>

      <div className="hidden xl:block">
        <SearchInput />
      </div>

      <div className="flex items-center gap-6">

        <button className="relative transition hover:scale-110">
          <Bell className="h-6 w-6 text-slate-600" />

          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            4
          </span>
        </button>

        <button className="relative transition hover:scale-110">
          <Mail className="h-6 w-6 text-slate-600" />

          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            2
          </span>
        </button>

        <button className="transition hover:rotate-90">
          <Settings className="h-6 w-6 text-slate-600" />
        </button>

        <UserProfile />

      </div>

    </header>
  );
}