import { redirect } from "next/navigation";
import ManagerDashboardWorkspace from "@/modules/dashboard/components/ManagerDashboardWorkspace";
import { getCurrentProfile } from "@/modules/enterprise/services/profile.service";
import { getRoleDashboardData, isManagerRole } from "@/modules/dashboard/services/workspace.service";

export default async function ManagerDashboardPage({ searchParams }: { searchParams?: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!isManagerRole(profile?.role) && profile?.role !== "Super Administrator") redirect("/dashboard");
  const data = await getRoleDashboardData(params?.date);
  return <ManagerDashboardWorkspace data={data} />;
}
