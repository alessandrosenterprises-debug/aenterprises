import { Bell, Search, Settings, User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h2 className="text-xl font-semibold text-[#03162F]">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <Search className="h-5 w-5 cursor-pointer" />
        <Bell className="h-5 w-5 cursor-pointer" />
        <Settings className="h-5 w-5 cursor-pointer" />
        <User className="h-5 w-5 cursor-pointer" />
      </div>
    </header>
  );
}