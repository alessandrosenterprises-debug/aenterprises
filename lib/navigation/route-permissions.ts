export function getDashboardPermission(pathname: string): string {
  if (pathname === "/dashboard") return "dashboard.view";
  if (pathname.startsWith("/dashboard/administration/activity")) return "access.view_audit";
  if (pathname.startsWith("/dashboard/administration/access")) return "access.manage_permissions";
  if (pathname.startsWith("/dashboard/administration")) return "access.manage_roles";
  if (pathname.startsWith("/dashboard/configuration/roles")) return "access.manage_roles";
  if (pathname.startsWith("/dashboard/configuration/permissions")) return "access.manage_permissions";
  if (pathname.startsWith("/dashboard/configuration/company-settings") || pathname.startsWith("/dashboard/settings")) return "settings.manage";
  if (pathname.startsWith("/dashboard/configuration/businesses") || pathname.startsWith("/dashboard/enterprise/content")) return "businesses.manage";
  if (pathname.startsWith("/dashboard/configuration")) return "configuration.manage";
  if (pathname.startsWith("/dashboard/enterprise")) return "businesses.view";
  if (pathname.startsWith("/dashboard/hr/employees")) return "employees.view";
  if (pathname.startsWith("/dashboard/hr/riders")) return "employees.manage";
  if (pathname.startsWith("/dashboard/departments")) return "hr.manage";
  if (pathname.startsWith("/dashboard/hr")) return "hr.manage";
  if (pathname.startsWith("/dashboard/employees")) return "employees.view";
  if (pathname.startsWith("/dashboard/customers")) return "customers.view";
  if (pathname.startsWith("/dashboard/loans")) return "customers.manage";
  if (pathname.startsWith("/dashboard/orders/my-deliveries")) return "deliveries.manage";
  if (pathname.startsWith("/dashboard/orders/riders") || pathname.startsWith("/dashboard/orders/delivery-pricing")) return "deliveries.manage";
  if (pathname.startsWith("/dashboard/orders")) return "orders.view";
  if (pathname.startsWith("/dashboard/bookings")) return "bookings.view";
  if (pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/catalog")) return "products.manage";
  if (pathname.startsWith("/dashboard/reports")) return "reports.view";
  if (pathname.startsWith("/dashboard/emails") || pathname.startsWith("/dashboard/messages") || pathname.startsWith("/dashboard/notifications")) return "communications.manage";
  if (pathname.startsWith("/dashboard/website")) return "configuration.manage";
  if (pathname.startsWith("/dashboard/payroll")) return "hr.manage";
  return "dashboard.view";
}
