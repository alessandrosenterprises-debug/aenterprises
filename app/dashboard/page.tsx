import RecentActivity from "@/modules/dashboard/components/RecentActivity";
import OperationsCenter from "@/modules/dashboard/components/OperationsCenter";
import QuickActions from "@/modules/dashboard/components/QuickActions";
import BusinessStatus from "@/modules/dashboard/components/BusinessStatus";
import Reminders from "@/modules/dashboard/components/Reminders";
import DashboardOperationsOverview from "@/modules/dashboard/components/DashboardOperationsOverview";
import StaffWorkspace from "@/modules/dashboard/components/StaffWorkspace";

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const params = await searchParams;

  const [
    profile,
    stats,
    staffAccess,
  ] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(params?.date),
    getDashboardStaffAccess(),
  ]);

  const isManagementUser = ["Super Administrator", "Enterprise Manager", "Operations Manager", "Business Manager"].includes(profile?.role ?? "");
  const canManageBookings = staffAccess.permissionKeys.includes("bookings.manage") || staffAccess.isSuperAdministrator;
  const bookings = canManageBookings ? await getBookings() : [];

  return (
    <>
      <WelcomeBanner profile={profile} />
      <StaffWorkspace
        stats={stats}
        permissionKeys={staffAccess.permissionKeys}
        isSuperAdministrator={staffAccess.isSuperAdministrator}
      />
      {isManagementUser && <DashboardOperationsOverview stats={stats} />}

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
          {isManagementUser ? (
            <QuickActions />
          ) : (
            <BusinessStatus />
          )}
        </div>
      </div>}
    </>
  );
}
