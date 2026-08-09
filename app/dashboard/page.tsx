import {
  Briefcase,
  Building2,
  CalendarDays,
  DollarSign,
  Users,
} from "lucide-react";
import RecentActivity from "@/modules/dashboard/components/RecentActivity";
import { getDashboardStats } from "@/modules/dashboard/services/dashboard.service";
import { StatCard } from "@/components/ui/stat-card";
import WelcomeBanner from "@/modules/dashboard/components/WelcomeBanner";
import BusinessStatus from "@/modules/dashboard/components/BusinessStatus";
import QuickActions from "@/modules/dashboard/components/QuickActions";
import { getCurrentProfile } from "@/modules/enterprise/services/profile.service";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const stats = await getDashboardStats();
  return (
    <>
      <WelcomeBanner profile={profile} />

      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Businesses"
          value={stats.businesses}
          icon={Building2}
          trend="+1 this month"
          trendDirection="up"
        />

        <StatCard
          title="Employees"
          value={stats.employees}
          icon={Users}
          trend="+4 this week"
          trendDirection="up"
        />

        <StatCard
          title="Customers"
          value={stats.customers}
          icon={Briefcase}
          trend="+18 today"
          trendDirection="up"
        />

        <StatCard
          title="Bookings"
          value={stats.bookings}
          icon={CalendarDays}
        />

        <StatCard
          title="Revenue"
          value={`ZMW ${stats.revenue.toFixed(2)}`}
          icon={DollarSign}
          color="gold"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
  <BusinessStatus />
  <QuickActions />
  <RecentActivity />
</div>
    </>
  );
}
