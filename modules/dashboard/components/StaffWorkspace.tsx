import Link from "next/link";
import {
  ArrowRight,
  Bike,
  CalendarDays,
  HandCoins,
  Mail,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";

type DashboardStats = Awaited<ReturnType<typeof import("../services/dashboard.service").getDashboardStats>>;

interface WorkspaceAction {
  title: string;
  description: string;
  href: string;
  permission: string;
  count?: number;
  icon: typeof ShoppingBag;
  urgent?: boolean;
}

export default function StaffWorkspace({
  stats,
  permissionKeys,
  isSuperAdministrator,
}: {
  stats: DashboardStats;
  permissionKeys: string[];
  isSuperAdministrator: boolean;
}) {
  const actions: WorkspaceAction[] = [
    { title: "Customer orders", description: "Accept · prepare · fulfil", href: "/dashboard/orders", permission: "orders.view", count: stats.incomingOrders, icon: ShoppingBag, urgent: true },
    { title: "Loan applications", description: "Review · decide · follow up", href: "/dashboard/loans", permission: "loans.approve", count: stats.openLoans, icon: HandCoins, urgent: true },
    { title: "Bookings", description: "Confirm · schedule · complete", href: "/dashboard/bookings", permission: "bookings.view", count: stats.pendingBookings, icon: CalendarDays, urgent: true },
    { title: "My deliveries", description: "Update assigned delivery progress", href: "/dashboard/orders/my-deliveries", permission: "deliveries.manage", count: stats.activeDeliveries, icon: Bike },
    { title: "Consultations", description: "Respond to service requests", href: "/dashboard/enterprise/tech-solutions/consultations", permission: "businesses.view", count: stats.pendingConsultations, icon: MessageSquare, urgent: true },
    { title: "Emails", description: "Read and respond to email", href: "/dashboard/emails", permission: "communications.manage", icon: Mail },
    { title: "Customer messages", description: "Reply to open conversations", href: "/dashboard/messages", permission: "communications.manage", icon: MessageSquare },
  ];

  const visibleActions = actions.filter((action) => isSuperAdministrator || permissionKeys.includes(action.permission));

  return (
    <section className="space-y-3" aria-label="Staff operations workspace">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9A7410]">Staff operations</p>
          <h2 className="mt-0.5 text-xl font-black text-[#03162F]">Work queues</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href} className="group relative flex min-h-[96px] min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#D4AF37]/70 hover:shadow-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#03162F] text-[#D4AF37]"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-extrabold text-[#03162F]">{action.title}</span>
                <span className="mt-1 block truncate text-[10px] leading-4 text-slate-500">{action.description}</span>
              </span>
              {action.count !== undefined && <span className={`absolute right-2 top-2 min-w-6 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black tabular-nums ${action.urgent && action.count > 0 ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>{action.count}</span>}
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#03162F]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
