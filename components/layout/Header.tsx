"use client";

import { Settings } from "lucide-react";

import SearchInput from "@/components/ui/search/SearchInput";
import NotificationCenter from "@/components/layout/NotificationCenter";
import UserProfile from "./UserProfile";

export default function Header() {
  return (
    <header className="sticky top-0 z-[100] flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-[#03162F]">
          Dashboard
        </h1>
      </div>

      <div className="mx-4 hidden min-w-0 flex-1 justify-center lg:flex">
        <SearchInput />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:gap-4">
        <NotificationCenter />

        <a
          href="/dashboard/settings"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#03162F]"
          aria-label="Settings"
        >
          <Settings className="h-6 w-6" />
        </a>

        <UserProfile />
      </div>
    </header>
  );
}