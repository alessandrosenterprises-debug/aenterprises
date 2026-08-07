import Link from "next/link";
import { navigation } from "@/lib/navigation";

export default function Sidebar() {
  return (
    <aside className="w-[280px] bg-[#03162F] text-white">
      <div className="border-b border-white/10 p-6">
        <h1 className="text-2xl font-bold text-[#D4AF37]">
          ALESSANDRO
        </h1>

        <p className="text-sm text-slate-300">
          Enterprise Platform
        </p>
      </div>

      <nav className="space-y-1 p-4">
        {navigation.map((item) => (
          <Link
            key={item.title}
            href={item.href ?? "#"}
            className="flex items-center rounded-xl px-4 py-3 transition hover:bg-white/10"
          >
            {item.icon && <item.icon className="mr-3 h-5 w-5" />}

            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}