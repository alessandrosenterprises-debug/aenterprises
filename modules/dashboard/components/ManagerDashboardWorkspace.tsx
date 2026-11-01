import StoreWorkspacePage from "@/modules/dashboard/components/StoreWorkspacePage";
import type { getRoleDashboardData } from "@/modules/dashboard/services/workspace.service";

type DashboardData = Awaited<ReturnType<typeof getRoleDashboardData>>;

export default function ManagerDashboardWorkspace({ data }: { data: DashboardData }) {
  return <StoreWorkspacePage
    workspace="manager"
    section="dashboard"
    previews={data.queuePreviews}
    stats={data.stats}
    storeName="Assigned store"
    canManage={data.staffAccess.isSuperAdministrator || data.staffAccess.permissionKeys.includes("orders.manage") || data.staffAccess.permissionKeys.includes("bookings.manage")}
  />;
}
