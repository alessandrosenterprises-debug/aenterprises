import { redirect } from "next/navigation";
import StaffDashboardWorkspace from "@/modules/dashboard/components/StaffDashboardWorkspace";
import { getCurrentProfile } from "@/modules/enterprise/services/profile.service";
import { getRoleDashboardData, isManagerRole } from "@/modules/dashboard/services/workspace.service";

export default async function StaffDashboardPage({ searchParams }: { searchParams?: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (isManagerRole(profile?.role)) redirect("/dashboard");
  const data = await getRoleDashboardData(params?.date);
  return <StaffDashboardWorkspace data={data} />;
}
