import RecentActivity from "@/modules/dashboard/components/RecentActivity";
import OperationsCenter from "@/modules/dashboard/components/OperationsCenter";
import QuickActions from "@/modules/dashboard/components/QuickActions";
import BusinessStatus from "@/modules/dashboard/components/BusinessStatus";
import Reminders from "@/modules/dashboard/components/Reminders";

import {
  getDashboardStats,
} from "@/modules/dashboard/services/dashboard.service";

import {
  getBookings,
} from "@/modules/bookings/services/booking.service";

import {
  getCurrentProfile,
} from "@/modules/enterprise/services/profile.service";

import { StatCard } from "@/components/ui/stat-card";
import WelcomeBanner from "@/modules/dashboard/components/WelcomeBanner";

export default async function DashboardPage() {
  const [
    profile,
    stats,
    bookings,
  ] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(),
    getBookings(),
  ]);

  const isManagementUser =
    profile?.role === "Super Administrator" ||
    profile?.role === "Operations Manager";

  return (
    <>
      <WelcomeBanner profile={profile} />

      {/* KPI CARDS */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Businesses"
          value={stats.businesses}
          icon="building"
          trend="+1 this month"
          trendDirection="up"
        />

        <StatCard
          title="Employees"
          value={stats.employees}
          icon="users"
          trend="+4 this week"
          trendDirection="up"
        />

        <StatCard
          title="Customers"
          value={stats.customers}
          icon="briefcase"
          trend="+18 today"
          trendDirection="up"
        />

        <StatCard
          title="Bookings"
          value={stats.bookings}
          icon="calendar"
        />

        <StatCard
          title="Revenue"
          value={`ZMW ${stats.revenue.toFixed(2)}`}
          icon="money"
          color="gold"
        />
      </div>

      {/* OPERATIONS CENTER */}
      <div className="space-y-6">
        <OperationsCenter bookings={bookings} />

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
      </div>
    </>
  );
}