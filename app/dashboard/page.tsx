import {
  Briefcase,
  Building2,
  CalendarDays,
  DollarSign,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import WelcomeBanner from "@/modules/dashboard/components/WelcomeBanner";
import BusinessStatus from "@/modules/dashboard/components/BusinessStatus";
import QuickActions from "@/modules/dashboard/components/QuickActions";

export default function DashboardPage() {
  return (
    <>
      <WelcomeBanner />

      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Businesses"
          value={5}
          icon={Building2}
          trend="+1 this month"
          trendDirection="up"
        />

        <StatCard
          title="Employees"
          value={32}
          icon={Users}
          trend="+4 this week"
          trendDirection="up"
        />

        <StatCard
          title="Customers"
          value={150}
          icon={Briefcase}
          trend="+18 today"
          trendDirection="up"
        />

        <StatCard
          title="Bookings"
          value={18}
          icon={CalendarDays}
        />

        <StatCard
          title="Revenue"
          value="ZMW 0.00"
          icon={DollarSign}
          color="gold"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BusinessStatus />
        <QuickActions />
      </div>
    </>
  );
}