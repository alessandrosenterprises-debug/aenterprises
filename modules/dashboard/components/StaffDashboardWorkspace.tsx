import { ClipboardList, ShieldCheck } from "lucide-react";
import StaffWorkspace from "@/modules/dashboard/components/StaffWorkspace";
import WorkQueueMonitor from "@/modules/dashboard/components/WorkQueueMonitor";
import DashboardOperationsTabs from "@/modules/dashboard/components/DashboardOperationsTabs";
import OperationsCenter from "@/modules/dashboard/components/OperationsCenter";
import Reminders from "@/modules/dashboard/components/Reminders";
import type { getRoleDashboardData } from "@/modules/dashboard/services/workspace.service";

type DashboardData = Awaited<ReturnType<typeof getRoleDashboardData>>;

export default function StaffDashboardWorkspace({ data }: { data: DashboardData }) {
  const canSeeWork = data.staffAccess.isSuperAdministrator || data.staffAccess.permissionKeys.some((permission) => ["orders.view", "loans.approve", "bookings.view", "deliveries.manage", "businesses.view", "communications.manage", "customers.view", "employees.view", "hr.manage", "reports.view"].includes(permission));
  return <main className="w-full min-w-0 space-y-5">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 rounded-none bg-[#03162F] p-6 text-white shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Staff workspace · {data.profile?.role ?? "Team member"}</p>
      <h1 className="mt-2 text-3xl font-bold">Good day, {data.profile?.display_name ?? "Team member"}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">Your work queues and daily tasks are gathered here. Open the items assigned to your role and continue where you left off.</p>
    </header>

    {canSeeWork ? <>
      <WorkQueueMonitor stats={data.stats} permissionKeys={data.staffAccess.permissionKeys} isSuperAdministrator={data.staffAccess.isSuperAdministrator} compact />
      <DashboardOperationsTabs previews={data.queuePreviews} stats={data.stats} permissionKeys={data.staffAccess.permissionKeys} isSuperAdministrator={data.staffAccess.isSuperAdministrator} />
      <StaffWorkspace stats={data.stats} permissionKeys={data.staffAccess.permissionKeys} isSuperAdministrator={data.staffAccess.isSuperAdministrator} />
      {data.canManageBookings && <OperationsCenter bookings={data.bookings} selectedDate={data.stats.date} />}
      {data.canManageBookings && <Reminders bookings={data.bookings} />}
      <InfoCard icon={ClipboardList} title="Only assigned work is shown" detail="Your role permissions control which queues and actions appear here. Incoming work refreshes automatically while this page is open." />
    </> : <section className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><ShieldCheck className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-bold text-[#03162F]">No workspaces assigned yet</h2><p className="mt-1 text-sm text-slate-500">Ask your manager to assign the pages and actions needed for your job.</p></section>}
  </main>;
}

function InfoCard({ icon: Icon, title, detail }: { icon: typeof ClipboardList; title: string; detail: string }) {
  return <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7F2DF] text-[#8B6A0B]"><Icon className="h-5 w-5" /></span><span><span className="block font-bold text-[#03162F]">{title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{detail}</span></span></article>;
}
