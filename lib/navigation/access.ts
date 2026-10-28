import type { NavigationItem } from "./navigation";
import { getDashboardPermission, getDashboardPermissions } from "./route-permissions";

const permissionByHref: Record<string, string> = {
  "/dashboard": "dashboard.view", "/dashboard/enterprise": "businesses.view", "/dashboard/enterprise/content": "businesses.manage",
  "/dashboard/customers": "customers.view", "/dashboard/loans": "loans.approve", "/dashboard/hr": "hr.manage",
  "/dashboard/hr/employees": "employees.view", "/dashboard/hr/riders": "employees.manage", "/dashboard/hr/departments": "hr.manage",
  "/dashboard/hr/leave-attendance": "hr.manage", "/dashboard/hr/documents": "hr.manage", "/dashboard/hr/loans-advances": "hr.manage",
  "/dashboard/hr/payroll": "hr.manage", "/dashboard/hr/reports": "reports.view", "/dashboard/emails": "communications.manage",
  "/dashboard/messages": "communications.manage", "/dashboard/products": "products.manage", "/dashboard/catalog": "products.manage",
  "/dashboard/bookings": "bookings.view", "/dashboard/orders": "orders.view", "/dashboard/orders/my-deliveries": "deliveries.manage",
  "/dashboard/reports": "reports.view", "/dashboard/configuration/roles": "access.manage_roles",
  "/dashboard/configuration/permissions": "access.manage_permissions", "/dashboard/configuration/businesses": "businesses.manage",
  "/dashboard/configuration/branches": "configuration.manage", "/dashboard/configuration/operators": "configuration.manage",
  "/dashboard/configuration/mobile-money-services": "configuration.manage", "/dashboard/configuration/loan-products": "configuration.manage",
  "/dashboard/configuration/loan-terms": "configuration.manage", "/dashboard/configuration/categories": "configuration.manage",
  "/dashboard/configuration/company-settings": "settings.manage", "/dashboard/administration": "access.manage_roles",
  "/dashboard/administration/access": "access.manage_permissions", "/dashboard/administration/activity": "access.view_audit",
  "/dashboard/notifications": "communications.manage", "/dashboard/settings": "settings.manage", "/dashboard/website": "configuration.manage",
};

export function itemPermissions(item: NavigationItem) {
  if (item.href) return item.permission ? [item.permission] : permissionByHref[item.href] ? [permissionByHref[item.href]] : getDashboardPermissions(item.href);
  const permission = item.permission ?? (item.href ? permissionByHref[item.href] ?? getDashboardPermission(item.href) : undefined);
  return permission ? [permission] : [];
}

export function canSeeNavigationItem(item: NavigationItem, permissionKeys: string[], isSuperAdministrator: boolean, accessControlEnabled: boolean) {
  if (item.superAdminOnly && !isSuperAdministrator) return false;
  const required = itemPermissions(item);
  return !accessControlEnabled || isSuperAdministrator || required.length === 0 || required.some((permission) => permissionKeys.includes(permission));
}
