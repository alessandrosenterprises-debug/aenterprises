import { CalendarCheck, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import RecentActivity from "@/modules/dashboard/components/RecentActivity";
import OperationsCenter from "@/modules/dashboard/components/OperationsCenter";
import Reminders from "@/modules/dashboard/components/Reminders";
import DashboardOperationsOverview from "@/modules/dashboard/components/DashboardOperationsOverview";
import StaffWorkspace from "@/modules/dashboard/components/StaffWorkspace";
import WorkQueueMonitor from "@/modules/dashboard/components/WorkQueueMonitor";
import DashboardOperationsTabs from "@/modules/dashboard/components/DashboardOperationsTabs";
import type { getRoleDashboardData } from "@/modules/dashboard/services/workspace.service";

type DashboardData = Awaited<ReturnType<typeof getRoleDashboardData>>;

export default function ManagerDashboardWorkspace({ data }: { data: DashboardData }) {
  const operationalPermissions = ["orders.view", "loans.approve", "bookings.view", "deliveries.manage", "businesses.view", "communications.manage", "customers.view", "employees.view", "hr.manage", "reports.view"];
  const hasOperationalAccess = data.staffAccess.isSuperAdministrator || data.staffAccess.permissionKeys.some((permission) => operationalPermissions.includes(permission));
  const canViewActivity = data.staffAccess.isSuperAdministrator || data.staffAccess.permissionKeys.includes("access.view_audit");
  const canViewBusinessReports = data.staffAccess.isSuperAdministrator || (data.staffAccess.permissionKeys.includes("reports.view") && data.staffAccess.permissionKeys.includes("businesses.view"));
  return <main className="w-full min-w-0 space-y-6">
    <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 rounded-none bg-[#03162F] p-6 text-white shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Manager workspace · {data.profile?.role ?? "Manager"}</p>
      <h1 className="mt-2 text-3xl font-bold">Team operations</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">Monitor business activity, review open work, and help your team keep customer requests moving.</p>
      <div className="mt-5 flex flex-wrap gap-3">{data.staffAccess.permissionKeys.includes("employees.view") && <ManagerLink href="/dashboard/employees" icon={UsersRound} label="Staff directory" />}{data.staffAccess.permissionKeys.includes("bookings.view") && <ManagerLink href="/dashboard/bookings" icon={CalendarCheck} label="Booking calendar" />}{data.staffAccess.permissionKeys.includes("access.manage_roles") && <ManagerLink href="/dashboard/administration" icon={ShieldCheck} label="Administration" />}</div>
    </header>
    {hasOperationalAccess && <WorkQueueMonitor stats={data.stats} permissionKeys={data.staffAccess.permissionKeys} isSuperAdministrator={data.staffAccess.isSuperAdministrator} compact />}
    {hasOperationalAccess && <DashboardOperationsTabs previews={data.queuePreviews} stats={data.stats} permissionKeys={data.staffAccess.permissionKeys} isSuperAdministrator={data.staffAccess.isSuperAdministrator} />}
    {hasOperationalAccess && <StaffWorkspace stats={data.stats} permissionKeys={data.staffAccess.permissionKeys} isSuperAdministrator={data.staffAccess.isSuperAdministrator} />}
    {canViewBusinessReports && <DashboardOperationsOverview stats={data.stats} dashboardHref="/dashboard/manager" />}
    {data.canManageBookings && <OperationsCenter bookings={data.bookings} selectedDate={data.stats.date} />}
    {(data.canManageBookings || canViewActivity) && <section className="grid gap-5 xl:grid-cols-2">
      {data.canManageBookings && <Reminders bookings={data.bookings} />}
      {canViewActivity && <RecentActivity />}
    </section>}
  </main>;
}

function ManagerLink({ href, icon: Icon, label }: { href: string; icon: typeof UsersRound; label: string }) {
  return <Link href={href} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"><Icon className="h-4 w-4 text-[#D4AF37]" />{label}</Link>;
}
