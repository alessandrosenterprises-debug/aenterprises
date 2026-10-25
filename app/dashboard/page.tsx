import RecentActivity from "@/modules/dashboard/components/RecentActivity";
import OperationsCenter from "@/modules/dashboard/components/OperationsCenter";
import QuickActions from "@/modules/dashboard/components/QuickActions";
import Reminders from "@/modules/dashboard/components/Reminders";
import DashboardOperationsOverview from "@/modules/dashboard/components/DashboardOperationsOverview";
import StaffWorkspace from "@/modules/dashboard/components/StaffWorkspace";
import DashboardOperationsTabs from "@/modules/dashboard/components/DashboardOperationsTabs";
import WorkQueueMonitor from "@/modules/dashboard/components/WorkQueueMonitor";
import { getDashboardQueuePreviews } from "@/modules/dashboard/services/workspace.service";

import {
  getDashboardStats,
  getDashboardStaffAccess,
} from "@/modules/dashboard/services/dashboard.service";

import {
  getBookings,
} from "@/modules/bookings/services/booking.service";

import {
  getCurrentProfile,
} from "@/modules/enterprise/services/profile.service";

import WelcomeBanner from "@/modules/dashboard/components/WelcomeBanner";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (["Enterprise Manager", "Operations Manager", "Business Manager"].includes(profile?.role ?? "")) redirect("/dashboard/manager");
  if (profile?.role !== "Super Administrator") redirect("/dashboard/staff");

  const [stats, staffAccess] = await Promise.all([
    getDashboardStats(params?.date),
    getDashboardStaffAccess(),
  ]);

  const canManageBookings = staffAccess.permissionKeys.includes("bookings.manage") || staffAccess.isSuperAdministrator;
  const bookings = canManageBookings ? await getBookings() : [];
  const queuePreviews = await getDashboardQueuePreviews(staffAccess.permissionKeys, staffAccess.isSuperAdministrator);

  return (
    <>
      <WelcomeBanner profile={profile} />
      <StaffWorkspace
        stats={stats}
        permissionKeys={staffAccess.permissionKeys}
        isSuperAdministrator={staffAccess.isSuperAdministrator}
      />
      <WorkQueueMonitor stats={stats} permissionKeys={staffAccess.permissionKeys} isSuperAdministrator={staffAccess.isSuperAdministrator} compact />
      <DashboardOperationsTabs previews={queuePreviews} stats={stats} permissionKeys={staffAccess.permissionKeys} isSuperAdministrator={staffAccess.isSuperAdministrator} />
      <DashboardOperationsOverview stats={stats} />

      {/* OPERATIONS CENTER */}
      {canManageBookings && <div className="space-y-6">
        <OperationsCenter bookings={bookings} selectedDate={stats.date} />

        {/* REMINDERS + RECENT ACTIVITY */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity />

          <Reminders bookings={bookings} />
        </div>

        {/* QUICK ACTIONS / BUSINESS STATUS */}
        <div className="grid gap-6 lg:grid-cols-2">
          <QuickActions />
        </div>
      </div>}
    </>
  );
}
