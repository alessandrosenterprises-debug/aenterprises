import { redirect } from "next/navigation";
import StoreWorkspacePage from "@/modules/dashboard/components/StoreWorkspacePage";
import { getCurrentProfile } from "@/modules/enterprise/services/profile.service";
import { getRoleDashboardData, isManagerRole } from "@/modules/dashboard/services/workspace.service";
import { createClient } from "@/lib/supabase/server";

export default async function ManagerDashboardPage({ searchParams }: { searchParams?: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const data = await getRoleDashboardData(params?.date);
  const isAdmin = data.staffAccess.isSuperAdministrator || data.staffAccess.permissionKeys.includes("access.manage_roles");
  if (!isManagerRole(profile?.role) && !isAdmin) redirect("/dashboard");
  const supabase = await createClient();
  const { data: scopeRows } = await supabase.rpc("get_current_store_scope");
  const scope = scopeRows?.[0];
  let storeName = "All enterprise stores";
  if (scope?.store_scoped && scope.business_id && scope.branch_id) {
    const [{ data: business }, { data: branch }] = await Promise.all([
      supabase.from("businesses").select("name").eq("id", scope.business_id).maybeSingle(),
      supabase.from("branches").select("name").eq("id", scope.branch_id).maybeSingle(),
    ]);
    storeName = [business?.name, branch?.name].filter(Boolean).join(" · ") || "Assigned store";
  }
  return <StoreWorkspacePage workspace="manager" section="dashboard" previews={data.queuePreviews} stats={data.stats} storeName={storeName} canManage={data.staffAccess.isSuperAdministrator || data.staffAccess.permissionKeys.includes("orders.manage") || data.staffAccess.permissionKeys.includes("bookings.manage")} />;
}
