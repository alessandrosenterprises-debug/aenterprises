import { notFound, redirect } from "next/navigation";
import StoreWorkspacePage from "@/modules/dashboard/components/StoreWorkspacePage";
import { getRoleDashboardData } from "@/modules/dashboard/services/workspace.service";
import { createClient } from "@/lib/supabase/server";

const staffSections = new Set(["orders","bookings","deliveries","messages","consultations","notifications","customers","reminders"]);
const managerSections = new Set(["orders","bookings","deliveries","messages","consultations","customers","reminders","reports","attendance","staff-management","cash-up","stock","report-submission","leave-requests","advances-shortages","customer-reviews","delivery-report","cash-reconciliation","invoices-quotations"]);

export default async function StoreWorkspaceSectionPage({ params }: { params: Promise<{ workspace: string; section: string }> }) {
  const { workspace, section } = await params;
  if (workspace !== "staff" && workspace !== "manager") notFound();
  if (!(workspace === "staff" ? staffSections : managerSections).has(section)) notFound();
  const supabase = await createClient();
  const [{ data: { user } }, { data: scopeRows }, data] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_current_store_scope"),
    getRoleDashboardData(),
  ]);
  if (!user) redirect("/login");
  const role = data.profile?.role ?? "";
  const isAdmin = data.staffAccess.isSuperAdministrator || data.staffAccess.permissionKeys.includes("access.manage_roles");
  if (workspace === "manager" && !isAdmin && !["Enterprise Manager","Operations Manager","Business Manager","Store Manager","Branch Manager"].includes(role)) redirect("/dashboard/access-denied");
  if (workspace === "staff" && !isAdmin && ["Enterprise Manager","Operations Manager","Business Manager","Store Manager","Branch Manager"].includes(role)) redirect("/dashboard/access-denied");
  if (!isAdmin && scopeRows?.[0]?.store_scoped !== true) redirect("/dashboard/access-denied?reason=store-scope");
  const scope = scopeRows?.[0];
  let storeName = "Assigned store";
  if (scope?.business_id) {
    const [{ data: business }, { data: branch }] = await Promise.all([
      supabase.from("businesses").select("name").eq("id", scope.business_id).maybeSingle(),
      scope.branch_id ? supabase.from("branches").select("name").eq("id", scope.branch_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    storeName = [business?.name, branch?.name].filter(Boolean).join(" · ") || storeName;
  }
  const canManage = data.staffAccess.permissionKeys.some((permission) => ["orders.manage","bookings.manage"].includes(permission)) || data.staffAccess.isSuperAdministrator;
  const canManageDeliveries = data.staffAccess.permissionKeys.includes("deliveries.manage") || isAdmin;
  let orderFormData: { businessId: string; branchId: string; customers: Array<{ id: string; fullName: string; phone: string; email: string | null }>; catalog: Array<{ id: string; name: string; price: number }> } | undefined;
  if (((section === "orders" && canManage) || (section === "deliveries" && canManageDeliveries)) && scope?.store_scoped === true && scope.business_id && scope.branch_id) {
    const [{ data: catalogRows }, { data: priorOrders }] = await Promise.all([
      supabase.from("enterprise_catalog").select("id, name, item_type, base_price, status").eq("business_id", scope.business_id).order("name"),
      supabase.from("orders").select("customer_id").eq("business_id", scope.business_id).eq("store_branch_id", scope.branch_id).order("created_at", { ascending: false }).limit(200),
    ]);
    const orderableTypes = new Set(["", "product", "goods", "item", "order", "retail"]);
    const excludedStatuses = new Set(["inactive", "disabled", "ended", "archived", "deleted"]);
    const catalog = (catalogRows ?? []).filter((item) => orderableTypes.has((item.item_type ?? "").trim().toLowerCase()) && !excludedStatuses.has((item.status ?? "").trim().toLowerCase())).map((item) => ({ id: item.id, name: item.name, price: Number(item.base_price ?? 0) })).filter((item) => Number.isFinite(item.price) && item.price >= 0);
    const customerIds = [...new Set((priorOrders ?? []).map((order) => order.customer_id).filter(Boolean))];
    const { data: customerRows } = customerIds.length
      ? await supabase.from("customers").select("id, full_name, phone, email").in("id", customerIds).order("full_name")
      : { data: [] };
    orderFormData = {
      businessId: scope.business_id,
      branchId: scope.branch_id,
      customers: (customerRows ?? []).map((customer) => ({ id: customer.id, fullName: customer.full_name || "Customer", phone: customer.phone || "No phone", email: customer.email ?? null })),
      catalog,
    };
  }
  return <StoreWorkspacePage workspace={workspace} section={section} previews={data.queuePreviews} stats={data.stats} storeName={storeName} canManage={canManage} canManageDeliveries={canManageDeliveries} orderFormData={orderFormData} />;
}
