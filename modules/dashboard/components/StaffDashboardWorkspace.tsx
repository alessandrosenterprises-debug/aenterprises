import type { getRoleDashboardData } from "@/modules/dashboard/services/workspace.service";

type DashboardData = Awaited<ReturnType<typeof getRoleDashboardData>>;

export default function StaffDashboardWorkspace({ data }: { data: DashboardData }) {
  const metrics = [
    ["Incoming orders", data.stats.incomingOrders], ["Bookings to confirm", data.stats.pendingBookings],
    ["Active deliveries", data.stats.activeDeliveries], ["New consultations", data.stats.pendingConsultations],
  ];
  return <div className="w-full min-w-0 space-y-5">
    <header className="sticky top-0 z-30 -mx-6 -mt-6 bg-[#03162f] px-6 py-5 text-white shadow-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">Staff workspace · {data.profile?.role ?? "Team member"}</p>
      <h1 className="mt-1 text-2xl font-bold">Good day, {data.profile?.display_name ?? "Team member"}</h1>
      <p className="mt-1 text-sm text-slate-300">Your store work is organized in the sidebar. Choose a section to open its own workspace page.</p>
    </header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label,value])=><article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-[#03162f]">{value}</p></article>)}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#03162f]">Store activity</h2><p className="mt-1 text-sm text-slate-500">{data.queuePreviews.activity.length} recent items are available in your assigned store. Open Orders, Bookings, Deliveries or Consultations from the sidebar to work on them.</p></section>
  </div>;
}
