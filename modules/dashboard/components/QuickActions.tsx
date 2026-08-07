import {
  UserPlus,
  CalendarPlus,
  PackagePlus,
  Megaphone,
  FileBarChart,
} from "lucide-react";

const actions = [
  { title: "New Customer", icon: UserPlus },
  { title: "New Booking", icon: CalendarPlus },
  { title: "Add Product", icon: PackagePlus },
  { title: "Promotion", icon: Megaphone },
  { title: "Reports", icon: FileBarChart },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-[#03162F]">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-5 transition hover:border-[#D4AF37] hover:bg-slate-50"
            >
              <Icon className="mb-3 h-6 w-6 text-[#03162F]" />

              <span className="text-sm font-medium">
                {action.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}