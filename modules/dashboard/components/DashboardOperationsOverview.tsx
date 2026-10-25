"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PackageSearch,
  RefreshCw,
  UserRoundPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardStats = Awaited<ReturnType<typeof import("../services/dashboard.service").getDashboardStats>>;

const businessAccents = [
  { border: "border-fuchsia-200", icon: "bg-fuchsia-100 text-fuchsia-700", chip: "bg-fuchsia-50 text-fuchsia-700" },
  { border: "border-sky-200", icon: "bg-sky-100 text-sky-700", chip: "bg-sky-50 text-sky-700" },
  { border: "border-emerald-200", icon: "bg-emerald-100 text-emerald-700", chip: "bg-emerald-50 text-emerald-700" },
  { border: "border-amber-200", icon: "bg-amber-100 text-amber-700", chip: "bg-amber-50 text-amber-700" },
  { border: "border-violet-200", icon: "bg-violet-100 text-violet-700", chip: "bg-violet-50 text-violet-700" },
];

function money(value: number) {
  return `ZMW ${Number(value ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayLabel(value: string) {
  const date = new Date(`${value}T12:00:00+02:00`);
  return new Intl.DateTimeFormat("en-ZM", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lusaka" }).format(date);
}

export default function DashboardOperationsOverview({ stats, dashboardHref = "/dashboard" }: { stats: DashboardStats; dashboardHref?: string }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

  const topCards = [
    { label: `Bookings ${stats.date === stats.currentDate ? "today" : "on selected date"}`, value: stats.bookingsToday, hint: `${stats.pendingBookings} currently awaiting attention`, icon: CalendarDays, color: "border-blue-200 bg-blue-50 text-blue-800", iconColor: "bg-blue-100 text-blue-700", href: "/dashboard/bookings" },
    { label: `Requests ${stats.date === stats.currentDate ? "today" : "on selected date"}`, value: stats.requestsToday, hint: "Orders, consultations and loan applications", icon: Activity, color: "border-violet-200 bg-violet-50 text-violet-800", iconColor: "bg-violet-100 text-violet-700", href: "/dashboard/notifications" },
    { label: "New customers", value: stats.newCustomers, hint: `Registered ${stats.date === stats.currentDate ? "today" : "on selected date"}`, icon: UserRoundPlus, color: "border-emerald-200 bg-emerald-50 text-emerald-800", iconColor: "bg-emerald-100 text-emerald-700", href: "/dashboard/customers" },
    { label: `Revenue ${stats.date === stats.currentDate ? "today" : "on selected date"}`, value: money(stats.todayRevenue), hint: "Paid bookings and orders", icon: WalletCards, color: "border-amber-200 bg-amber-50 text-amber-900", iconColor: "bg-amber-100 text-amber-700", href: "/dashboard/reports" },
  ];

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Daily operations</p>
          <h2 className="mt-1 text-xl font-black text-[#03162F]">{todayLabel(stats.date)}</h2>
          <p className="mt-1 text-sm text-slate-500">{stats.date === stats.currentDate ? "Showing today’s figures." : "Showing figures for the selected date."} Business cards also include open tasks and stock alerts.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 self-start sm:self-auto">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            <span>Summary date</span>
            <input
              aria-label="Choose dashboard date"
              type="date"
              value={stats.date}
              max={stats.currentDate}
              onChange={(event) => {
                if (event.target.value) router.push(`${dashboardHref}?date=${event.target.value}`);
              }}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-[#03162F] shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700"><RefreshCw className="h-3.5 w-3.5" />Live</div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topCards.map(({ label, value, hint, icon: Icon, color, iconColor, href }) => (
          <Link key={label} href={href} className={`group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${color}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold opacity-80">{label}</p><p className="mt-3 text-3xl font-black tracking-tight">{value}</p></div><span className={`rounded-xl p-3 ${iconColor}`}><Icon className="h-5 w-5" /></span></div>
            <div className="mt-4 flex items-center justify-between gap-2 text-xs opacity-75"><span>{hint}</span><ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black text-[#03162F]">Seven-day activity</h2><p className="mt-1 text-sm text-slate-500">Bookings and customer requests by day</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">Through selected date</span></div>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyActivity} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs><linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient><linearGradient id="requestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.22} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#2563eb" strokeWidth={3} fill="url(#bookingFill)" />
                <Area type="monotone" dataKey="requests" name="Requests" stroke="#8b5cf6" strokeWidth={3} fill="url(#requestFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-sm"><div><p className="text-xs text-slate-500">Revenue, 7 days</p><p className="mt-1 font-black text-[#03162F]">{money(stats.dailyActivity.reduce((sum, day) => sum + day.revenue, 0))}</p></div><div><p className="text-xs text-slate-500">Active businesses</p><p className="mt-1 font-black text-[#03162F]">{stats.businesses}</p></div><div><p className="text-xs text-slate-500">Active staff</p><p className="mt-1 font-black text-[#03162F]">{stats.employees}</p></div></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black text-[#03162F]">Needs attention</h2><p className="mt-1 text-sm text-slate-500">Open work across the business</p></div><span className="rounded-xl bg-rose-50 p-3 text-rose-700"><AlertTriangle className="h-5 w-5" /></span></div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Pending bookings", value: stats.pendingBookings, href: "/dashboard/bookings", color: "bg-amber-50 text-amber-800", Icon: Clock3 },
              { label: "Pending staff records", value: stats.businessCards.reduce((sum, business) => sum + business.pendingStaff, 0), href: "/dashboard/employees", color: "bg-sky-50 text-sky-800", Icon: UsersRound },
              { label: "Low-stock products", value: stats.businessCards.reduce((sum, business) => sum + business.lowStock, 0), href: "/dashboard/catalog", color: "bg-rose-50 text-rose-800", Icon: PackageSearch },
              { label: "Pending consultations", value: stats.businessCards.reduce((sum, business) => sum + business.pendingConsultations, 0), href: "/dashboard/enterprise/tech-solutions/consultations", color: "bg-violet-50 text-violet-800", Icon: Activity },
              { label: "Today's paid activity", value: money(stats.todayRevenue), href: "/dashboard/reports", color: "bg-emerald-50 text-emerald-800", Icon: CheckCircle2 },
            ].map(({ label, value, href, color, Icon }) => <Link key={label} href={href} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:brightness-[0.98] ${color}`}><span className="flex min-w-0 items-center gap-3"><Icon className="h-4 w-4 shrink-0" /><span className="truncate text-sm font-semibold">{label}</span></span><span className="shrink-0 text-sm font-black">{value}</span></Link>)}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black text-[#03162F]">Business operations</h2><p className="mt-1 text-sm text-slate-500">Today’s activity and current open items for each business.</p></div><Link href="/dashboard/enterprise" className="text-sm font-bold text-blue-700 hover:underline">View all workspaces →</Link></div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {stats.businessCards.map((business, index) => {
            const accent = businessAccents[index % businessAccents.length];
            return <article key={business.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${accent.border}`}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="flex min-w-0 items-center gap-3">{business.logo_url ? <img src={business.logo_url} alt={`${business.name} logo`} className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white p-1 object-contain" /> : <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.icon}`}><Activity className="h-5 w-5" /></span>}<div className="min-w-0"><h3 className="truncate font-black text-[#03162F]">{business.name}</h3><p className="mt-0.5 text-xs text-slate-500">{business.active ? "Active business" : "Inactive business"}</p></div></div><Link href={`/dashboard/enterprise/${business.slug}`} aria-label={`Open ${business.name} workspace`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ArrowUpRight className="h-4 w-4" /></Link></div>
              <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3">
                <Metric label="Bookings today" value={business.bookingsToday} accent={accent.chip} href="/dashboard/bookings" />
                <Metric label="Pending bookings" value={business.pendingBookings} accent="bg-amber-50 text-amber-700" href="/dashboard/bookings" />
                <Metric label="Requests today" value={business.requestsToday} accent="bg-indigo-50 text-indigo-700" href="/dashboard/notifications" />
                <Metric label="Consultations" value={business.consultationsToday} accent="bg-violet-50 text-violet-700" href="/dashboard/enterprise/tech-solutions/consultations" />
                <Metric label="Pending staff" value={business.pendingStaff} accent="bg-sky-50 text-sky-700" href="/dashboard/employees" />
                <Metric label="Low stock" value={business.lowStock} accent={business.lowStock ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"} href={`/dashboard/enterprise/${business.slug}/products`} />
              </div>
              {business.lowStockItems.length > 0 && <div className="mx-4 mb-4 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2.5"><p className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Stock alert</p><p className="mt-1 truncate text-xs text-rose-900">{business.lowStockItems.map((item) => `${item.name} (${item.quantity})`).join(" · ")}{business.lowStock > business.lowStockItems.length ? ` · +${business.lowStock - business.lowStockItems.length} more` : ""}</p></div>}
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, accent, href }: { label: string; value: number; accent: string; href: string }) {
  return <Link href={href} className={`min-w-0 rounded-xl p-3 transition hover:brightness-[0.98] ${accent}`}><p className="truncate text-[11px] font-semibold opacity-75">{label}</p><p className="mt-1 text-xl font-black">{value}</p></Link>;
}
